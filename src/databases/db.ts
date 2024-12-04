import Dexie from 'dexie';
import {
  InspectionResponse,
  InspectionQuestionImage,
  WorkOrderDocument,
  WorkOrderList,
  InspectionResponseImage,
  VisionsTML,
  MeridiumDetails,
  EquipDetails,
} from '../app/core/sync/entities';
import dayjs from 'dayjs';
import { MIUtilities } from 'src/app/shared/utility';
import { VisionDetailsModel } from 'src/app/core/models/local/vision-details.model';
import {v4 as uuidv4} from 'uuid';

export class AppDB extends Dexie {
  workOrderList!: Dexie.Table<WorkOrderList, number>;
  questionImages!: Dexie.Table<InspectionQuestionImage, string>;
  inspectionResponseImage!: Dexie.Table<InspectionResponseImage, string>;
  workOrderDocuments!: Dexie.Table<WorkOrderDocument, string>;

  constructor() {
    super('ngdexieliveQuery');
    // this.version is similar to how entity framework works, when app is deployed and has users, you would want to add a new version and not change the existing versions
    this.version(1).stores({
      workOrderList: 'id',
      questionImages: 'questionId'
    });
    this.version(2).stores({
      workOrderList: 'id, aiInternalStatus'
    });
    this.version(3).stores({
      workOrderList: 'id, aiInternalStatus, targetDate'
    });
    this.version(4).stores({
      workOrderList: 'id, aiInternalStatus, targetDate, isChanged'
    });
    this.version(5).stores({
      inspectionResponseImage: 'serverId, inspectionResponseId, inspectionId'
    });
    this.version(6).stores({
      workOrderDocuments: 'id, inspectionId, isUploaded'
    });

    // The following allows us to pull the records out of the DBs as the classes we defined e.g if we perform a .where on user, it will return objects of the User class
    this.workOrderList.mapToClass(WorkOrderList);
    this.questionImages.mapToClass(InspectionQuestionImage);
    this.inspectionResponseImage.mapToClass(InspectionResponseImage);
    this.workOrderDocuments.mapToClass(WorkOrderDocument);
    
    // wrap this AppDB instance with Proxy, and then for every method called on this AppDB instance, check indexed db connection and then open it if it's currently closed 
    return new Proxy(this, {
        get(target, prop) {
            const origMethod = target[prop];

            if (typeof origMethod == 'function' && Object.getPrototypeOf(target).hasOwnProperty(prop)) {
                return function (...args) {
                  try
                  {
                    if (!target.isOpen())
                    {
                      target.open();
                    }  
                  }
                  catch (e)
                  {
                    console.error("There was an error with opening a connection to IndexedDB. " , e)
                  }
                  
                  let result = origMethod.apply(target, args);
                  return result
                }
            }
            else
              return target[prop];
        }
    })
  }

  // function to clear local db (for debugging / testing purposes)
  // returns success
  public async clearDataFromTables() {
    await db.transaction('rw', db.tables, async () => {
      // Iterate over each table in the database
      for (const table of db.tables) {
        await table.clear(); // Clear all data from the table
      }
    });
  }

  public fetchAllWorkOrder(): Promise<WorkOrderList[]>{
    return db.workOrderList.toCollection().sortBy('targetDate');
  }

  
  public fetchAllWorkOrderPaginated(pageNum: number): Promise<WorkOrderList[]> {
    let list = db.workOrderList.orderBy('targetDate');
    return this.paginateCollection(pageNum, list);
  }

  public fetchWorkOrderByStatus(pageNum: number, statusId: number): Promise<WorkOrderList[]> {
    let list =  db.workOrderList
      .where('aiInternalStatus')
      .equals(statusId)
    return this.paginateCollection(pageNum, list);
  }

  private woStringMatch(wo: WorkOrderList, str: string): boolean {
    if(wo.equipmentCode.toLowerCase().includes(str.toLowerCase()) || 
      wo.code.toLowerCase().includes(str.toLowerCase()) || 
      wo.id.toString().toLowerCase().includes(str.toLowerCase()) ||
      wo.description.toLowerCase().includes(str.toLowerCase()) ||
      wo.equipmentDescription.toLowerCase().includes(str.toLowerCase()) ){
      return true;
    }
    else{
      return false;
    }
  }

  private filterStringMatch(wo: WorkOrderList, str: string, type: string): boolean {
    if(wo[type].toLowerCase().includes(str.toLowerCase())){
       return true;
      }
      else{
        return false;
      };
}

  //given a list of status ids (or empty list), and a dynamic list of filter parameters, fetch maching workOrders
  public async fetchWorkOrderFiltered (
    statusIds: number[] | null,
    filterStr: string,
    filterInspectionType: string[],
    filterArea: string[],
    filterSubArea: string[],
    filterProject: string[],
    filterGroup: string[],
    filterOrg: string[],
    hideSubmitted: boolean,
    dueToday: boolean,
    filterEPField: string,
    filterEPStr: string
  ) : Promise<WorkOrderList[]> {
    let list: Dexie.Collection<WorkOrderList, number> = await this._fetchWorkOrderFiltered(statusIds, filterStr, filterInspectionType, filterArea, filterSubArea, filterProject, filterGroup, filterOrg, hideSubmitted, dueToday, filterEPField, filterEPStr);
    return list.toArray();
  }

