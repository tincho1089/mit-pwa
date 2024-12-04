import { Injectable } from '@angular/core';
import { Observable, Subject, firstValueFrom, forkJoin, of, lastValueFrom } from 'rxjs';
import { catchError, concatMap, map, tap } from 'rxjs/operators';
import { db } from 'src/databases/db';
import { MIUtilities } from 'src/app/shared/utility';
import { UserAPIService } from '../api/user-api.service';
import { WorkOrderAPIService } from '../api/workorder-api.service';
import { InspectionResponseAPIService } from '../api/inspection-response-api.service';
import {
  InspectionQuestionImage,
  InspectionResponse,
  EquipDetails,
  WorkOrderDocument,
  InspectionResponseImage,
  WorkOrderList,
} from '../../sync/entities';
import {
  RestrictionsInterface,
  RestrictionsModel,
} from '../../models/api/response/restrictions.model';
import { GetConfigModel } from '../../models/api/response/get-config.model';
import { LoadingIndicatorService } from '../loading-indicator.service';
import { ErrorDialogService } from '../error.service';
import { QuestionImageModel } from '../../models/api/question-image.model';
import { DownloadImageModel } from '../../models/api/download-image.model';
import { InspectionResponseImageAPIService } from '../api/inspection-response-image-api.service';
import { HttpClient } from '@angular/common/http';
import { ENV } from 'src/environments/environment';
import { InspectionQuestionImageAPIService } from '../api/inspection-question-image-api.service';
import { WorkOrderUpdates } from '../../models/api/request/response.model';
import { PromptInfoComponent } from '../../components/promptInfo/promptInfo.component';
import { MatDialog } from '@angular/material/dialog';
import { SettingsService } from '../app-settings.service';
import { WorkOrderDocumentResponseModel } from '../../models/api/response/work-order-documents.model';
import { PagedResult } from '../../models/api/response/paged-result.model';
import { ApplicationInsightsService } from '../applicationInsights.service';
import { OnlineSearchWorkOrderModel } from '../../sync/entities/online-search-work-order-model';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class SyncService {
  public syncInProgressSubject: Subject<boolean> = new Subject<boolean>(); //subject that tells components that sync is or is not in progress
  public workOrderListUpdated: Subject<boolean> = new Subject<boolean>(); //subject that components can subscribe to to know that the workOrderList was updated, true for success, false for failure
  private submittedImages = null;
  private config = new GetConfigModel();
  private workOrderResponseDownloadBatchSize = 5;
  private imageDownloadBatchSize = 2;
  private documentDownloadBatchSize = 2;
  private noResponsesUpdated = false;

  // Upload
  private uploadTotals = {
    totalWorkOrders: 0,
    totalImages: 0,
    totalDocuments: 0,
    totalImagesFailed: 0,
    totalDocumentsFailed: 0,
  };

  private downloadTotals = {
    totalWorkOrders: 0,
    totalImages: 0,
    totalDocuments: 0,
    totalImagesFailed: 0,
    totalDocumentsFailed: 0,
  };

  constructor(
    private userAPI: UserAPIService,
    private workOrderAPI: WorkOrderAPIService,
    private responseAPI: InspectionResponseAPIService,
    private loadingIndicatorService: LoadingIndicatorService,
    private responseImageAPI: InspectionResponseImageAPIService,
    private questionImageAPI: InspectionQuestionImageAPIService,
    private errorService: ErrorDialogService,
    private http: HttpClient,
    public dialog: MatDialog,
    private settingsService: SettingsService,
    private appInsights: ApplicationInsightsService,
    private translateService: TranslateService
  ) {
   }

  public async initiateSync() {
    this.loadingIndicatorService.show();
    this.initializeTotals();

    try {
      this.appInsights.logEvent('Sync');

      /**
       * Upload process
       */   
      const restrictions = await this.upload();

      /**
       * Download process
       */
      await this.getWorkOrders(restrictions);

      // Check for existing images in the old structure and migrate them to the new images table.
      // This step can be removed once everyone is using the new structure as it is a resource-intensive process and the reason we created the new table.
      if (!localStorage.getItem('ImagesTransferred')) {
        await db.getImagesNestedInResponses();
      }

      await lastValueFrom(this.translateService.get(
        [
          'home.Sync',
          'home.syncComplete'
        ]
      ));

      this.loadingIndicatorService.hide();

      const syncMessage = `
      <div>
        <p>Work orders and responses have been successfully synced.</p><br>
      
        <h4>Download:</h4>
        <p><strong>Work orders Downloaded:</strong> ${this.downloadTotals.totalWorkOrders}</p>
        <p><strong>Images Downloaded:</strong> ${this.downloadTotals.totalImages - this.downloadTotals.totalImagesFailed} out of ${this.downloadTotals.totalImages}</p>
        <p><strong>Documents Downloaded:</strong> ${this.downloadTotals.totalDocuments - this.downloadTotals.totalDocumentsFailed} out of ${this.downloadTotals.totalDocuments}</p><br>
       
        <h4>Upload:</h4>
        <p><strong>Work orders Uploaded:</strong> ${this.uploadTotals.totalWorkOrders}</p>
        <p><strong>Images Uploaded:</strong> ${this.uploadTotals.totalImages - this.uploadTotals.totalImagesFailed} out of ${this.uploadTotals.totalImages}</p>
        <p><strong>Documents Uploaded:</strong> ${this.uploadTotals.totalDocuments - this.uploadTotals.totalDocumentsFailed} out of ${this.uploadTotals.totalDocuments}</p><br>
       
        ${this.downloadTotals.totalImagesFailed > 0 || this.downloadTotals.totalDocumentsFailed > 0
          || this.uploadTotals.totalImagesFailed > 0 || this.uploadTotals.totalDocumentsFailed > 0 ?
          '<p style="color: red;"><strong>Note:</strong> Some items failed to upload/download. Please try syncing again.</p>' : ''}      
      </div>
    `;

      this.dialog.open(PromptInfoComponent, {
        width: '350px',
        data: {
          title: "Sync Summary",
          content: syncMessage,
          formattedContent: syncMessage,
          showOkButton: true
        },
        panelClass: 'custom-dialog'
      });
    }
    catch (error) {
      this.loadingIndicatorService.hide();
      console.error(error);
      this.errorService.openDialog("Sync Failure", error);
      this.workOrderListUpdated.next(false); //sync fail
    }
  }

  public async initiateOnlineSearchSync() {
    let restrictions: RestrictionsModel;
    this.loadingIndicatorService.show();
    try {
      restrictions = await this.upload(null, [], 'online search - upload');
      await this.getWorkOrders(restrictions);
      this.loadingIndicatorService.hide(); // hide indicator since it only hides after download
    }
    catch (error) {
      this.loadingIndicatorService.hide();
      console.error(error);
      this.errorService.openDialog("Sync Failure", error);
      this.workOrderListUpdated.next(false); //sync fail
    }

    return restrictions;
  }

  // Used for manual download
  public async initiateOnlineSearchDownload(workOrderIds? : Array<number>) :Promise<void> {
    this.loadingIndicatorService.show();
    try {
      let restrictions : RestrictionsModel = await this.compareWorkOrder('online search - download', workOrderIds);
      await this.getWorkOrders(restrictions);
    }
    catch (error) {
      this.loadingIndicatorService.hide();
      console.error(error);
      this.errorService.openDialog("Sync Failure", error);
      this.workOrderListUpdated.next(false); //sync fail
    }
  }

  public async onlineSearch(workOrderCodeTerm: string) : Promise<PagedResult<OnlineSearchWorkOrderModel>> {
    this.loadingIndicatorService.show();
    this.loadingIndicatorService.setMsgTranslated('home.searchOnline');
    let result: PagedResult<OnlineSearchWorkOrderModel> = null;
    try {
      const source$ = this.workOrderAPI.search(workOrderCodeTerm);
      const data = await lastValueFrom(source$);
      result = data;
      this.loadingIndicatorService.hide();
    } catch (error) {
      console.error(error)
      this.loadingIndicatorService.hide();
      this.errorService.openDialog('OnlineSearch Fetch Failure', error.message);
    }
    return result;
  }

  /**
   *
   * @param workOrderIds
   * @param compareType
   */
  private async compareWorkOrder(compareType: string = "default", workOrderIds: Array<number> = []): Promise<RestrictionsModel> {
    this.loadingIndicatorService.setMsgTranslated('inspection.comparing');
    const requestModel: any = {};
    requestModel.LocalWOs = await this.getCompareModel();
    requestModel.AdditionalWorkOrderIds = workOrderIds;
    requestModel.CompareType = compareType;

    if (!MIUtilities.isNullOrUndefined(localStorage.getItem("delImgIds"))) {
      const images = JSON.parse(localStorage.getItem("delImgIds"));
      requestModel.ImageIds = images.map(img => img.imageServerId);
    }

    let rules: RestrictionsModel = null;
    console.log(requestModel);

    const source$ = this.workOrderAPI.compareWorkOrder(requestModel);
    const data = await lastValueFrom(source$);
    console.log(data);

    if (!MIUtilities.isNullOrUndefinedObject(data) && !MIUtilities.isNullOrUndefinedObject(data.CompareResult)) {
      const restrictions: RestrictionsInterface = data.CompareResult;
      rules = new RestrictionsModel(restrictions);

      // Update the wo status to inactive
      if (rules.inactives.length) {
        const inactiveWoBatches = rules.inactives.map(id => parseInt(id));
        await db.updateBulkWorkOrderStatus(100, inactiveWoBatches);
      }

      rules.files = data.Files;
      rules.docs = data.Docs;
      rules.actions = data.Actions;
    }

    return rules;
  }

  public async getWorkOrders(restrictions) {
    this.loadingIndicatorService.setMsgTranslated('inspection.downloadingWorkorders');
    try {
      const source$ = this.userAPI.getConfig();
      const config = await lastValueFrom(source$);
      console.log('CONFIG>>' + JSON.stringify(config));
      this.config = { ...config };
      this.config.inspectionsResponseChunk = this.workOrderResponseDownloadBatchSize;
      const downloadWoBatches: Array<Observable<Array<WorkOrderList>>> = [];

      while (restrictions.download.length) {
        const ids = restrictions.download
          .splice(0, this.workOrderResponseDownloadBatchSize)
          .map(Number);
        const workorders = this.workOrderAPI.getWorkOrders(ids);
        downloadWoBatches.push(workorders);
      }

      // insert downloads
      await this.batchProcessDownloads(downloadWoBatches, restrictions.docs);
    } catch (error) {
      console.error(error)
      this.loadingIndicatorService.hide();
      this.errorService.openDialog('Workorder Fetch Failure', error.message);
    }
  }

  private async batchProcessDownloads(chunks: Observable<WorkOrderList[]>[], docs?: any[]) {
    if (chunks.length > 0) {
      const source$ = forkJoin(chunks);
      const workOrders = await lastValueFrom(source$);
      const woExtract = workOrders.reduce((acc, chunk) => {
        if (chunk['Message']) { // serverside error
          throw new Error(chunk['Message'])
        }
        acc = [...acc, ...chunk];
        return acc;
      }, []);

      /**
       * Store the work orders in the workorderlist table
       */
      await this.storeBatch(woExtract);
      /**
       * Save the equipment details for all work orders
       */
      await db.bulkEquipmentDetails(woExtract);
      /**
       * Save the tml details for all work orders
       */
      await db.bulkTMLs(woExtract);
      /**
       * Save the meridium details for all work orders
       */
      await db.bulkMeridiumDetails(woExtract);
      /**
       * Got the work orders. Now, fetching the responses for these work orders
       * This also downloads all the images that are attached to the responses.
       */
      await this.getResponses(woExtract);
      /**
       * Download the documents content now
       */
      await this.downloadDocuments(woExtract, false);
    }

    if (docs && docs.length > 0) {
      const woDocs = docs.map((f) => {
        let woDoc = new WorkOrderDocument();
        woDoc.id = f.ID.toString();
        woDoc.inspectionId = f.InspectionWorkOrderId;
        woDoc.docName = f.DocumentName;
        return woDoc;
      });

      /**
       * Download the documents content now
       */
      await this.downloadWODocuments(woDocs);
    }

    this.workOrderListUpdated.next(true);
    this.loadingIndicatorService.hide();
  }

  private async storeBatch(records: any[]) {
    const mappedRecords: WorkOrderList[] = records.map(
      (record: WorkOrderList) => {
        let wo = new WorkOrderList();
        wo.init(record);
        return wo;
      }
    );

    const batchSize = 20; // Define your desired batch size

    await db
      .insertRecordsInBatch(mappedRecords, batchSize)
      .then(() => {
        //this.workOrderListUpdated.next(true); //sync success, emit true
      })
      .catch((error) => {
        this.appInsights.logException( new Error(error));
        console.error('Error inserting bulk records', error);
        this.errorService.openDialog('Bulk Insert Records Failure', error.message);
        this.loadingIndicatorService.hide();
        this.workOrderListUpdated.next(false); //sync failure, emit false
      });
  }

  private async getResponses(woList: any[]) {
    if (woList.length > 0) {
      this.downloadTotals.totalWorkOrders = woList.length;
      const chunkSize = this.workOrderResponseDownloadBatchSize;

      const ids: Array<Array<number>> = woList.reduce((chunks, wo, i) => {
        if (i % Number(chunkSize) === 0) chunks.push([+wo.ID]);
        else {
          chunks[chunks.length - 1].push(+wo.ID);
        }
        return chunks;
      }, []);

      const downloadRequest: Array<Observable<any>> = ids.map((chunk) =>
        this.getBulkResponses(chunk, true)
      );

      let counter: number = 0;
      console.log('LENGTH>>' + downloadRequest.length);

      await this.loadingIndicatorService.setMsgTranslated(
        'inspection.downloadingResponses'
      );

      if (downloadRequest.length > 0) {
        //convert subscription to promise and await
        await lastValueFrom(
          forkJoin(downloadRequest).pipe(
            concatMap(async (responses) => {
              const flattenedArr = responses.flat();
              let groupedData : any[][] = [];
              // Extracting unique inspectorGroup values
              const uniqueGroups = Array.from(new Set(flattenedArr.map(item => item.InspectionWorkOrderId)));
              // Initializing the groupedData array
              uniqueGroups.forEach(group => { groupedData.push([]); });
              console.log(uniqueGroups);
              // Grouping the data
              flattenedArr.forEach(item =>
                {
                  const index = uniqueGroups.indexOf(item.InspectionWorkOrderId);
                  groupedData[index].push(item);
                });

              const insertOperations = groupedData.map(
                async (response: Array<any>) => {
                  try
                  {
                    if (response && response.length > 0) {
                      const inspectionResponse = new InspectionResponse();
                      const inspectionResponseImage = new InspectionResponseImage();
                      let woId = response[0]['InspectionWorkOrderId'];
                      let inspectionResponses = inspectionResponse.init(
                        woId,
                        response
                      ).sort((a, b) => {
                        try{
                          if(a.sectionSortId !== b.sectionSortId){
                            return a.sectionSortId - b.sectionSortId;
                          }
                          if(a.inspectionSection !== b.inspectionSection){
                            return a.inspectionSection.localeCompare(b.inspectionSection);
                          }

                          if(a.subSectionSortId !== b.subSectionSortId){
                            return a.subSectionSortId - b.subSectionSortId;
                          }
                          if(a.subsection !== b.subsection){
                            return a.subsection.localeCompare(b.subsection);
                          }

                          if(a.sortId !== b.sortId){
                            return a.sortId - b.sortId;
                          }

                          if(a.id !== b.id){
                            return a.id - b.id;
                          }

                          return a.question.localeCompare(b.question);
                        }
                        catch(error){
                          this.appInsights.logException( new Error(error));
                          console.log('Sorting responses failed: ', error);
                          return 0;
                        }
                      });

                      await db.updateInspectionResponses(
                        woId,
                        inspectionResponses
                      );

                      const images = response.flatMap(r => r.Images.length > 0 ? r.Images : []);
                      if (images.length > 0) {
                        const inspectionResponseImages = inspectionResponseImage.init(woId,
                          response[0]['InspectionItemCode'], images);
                        await db.addResponseImagesBulk(inspectionResponseImages);
                      }

                      counter += inspectionResponses.length;
                      await this.loadingIndicatorService.setCountMsgTranslated(
                        'inspection.downloadingResponses', counter, flattenedArr.length
                      );

                      // prevent overwriting local after downloading inspections
                      let wo = await db.workOrderList.get(woId);
                      await db.markCompletedAsSubmitted(wo);
                      await db.setInspectionSynced(wo.id);
                    }
                  }
                  catch (e)
                  {
                    this.appInsights.logException(new Error(e));
                    this.errorService.openDialog("Error in getting responses", e.message);
                    console.error(e);
                    throw e;
                  }
                }
              );

             if (insertOperations.length) {
              await lastValueFrom(forkJoin(insertOperations));
              await this.extractResponseAndQuestionImages(responses);
             }
            })
          )
        );
      }
    }
  }

  private getBulkResponses(ids: number[], regular: boolean): Observable<any> {
    return this.responseAPI.getBulkResponses(ids);
  }

  async updateResponses(workOrderId: number, responses: any): Promise<void> {
    await db.workOrderList.update(workOrderId, {
      inspectionResponses: responses,
    });
  }

  private async extractResponseAndQuestionImages(responses) {
    let totalImages = 0;
    // we only keep the responses that contain images to avoid processing all the responses
    const responsesWithImages = responses.filter(inspection => inspection.some(response => (response.Images && response.Images.length > 0) || response.QuestionImage));
    const images = responsesWithImages.reduce((acc, download) => {
      try {
        if (download)
          download.forEach((d) => {
            /**
             * This code is to prepare the download model for question image
             */
            [acc, totalImages] = this.processQuestionImages(
              d,
              acc,
              totalImages
            );
            /**
             * This code is to prepare the download model for response image
             */
            [acc, totalImages] = this.processInspectionImages(
              d,
              acc,
              totalImages
            );
          });
      } catch (error) {
        console.log('error getting images models->', error);
      }
      return acc;
    }, {});

    console.log(images);
    await this.downloadImagesInBatches(images, totalImages);

  }

  async downloadImagesInBatches(images, totalImages) {
    // Combine the arrays from both properties into a single array
    // Divide the combined array into subarrays, each containing batchSize items
    const batches: { inspectionImages: any[]; questionImages: any[] }[] = [];

    const longerArray = (images.inspectionImages != null ? images.inspectionImages.length : 0) > (images.questionImages != null ? images.questionImages.length : 0) ? images.inspectionImages : images.questionImages;
    if (!(longerArray && longerArray.length > 0)) return; // if there are no images to download, skip batching logic

    // initialize batches
    for (let i = 0; i < longerArray.length; i+=this.imageDownloadBatchSize)
    {
      let inspectionImagesbatch = images.inspectionImages ? images.inspectionImages.slice(i, i + this.imageDownloadBatchSize): [];
      let questionImagesbatch = images.questionImages ? images.questionImages.slice(i, i + this.imageDownloadBatchSize): [];

      let batch = {inspectionImages: inspectionImagesbatch ?? [], questionImages: questionImagesbatch ?? []}
      // assemble batches in such a way that getImagesThread still works with batching
      batches.push(batch);
    }

    let totalCount = 0;

    console.log(batches);

    for (let batch of batches) {
      console.log(batch);

      const imagesThread = this.getImagesThread(batch);
      await this.downloadImages(imagesThread, totalCount, totalImages);

      totalCount += (imagesThread.length);
    }
  }


  private processQuestionImages(
    download: any,
    acc: any,
    totalImages: number
  ): [any, number] {
    if (download['QuestionImage']) {
      const model = new QuestionImageModel(
        download.InspectionItemCode,
        download.QuestionImage
      );
      if (acc['questionImages']) {
        if (
          !acc['questionImages'].find((e) => e.imageName === model.imageName)
        ) {
          acc['questionImages'].push(model);
          totalImages++;
        }
      } else {
        acc['questionImages'] = [model];
        totalImages++;
      }
    }
    return [acc, totalImages];
  }

  private processInspectionImages(
    download: any,
    acc: any,
    totalImages: number
  ): [any, number] {
    if (download['Images']) {
      const imagesArray = download.Images;
      imagesArray.forEach((img) => {
        const model = new DownloadImageModel(
          download.InspectionWorkOrderId.toString(),
          img.InspectionResponseID,
          Math.floor(img.ID).toString(),
          download.InspectionItemCode,
          img.imageCaption
        );
        if (acc['inspectionImages']) {
          acc['inspectionImages'].push(model);
        } else {
          acc['inspectionImages'] = [model];
        }

        totalImages++;
      });
    }
    return [acc, totalImages];
  }

  private getImagesThread(images): Array<Observable<any>> {
    const imagesThread: Array<any> = [];
    if (!MIUtilities.isNullOrUndefinedObject(images)) {
      if (!MIUtilities.isNullOrUndefinedObject(images['inspectionImages'])) {
        images['inspectionImages'].map((i) =>
          imagesThread.push(this.downloadImageContent(i))
        );
        if (!MIUtilities.isNullOrUndefinedObject(images['questionImages'])) {
          images['questionImages'].map((i) =>
            imagesThread.push(this.downloadQuestionImageContent(i))
          );
        }
      } else if (
        !MIUtilities.isNullOrUndefinedObject(images['questionImages'])
      ) {
        images['questionImages'].map((i) =>
          imagesThread.push(this.downloadQuestionImageContent(i))
        );
      }
    }
    
    return imagesThread; // this will get forkjoined to save the responses but at this point, all of the http requests have already been fired
  }

  private async downloadImages(imagesThread, processed, totalImages): Promise<void> {
    let batchProcessedCounter: number = 0;
    this.downloadTotals.totalImages = totalImages;
    try {
      if (
        !MIUtilities.isNullOrUndefinedObject(imagesThread) &&
        imagesThread.length > 0
      ) {
        const source$ = forkJoin(
          imagesThread.map((req) => {
            req.then(() => {
              batchProcessedCounter++;
              this.loadingIndicatorService.setCountMsgTranslated(
                'inspection.downloadingImage', processed + batchProcessedCounter, totalImages
              ); // THIS IS ACTUALLY THE COUNTER FOR SAVING, NOT DOWNLOADING
            }).catch(() => {
              this.downloadTotals.totalImagesFailed++; // Increment counter if download fails
            });
            return req;
          })
        );
        await lastValueFrom(source$);

        return null;
      }
    } catch (err) {
      this.appInsights.logException( new Error(err));
      console.error(err);
      return null;
    }
  }

  private async downloadDocuments(
    workOrders: any,
    isPending: boolean
  ): Promise<void> {
    let workOrderDocuments = workOrders
      .filter((workOrder) => workOrder['Documents'])
      .map((workOrder: WorkOrderList) => {
        return workOrder['Documents'].map((document) => {
          const workOrderDocument = new WorkOrderDocument();
          workOrderDocument.init(document);
          workOrderDocument.inspectionId = workOrder['ID'];
          return workOrderDocument;
        });
      });

    workOrderDocuments = [].concat.apply([], workOrderDocuments);
    await this.downloadWODocuments(workOrderDocuments, isPending);
  }

   private getBatches(source, size): Array<Array<any>>
   {
      // batch any source (an array) into chunks of specified size
      const batches : Array<Array<any>> = source.reduce((chunks, doc, i) => {
        if (i % Number(size) === 0) chunks.push([doc]);
        else {
          chunks[chunks.length - 1].push(doc);
        }
        return chunks;
      }, []);
      return batches;
   }

  private async downloadWODocuments(workOrderDocuments: WorkOrderDocument[], isPending?: boolean) {
    let counter = 0;
    let batches = this.getBatches(workOrderDocuments, this.documentDownloadBatchSize);

    for (let batch of batches) {
      const downloadFiles: Array<Promise<any>> = batch.map((doc) =>
        // document download fires from inside here
        this.downloadDocumentContent(
          doc,
          isPending
        ));

      if (workOrderDocuments.length) {
        const source$ = await forkJoin(
          downloadFiles.map((req) => {
            req.then(() => {
              counter++;
              /**
               * This is a placeholder to show the downloading message using counter
               */
              this.loadingIndicatorService.setCountMsgTranslated(
                'inspection.downloadingDocuments', counter, workOrderDocuments.length
              ); // THIS IS ACTUALLY THE COUNTER FOR SAVING, NOT DOWNLOADING
            }).catch((error) => {
              this.downloadTotals.totalDocumentsFailed++; // Increment counter if download fails
            });
            return req;
          }));

        const wodocarray: WorkOrderDocument[] = await lastValueFrom(source$);
        await db.updateBulkDocumentContent(wodocarray);
      }
      this.downloadTotals.totalDocuments = counter;
      console.log(counter + ' docs were downloaded');
    }
  }

  private async downloadImageContent(image) {
    const inputImage = new DownloadImageModel(
      image.inspectionID,
      image.responseID,
      image.imageID,
      image.inspectionItemCode,
      image.imageCaption
    );
    const source$ = this.responseImageAPI.downloadImage(inputImage);
    const imageResponse = await lastValueFrom(source$);
    /**
     * First delete the image from local DB if it already exists to avoid duplicates
     */
    /**
     * Next, save the image with image content to the local DB
     */
    await db.updateImageContentWithoutWorkOrderContext(
      image.inspectionID,
      image.responseID,
      image.imageID,
      imageResponse.ImageData
    );
  }

  private async downloadDocumentContent(
    woDoc: WorkOrderDocument,
    isPending: boolean,
    islastDoc?: boolean
  ): Promise<any> {
    const httpUrl =
      `${ENV.documents_api}/${woDoc.inspectionId}/documents/${woDoc.id}` +
      '?' +
      MIUtilities.getDeviceInfo();
    return firstValueFrom(this.http
      .get(httpUrl, { responseType: 'blob' }))
      .then((blob: any) => {
        return this.blobToBase64(blob)
          .then((uri: string) => {
            woDoc.fileURI = uri;
            if(woDoc.fileURI?.toLowerCase().includes('application/pdf'))
                woDoc.fileURI = uri.replace('application/pdf;', 'application/octet-stream;');
            woDoc.isDownloaded = 1;
            return woDoc;
          })
      })
  }

  private async downloadQuestionImageContent(image: QuestionImageModel) {
    const source$ = this.questionImageAPI.downloadQuestionImage(image.questionId);
    const imageResponse = await lastValueFrom(source$);
    /**
     * Next, save the image with image content to the local DB
     */
    let questionImage: InspectionQuestionImage =
      new InspectionQuestionImage(
        image.questionId,
        image.imageName,
        imageResponse.Data
      );
    await db.updateQuestionImage(questionImage);
  }

  private async getCompareModel(
    workOrderIds?: Array<number>,
    compareType: string = 'default'
  ) {
    const excludedStatus = [99, 100];
    const workorders = await db.getWorkOrdersNotInStatus(excludedStatus);

    let compareRequestModel = [];

    // call dexie once to gell all the images and documents
    const woIds = workorders.map(wo => wo.id);
    const imagesByWO = await db.bulkGetImagesByWorkOrderId(woIds);
    const documentsByWO = await db.getAllDocumentsByWorkOrderId(woIds)

    workorders?.forEach(async (workOrder) => {
      let element = {};
      element['WoId'] = workOrder.id;
      element['WoCode'] = workOrder.code;
      element['woStatus'] = workOrder.aiInternalStatus;
      element['GroupId'] = workOrder.groupId;
      element['ResponseCreatedDate'] = workOrder.responseCreatedDate;
      element['ResponsesCount'] = workOrder.inspectionResponses ? workOrder.inspectionResponses.length : 0;
      element['UserId'] = workOrder.userId;

      /**
       * Get all image files names for all response images for this work order
       */
      const images = imagesByWO.filter(image => image.inspectionId == workOrder.id);
      if (images.length) {
        const fileNames = images.map((image) => image.fileName).filter((fileName) => fileName);
        element['FileNames'] = fileNames.join(',');
      } else {
        element['FileNames'] = '';
      }

      /**
       * Get all document names for all documents in this work order
       */
      const documents = documentsByWO.filter(doc => doc.inspectionId == workOrder.id);
      element['DocNames'] = documents.length ? documents.map((doc) => doc?.docName).join(',') : '';
      compareRequestModel.push(element);
    });
    return compareRequestModel;
  }

  /**
     *
     * @param wo
     * @param additionalWorkOrderIds
     * @param compareType
     * @returns
     */
  private async upload(wo?: WorkOrderList[], additionalWorkOrderIds: number[] = null, compareType = "default"): Promise<RestrictionsModel> {
    // Due to a poor internet connection, some images may not have been uploaded to web.
    this.submittedImages = await db.getPendingImagesToUpload();

    const restrictions: RestrictionsModel = await this.compareWorkOrder(compareType);

    if (restrictions.alertMsg != null) {
      // not translating because the content isnt translated
      this.dialog.open(PromptInfoComponent, {
        width: '350px',
        data: {
          title: 'Notification',
          content: restrictions.alertMsg,
          formattedContent: restrictions.alertMsg,
          showOkButton: true,
        },
        panelClass: 'custom-dialog',
      });
    }

    /**
     * On server, delete the responses which are removed locally.
     * Wait for the response deletion in the server before sending anything
     */
    await lastValueFrom(this.deleteResponses());

    await this.deleteImages();

    const files = !MIUtilities.isNullOrUndefined(restrictions) ? restrictions.files : "";
    console.log(restrictions);

    // this function needs to be optimized
    let updatedWorkOrders = await this.uploadResponses(wo, restrictions);

    console.log("UPLOAD>>>STEP IMAGE UPLOAD>>>");
    /**
     * Upload Images, passing in the updated work orders so we wont have to re-query the same work orders and store them again in memory
     */
    console.log(restrictions);

    await this.uploadImages(updatedWorkOrders, files);

    console.log("UPLOAD>>>STEP DOCUMENT UPLOAD>>>");

    /**
     * Upload Documents, passing in the updated work orders so we wont have to re-query the same work orders and store them again in memory
     */
    await this.uploadDocuments(updatedWorkOrders.map(wo => wo.id));

    // Check if some images failed to upload during sync
    await this.uploadPendingSubmittedImages();

    // Due to a poor internet connection, some documents may not have been uploaded to web. 
    await this.getPendingDocumentsToUpload();

    /**
     * Update image captions, passing in the updated work orders so we wont have to re-query the same work orders and store them again in memory
     */
    const imageUpdates = await this.getUpdatedImages(updatedWorkOrders);

    if (imageUpdates && imageUpdates.length > 0) {
      // reduces memory usage from updateImages responses
      let batches = this.getBatches(imageUpdates, this.imageDownloadBatchSize);

      for (let batch of batches)
      {
        const success = await this.updateImages(batch);
        if (success) { // Don't change 'isChanged' property if failed
          await db.updateImagesIsChangedV2(batch);
        }
      }
    }

    return restrictions;
  }

  async getUpdatedImages(updatedWorkOrders: WorkOrderList[])
  {
    let modifiedImageList = [];
    const images = await db.bulkGetImagesByWorkOrderId(updatedWorkOrders.map(wo => wo.id));
    images.forEach((image) => {
      if (image.isChanged === "Y") {
        modifiedImageList.push(({
          ID: image.serverId,
          InspectionResponseID: image.inspectionResponseId,
          ImageCaption: image.imageCaption,
          workOrderId: image.inspectionId,
        }))
      }
    });

      return modifiedImageList;
  }

  private async uploadPendingSubmittedImages() {
    this.loadingIndicatorService.setMsgTranslated('inspection.uploadingResponseImage');
    try {
      if (!MIUtilities.isNullOrUndefinedObject(this.submittedImages) && this.submittedImages.length > 0) {
        const { woIds, files } = this.submittedImages.reduce((acc, { id, fileName }) => {
          acc.woIds.push(id);
          acc.files.push(fileName);
          return acc;
        }, { woIds: [], files: [] });

        const images = await this.getImages({ ids: woIds, fileNames: files.join(',') });
        await this.uploadImages(this.submittedImages, images);
      } else {
        console.log("There are no images for submitted inspections to check.");
      }
    } catch (err) {
      console.log("Error in uploadPendingSubmittedImages, proceeding with sync:", err);
    }
  }

  private async getPendingDocumentsToUpload() {
    this.loadingIndicatorService.setMsgTranslated('inspection.uploadingWorkOrderDocument');
    const pendingDocuments = await db.getAllNewDocuments();

    if (pendingDocuments.length > 0) {
      await this.uploadDocuments(pendingDocuments.map(doc => doc.inspectionId));
    }
  }
  
  /**
   *
   * @param files
   */
  async uploadImages(updatedWorkOrders:WorkOrderList[], files: string) {

    this.loadingIndicatorService.setMsgTranslated('inspection.uploadingResponseImage');
    console.log("INSIDE IMAGE UPLOAD>>>");
    console.log("INSIDE IMAGE UPLOAD>>> STEP1");
    if (!MIUtilities.isNullOrUndefined(files) && files.length > 0) {
      console.log("INSIDE IMAGE UPLOAD>>> STEP1.1>>>");
      const inspectionResponseImages = await this.getImagesByFileNames(updatedWorkOrders, files);

      let batches = this.getBatches(inspectionResponseImages, this.imageDownloadBatchSize);
      console.log(batches);

      this.uploadTotals.totalImages = inspectionResponseImages ? inspectionResponseImages.length : 0;

      console.log(inspectionResponseImages);
      for (let i = 0; i < batches.length; i++)
      {
        let batch = batches[i];
        console.log(batch);
        console.log("INSIDE IMAGE UPLOAD>>> STEP3");
        if (MIUtilities.isNullOrUndefinedObject(batch) || batch.length === 0) {
          console.log("THERE ARE NO IMAGES TO UPLOAD>>>");
        } else {
          console.log("THERE ARE IMAGES TO UPLOAD>>>");
        }

        // Added this condition to stop from sync error when  compare api response
        // have series of commas for files
        if (batch.length > 0) {
          console.log(batch);
          const imageRequest = this.assembleUploadImagesRequest(batch);
          try {
            await this.forkImageRequests(imageRequest, batch, i * batch.length, this.uploadTotals.totalImages);
          } catch (error) {
            this.uploadTotals.totalImagesFailed += batch.length; // Increment counter by the number of images in the failed batch
          }
        }
      }
    }
  }

  async  getImagesByFileNames(updatedWorkOrders:WorkOrderList[], files: string) {
    const matchingResults: InspectionResponseImage[] = [];
    console.log(updatedWorkOrders);
    console.log(files);

    const images = await db.bulkGetImagesByWorkOrderId(updatedWorkOrders.map(wo => wo.id));
    let matchingImagesInFiles : { img: InspectionResponseImage, wo: WorkOrderList }[] = [];
    // return all images that are in files
    images.forEach(image => {
      if (files.includes(image?.fileName)) {
        const wo = updatedWorkOrders.find(inspection => inspection.id == image.inspectionId);
        matchingImagesInFiles.push({img: image, wo: wo});
      }
    });

    console.log(matchingImagesInFiles);

    for (const obj of matchingImagesInFiles) {
      // Check if the files has the filename
      if (files.includes(obj.img.fileName)) {
        // when 'files' contains the image name and it wasn't changed in mobile,
        // it means the image was deleted from web
        if (obj.img.isChanged === 'N') {
          //  delete the image in mobile too.
          await db.deleteImage(
            obj.wo,
            obj.img.inspectionResponseQuestionId,
            obj.img.serverId
          );
        } else {
          // add to matchingResults to upload the image to web
          matchingResults.push(obj.img);
        }
      }
    }
    return matchingResults;
  }

  /**
   *
   * @param imageRequest
   * @param inspectionResponseImages
   */
  private async forkImageRequests(imageRequest, inspectionResponseImages, count, total) {
    let counter = 0;
    console.log(imageRequest);
    const source$ = await forkJoin(imageRequest.map( (req) =>
    req.pipe(
      tap(e => {
        counter++;
        if (total > 0)
          this.loadingIndicatorService.setCountMsgTranslated(
            'inspection.uploadingResponseImage',  count + counter, total
          );
      })
    )
    ));

    const responses = await lastValueFrom(source$);
    if (responses) {
      inspectionResponseImages.forEach(async (i, index) => {
        if (responses[index]?.ID) {
          const msg = MIUtilities.getRespValidationResult(responses[index]);
          if (MIUtilities.isNullOrUndefined(msg) || msg.trim().length === 0) {
            console.log("INSIDE IMAGE UPLOAD SUCCESS. UPDATING THE ID IN LOCAL DB>>> STEP4>>" + i.serverId + " AND RESPONSE ID " + i.inspectionResponseId);
            let serverId = this.getImageServerId(responses, index);
            await db.updateImageServerId(i.serverId, serverId);
          } else {
            console.log("IMAGE UPLOAD FAILED>>>STEP 5 FOR LOCAL IMAGE ID >>>" + i.serverId + " AND RESPONSE ID " + i.inspectionResponseId);
          }
        } else {
          console.log("RESPONSES[INDEX] IS NULL IMAGE UPLOAD FAILED>>>STEP 6" + JSON.stringify(responses));
        }
      });
    } else {
      console.log("RESPONSES ARE NULL>>>IMAGE UPLOAD FAILED>>>STEP 7" + JSON.stringify(responses));
    }
  }

  /**
   *
   * @param inspectionResponseImages
   * @returns
   */
  private assembleUploadImagesRequest(inspectionResponseImages: InspectionResponseImage[]) {

    return inspectionResponseImages?.map(
      (inspectionResponseImage) => {
        let img = this.responseImageAPI.uploadImage(inspectionResponseImage);

        return img;
      }
    );
  }

  /**
   *
   * @param responses
   * @param index
   * @returns
   */
  private getImageServerId(responses, index: number) {
    let serverId = null;
    try {
      if (responses[index].ID.toString().trim().endsWith(".0")) {
        serverId = responses[index].ID.toString().trim().slice(0, -2);
      } else {
        serverId = responses[index].ID;
      }
    } catch (err) {
      serverId = responses[index].ID;
    }
    return serverId;
  }


  /**
   * Gets the new docs from that work order to upload
   **/
  async uploadDocuments(updatedWos: Array<number>) {
    this.uploadTotals.totalDocuments = 0;
    this.uploadTotals.totalDocumentsFailed = 0;
    this.loadingIndicatorService.setMsgTranslated('inspection.uploadingWorkOrderDocument');
    let uploadableWorkOrderDocuments = await db.getNewDocumentsByWorkOrderId(updatedWos);

    this.uploadTotals.totalDocuments = uploadableWorkOrderDocuments.length;

    for (const workOrderDocument of uploadableWorkOrderDocuments) {
      try {
        let formData = new FormData();
        const previousId = workOrderDocument.id.toString();
        const fileName = workOrderDocument?.docName;
        const fileBlob = this.dataURItoBlob(workOrderDocument.fileURI);
        const file = new File([fileBlob], fileName);
        formData.append("file", file);

        let result = await lastValueFrom(this.http.post<WorkOrderDocumentResponseModel>(`${ENV.documents_api}/${workOrderDocument.inspectionId}/documents?` +
          MIUtilities.getDeviceInfo(), formData));

        workOrderDocument.isUploaded = 1;
        workOrderDocument.id = result[0].ID.toString();
        await db.updateDocumentContent(previousId, workOrderDocument);
      } catch (error) {
        this.uploadTotals.totalDocumentsFailed++;
      }
    }

    // When all the documents are uploaded, no responses were updated and the work order is still marked as changed, set isChanged to 'N'.
    if (this.noResponsesUpdated) {
      updatedWos.forEach(woId => db.setInspectionSynced(woId));
    }
  }  



  /**
 *
 * @param dataURL
 */
  private dataURItoBlob(dataURI: string) {
    const contentType = dataURI.split(';base64,')[0].replace('data:', '');
    const base64Data = dataURI.split(';base64,')[1];
    const byteString = window.atob(base64Data);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([int8Array], { type: contentType });
    return blob;
  }


  /**
   *
   * @returns
   */
  private deleteResponses(): Observable<boolean> {
    let responseIds = localStorage.getItem("delRespIds");
    if (responseIds && responseIds.length > 0) {
      responseIds = "[" +
            responseIds.replace(/, +/g, ",").split(",").map(Number).toString() +
                "]";
      return this.responseAPI.deleteResponses(responseIds).pipe(
        tap(() => {
            console.log("DELETERESPONSES SUCCESSFUL");
            localStorage.removeItem("delRespIds");
        }),
        map(() => true),
        catchError((error) => {
          console.log("DELETERESPONSES FAILED:", error);
          return of(false);
        })
      );
    }
    return of(true);
  }


  /**
  *
  * @param wo
  * @param restrictions
  */
  private async uploadResponses(wo: WorkOrderList[], restrictions: any) : Promise<WorkOrderList[]> {
    this.loadingIndicatorService.setMsgTranslated('inspection.uploadingWorkOrders');
    const excludedStatus = [99, 100];
    let woToUpload: WorkOrderList[] = null;
    if (!MIUtilities.isNullOrUndefinedObject(wo)) {
      woToUpload = wo;
      console.log(woToUpload);
    } else {
      woToUpload = await db.getUpdatedWorkOrders();
      console.log(woToUpload);
      woToUpload = woToUpload.filter(
        (wo) => !excludedStatus.includes(wo.aiInternalStatus)
      );
    }

    console.debug("INSIDE UPLOAD RESPONSES>>>STEP3>>");
    woToUpload = woToUpload.filter(wo => !excludedStatus.includes(wo.aiInternalStatus));

    console.log(woToUpload);
    const responsesToUpload: Array<WorkOrderUpdates> = await woToUpload?.reduce(
      async (requestAcc, wo) => {
        const request: WorkOrderUpdates = await this.createRequest(
          wo,
          restrictions
        );
        if (request)
          await requestAcc.then(acc => {
            acc.push(request);
          });
        return requestAcc;
      },
      Promise.resolve([])
    );

    console.debug("INSIDE UPLOAD RESPONSES>>>STEP4>>");
    console.log(responsesToUpload);

    // batch here
    let batches = this.getBatches(responsesToUpload, this.workOrderResponseDownloadBatchSize);
    console.log(batches);
    let counter: number = 0;
    for (let batch of batches)
    {
        // send one request per response to upload
        console.log(batch);

        if (batch.length == 0) continue;
        const uploadRequests: Array<Observable<any>> = batch.map(r =>
          this.syncResponsesV2(r)
        );

        console.debug("INSIDE UPLOAD RESPONSES>>>STEP5>>");
        if (uploadRequests.length > 0) {
          this.uploadTotals.totalWorkOrders = uploadRequests.length;
          let response = await lastValueFrom(forkJoin(uploadRequests.map(req =>
            req.pipe(
              tap(e => {
                counter++;
                this.loadingIndicatorService.setCountMsgTranslated(
                  'inspection.uploadingWorkOrders', counter, responsesToUpload.length
                );
              })
            )
          )));

          batch.forEach(async(r, i) => {
            const msg = MIUtilities.getRespValidationResult(response[i]);
            console.log("UPLOAD API MESSAGE IS " + msg + " response uploaded for " + r.inspectionid);
            if (MIUtilities.isNullOrUndefined(msg) || msg.length === 0) {
              // This db call has to finish before we do anything in the UI
              // Process all DB updates on successful sync of data for a workorder
              await Promise.resolve(response[i]).then(async response => {
                await db.doWOSyncSuccessDBUpdates(response, r, r.inspectionid);
              });
            } else {
              console.log(
                `SYNC FAILED FOR THE WORKORDER >>> ${r.inspectionid}. Message is ${msg} for user ${this.settingsService.getUser()?.Email}`
              );
            }

            await db.setInspectionSynced(r.inspectionid);
          });
    }

    }

    // If the work order is marked as changed (isChanged = 'Y') but has no responses to upload,
    // it indicates that only the documents were updated. This prevents re-querying the responses later.
    this.noResponsesUpdated = ((woToUpload && woToUpload.length > 0) && (batches && batches.length == 0));

    return woToUpload; // return so that we dont have to re-query dexie on the next steps

  }

  /**
   *
   * @param response
   * @returns
   */
  syncResponsesV2(response: WorkOrderUpdates): Observable<any> {

    let url: string = "inspection-assignment/" + response.inspectionid +
      "/SyncResponses/v2?status=" + response.status + "&" + MIUtilities.getDeviceInfo();
    if (!MIUtilities.isNullOrUndefined(response.userid)) {
      url += "&userid=" + response.userid;
    }
    if (!MIUtilities.isNullOrUndefined(response.completionDate)) {
      url += "&completionDate=" + response.completionDate;
    }
    const currDate: string = (new Date()).toISOString();
    localStorage.removeItem("ResponsesCreateDate");
    url += "&ResponsesCreateDate=" + currDate;

    // now returns an Observable of Config
    return this.responseAPI.syncResponses
      (
        url,
        response
      ).pipe(map(
         (res: any) => {
          let serverNewResponses: any[] = [];
          if (res && res.length > 0) {

            res.filter(element => !MIUtilities.isNullOrUndefinedObject(element.InspectionItemCode) &&
            (element.InspectionItemCode.indexOf('ADHOC_') > -1 || element.InspectionItemCode.indexOf('-copy-') > -1 || element.SubsectionCopy))
            .forEach((element) => {

              serverNewResponses.push({
                'clientId': element.InspectionItemCode,
                'serverId': Number(element.ID)
              });
            });

          }
          res.respCreatedDate = currDate;
          res.serverNewResponses = serverNewResponses;

          return res;
        })
      );
  }



  /**
   *
   * @param wo
   * @param restrictions
   * @returns
   */
  private async createRequest(
    wo: WorkOrderList,
    restrictions: RestrictionsModel
  ): Promise<WorkOrderUpdates> {
    console.log("INSIDE createRequest>>>1");
    const iResponses: Array<InspectionResponse> = wo.inspectionResponses?.filter(response => response?.isChanged == 'Y');
    console.log("INSIDE createRequest>>>2");
    const tmlDetails = wo?.tmlDetails?.isChanged == 'Y' ? wo.tmlDetails : null;;

    let eqDetails: Array<EquipDetails> = [];
    let eqDetailsChangedCount = 0;
    console.log("INSIDE createRequest>>>3");
    if (restrictions === null ||
      (restrictions)
    ) {
      eqDetails = wo.eqDetails; //await db.getEquipmentDetailsByWorkOrder(wo.id);
      eqDetailsChangedCount = eqDetails?.filter(eqDetail => eqDetail.isChanged == 'Y')?.length;
    }

    let responses = await this.getUpdatedResponses(wo, eqDetailsChangedCount, iResponses, tmlDetails, eqDetails);
    console.log(responses);
    return responses;
  }

  private async getUpdatedResponses(wo, eqDetailsChangedCount, iResponses, tmlDetails, eqDetails) {
    if (
      eqDetailsChangedCount > 0 ||
      iResponses?.length > 0 ||
      !MIUtilities.isNullOrUndefined(tmlDetails) ||
      (wo.summaryComments && (wo.summaryComments != wo.hiddenSummary)) ||
      wo.aiInternalStatus === 2 ||
      !MIUtilities.isNullOrUndefined(wo.reassigned_id)
    ) {
      const meridiumData = wo.source === 'Meridium';
      let meridiumDetails = null;
      if (meridiumData) {
        meridiumDetails = wo.meridiumDetails;
        // use the meridiumDetails in the WO instead of doing to the DB to refetch the WO again only to get the same data await db.getMeridiumDetailsByWorkOrder(wo.id);
      }

      const equipmentDetails = this.getEquipmentDetails(eqDetails, meridiumData, meridiumDetails, wo);

      const responses =
        iResponses.length > 0
          ? iResponses.map(response => {
            return this.buildResponse(response, wo);
          })
          : [];

      const tmlPoints = this.getTMLPoints(tmlDetails);

      const comment = !MIUtilities.isNullOrUndefined(wo.summaryComments) ? wo.summaryComments : "";
      const summary = wo.summary ? wo.summary : "";
      const requestModel = this.getRequestModel(responses, equipmentDetails, tmlPoints, comment, summary, wo.inspectionType);

      const userid = wo.reassigned_id ? wo.reassigned_id : "";

      let status = await this.getStatus(wo.aiInternalStatus, wo);

      let woUpdates = this.getWorkOrderUpdates(wo, userid, requestModel, status);
      return woUpdates
    }
    return null;
  }

  /**
   *
   * @param wo
   * @param userid
   * @param requestModel
   * @param status
   * @returns
   */
  private getWorkOrderUpdates(wo, userid, requestModel, status) {
    return new WorkOrderUpdates(
      +wo.id,
      userid,
      +status,
      JSON.stringify(requestModel),
      wo.aiDateCompleted
    );
  }

  /**
   *
   * @param status
   * @param wo
   */
  private async getStatus(status, wo) {

    if (status === 2 && !wo.reviewRequired) {
      const recs = wo.inspectionResponses.filter(
        (response) => response.comments !== '' || response.recommendation !== '').length;

      if (recs == 0) {
        console.log(`[sync] ${wo.code} - Review not required. Setting status 5.`);
        status = 5;
      }
    }
    return status;
  }

  /**
   *
   * @param responses
   * @param equipmentDetails
   * @param tmlPoints
   * @param comment
   * @param summary
   * @param inspectionType
   * @returns
   */
  private getRequestModel(responses, equipmentDetails, tmlPoints, comment, summary, inspectionType) {
    const requestModel: any = {};
    requestModel.Responses = responses;
    if (inspectionType === "Piping (Meridium)")
      requestModel.EquipmentDetails = "";
    else if (
      !MIUtilities.isNullOrUndefined(equipmentDetails) &&
      equipmentDetails.length > 0
    ) {
      requestModel.EquipmentDetails = equipmentDetails;
    }
    if (
      !MIUtilities.isNullOrUndefined(tmlPoints) &&
      tmlPoints.length > 0
    ) {
      requestModel.TMLPoints = tmlPoints;
    }
    requestModel.Comment = comment;
    requestModel.Summary = summary;
    return requestModel;
  }

  /**
   *
   * @param tmlDetails
   * @returns
   */
  private getTMLPoints(tmlDetails): string {
    return tmlDetails
      ? JSON.stringify(
        {
          InspectorName: tmlDetails.inspectorName,
          TMLPoints: tmlDetails.tmlReadings,
          NewTMLsConfig: JSON.parse(tmlDetails.newTMLs),
          NewTMLs: JSON.parse(tmlDetails.newTMLs),
          tmlConfig: tmlDetails.tmlConfig
            ? JSON.parse(tmlDetails.tmlConfig)
            : [],
          EquipData: [
            {
              ["Equipment Number"]: tmlDetails.equipmentNumber,
              ["Equipment Type"]: tmlDetails.equipmentType,
              ["Plant ID"]: tmlDetails.plantId,
              ["Site Name"]: tmlDetails.siteName
            }
          ]
        }
      )
      : "";
  }

  /**
   *
   * @param eqDetails
   * @param meridiumData
   * @param meridiumDetails
   * @param wo
   * @returns
   */
  private getEquipmentDetails(eqDetails, meridiumData, meridiumDetails, wo): string {
    if (!MIUtilities.isNullOrUndefinedObject(eqDetails) &&
      eqDetails.length > 0) {
      return JSON.stringify({
        Fields: eqDetails.map(detail => {
          return this.getUpdatedVisionsItem(detail);
        }),
        ["Inspection Type"]: wo.inspectionType,
        SendToVisions: JSON.stringify(wo.sendtovisions),
        meridiumData,
        ...(meridiumData && meridiumDetails ? { BasicInformation: meridiumDetails.equipmentData.BasicInformation } : {}),
        ...(meridiumData && meridiumDetails ? { DamageMechanism: meridiumDetails.equipmentData.DamageMechanism } : {}),
        ...(meridiumData && meridiumDetails ? { EquipmentDetail: meridiumDetails.equipmentData.EquipmentDetail } : {}),
      });
    }
    return "";
  }

  /**
   *
   * @param detail
   * @returns
   */
  private getUpdatedVisionsItem(detail) {
    let updatedVisionsItem = null;
    try {
      updatedVisionsItem = detail?.jsonValue ? JSON.parse(detail.jsonValue) : {};
    } catch (err) {
      updatedVisionsItem = {};
      console.log("ignore error...");
    }
    if ((!MIUtilities.isNullOrUndefined(detail) && detail.fieldType !== "Not Editable") ||
      (!MIUtilities.isNullOrUndefinedObject(detail) &&
        !MIUtilities.isNullOrUndefined(detail.updatedVal) &&
        !MIUtilities.isNullOrUndefinedObject(updatedVisionsItem))) {
      updatedVisionsItem["NewValue"] = detail ? detail.updatedVal : "";
    }
    return updatedVisionsItem ? updatedVisionsItem : {};
  }

  /**
   *
   * @param response
   * @param workorder
   * @returns
   */
  private buildResponse(response, workorder: WorkOrderList) {
    console.log("response",response)
    const responseObj = {
      Answer: response.answer,
      Comments: response.comments ? response.comments : "",
      Recommendation: response.recommendation ? response.recommendation : "",
      IsImmediateAttentionRequired: JSON.stringify(response.attention),
      InspectionItemCode: response.questionId,
      CreatedBy: response.createdBy,
      CreatedDate: response.createdDate,
      FollowUpWO: JSON.stringify(response.followUpWO),
      CircuitPiping: response.circuitPiping ? response.circuitPiping : "",
      ActionMsg: response.actionMsg,
      SubsectionCopy: JSON.stringify(response.subCopy)
    };

    if (!MIUtilities.isNullOrUndefined(response.id)) {
      responseObj['ID'] = response.id;
      responseObj['InspectionItemSubsection'] = MIUtilities.isNullOrUndefined(response.subsection)
        ? ""
        : response.subsection.trim();
      responseObj['InspectionItemCode'] = MIUtilities.isNullOrUndefined(response.questionId)
        ? ""
        : response.questionId.trim();
    } else {
      responseObj['ID'] = 0;
      responseObj['InspectionItemType'] = response.itemType;
      responseObj['InspectionItemDescription'] = response.question;
      responseObj['InspectionSection'] = response.inspectionSection;
      responseObj['InspectionWorkOrderCode'] = workorder.code;
      responseObj['SectionSortID'] = response.sectionSortId;
      responseObj['SubSectionSortID'] = response.subSectionSortId;
      responseObj['ItemSortID'] = response.sortId;
      responseObj['InspectionItemSubsection'] = MIUtilities.isNullOrUndefined(response.subsection)
        ? ""
        : response.subsection.trim();
      responseObj['DisplayNA'] = response.displayNA;
      responseObj['Units'] = response.units;
      responseObj['InspectionItemConditions'] = MIUtilities.isNullOrUndefined(
        response.conditions
      )
        ? ""
        : response.conditions;
    }
    responseObj['ConditionalExpression'] = MIUtilities.isNullOrUndefined(response.conditionalExpression)
      ? ""
      : response.conditionalExpression;
    responseObj['InspectionItemOptions'] = MIUtilities.isNullOrUndefined(response.options)
      ? ""
      : response.options;
    return responseObj;
  }

  /**
   *
   * @param ids
   */
  async getImages(ids): Promise<string> {
    const imgReq = await this.responseImageAPI.getImages(ids);
    let imgRes = await lastValueFrom(imgReq);
    const msg = MIUtilities.getRespValidationResult(imgRes);

    if (MIUtilities.isNullOrUndefined(msg) || msg.length === 0) {
      console.log("GETIMAGES SERVICE SUCCESS>>>" + imgRes["files"]);
      return imgRes["files"];
    } else {
      console.error("Image","1. GETIMAGES api error >>>" + msg);
      return "";
    }
  }

  /**
   *
   * @param images
   */
  async updateImages(images: any) {
    try
    {
      console.log(`INSIDE UPDATEIMAGES>>> ${images.length} to update`);
      let respObs = this.responseImageAPI.updateImages(images);
      await lastValueFrom(respObs);
      return true;
    }
    catch(error){
      console.log(`INSIDE UPDATEIMAGES>>> ERROR UPDATING IMAGES: ${error}`);
      return false;
    }
  }

  blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  async uploadWorkorder(
    workorder: WorkOrderList,
    releaseWO?: boolean
  ) {
    this.loadingIndicatorService.show();

    try {
      console.log("UPLOAD>>>STEP RESPONSES UPLOAD>>>");
      /**
       * On server, delete the responses which are removed locally
       * Wait for the response deletion in the server before sending anything
       */
      await lastValueFrom(this.deleteResponses());
      const workOrder = await db.workOrderList.get(workorder.id);
      console.log(workOrder);

      await this.deleteImages(workOrder.id);

      await this.uploadResponses([workOrder], null);

      console.log("UPLOAD>>>GET IMAGES>>>");
      /**
       * Get all image files names for all response images for this work order (local images)
       */
      const imageList = await db.getImagesByWorkOrderId(workOrder.id);
      const fileNames = imageList.map((image) => image.fileName).filter((fileName) => fileName);
      const files = fileNames.join(',');

      console.log(files);

      // Compare vs the server images to avoid duplicates
      const images = await this.getImages({ ids: [workOrder.id], fileNames: files });
      console.log("UPLOAD>>>STEP IMAGE UPLOAD>>>" + images);
      await this.uploadImages([workOrder], images);

      console.log("UPLOAD>>>STEP DOCUMENT UPLOAD>>>");
      await this.uploadDocuments([workOrder.id]);
      console.log("Check for image updates...");

      let imageUpdates = await this.getUpdatedImages([workOrder]);
      if (imageUpdates && imageUpdates.length > 0) {
      // reduces memory usage from updateImages responses
      let batches = this.getBatches(imageUpdates, this.imageDownloadBatchSize);

      for (let batch of batches)
      {
        const success = await this.updateImages(batch);
        if (success) { // Don't change 'isChanged' property if failed
          await db.updateImagesIsChangedV2(batch);
        }
      }
    }
      this.loadingIndicatorService.hide();
    } catch (error) {
      this.appInsights.logException( new Error(error));
      console.error(error);
      this.loadingIndicatorService.hide();
      this.errorService.openDialog(`Error Uploading Workorder ${workorder.code}`, error);
      this.workOrderListUpdated.next(false);
    }
  }

  /**
   * Deletes images in the server for the images that were deleted manually in the mobile device.
   * @returns
   */
  async deleteImages(inspectionId: number = null): Promise<boolean> {
    {
      try {
        let images = JSON.parse(localStorage.getItem("delImgIds")) ?? [];
        if (images && images.length > 0) {

          let imageIds = [];

          if(inspectionId)
          {
            imageIds = images.filter(img => img.inspectionId == inspectionId).map(img => img.imageServerId);
            images = images.filter(img => img.inspectionId != inspectionId);
          }
          else{
            imageIds = images.map(img => img.imageServerId);
            images = [];
          }

          const source$ = this.responseImageAPI.deleteImages(imageIds);
          let response = await lastValueFrom(source$);

          localStorage.setItem("delImgIds", JSON.stringify(images));
          console.log(response);
        }

        return true;

      } catch (err) {
        this.appInsights.logException( new Error(err));
        console.log("DELETEIMAGES FAILED 2>>>");
        console.error(err);
        return false;
      }
    }
  }

  initializeTotals() {
    this.uploadTotals = {
      totalWorkOrders: 0,
      totalImages: 0,
      totalDocuments: 0,
      totalImagesFailed: 0,
      totalDocumentsFailed: 0,
    };

    this.downloadTotals = {
      totalWorkOrders: 0,
      totalImages: 0,
      totalDocuments: 0,
      totalImagesFailed: 0,
      totalDocumentsFailed: 0,
    };
  }
}

