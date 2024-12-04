import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  NgZone,
  OnDestroy
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject, Subscription, lastValueFrom } from 'rxjs';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import { InspectionAssignmentAPIService } from 'src/app/core/services/api/inspection-assignment-api.service';
import { LoadingIndicatorService } from 'src/app/core/services/loading-indicator.service';
import {
  EquipDetails,
  InspectionResponseImage,
  MeridiumDetails,
  VisionsTML,
  WorkOrderDocument,
  WorkOrderList,
} from 'src/app/core/sync/entities';
import { db } from 'src/databases/db';
import { InspectionDetailsService } from '../../../services/inspection-details.service';
import Compressor from 'compressorjs'
import { ActivatedRoute, Router } from '@angular/router'
import { ENV } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from 'src/app/core/services/app-settings.service';
import { saveAs } from 'file-saver-es';
import { MIUtilities } from 'src/app/shared/utility';
import JSZip from 'jszip';
import { SharedService } from 'src/app/core/services/shared.service';
import { CanvasEditPhotoComponent } from '../../inspection-question-types/photo/canvas-edit/canvas-edit-photo.component';
import {v4 as uuidv4} from 'uuid';

@Component({
  selector: 'app-wo-equipment-tab',
  templateUrl: './wo-equipment.component.html',
  styleUrls: ['./wo-equipment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WOEquipmentComponent implements AfterViewInit, OnDestroy {
  private _inspection = new BehaviorSubject<WorkOrderList>(new WorkOrderList());
  equipmentDetails: Array<EquipDetails> = new Array<EquipDetails>();
  equipmentDetailsForm: FormGroup = new FormGroup({});
  filesDataSource: MatTableDataSource<WorkOrderDocument> = new MatTableDataSource<WorkOrderDocument>();
  formGroup: AbstractControl<any, any>;
  grouping: Array<any> = [];
  file: File | Blob;
  photo = '';
  private subscription = new Subscription();
  //InspectionID
  inspectionID = null;
  // tml details
  tmlDetails: VisionsTML;
  // meridium Details
  meridiumDetails: MeridiumDetails;
  showMeridiumTml: boolean = false;
  workOrderDocuments: Array<WorkOrderDocument> = new Array<WorkOrderDocument>();
  
  @Input() set inspection(value: WorkOrderList) {
    this._inspection.next(value);
  }

  get inspection() {
    return this._inspection.getValue();
  }

  constructor(
    private loadingIndicatorService: LoadingIndicatorService,
    private inspectionAssignmentService: InspectionAssignmentAPIService,
    public dialog: MatDialog,
    private ref: ChangeDetectorRef,
    private inspectionDetailsService: InspectionDetailsService,
    private route: Router,
    private translate: TranslateService,
    private settingsService: SettingsService,
    private sharedService: SharedService,
    private zone: NgZone,
    private router: ActivatedRoute
  ) { 
    this.inspectionID = this.router.snapshot.paramMap.get('id'); /**Taking inspection ID From URL, Since Inspection observable holds multiple IDs */
  }

  
  ngAfterViewInit() {
    try{
      this.inspectionDetailsService.showHomeIcon(true);
      this.loadingIndicatorService.show();
      this._inspection.subscribe(() => {
        if (
          this.inspection?.eqDetails &&
          this.inspection?.eqDetails.length > 0
        ) {
          this.grouping = this.inspection.eqDetails.reduce((acc, vision) => {
            try {
              vision['jsonOptions'] = JSON.parse(vision.options);
            } catch { }
            const index = acc.findIndex((e) => e.sectionName == vision.section);
            if (index === -1)
              acc.push({ sectionName: vision.section, visions: [vision] });
            else {
              acc[index].visions.push(vision);
            }
            return acc;
          }, []);
  
          this.equipmentDetails = this.inspection.eqDetails;
          this.createForm();
  
          this.ref.detectChanges();
        }
        this.setTMLMeridiumSource();
        this.createFilesDataSource();
        this.loadingIndicatorService.hide();
      });
    }
    catch(error){
      this.loadingIndicatorService.hide();
      console.log(error);
    }
  }

  setTMLMeridiumSource() {
    if (this.inspection?.tmlDetails &&
      this.inspection.tmlDetails.tmlReadings?.length > 0 && this.inspection?.id == this.inspectionID
    ) {
      this.tmlDetails = this.inspection.tmlDetails;
      this.ref.detectChanges();
    }

    if(this.inspection?.meridiumDetails && this.inspection?.id == this.inspectionID) {
      this.meridiumDetails = this.inspection.meridiumDetails;
      this.ref.detectChanges();
    }

    if(this.inspection?.meridiumData && this.inspection?.id == this.inspectionID) {
      this.showMeridiumTml = this.inspection?.meridiumData && this.inspection?.serviceType && !this.inspection?.serviceType?.includes('MeridiumCPF')
      this.ref.detectChanges();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();

    this._inspection = null;
    this.equipmentDetails = null;
    this.filesDataSource = null;
    this.grouping = null;
    this.photo = null;
    this.file = null;
    this.tmlDetails = null;
    this.meridiumDetails = null;
  }

  createForm() {
    if (this.equipmentDetails) {
      this.equipmentDetailsForm = new FormGroup({
        visionDetails: new FormArray(
          this.grouping.map((group) => {
            return new FormGroup({
              visions: new FormArray(
                group.visions.map((vision) => {
                  const form = new FormGroup({
                    id: new FormControl(vision.id),
                    inspectionId: new FormControl(vision.inspectionId),
                    fieldName: new FormControl(vision.fieldName),
                    currVal: new FormControl(vision.currVal),
                    units: new FormControl(vision.units),
                    updatedVal:
                      vision.fieldType &&
                        vision.fieldType.toLowerCase() === 'dropdown' &&
                        vision['jsonOptions'] &&
                        vision['jsonOptions'].length > 15 &&
                        vision['jsonOptions'].find(
                          (v) => v.Value === vision.updatedVal
                        )
                        ? new FormControl({
                          Name: vision['jsonOptions'].find(
                            (v) => v.Value === vision.updatedVal
                          ).Name,
                          Value: vision.updatedVal,
                        })
                        : new FormControl(vision.updatedVal),
                    fieldType: new FormControl(vision.fieldType),
                  });

                  this.subscription.add(
                    form.valueChanges.subscribe((value) =>
                      this.onEquipmentValueChanges(value)
                    )
                  );
                  return form;
                })
              ),
            });
          })
        ),
      });
    }
  }

  onEquipmentValueChanges(value) {
    const visionDetail: EquipDetails = this.inspection.eqDetails.find(
      (v) => v.id == value.id
    );
    if (typeof value.updatedVal === 'object') {
      visionDetail.updatedVal = value.updatedVal?.Value;
    } else {
      visionDetail.updatedVal = value.updatedVal ? value.updatedVal.toString() : '';
    }
    visionDetail.isChanged = 'Y';
    db.updateEquipmentProperty(visionDetail, value.id, this.inspection.id);
  }

  async createFilesDataSource() {
    // get documents from Dexie
   this.workOrderDocuments = await db.getAllDocumentsByWorkOrderId([this.inspection.id]);
    if (this.workOrderDocuments.length > 0) {
      this.filesDataSource.data = [...this.workOrderDocuments];
    }
  }

  previewImage(file: any, index: number) {
    const imageTypes = ['.png', '.webp', '.gif', '.svg+xml', '.jpeg', '.jpg'];
    const base64String = file.fileURI.toString().split(',')[1];
    if (imageTypes.some(image => file.docName?.toLowerCase().includes(image))) //image type, open photo editor
    {
      this.photo = base64String;
      this.openEditor(index, file);
    }
    else{
      //Part 2 to do: Open file instead of download
    }
      
  }

  async openEditor(index: number, file: any = null) {
    try {
      const base64String = file.fileURI.toString().split(',')[1];
      if(file.fileURI.indexOf('data:image/') == -1)
      {
          this.photo = 'data:image/png;base64,' + base64String;
      }
      else
      {
        this.photo = file.fileURI;
      }
      await this.zone.run(async () => {
        const photoDialog = this.dialog.open(CanvasEditPhotoComponent, {
          maxWidth: '100vw',
          maxHeight: '100vh',
          data: {
            showPhotoEditorTitle: true,
            showDrawButton: true,
            showTextButton: true,
            showSaveButton: true,
            showCloseButton: true,
            scaleToImage: true,
            photo: this.photo
          },
          panelClass: 'full-screen-modal',
        });

        const source$ = photoDialog.afterClosed();
        const photo = await lastValueFrom(source$);

        if (!photo) return;

        this.sharedService.loadIndicatorSvc.show();
        this.sharedService.loadIndicatorSvc.setMsgTranslated(
          'photo.savingPhoto'
        );

        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.width = photo.originalWidth;
        hiddenCanvas.height = photo.originalHeight;
        const hiddenCtx = hiddenCanvas.getContext('2d');

        const canvasImg = new Image();
        canvasImg.src = photo.imageData;

        canvasImg.onload = async () =>{

          hiddenCtx.drawImage(canvasImg, 0, 0, photo.drawingWidth, photo.drawingHeight, 0, 0, photo.originalWidth, photo.originalHeight);

          const imageBase64 = await fetch(hiddenCanvas.toDataURL());
          const imageBlob = await imageBase64.blob();
  
          let compressedImage = imageBlob;
          this.insertFile(compressedImage, file.docName);
          this.deleteFile(index);
          this.sharedService.loadIndicatorSvc.hide();
        }
      });
    } catch (error) {
      console.error(error);
      this.sharedService.loadIndicatorSvc.hide();
      this.sharedService.errDialogSvc.openDialog(
        'Error Saving Photo',
        error
      );
    }
  }

  // accepts one or more files that the user has uploaded, converts to base 64 then stores then in the db (attached to the inspection)
  public async fileUploaded(event) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      Array.from(files).forEach((file) => {
        // Replacing spaces and hyphen with underscore like in web
        const fileName = file.name.trim().replace(/ /g,"_").replace('-','_');
        // Skipping documents with same name silently like in web. Can be made better.
        if(this.workOrderDocuments.findIndex( d => d.docName === fileName) < 0)
        {
        if (file.type.includes('image') && this.settingsService.get('isCompressImage')) {
          new Compressor(file, { //if image is one of the below types and above the convertSize, it will be converted to jpeg and compressed
            convertTypes: ['image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/jpeg'],
            mimeType: 'image/jpeg', // convert all images to jpeg
            quality: 0.6,
            success: ((result) => {
              this.insertFile(result,fileName )
            }),
            error(err) {
              console.error(err)
            },
          })
        }
        else { //not an image, no compression
          this.insertFile(file, fileName)
        }
      }
      })
    }
  }

  //takes the file object and inserts it into the local inspection object (but does not update the db)
  private insertFile(file: File | Blob, fileName: string) {
    const reader: FileReader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;

      let doc = new WorkOrderDocument();
      doc.fileURI = base64data;
      if(doc.fileURI?.toLowerCase().includes('application/pdf'))
        doc.fileURI = base64data.replace('application/pdf;', 'application/octet-stream;');
      doc.docName = fileName;
      doc.inspectionId = this.inspection.id;
      doc.id = uuidv4();

      this.workOrderDocuments.push(doc);
      if (!this.filesDataSource) {
        this.filesDataSource = new MatTableDataSource();
      }
      this.filesDataSource.data = [...this.workOrderDocuments];
      await db.addWorkOrderDocument(doc);
      await db.setInspectionUpdated(this.inspection.id);
      this.ref.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  //triggered when user clicks x on the table to delete a file thats attached to the inspection
  public async deleteFile(index: number) {
    const selectedDocument = this.workOrderDocuments[index];
    this.workOrderDocuments.splice(index, 1);
    this.filesDataSource.data = this.workOrderDocuments;
    await db.deleteDocumentById(selectedDocument.id);
    if (this.filesDataSource.data.length === 0) {
      this.filesDataSource = null;
    }
  }

  clearFile(event: Event) {
    const target = event.target as HTMLInputElement;
    target.value = '';
  }

  async resetInspection() {
    try{
      let networkStatus = await this.sharedService.checkOfflineAndAlert('wo.offlineReset');

    if(networkStatus){
    let t = await lastValueFrom(this.translate.get(
      [
        'inspection.reset',
        'inspection.resetDesc',
        'wo.resetConfirm',
        'wo.resetSuccess',
        'wo.resetFail'
      ]
    ));
    const dialogRef = this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: {
        showYesButton: true,
        showNoButton: true,
        title: t['inspection.reset'],
        content:
          t['inspection.resetDesc'],
      },
      panelClass: 'custom-dialog',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadingIndicatorService.show();
        this.inspectionAssignmentService
          .resetInspection(this.inspection.id)
          .subscribe(
            (reset: {
              Message: string;
              Success: boolean;
              MessageDetail: string;
            }) => {
              if (reset.Success) {
                db.deleteWorkorders([this.inspection])
                this.route.navigate(['/home']);
                
                this.dialog.open(PromptInfoComponent, {
                  data: {
                    showOkButton: true,
                    title: t['wo.resetSuccess'],
                    content:
                      t['wo.resetConfirm'],
                  },
                  panelClass: 'custom-dialog'
                });
              } else {
                this.dialog.open(PromptInfoComponent, {
                  data: {
                    showOkButton: true,
                    title: t['wo.resetFail'],
                    content: reset.MessageDetail,
                  },
                  panelClass: 'custom-dialog'
                });
              }
              this.loadingIndicatorService.hide();
            }
          );
      }
    });
  }
    }
    catch(error){
      this.loadingIndicatorService.hide();
      console.log(error);
    }
  }

  exportInspection() {
    const fileName = `${this.inspection.id}.json`;
    const text = JSON.stringify(this.inspection, null, 2);
    this.dynamicDownloadJson({
      fileName,
      text
    });
  }

  async openWeb() {
    let networkStatus = await this.sharedService.checkOfflineAndAlert('wo.offlineOpenWeb');
    if (networkStatus)
      window.open(`${ENV.webUrl}/inspection/details/${this.inspection.id}`, '_blank');
  }


  private dynamicDownloadJson(arg: { fileName: string, text: string }) {
    const blob = new Blob([arg.text], { type: 'text/json;charset=utf-8' });
    saveAs(blob, arg.fileName);
  }

  public async exportImages() {
    const inspectionImages = await db.getImagesByWorkOrderId(this.inspection.id);

    await this.downloadImagesAsZipFile(inspectionImages);
  }

  private async downloadImagesAsZipFile(images: InspectionResponseImage[]) {

    let zip = new JSZip();
    let inspectionFolder = zip.folder(this.inspection.id.toString());

    images.forEach((img, index) => {
      //saving every image to .png due to content type not available in local db
      try {
        let delimiter = ";base64,";
        let photo:string = img.photo;
        if(photo.includes(delimiter))
        {
          photo = photo.split(delimiter)[1];
        }
        const blob = MIUtilities.base64toBlob(photo, 'image/png');
        inspectionFolder.file(`${img.inspectionId + "_" + img.serverId}.png`, blob);
      }
      catch (error) {
        console.log("Unable to export", img.serverId, "due to error ", error);
      }
    });

    await inspectionFolder.generateAsync({ type: "blob" }).then(content => saveAs(content, this.inspection.id));
  }
}