  //given a list of status ids (or empty list), and a dynamic list of filter parameters, fetch maching workOrders
  public async fetchWorkOrderFilteredPaginated(
    pageNum: number,
    statusIds: number[] | null,
    filterStr: string,
    filterInspectionType: string[],
    filterArea: string[],
    filterSubArea: string[],
    filterProject: string[],
    filterGroup: string[],
    filterOrg: string[],
    hideSubmitted: boolean,
    dueToday: boolean,
    filterEPField: string,
    filterEPStr: string
  ) : Promise<WorkOrderList[]> {
    let list: Dexie.Collection<WorkOrderList, number> = await this._fetchWorkOrderFiltered(statusIds, filterStr, filterInspectionType, filterArea, filterSubArea, filterProject, filterGroup, filterOrg, hideSubmitted, dueToday, filterEPField, filterEPStr);
    
    return this.paginateCollection(pageNum, list);
  }

  private async _fetchWorkOrderFiltered (
    statusIds: number[] | null,
    filterStr: string,
    filterInspectionType: string[],
    filterArea: string[] | null,
    filterSubArea: string[] | null,
    filterProject: string[] | null,
    filterGroup: string[] | null,
    filterOrg: string[] | null,
    hideSubmitted: boolean,
    dueToday: boolean,
    filterEPField: string,
    filterEPStr: string
  ) : Promise<Dexie.Collection<WorkOrderList, number>> {
    let list: Dexie.Collection<WorkOrderList, number>
    if(statusIds.length > 0){
      list = db.workOrderList.orderBy('targetDate').filter(
        (item) => statusIds.includes(item.aiInternalStatus)
      );
    }
    else{
      list = db.workOrderList.orderBy('targetDate');
    }
    list = list.filter((wo) => this.woStringMatch(wo, filterStr));
    
    if(filterInspectionType.length > 0)
    {
    list = list.filter((item) => filterInspectionType.includes(item.inspectionType));
    }
    if(filterArea.length > 0)
    {
    list = list.filter((item) => filterArea.includes(item.area));
    }
    if(filterSubArea.length > 0)
    {
     list = list.filter((item) => filterSubArea.includes(item.department));
    }
    if(filterProject.length > 0)
    {
     list = list.filter((item) => filterProject.includes(item.project));
    }
    if(filterGroup.length > 0)
    {
    list = list.filter((item) => filterGroup.includes(item.groups));
    }
    if(filterOrg.length > 0)
    {
    list = list.filter((item) => filterOrg.includes(item.org));
    }
    if(hideSubmitted){
      list = list.filter((item) => item.aiInternalStatus != 99)
    }
    if(dueToday){
      const todayDate: string = dayjs(new Date()).format('MM-DD-YYYY');
      list = list.filter((item) => dayjs(item.scheduledEndDate).format('MM-DD-YYYY') == todayDate);
    }
    const epValue = MIUtilities.standardiseStr(filterEPStr);
    if(MIUtilities.stringHasValue(filterEPField) && MIUtilities.stringHasValue(epValue)) {
      list = list.filter(
        (x) => x.eqProp &&
        MIUtilities.standardiseStr(x.eqProp.find(ep => ep.fieldName == filterEPField)?.currVal).includes(epValue)
      );
    }
    return list;
  }
  
  //given a WorkOrderList collection, skip 5*pageNum and return an additional 5 items
 private paginateCollection(pageNum: number, list: Dexie.Collection<any, number>): Promise<WorkOrderList[]>{
    return list.offset(15*pageNum).limit(15).toArray();
  }

  public async countWorkOrderByStatus(statusId: number): Promise<number> {
    let count = await db.workOrderList.where('aiInternalStatus').equals(statusId).count();
    return count;
  }

  public async retrieveWorkOrdersByFilter(type: string, filterArea: string) {
    let filterList = await db.workOrderList.filter((wo) => this.filterStringMatch(wo, filterArea, type)).toArray();
    return filterList;
  }

  async insertRecordsInBatch(records: WorkOrderList[], batchSize: number) {
    const totalRecords = records.length;
    let currentIndex = 0;

    while (currentIndex < totalRecords) {
      const currentBatch = records.slice(
        currentIndex,
        currentIndex + batchSize
      );

      // we can move this out to a separate function to write on demand to any table
      await this.transaction('readwrite', this.workOrderList, async () => {
        for (const record of currentBatch) {
          await this.workOrderList.put(record);
        }
      });

      currentIndex += batchSize;
    }
  }


  /**
   * Get array of name's except 'General Section' without count of inspections
   * @param workOrderID - WorkOrder Id that you are looking for
   */
  public async getInspectionSections(
    workOrderId: number
  ) {
    const names: string[] = [];
    const workOrder = await db.workOrderList.get(workOrderId);
    if(workOrder){
      for(let response of workOrder.inspectionResponses){
        if(response.inspectionSection != 'General' && names.indexOf(response.inspectionSection) == -1){ //if its not general and not in the list, add it
          names.push(response.inspectionSection);
        }
      }
    }

    return names;
  }

  /**
   * Get array of name's except 'General Section' without count of inspections
   * @param workOrderID - WorkOrder Id that you are looking for
   * @param inspectionSection - Name of section that you are looking for
   */
  public async getSubSections(
    workOrderId: number,
    inspectionSection: string
  ) {
    const names: string[] = [];
    const workOrder = await db.workOrderList.get(workOrderId);
    if(workOrder){
      for(let response of workOrder.inspectionResponses){
        if(response.inspectionSection == inspectionSection && names.indexOf(response.subsection) == -1){ //if the section matches and its not in the list, add it
          names.push(response.subsection);
        }
      }
    }

    return names;
  }

  /**
   *
   * @param workOrderId
   * @param inspectionsResponses
   */
  async updateInspectionResponses(
    workOrderId: number,
    inspectionsResponses: any[]
  ) {
    await this.workOrderList.update(
      workOrderId,
      {
        'inspectionResponses': inspectionsResponses,
        'isChanged': 'Y'
      }
    );
  }

  async addResponseImagesBulk(images) {
    await db.inspectionResponseImage.bulkPut(images);
  }

  async removeInspectionResponse(inspectionResponse: InspectionResponse) {
    const workOrder = await this.workOrderList.get(inspectionResponse.inspectionId);

    if (workOrder) {
      const respIndex = workOrder.inspectionResponses?.findIndex((resp) => resp.questionId === inspectionResponse.questionId);

      if (respIndex > -1) {
        workOrder.inspectionResponses?.splice(respIndex, 1);
      }

      await this.updateInspectionResponses(inspectionResponse.inspectionId, workOrder.inspectionResponses);
    }
  }

  async updateAnswer(inspectionResponse: InspectionResponse, updateCompletedDate:boolean = true) {
    console.log("db.ts",inspectionResponse)
    const workOrder = await this.workOrderList.get(
      inspectionResponse.inspectionId
    );
    if (workOrder) {
      
      const responseIndex = workOrder.inspectionResponses.findIndex (
        (r) => r.questionId == inspectionResponse.questionId
      );
      const response = workOrder.inspectionResponses[responseIndex];

      console.log(`[DB] Updating Response for ${workOrder.code} -> ${response.questionId}`);

      if (response) {
        console.log(response);
        response.answer = inspectionResponse.answer;
        response.isChanged = 'Y';
        response.comments = inspectionResponse.comments;
        response.attention = inspectionResponse.attention;
        response.circuitPiping = inspectionResponse.circuitPiping;
        response.recommendation = inspectionResponse.recommendation;
        response.followUpWO = inspectionResponse.followUpWO;
        response.isShow = inspectionResponse.isShow;
        response.isNA = inspectionResponse.isNA;

        if(updateCompletedDate){
        response.createdDate = dayjs().format('YYYY-MM-DDTHH:mm:ss');
        }
        response.createdBy =  localStorage.getItem("Email");

        // only update the index of the response, preventing overwriting other 
        // concurrent updateAnswer calls
        const updateQuery = {};
        updateQuery[`inspectionResponses.${responseIndex}`] = response;
        await this.workOrderList.update(workOrder.id,updateQuery);
        await this.setInspectionUpdated(workOrder.id);

        console.log("---updated data in db")
      }
    }
  }

  getUpdatedWorkOrders()
  {
    let updatedWos =  db.workOrderList.filter(i => i.isChanged =='Y');
    return updatedWos.toArray();
  }

 async getWorkOrdersWithPendingImages() { 
  return await db.inspectionResponseImage.where(image => image.isChanged === 'Y' && image.serverId.toString().includes('NS_')).toArray();
  }

  async setInspectionUpdated(workorderId: number) {
    await this.workOrderList.update(workorderId, {'isChanged': 'Y'});
    console.log('updated ' + workorderId + ' isChanged to Y');
  }

  async setInspectionSynced(workorderId: number) {
    await this.workOrderList.update(workorderId, {'isChanged': 'N'});
    console.log('updated ' + workorderId + ' isChanged to N');
  }

  async saveThumbnail(
    workorder: WorkOrderList,
    responseId: number,
    imageId: string,
    thumbnail: string
  ) {
    if (workorder) {
      try {
        const imageToUpdate = await db.inspectionResponseImage
          .where('serverId')
          .equals(imageId)
          .first();
  
        if (imageToUpdate) {
          await db.inspectionResponseImage.update(imageId, { thumbnail: thumbnail });
        }
      } catch (error) {
        console.error('Error updating image:', error);
      }
  
      try {
        await this.setInspectionUpdated(workorder.id);

      } catch (error) {
        console.error('Error updating inspection:', error);
      }
    }
  }

  async bulkSaveThumbnails(
    workorder: WorkOrderList,
    images: InspectionResponseImage[]
  ) {
    if (workorder) {
      try {
        // to rollback in case one of them fails
        await db.transaction('rw', db.inspectionResponseImage, async () => {
          await db.inspectionResponseImage.bulkPut(images);
        });
      } catch (error) {
        console.error('Error during bulk update or inspection update:', error);
      }
     await this.setInspectionUpdated(workorder.id);

    }
  }
  
  

  /**
   * OPTIMIZATION OPPORTUNITY: FIGURE OUT A WAY TO PASS THE WORK ORDER WITH THE IMAGE, OR TO DO A BULK UPDATE DEPENDING ON THE INSPECTIONID
   * SO THAT IN HERE WE WONT HAVE TO STORE ANOTHER COPY OF THE WORK ORDER IN MEMORY DURING SYNC WHEN DOWNLOADING AN IMAGE
   * IN ORDER TO SAVE MEMORY AND INDEXED DB ROUND TRIPS.
   * OPTIONS: 
   *  CACHE THE WORK ORDER, USE THE SAME AND DONT RE-PULL.
   *  DO A BULK UPDATE.
   *  GROUP THE IMAGES TO BE UPDATED BY THEIR RESPONSE IDs AND ONLY PULL THE WORKORDER ONCE.
   * @param inspectionId 
   * @param responseId 
   * @param imageId 
   * @param imageContent 
   */
  async updateImageContentWithoutWorkOrderContext(
    inspectionId: number,
    responseId: number,
    imageId: string,
    imageContent: string,
  )
  {
    let workorder = await db.workOrderList.get(Number(inspectionId));
    await this.updateImageContent(workorder, responseId, imageId, imageContent);
    workorder = null; // release and let it get GC-ed afterwards
  }

  /**
   *
   * @param inspectionId
   * @param responseId
   * @param imageId
   * @param imageContent
   */
  async updateImageContent(
    workorder: WorkOrderList,
    responseId: number,
    imageId: string,
    imageContent: string,
    replaceImageServerId = false,
    markForUpload = false,
  ) : Promise<InspectionResponseImage>{
    /**
     * From the passed workorder,
     * Get the response
     * Get the image
     * Update the image content
     * Update the response to assign the updated image
     * Update the workorder
     */
    if (workorder) {
      const response = workorder.inspectionResponses?.find(
        (resp) => resp?.id === responseId
      );
      const image = await db.inspectionResponseImage.filter(image => image.serverId == imageId).first();

      if (!image || !response) return null; // if the image is missing, or the response an image is assigned to is missing, do nothing as there is nothing to update

      image.photo = imageContent;

      if (markForUpload) // true for when you attach a photo or update it
      {
        image.isChanged = 'Y';
      }
      else // false for when you are saving a photo that was just downloaded from sync so it doesnt get picked up immediately on the next sync
      {
        image.isChanged = 'N';
      }

      if (replaceImageServerId) {
        // replace file name on update, so that it gets reuploaded to the server after sync
        image.fileName = response.inspectionId + "_" + response.questionId + "_" + Date.now();
        image.serverId = "NS_" + Date.now();
        // Update the server id first to ensure the image can be updated later without causing ID mismatches or duplication.
        await db.updateImageServerId(imageId, image.serverId);
      }

      try {
        await db.inspectionResponseImage.put(image, imageId);
      } catch (error) {
        console.error('Error updating the image:', error);
      }

      return image;
    } else {
      console.error('Workorder not found for updating images');
      return null;
    }
  }

  async addImage(
    workorder: WorkOrderList,
    questionId: string,
    imageContent: string,
  ) {

    if (workorder) {
      const response = workorder.inspectionResponses?.find(
        (resp) => resp.questionId === questionId
      );

      const image = new InspectionResponseImage();
      image.inspectionId = workorder.id;
      image.inspectionResponseQuestionId = questionId;
      image.inspectionItemCode = response.questionId;
      image.serverId = "NS_" + Date.now();
      image.imageCaption = '';
      image.photo = imageContent;
      image.thumbnail = '';
      image.serverFlag = 'N';
      image.fileName = response.inspectionId + "_" + response.questionId + "_" + Date.now();
      image.isChanged = 'Y';
      image.originalPhoto = '';
      image.inspectionResponseId =response.id;

      try {
        await db.inspectionResponseImage.add(image);
      } catch (error) {
        console.error('Error adding image:', error);
      }
      await this.setInspectionUpdated(workorder.id);

    } else {
      console.error('Workorder not found for updating images');
    }
  }

  async deleteImage(
    workorder: WorkOrderList,
    questionId: string,
    imageId: string
  ) {

    if (workorder) {

      try {
        const imageToDelete = await db.inspectionResponseImage.filter(image => image.serverId == imageId).first();
        if (imageToDelete) {
          await db.inspectionResponseImage.delete(imageId);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
      }
    } else {
      console.error('Workorder not found for updating images');
    }
  }

  async deleteQuestionImages(
    workorder: WorkOrderList,
    questionId: string,
  ) {

    if (workorder) {
      try {
        const imagesToDelete = await db.inspectionResponseImage.where("inspectionResponseId").equals(questionId).toArray();
        if (imagesToDelete.length) {
          await db.inspectionResponseImage.bulkDelete(imagesToDelete.map(img => img.serverId));
        }
      } catch (error) {
        console.error('Error deleting images in bulk:', error);
      }
    } else {
      console.error('Workorder not found for updating images');
    }
  }

  async updateImageCaption(
    workorder: WorkOrderList,
    questionId: string,
    imageId: string,
    imageCaption: string
  ) {
    if (workorder) {
      const image = await db.inspectionResponseImage.filter(image => image.serverId == imageId).first();
      image.imageCaption = imageCaption;
      image.isChanged = 'Y';
      try {
        await db.inspectionResponseImage.put(image, imageId);
      } catch (error) {
        console.error('Error updating image:', error);
      }
      await this.setInspectionUpdated(workorder.id);

    } else {
      console.error('Workorder not found for updating images');
    }
  }

  /**
   *
   * @param document
   */
  async updateDocumentContent(previousId: string, document: WorkOrderDocument) {
    try {
      // Update the document with the given id
      await db.workOrderDocuments.where('id').equals(previousId).modify((record) => {
        record.id = document.id.toString();
        record.isUploaded = document.isUploaded
      });
    } catch (error) {
      console.error("Failed to update document:", error);
    }
  }

    /**
   *
   * @param documents
   */
  // using method for uploading new documents might cause duplicates due to missing docId
  async updateBulkDocumentContent(documents: WorkOrderDocument[]) {
    try {
      await db.workOrderDocuments.bulkPut(documents);    
    } catch(ex) {
      console.error('error updating the documents');
    }
  }

  public async updateQuestionImage(questionImage: InspectionQuestionImage) {
    await db.questionImages.put(questionImage);
  }

  public async getQuestionImage(questionId: string): Promise<InspectionQuestionImage>{
    const countQuestionImage: number = await db.questionImages.count();
    if(countQuestionImage > 0){
      return await db.questionImages.get(questionId)
    }
    else{ //don't perform get if theres no records to prevent dexie throwing error
      return null;
    }
  }
  
  async updateWorkOrder(workOrder: WorkOrderList){
    await this.workOrderList.put(workOrder);
    await this.setInspectionUpdated(workOrder.id);
  }

  async getResponseById(
    workorder: WorkOrderList,
    responseQuestionId: string
  ) {

    if (workorder) {
      const response = workorder.inspectionResponses?.find(
        (resp) => resp.questionId === responseQuestionId
      );

      return response;
    } else {
      console.error('Workorder not found for updating images');
      return null;
    }
  }

  /**
   * 
   * @param excludedStatus 
   * @returns 
   */
  async getWorkOrdersNotInStatus(excludedStatus: number[]): Promise<WorkOrderList[]> {
    return db.workOrderList
      .where('aiInternalStatus')
      .noneOf(excludedStatus)
      .toArray();
  }

  async getWorkOrdersByStatus(statuses: number[]): Promise<WorkOrderList[]> {
    return db.workOrderList
      .where('aiInternalStatus')
      .anyOf(statuses)
      .toArray();
  }

   async getWorkOrderIDsByStatus(statuses: number[]): Promise<number[]> {
    return db.workOrderList
      .where('aiInternalStatus')
      .anyOf(statuses)
      .primaryKeys()
  }

   /**
   * 
   * @param vision 
   * @param id 
   * @param inspectionId 
   */
   async updateEquipmentDetailsRecord(vision: VisionDetailsModel, id: number, inspectionId: number) {
    try {
      const wo = await db.workOrderList.get(inspectionId);
      let eqDetailIndex = wo.eqDetails.findIndex(eqDetail => eqDetail?.id == id);
      let eqDetail = wo.eqDetails[eqDetailIndex];
      eqDetail["fieldName"] = !MIUtilities.isNullOrUndefined(vision.DisplayName) ? vision.DisplayName : "";
      eqDetail["currVal"] = !MIUtilities.isNullOrUndefined(vision.Value) ? vision.Value : "";
      eqDetail["updatedVal"] = !MIUtilities.isNullOrUndefined(vision.NewValue) ? vision.NewValue : "";
      eqDetail["fieldType"] = !MIUtilities.isNullOrUndefined(vision.Type) ? vision.Type : "";
      eqDetail["units"] = !MIUtilities.isNullOrUndefined(vision.Unit) ? vision.Unit : "";
      eqDetail["options"] = !MIUtilities.isNullOrUndefined(vision.Options) ? JSON.stringify(vision.Options) : "";
      eqDetail["jsonValue"] = !MIUtilities.isNullOrUndefined(vision) ? JSON.stringify(vision) : "";
      eqDetail["isChanged"] = "N";
      eqDetail["section"] = !MIUtilities.isNullOrUndefined(vision.Section) ? vision.Section : "";

      const updateQuery = {};
      updateQuery[`eqDetails.${eqDetailIndex}`] = eqDetail;
      await this.workOrderList.update(wo.id,updateQuery);
    } catch (e) {
      console.log("ERROR UPDATING VISIONS RECORD FOR ID>>>" + id + ".Error Message is " + e);
    }
  }
    
  /**
   * 
   * @param workorders 
   */
  async bulkEquipmentDetails(workorders: any[]) {
    try {
      for (const workorder of workorders) { 
        const eqDetails = workorder.EquipmentDetails
        ? JSON.parse(workorder.EquipmentDetails)
        : null;
      if (eqDetails) {
        let visionDetails: Array<VisionDetailsModel> = eqDetails["Fields"];
        if (!visionDetails && eqDetails["EquipmentDetail"]) {
          visionDetails = eqDetails["EquipmentDetail"];
        }
        await this.processEquipDetails(visionDetails, workorder.ID);
       }
      }
        } catch (e) {
          console.log("vision-details:bulk->", e);
        }
  }

  /**
   * 
   * @param visionDetails 
   * @param inspectionId 
   */
  private async processEquipDetails(visionDetails, inspectionId){
    if (visionDetails) {
      let wo = await db.workOrderList.get(inspectionId);
      let existingVisions = wo.eqDetails;
      const firstProperty = 'EquipName';
      visionDetails.sort((x, y) => {
        if(x.FieldName == firstProperty){
          return -1;
        } else if(y.FieldName == firstProperty){
          return 1;
        }
        return 0;
      });
      //If there are no visions previously, then insert all
      if (!existingVisions || existingVisions?.length == 0) {
        this.handleNewVisions(visionDetails, wo, inspectionId);
        //If there are visions previously for the workorder, then check for the following conditions
      } else {
        this.handleExistingVisions(visionDetails, existingVisions, inspectionId);
      }
    }
  }
  /**
   * 
   * @param visionDetails 
   * @param existingVisions 
   * @param inspectionId 
   */
  private async handleExistingVisions(visionDetails, existingVisions, inspectionId: number){
    visionDetails.map(async vision => {
      const visionDetail = new EquipDetails();
      const existingRow = existingVisions.filter(row => row.fieldName === vision.DisplayName);
      //If the record exists for the field name, then check for the update flag
      if (existingRow && existingRow[0]) {
        //If the record is not locally updated, then insert
        if (existingRow[0].isChanged != 'Y') {
          await this.updateEquipmentDetailsRecord(vision, existingRow[0].id, inspectionId);
        }
        //If the record does not exist for the fieldname, then insert
      } else {
        if (!MIUtilities.isNullOrUndefined(vision.DisplayName)) {
          visionDetail.init(vision);
          visionDetail.inspectionId = +inspectionId;
          console.log("INSERT INTO VISIONS>>>CASE2>>");
          let wo = await db.workOrderList.get(inspectionId);
          wo.eqDetails ? wo.eqDetails.push(visionDetail) : [].push(visionDetail);
        }
      }
    });
  }

  /**
   * 
   * @param visionDetails 
   * @param wo 
   * @param inspectionId 
   */
  private async handleNewVisions(visionDetails, wo, inspectionId: number){
    let newEquipDetails: EquipDetails[] = [];
    visionDetails.map(async vision => {
      const visionDetail = new EquipDetails();
      if (!MIUtilities.isNullOrUndefined(vision.DisplayName)) {
        visionDetail.init(vision);
        visionDetail.id = uuidv4();
        visionDetail.inspectionId = +inspectionId;
        console.log("INSERT INTO VISIONS>>>CASE1>>");
        newEquipDetails.push(visionDetail);
      }
    });
    const updateQuery = {};
    updateQuery[`eqDetails`] = newEquipDetails;
    await this.workOrderList.update(wo.id,updateQuery);
  }

  /**
   * 
   * @param inspectionId 
   * @returns 
   */
  async getEquipmentDetailsByWorkOrder(inspectionId: number){
    console.log('[DB] Fetching Equipment Details for WO: '+inspectionId);
    const wo = await db.workOrderList.get(inspectionId);
    return wo.eqDetails;
  }

    /**
   * 
   * @param workOrderList 
   */
  async bulkMeridiumDetails(workOrderList) {
    try {
      workOrderList
        .map(async workOrderRecord => {
          if (
            workOrderRecord["EquipmentDetails"] !== "null" &&
            workOrderRecord["EquipmentDetails"] &&
            (JSON.parse(workOrderRecord["EquipmentDetails"])["EquipmentDetail"] ||
              JSON.parse(workOrderRecord["EquipmentDetails"])["BasicInformation"] ||
              JSON.parse(workOrderRecord["EquipmentDetails"])["DamageMechanism"])
          ) {
            const meridiumDetails = new MeridiumDetails();
            meridiumDetails.init(workOrderRecord);
            const wo = await db.workOrderList.get(workOrderRecord["ID"]);
            wo.meridiumDetails = meridiumDetails;
            await db.workOrderList.put(wo);
          }
        });
    } catch (e) {
      console.log(e);
    }
  }

   /**
   * 
   * @param inspectionId 
   * @returns 
   */
   async getMeridiumDetailsByWorkOrder(inspectionId: number){
    const wo = await db.workOrderList.get(inspectionId);
    return wo?.meridiumDetails;
  }

    /**
   * 
   * @param workOrderList 
   */
    async bulkTMLs(workOrderList: any[]) {
      try {
          let visionTMLRecord = null;
          for (const workOrderRecord of workOrderList) { 
            const tmlPoints = workOrderRecord.TMLPoints ? JSON.parse(workOrderRecord.TMLPoints) : null;
            if (!MIUtilities.isNullOrUndefinedObject(tmlPoints)) {
              console.log("STEP3>>");
              const wo = await db.workOrderList.get(workOrderRecord["ID"]);
              const existingTmlDetails = wo.tmlDetails;
              if(!existingTmlDetails || existingTmlDetails.isChanged != "Y"){
                  visionTMLRecord = new VisionsTML();
                  visionTMLRecord.init(workOrderRecord);
                  const updateQuery = {};
                  updateQuery[`tmlDetails`] = visionTMLRecord;
                  await this.workOrderList.update(wo.id,updateQuery);
              }
              console.log("STEP5>>");
            }
          }
      } catch (e) {
        console.log("CATCH>>VISIONS TML>>BULK>>"+e);
      }
    }
  
      /**
       * 
       */
  async updateImagesIsChanged(images: any[], changedVal: string = 'N') {
    for (let img of images) {
      const workOrder = await db.workOrderList.get(img.workOrderId);

      if (img.InspectionResponseQuestionID) {
        const respI = workOrder.inspectionResponses.findIndex(resp => resp.questionId == img.InspectionResponseQuestionID);
        if (respI > -1) {
          try {
            await db.inspectionResponseImage.update(img.ID, {
              isChanged: changedVal,
              inspectionResponseId: img.InspectionResponseQuestionID
            });
          } catch (error) {
            console.error('Error updating server id:', error);
          }
        }
        else {
          console.error(workOrder.code + " is broken - can't map inspection response to image");
        }
      }
    }
  }

      /**
   * Updates the local generated id's with the server generated ids
   * @param inspectionId 
   * @param clientId 
   * @param serverId 
   */
       async updateQuestionIds(inspectionId: number, clientId: string, serverId: number) {
        const workOrder = await this.workOrderList.get(inspectionId);
        if (workOrder) {
          const respIndex = workOrder.inspectionResponses.findIndex(r => {
            return r.questionId === clientId;
          });

          const response = workOrder.inspectionResponses[respIndex];
           if (response) {
            response.id = serverId;
          }
          const updateQuery = {};
          updateQuery[`inspectionResponses.${respIndex}`] = response;
          await this.workOrderList.update(workOrder.id,updateQuery);
        }
      }

  /**
   * 
   * @param existinImageId 
   * @param updatedServerId 
   * @param responseId 
   * @param inspectionId 
   */
  async updateImageServerId(existinImageId: string, updatedServerId: string) {
    try {
      await db.inspectionResponseImage.update(existinImageId, { serverId: updatedServerId });
    } catch (error) {
      console.error('Error updating server id:', error);
    }
  }

  /**
   * 
   * @param status 
   * @param woIds 
   */
  async updateBulkWorkOrderStatus(status: number, woIds: number[]) {
    const woList = await db.workOrderList
      .where('id')
      .anyOf(woIds)
      .toArray();

      for (const wo of woList) { 
        await this.workOrderList.update(wo.id,{
          'aiInternalStatus': status
        });
      }
  }

  /**
   * 
   * @returns 
   */
  async getReassignedWorkOrders(){
    return await db.workOrderList.toArray()
            .then((workOrders) => workOrders.filter((wo) => wo["reassigned_id"] != null && wo["reassigned_id"].toString().length > 0));
  }

  /**
   * 
   * @param inspectionId 
   * @returns 
   */
  async getChangedResponsesForAWorkOrder(inspectionId: number){
    const wo = await db.workOrderList.get(inspectionId);
    const responses = wo.inspectionResponses?.filter(response => response?.isChanged == 'Y');
    return responses;
  }

  async markCompletedAsSubmitted(wo: WorkOrderList)
  {
    if (wo.aiInternalStatus == 2) {
      await this.updateBulkWorkOrderStatus(99, [wo.id]);
    }
  }

  async doWOSyncSuccessDBUpdates(response, request, inspectionId : number){
    let wo = await db.workOrderList.get(inspectionId);
   
    await this.markCompletedAsSubmitted(wo);

    if (!MIUtilities.isNullOrUndefinedObject(response)) {

      if(!MIUtilities.isNullOrUndefined(response.respCreatedDate)){
        await db.workOrderList.update(
          wo.id,
          {'responseCreatedDate': response.respCreatedDate}
        );
      }

      if(!MIUtilities.isNullOrUndefined(response.serverNewResponses)){

        response.serverNewResponses.forEach(serverResponse => {
          let localResponse = wo.inspectionResponses.find(r => r.questionId == serverResponse.clientId);

          if(localResponse){
            localResponse.id = serverResponse.serverId;
          }
        });
        await db.workOrderList.update(
          wo.id,
          {'isChanged': 'Y'}
        );
        
      }

    }
    if(request && request.requestModel){
      await db.workOrderList.update(
        wo.id,
        {'hiddenSummary': JSON.parse(request.requestModel)?.Comment}
      );
    }
    wo.inspectionResponses?.forEach((response) => {
      response.isChanged = 'N';
    });
    await db.workOrderList.update(
      wo.id,
      {'inspectionResponses': wo.inspectionResponses}
    );
    wo.eqDetails?.forEach((eqDetail) => {
      eqDetail.isChanged = 'N';
    });
    await db.workOrderList.update(
      wo.id,
      {'eqDetails': wo.eqDetails}
    );
    if(wo.tmlDetails){
      wo.tmlDetails.isChanged = 'N';
      await db.workOrderList.update(
        wo.id,
        {'tmlDetails.isChanged': 'N'}
      );
    }

    await db.setInspectionSynced(wo.id);

    console.log(`[DB] Sync Success on WO: ${inspectionId}`);
  }

  /**
   * 
   * @param inspectionId 
   * @returns 
   */
  async getSubEquipmentData(inspectionId: number){
    const wo = await db.workOrderList.get(inspectionId);
    return wo.subEquipmentData;
  }

  async updateEquipmentProperty(equipmentProperty: EquipDetails, id: number, inspectionId: number) {
    const wo = await db.workOrderList.get(inspectionId);
    const eqId = wo.eqDetails.findIndex(eqDetail => eqDetail?.id == id);

    const updateQuery = {};
    updateQuery[`eqDetails.${eqId}`] = equipmentProperty;
    await this.workOrderList.update(wo.id,updateQuery);
    await this.setInspectionUpdated(wo.id);
  }

  public deleteWorkorders(workorders: WorkOrderList[]) {
    workorders.forEach((workorder: WorkOrderList) => {
       db.workOrderList.delete(workorder.id);
       workorder.inspectionResponses && workorder.inspectionResponses.forEach((response) =>{
        db.questionImages.delete(response.questionId)
       });
    });
  }

  public async deleteWorkorderIds(workorderIds: number[]) {
    await db.workOrderList.bulkDelete(workorderIds);
  }

  //TML Region

  async updateTMLDetails(inspectionId: number,tmlDetails: any) {
    const updateQuery = {};
    updateQuery[`tmlDetails`] = tmlDetails;
    await this.workOrderList.update(inspectionId,updateQuery);
    await this.setInspectionUpdated(inspectionId);
  }

  //TML Region

  public async isLocalDBEmpty():Promise<boolean> {
    let count = await this.workOrderList.count();
    return  (count > 0) ? false : true;
  }

  async updateResponseComments(inspectionResponse: InspectionResponse) {
    const workOrder = await this.workOrderList.get(
      inspectionResponse.inspectionId
    );
    if (workOrder) {
      const responseIndex = workOrder.inspectionResponses.findIndex (
        (r) => r.id == inspectionResponse?.id && r?.questionId == inspectionResponse?.questionId
      );
      const response = workOrder.inspectionResponses[responseIndex];

      if (response) {
        response.isChanged = 'Y';
        response.comments = inspectionResponse.comments;
        response.attention = inspectionResponse.attention;
        response.recommendation = inspectionResponse.recommendation;
        response.followUpWO = inspectionResponse.followUpWO;
        response.createdDate = dayjs().format('YYYY-MM-DDTHH:mm:ss');
        response.createdBy =  localStorage.getItem("Email");

        // only update the index of the response, preventing overwriting other 
        // concurrent updateAnswer calls
        const updateQuery = {};
        updateQuery[`inspectionResponses.${responseIndex}`] = response;
        await this.workOrderList.update(workOrder.id,updateQuery);
        await this.setInspectionUpdated(workOrder.id);
      }
    }
  }

  // added to have  lightweight WorkOrderList with no responses amd documents for home screen;
  async getAllWOMetadata() {
    let lightweightArray = [];
    await db.workOrderList.each( wo => { 
      lightweightArray.push(
        {
          inspectionType: wo.inspectionType,
          area: wo.area,
          department: wo.department,
          project: wo.project,
          groups: wo.groups,
          org: wo.org
        });
      // inspectionType
      // area
      // subarea (department)
      // projects
      // groups
      // orgs
    });
    return lightweightArray;
  }

  public async getInspectionResponses (workOrderID: number) : Promise<InspectionResponse[]>{
    let workOrder = await db.workOrderList.get(workOrderID);
    return workOrder ? workOrder['inspectionResponses'] : [];
  }

  public async getImagesByResponseId(responseId: number, batchSize: number = 3) {
    let images = [];
    try {
      const totalImages = await db.inspectionResponseImage
        .where('inspectionResponseId')
        .equals(responseId)
        .count();
  
      for (let offset = 0; offset < totalImages; offset += batchSize) {
        const batch = await db.inspectionResponseImage
          .where('inspectionResponseId')
          .equals(responseId)
          .offset(offset)
          .limit(batchSize)
          .toArray();
        images = images.concat(batch);
      }
      return images;
    } catch (ex) {
      console.error('Error fetching images:', ex);
      return null;
    }
  }

  public async addBulkImages(imagesList: Array<InspectionResponseImage>) {
    try {
      await db.inspectionResponseImage.bulkAdd(imagesList);
    } catch (error) {
      console.error('Error adding images:', error);
    }
  }

  async updateImagesIsChangedV2(images: any[], changedVal: string = 'N') {
    try {
      for (let img of images) {
        const workOrder = {};
        workOrder[`inspectionResponses.${img.responseIndex}.inspectionImages.${img.imageIndex}.isChanged`] = changedVal;
        await db.workOrderList.update(img.workOrderId, workOrder);
      }
    }
    catch (error) {
      console.log(`INSIDE UPDATEIMAGESISCHANGEDV2>>> ERROR UPDATING IMAGES: ${error}`);
    }
  }

    /**
     *
    * Updates the existing local resonse id's with the new response ids from server
    * /
     * @param inspectionId 
     * @param questionId 
     * @param newResponseId 
     * @param newAnswer 
     */    
     async updateResponseId(inspectionId: number, questionId: string, newResponseId: number, newResponse) {
      const workOrder = await this.workOrderList.get(inspectionId);
      if (workOrder) {
            const respIndex = workOrder.inspectionResponses.findIndex(r => {
          console.log("r['questionId']", r?.questionId)
          return r.questionId === questionId;
        });
   
        const response = workOrder.inspectionResponses[respIndex];
         if (response) {
          response.id = newResponseId;
          //IF THE ANSWER IS NOT CHANGED LOCALLY, THEN BRING IN THE ANSWER FROM SERVER
          if(response.isChanged === 'N'){
            response.answer = newResponse['Answer'];
            response.comments = newResponse['Comments'];
            response.recommendation = newResponse['Recommendation'];
          }
          const updateQuery = {};
          updateQuery[`inspectionResponses.${respIndex}`] = response;
          await this.workOrderList.update(workOrder.id,updateQuery);
        }
      }
    }

  /**
   * 
   * @param inspectionId 
   * @returns 
   */
  async getResponsesCount(inspectionId: number): Promise<number> {
    try {
      const res = await this.getInspectionResponses(inspectionId);
      return res ? res.length : 0;
    } catch (error) {
      return 0;
    }
  }

  async getPendingImagesToUpload() {
    // Get pending images to be uploaded to web
    const images = await this.inspectionResponseImage.filter((image) => 
      typeof image.serverId === 'string' && image.serverId.indexOf('NS_') > -1 && image.isChanged == 'Y'
    ).toArray();
  
    const submittedImages = images.reduce((acc, image) => {
      const existing = acc.find(item => item.id === image.inspectionId);
      if (existing) {
        existing.fileName += `,${image.fileName}`;
      } else {
        acc.push({ id: image.inspectionId, fileName: image.fileName });
      }
      return acc;
    }, []);
  
    return submittedImages;
  }

  async getImagesNestedInResponses() {
    const existingImagesTableIds = (await this.inspectionResponseImage.toArray()).map(image => image.serverId);
    const images = [];
    const workOrders = await this.workOrderList.toArray();

    for (const workOrder of workOrders) {
      // Create a deep copy of workOrder to prevent modifying the original array during iteration
      let workOrderCopy = JSON.parse(JSON.stringify(workOrder));

      for (const inspectionResponse of workOrder?.inspectionResponses || []) {
        if (!inspectionResponse?.inspectionImages?.length) continue; // Skip if no inspectionImages

        for (const image of inspectionResponse.inspectionImages) {
          if (!existingImagesTableIds.includes(image.serverId)) {
            images.push(image);

            const response = workOrderCopy.inspectionResponses?.find(
              (resp) => resp.questionId === inspectionResponse.questionId
            );
            const respIndex = workOrderCopy.inspectionResponses?.findIndex(
              (resp) => resp.questionId === inspectionResponse.questionId
            );
            const imageIndex = response.inspectionImages?.findIndex(
              (img) => img.serverId == image.serverId.toString()
            );

            if (imageIndex > -1) {
              response.inspectionImages?.splice(imageIndex, 1);

              const updateQuery = {};
              updateQuery[`inspectionResponses.${respIndex}`] = response;
              this.workOrderList.update(workOrder.id, updateQuery);
            }
          }
        }
      }
    }

    if (images.length) {
      await this.addBulkImages(images);
    }
    localStorage.setItem("ImagesTransferred", 'true');
  } 

  async getImagesByWorkOrderId(workorderId: number) {
    return await db.inspectionResponseImage.where("inspectionId").equals(workorderId).toArray();
  }

  async bulkGetImagesByWorkOrderId(ids: Array<number>) {
    return await db.inspectionResponseImage.where("inspectionId").anyOf(ids).toArray();
  }

  async getAllNewDocuments(){
    return await db.workOrderDocuments.where('isUploaded').equals(0).toArray();
   }

  async getNewDocumentsByWorkOrderId(ids: Array<number>){
   return await db.workOrderDocuments.where('inspectionId').anyOf(ids).and(doc => doc.isUploaded === 0).toArray();
  }

  async getAllDocumentsByWorkOrderId(ids: Array<number>){
    return await db.workOrderDocuments.where('inspectionId').anyOf(ids).toArray();
  }

  async addWorkOrderDocument(document: WorkOrderDocument) {
    try {
      await db.workOrderDocuments.add(document);
    } catch (error) {
      console.error("Failed to add document: " + error);
    }
  }

  async deleteDocumentById(docId: string) {
    try {
      // Delete the document with the given id
      await db.workOrderDocuments.delete(docId);
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  }
}

export const db = new AppDB();