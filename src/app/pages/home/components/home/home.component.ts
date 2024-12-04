import { AfterViewInit, Component, OnInit, ChangeDetectorRef, HostListener, OnDestroy } from '@angular/core';
import { db } from 'src/databases/db';
import { WorkOrderList } from 'src/app/core/sync/entities/work-order-list';
import { SyncService } from 'src/app/core/services/sync/sync.service';
import { WOStatus } from 'src/app/core/models/ui/workOrderStatus';
import { InspectionDetailsService } from '../../../inspection/services/inspection-details.service';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { HomeService } from '../../services/home.service';
import { SettingsService } from 'src/app/core/services/app-settings.service';
import { OnlineSearchWorkOrderModel } from 'src/app/core/sync/entities/online-search-work-order-model';
import { PagedResult } from 'src/app/core/models/api/response/paged-result.model';
import * as _ from "lodash-es";
import { SharedService } from 'src/app/core/services/shared.service';
import { MIUtilities } from 'src/app/shared/utility';
import { FilterCheckbox } from 'src/app/core/sync/entities/filter-checkbox';
import { OnlineSearchFilterService } from '../../services/online-search-filter.service';
import { PENDING_NOTIFICATION } from 'src/app/core/enums/pending-notification.enum';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  totalCards: Array<number> = [1, 2, 3];
  todayDate = new Date();
  displayList: boolean = false; //don't display list until we've pulled workOrders, instead display loading text
  displayOnlineList: boolean = false;
  displayOnlineSearchMaxRecordWarning: boolean = false;
  inspectionStatuses: Array<WOStatus> = [
    new WOStatus(0),    // 'not started'
    new WOStatus(1),    // 'in progress'
    new WOStatus(2),    // 'completed'
    new WOStatus(3),    // 'returned'
    new WOStatus(99),   // 'submitted'
    new WOStatus(100),  // 'unassigned'
  ];
  showAdditionalFilters: boolean;
  selectedStatuses: number[] = [];
  filterStr: string = '';
  onlineSearchStr : string = '';
  filterEPStr : string = '';
  filterEPField : string = '';
  userId: string = '';
  html5Qrcode: Html5Qrcode;
  txtTimeout = null;
  hideSubmitted: boolean;
  dueToday: boolean;
  hasPending = "NONE";

  //lazy loading / pagination variables
  inspectionTypeFilter: FilterCheckbox = new FilterCheckbox("inspectionType");
  areaFilter: FilterCheckbox = new FilterCheckbox("area");
  subAreaFilter: FilterCheckbox = new FilterCheckbox("department");
  projectFilter: FilterCheckbox = new FilterCheckbox("project");
  groupFilter: FilterCheckbox = new FilterCheckbox("groups");
  orgFilter: FilterCheckbox = new FilterCheckbox("org");
  currentWorkOrders: Array<WorkOrderList> = []; //list of work orders that are currently displayed to the user for lazy loading (that match filter criteria)
  allFilterOptions: Array<WorkOrderList> = []; //list of work orders to array
  currentPageNumber: number = 0; //current page number for lazy loading workorders
  continueFetch: boolean = true; //boolean determining if we hit the end of the collection we are currently filtered on or not
  equipmentPropertiesList: Array<string> = [];

  onlineSearchResults: Array<OnlineSearchWorkOrderModel> = [];
  hasDownloadableInspections = false;

  constructor(
    private syncSvc: SyncService,
    private inspectionDetailsService: InspectionDetailsService,
    private homeService: HomeService,
    private changeDetection: ChangeDetectorRef,
    public settingsService: SettingsService,
    public sharedService:SharedService,
    private onlineSearchFilterService: OnlineSearchFilterService,
    private translate: TranslateService
  ) {
      this.homeService.workOrderRemoved$.subscribe(() => {
        (async () => {
          await this.refreshWorkOrderList();
        })();
      });
    }

  async ngOnInit() {
    this.inspectionDetailsService.showHomeIcon(false);
    this.setFiltersInitial();
    this.initialSetup();
    // getting the user for the first time
    this.homeService.userInformationComplete.subscribe((success: boolean) => {
      this.initialSetup();
    });

    this.syncSvc.workOrderListUpdated.subscribe((success: boolean) => {
      (async () => {
        if (success)
        {
          this.resetPagination();
          await this.refreshWorkOrderList();
          this.changeDetection.detectChanges();
        }
      })();
    }
    );
  }

  ngAfterViewInit(): void {
    this.html5Qrcode = new Html5Qrcode("reader", {
      verbose: true,
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
    });
  }

  @HostListener('unloaded')
  ngOnDestroy() {
    this.changeDetection.detach();
    this.currentWorkOrders = null;
    this.allFilterOptions = null;
    this.inspectionTypeFilter = null;
    this.areaFilter = null;
    this.subAreaFilter = null;
    this.projectFilter = null;
    this.groupFilter = null;
    this.orgFilter = null;
    this.equipmentPropertiesList = null;
    this.onlineSearchResults = null;
    this.totalCards = null;
    this.todayDate = null;
    this.inspectionStatuses = null;
    this.selectedStatuses = null;
    this.filterStr = null;
    this.onlineSearchStr = null;
    this.filterEPStr = null;
    this.filterEPField = null;
    this.filterEPField = null;
    this.userId = null;
    this.html5Qrcode = null;
  }

  startScanning() {
    let _error;
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    this.html5Qrcode.start({ facingMode: "environment" }, config, (decodedText, decodedResult) => {
      this.filterStr = decodedText;
      this.closeQrCode();
    }, (error) => {
      _error = error;
    });
  }

  scanState() {
    if (!this.html5Qrcode) return {};
    let state: Html5QrcodeScannerState = this.html5Qrcode?.getState();
    return {
      'qr-code-start': state == Html5QrcodeScannerState.SCANNING,
      'qr-code-stop': state != Html5QrcodeScannerState.SCANNING
    }
  }

  closeQrCode() {
    this.html5Qrcode.stop().then(() => {
      this.html5Qrcode.clear();
    });
  }

  setFiltersInitial() {
    if(this.settingsService.get('filters')?.showAdditionalFilters == 'no')
      { this.showAdditionalFilters = false; }
      else{
        this.showAdditionalFilters = true; }
    this.selectedStatuses = [];
    this.selectedStatuses = this.settingsService.get('filters')?.selectedStatuses || [];
    for(let statuses of this.inspectionStatuses){
      if(this.selectedStatuses.includes(statuses.statusId))
        statuses.selected = true;
    }
    this.filterStr = this.settingsService.get('filters')?.filterStr || '';
    this.inspectionTypeFilter.filter = this.settingsService.get('filters')?.filterInspectionType || [];
    this.areaFilter.filter = this.settingsService.get('filters')?.filterArea || [];
    this.subAreaFilter.filter = this.settingsService.get('filters')?.filterSubArea || [];
    this.projectFilter.filter = this.settingsService.get('filters')?.filterProject || [];
    this.groupFilter.filter = this.settingsService.get('filters')?.filterGroup || [];
    this.orgFilter.filter = this.settingsService.get('filters')?.filterOrg || [];
    this.filterEPStr = this.settingsService.get('filters')?.filterEPStr || '';
    this.filterEPField = this.settingsService.get('filters')?.filterEPField || '';

    if(this.settingsService.get('filters')?.hideSubmitted == 'yes')
    { this.hideSubmitted = true; }
    else{
      this.hideSubmitted = false; }

      if(this.settingsService.get('filters')?.dueToday == 'yes')
    { this.dueToday = true; }
    else{
      this.dueToday = false; }
  }

  async onScroll(){
    this.currentPageNumber = this.currentPageNumber + 1;
    await this.pullFilteredWorkOrders()
  }

  private async refreshWorkOrderList(){ // reset page
    if (this.displayOnlineList)
    {
      await this.displayDeviceRecordsForOnlineSearch();
    }
    else
    {
      await this.fetchWorkOrdersAndStatusQuantities();
    }
    await this.showBannerPendingInspections();
  }

  async onlineSearch() {
    this.clearOnlineSearchResults();
    const onlineSearchResults : PagedResult<OnlineSearchWorkOrderModel> = await this.syncSvc.onlineSearch(this.onlineSearchStr);
    onlineSearchResults.Items = this.trimWODocsandResponses(onlineSearchResults.Items);
    this.displayOnlineSearchMaxRecordWarning = !onlineSearchResults.LastPage;
    let deviceSearchResults : WorkOrderList[] = await db.fetchWorkOrderFiltered(this.selectedStatuses, this.onlineSearchStr, this.inspectionTypeFilter.filter, this.areaFilter.filter, this.subAreaFilter.filter, this.projectFilter.filter, this.groupFilter.filter, this.orgFilter.filter, this.hideSubmitted, this.dueToday, this.filterEPField, this.filterEPStr);
    // added to trim inspection responses and documents to avoid loading memory
    deviceSearchResults = this.trimWODocsandResponses(deviceSearchResults);
    const searchResults : OnlineSearchWorkOrderModel[] = this.createOnlineSearchWorkOrderModels(onlineSearchResults.Items, deviceSearchResults);
    this.onlineSearchResults = searchResults;
    this.hasDownloadableInspections = OnlineSearchWorkOrderModel.checkDownloadableSearchResults(this.onlineSearchResults);
    this.calculateStatusesForOnlineSearch();
    this.populateEquipmentPropertiesList(this.onlineSearchResults);
  }

  public async resetOnlineSearchResults() {
    await this.displayDeviceRecordsForOnlineSearch();
  }

  private createOnlineSearchWorkOrderModels(onlineSearchResults : OnlineSearchWorkOrderModel[], deviceSearchResults: WorkOrderList[]) : OnlineSearchWorkOrderModel[]
  {
    function addMissing(onlineSearchResults : OnlineSearchWorkOrderModel[], deviceSearchResults: OnlineSearchWorkOrderModel[]  ) : OnlineSearchWorkOrderModel[] {
      let resultIds = onlineSearchResults.map(x => x.id);
      let deviceResultsNotIncludeInOnlineSearchResults = deviceSearchResults.filter(x => !resultIds.includes(x.id));
      deviceResultsNotIncludeInOnlineSearchResults = deviceResultsNotIncludeInOnlineSearchResults.map((x) => {
        x.isSelected = true;
        x.isDownloaded = true
        return x;
      });
      let result = onlineSearchResults.concat(deviceResultsNotIncludeInOnlineSearchResults);
      result = _.sortBy(result, [x => x.targetDate, x => x.code]);
      return result;
    }

    function setOnlineSearchResultsProperties(onlineSearchResults : OnlineSearchWorkOrderModel[], deviceSearchResults: OnlineSearchWorkOrderModel[]) : OnlineSearchWorkOrderModel[] {
      let deviceIds : Array<number> = device.map(x => x.id);
      let result = onlineSearchResults.map(x => {
        x.isDownloaded = deviceIds.includes(x.id)
        x.isSelected = x.isDownloaded
        return x;
      });
      return result;
    }

    let online : OnlineSearchWorkOrderModel[] = OnlineSearchWorkOrderModel.createArray(onlineSearchResults);
    let device : OnlineSearchWorkOrderModel[] = OnlineSearchWorkOrderModel.createArray(deviceSearchResults);
    online = setOnlineSearchResultsProperties(online, device);
    const result : OnlineSearchWorkOrderModel[] = addMissing(online, device)
    return result;
  }

  private async displayDeviceRecordsForOnlineSearch() {
    this.clearOnlineSearchResults();
    let deviceSearchResults : WorkOrderList[] = await db.fetchAllWorkOrder();
    deviceSearchResults = this.trimWODocsandResponses(deviceSearchResults);
      let onlineSearchResults : OnlineSearchWorkOrderModel[] = OnlineSearchWorkOrderModel.createArray(deviceSearchResults);
      this.onlineSearchResults = onlineSearchResults.map((x) => {
        x.isSelected = true;
        x.isDownloaded = true;
        return x;
      });
      this.hasDownloadableInspections = OnlineSearchWorkOrderModel.checkDownloadableSearchResults(this.onlineSearchResults);
      this.onlineSearchStr = "";
      this.calculateStatusesForOnlineSearch();
      this.populateEquipmentPropertiesList(await db.fetchAllWorkOrder());
  }

  private calculateStatusesForOnlineSearch() {
    for (const status of this.inspectionStatuses) {
      status.quantity = this.onlineSearchResults.filter(x => x.aiInternalStatus === status.statusId).length;
    }
  }

  private clearOnlineSearchResults()
  {
    this.onlineSearchResults = [];
    this.displayOnlineSearchMaxRecordWarning = false;
    this.selectedStatuses = [];
    this.filterEPStr = '';
    this.filterEPField = '';
    this.onlineSearchFilterService.clearResults();
  }

  getAffectedWorkOrderIds() : number[]
  {
    let workorderIds : number[] = [];
    if (this.onlineSearchResults && this.onlineSearchResults.length > 0)
    {
      workorderIds = this.onlineSearchResults.filter(x => x.isSelected === true).map(x => x.id);
    }

    return workorderIds
  }

  async download()
  {
    this.displayOnlineSearchMaxRecordWarning = false;
    let wos = this.getAffectedWorkOrderIds();
    await this.syncSvc.initiateOnlineSearchDownload(wos);
    this.displayDeviceRecordsForOnlineSearch();
  }

  // mainly for online search
  async sync() {
    let networkStatus = await this.sharedService.checkOfflineAndAlert('home.offlineSync');
    if(networkStatus)
    {
      await this.syncSvc.initiateOnlineSearchSync();
      await this.displayDeviceRecordsForOnlineSearch();
    }
  }

  private initialSetup() {
    const user = this.settingsService.getUser();
    this.displayOnlineList = user.OnlineSearchEnabled;
    this.displayList = !user.OnlineSearchEnabled;
    this.refreshWorkOrderList();
  }

  private async showBannerPendingInspections() {
    const completed = this.inspectionStatuses.find(status => status.statusId === 2);
    const pending = this.inspectionStatuses.find(status => status.statusId === 1);

    if (completed && completed.quantity > 0) {
      this.hasPending = PENDING_NOTIFICATION.COMPLETED;
    } else if (pending && pending.quantity > 0) {
      const totalChanged = await db.getUpdatedWorkOrders();
      if (totalChanged.length > 0) {
        this.hasPending = PENDING_NOTIFICATION.INPROGRESS;
      } else this.hasPending = PENDING_NOTIFICATION.NONE;
    } else this.hasPending = PENDING_NOTIFICATION.NONE;
  }

  private async fetchWorkOrdersAndStatusQuantities() {
    //fetch all workorders and number/status
    for (const status of this.inspectionStatuses) {
      status.quantity = await db.countWorkOrderByStatus(status.statusId);
    }
    this.resetPagination();

    this.pullFilteredWorkOrders();
    this.allFilterOptions = await db.getAllWOMetadata();

    this.inspectionTypeFilter.setDistinctOptions(this.allFilterOptions);
    this.areaFilter.setDistinctOptions(this.allFilterOptions);
    this.subAreaFilter.setDistinctOptions(this.allFilterOptions);
    this.projectFilter.setDistinctOptions(this.allFilterOptions);
    this.groupFilter.setDistinctOptions(this.allFilterOptions);
    this.orgFilter.setDistinctOptions(this.allFilterOptions);

    this.populateEquipmentPropertiesList(await db.fetchAllWorkOrder());
  }

  private populateEquipmentPropertiesList(workorders: WorkOrderList[]) {
    this.equipmentPropertiesList = Array<string>();
    workorders.forEach((workorder) => {
      workorder.eqProp?.forEach((equipmentProperty) => {
        if(
          MIUtilities.stringHasValue(equipmentProperty.fieldName) &&
          MIUtilities.stringHasValue(equipmentProperty.currVal) &&
          !this.equipmentPropertiesList.includes(equipmentProperty.fieldName)
        )
        {
          this.equipmentPropertiesList.push(equipmentProperty.fieldName);
        }
      });
    });
    this.equipmentPropertiesList.sort();
  }

  public async filterByStatus(statusIndex: number) { //status selection triggered, reset pagination then pull based on new filter criteria
    this.inspectionStatuses[statusIndex].selected = !this.inspectionStatuses[statusIndex].selected //flip the boolean
    this.selectedStatuses = [];
    for(let status of this.inspectionStatuses){
      if(status.selected){
        this.selectedStatuses.push(status.statusId)

        if(status.statusId === 99 && this.hideSubmitted){
          this.hideSubmitted = !this.hideSubmitted;
        }

      }
    }
    await this.filter();
  }

  public async resetEquipmentPropertyFilter() {
    this.filterEPStr = '';
    this.filterEPField = '';
    await this.filter();
  }

  public async resetEquipmentPropertiesFilter() {
    this.filterEPStr = '';
    this.filterEPField = '';
    await this.filter();
  }

  public async filter() {
    if (this.displayOnlineList) {
      this.resetFilter();
      this.onlineSearchResults = this.onlineSearchFilterService.filter(this.onlineSearchResults);
      this.setEquipmentPropertyFilterLabels(this.onlineSearchResults);
    } else {
      this.resetPagination();
      await this.pullFilteredWorkOrders();
    }
  }

  private setEquipmentPropertyFilterLabels(searchResults: WorkOrderList[]) {
    searchResults.forEach(wo => {
      wo.updateEquipmentPropertyLabel(this.filterEPField, this.filterEPStr)
    });
  }

  public equipmentPropertyFilteringEnabled() : boolean {
    return this.filterEPField != '' && this.filterEPStr != '';
  }

  public resetFilter() {
    this.settingsService.set('filters', {});
    let hideSubmitted = "no"
    if(this.hideSubmitted){
      hideSubmitted = "yes"
    }
    let dueToday = "no"
    if(this.dueToday){
      dueToday = "yes"
    }
    let viewAdditionalFilters = "yes"
    if(!this.showAdditionalFilters){
      viewAdditionalFilters = "no"
    }
    this.settingsService.set('filters',
    {
      showAdditionalFilters: viewAdditionalFilters,
      selectedStatuses: this.selectedStatuses,
      filterStr: this.filterStr,
      filterInspectionType: this.inspectionTypeFilter.filter,
      filterArea: this.areaFilter.filter,
      filterSubArea: this.subAreaFilter.filter,
      filterProject: this.projectFilter.filter,
      filterGroup: this.groupFilter.filter,
      filterOrg: this.orgFilter.filter,
      filterEPStr: this.filterEPStr,
      filterEPField: this.filterEPField,
      hideSubmitted: hideSubmitted,
      dueToday: dueToday
    });
  }

  public clearFilter(filter: FilterCheckbox){
    filter.clear();
    this.resetFilter();
    this.resetPagination();
    this.pullFilteredWorkOrders();
  }


  public clearAllFilters() {
    this.inspectionTypeFilter.clear();
    this.areaFilter.clear();
    this.subAreaFilter.clear();
    this.projectFilter.clear();
    this.groupFilter.clear();
    this.orgFilter.clear();

    for (let status of this.inspectionStatuses) {
      status.selected = false;
    }
    this.selectedStatuses = [];

    this.hideSubmitted = false;
    this.dueToday = false;

    this.filterEPStr = '';
    this.filterEPField = '';

    this.resetFilter();
    this.resetPagination();
    this.pullFilteredWorkOrders();
  }

  public toggleStatusFilterView() {
    this.showAdditionalFilters = !this.showAdditionalFilters;
  }

  public textTriggerPullWorkOrders(){ //text filter triggered, reset pagination and pull new records
    this.resetFilter();
    clearTimeout(this.txtTimeout);
    this.txtTimeout = setTimeout(() => {
      this.resetPagination();
      this.pullFilteredWorkOrders();
      this.filterTriggerPullWorkOrders();
    }, 1000);
  }

  public async filterTriggerPullWorkOrders(){ //text filter triggered, reset pagination and pull new records
    this.inspectionTypeFilter.refineFilter();
    this.areaFilter.refineFilter();
    this.subAreaFilter.refineFilter();
    this.projectFilter.refineFilter();
    this.groupFilter.refineFilter();
    this.orgFilter.refineFilter();
  }

  //reset pagination vars when filters change
  private resetPagination(){
    this.currentPageNumber = 0;
    this.continueFetch = true;
    this.currentWorkOrders = [];
  }

  private async updateExistingRecords(existingRecordIds: number[], newRecords: WorkOrderList[])
  {
    this.currentWorkOrders = this.currentWorkOrders.map(existingRecord => {
      if (!existingRecordIds.includes(existingRecord.id)) {
        // Find the corresponding new record based on id
        const correspondingNewRecord = newRecords.find(newRecord => newRecord.id === existingRecord.id);

        // Update existing record with new data
        return correspondingNewRecord || existingRecord;
      }

      return existingRecord;
    });

    // Concatenate the unique new records with the currentWorkOrders array
    this.currentWorkOrders = this.currentWorkOrders.concat(newRecords.filter(record => !existingRecordIds.includes(record.id)));
  }

  private async pullFilteredWorkOrders() {
    let newRecords: WorkOrderList[] = [];
    try
    {
      this.sharedService.loadIndicatorSvc.show();
      if(this.continueFetch){ //if continueFetch false, we know we already pulled all the workOrders that match, stop pulling
        //pull workorders based on status and text filters
        if (this.selectedStatuses.length > 0 || this.areFiltersPopulated() || this.hideSubmitted != undefined || this.dueToday != undefined) {
          newRecords = await db.fetchWorkOrderFilteredPaginated(
            this.currentPageNumber,
            this.selectedStatuses,
            this.filterStr,
            this.inspectionTypeFilter.filter,
            this.areaFilter.filter,
            this.subAreaFilter.filter,
            this.projectFilter.filter,
            this.groupFilter.filter,
            this.orgFilter.filter,
            this.hideSubmitted,
            this.dueToday,
            this.filterEPField,
            this.filterEPStr
          );
        }
        else {
          newRecords = await db.fetchAllWorkOrderPaginated(this.currentPageNumber);
        }
        this.setEquipmentPropertyFilterLabels(newRecords);

        // list of properties to show in the home screen (inspection-list-item)
        let propertiesToKeep = ["code", "department", "aiInternalStatus", "isImported", "id", "groupId", "description", "userName", "inspectionType", "scheduledEndDate", "returnComment", "equipmentCode", "equipmentDescription", "equipmentClassDesc", "area", "userId", "equipmentPropertyFilterLabel"];

        // make the workorder array light weight
        newRecords =  newRecords.map(wo => {
          Object.keys(wo).forEach( property =>
            {
              if (!propertiesToKeep.includes(property))
              {
                wo[property] = null;
              }
            }
          );
          return wo;
        } );

      if (newRecords.length < 5) this.continueFetch = false; //set continueFetch false because we hit the end of the db collection
      // Upsert from array instead of pushing duplicate records - this.currentWorkOrders.push(...newRecords) appends duplicates.
      // we should update the existing items in this.currentWorkOrders and append new items

      const existingRecordIds = this.currentWorkOrders.map(record => record.id);
      this.updateExistingRecords(existingRecordIds, newRecords); // Update existing records that are not in uniqueNewRecords
      //now find all distinct values for filter dropdown
      }
    }
    catch (err)
    {
      console.error(err);
    }
    finally
    {
      newRecords = null;
      this.sharedService.loadIndicatorSvc.hide();
    }
  }

  public isOverdue(date: string): string | null {
    let dateObj = new Date(date);
    if (dateObj < this.todayDate) return 'text-light-red';
    else return null;
  }

  public isReturned(aiInternalStatus: number): string | null {
    if (aiInternalStatus == 3) return 'text-light-red';
    else return null;
  }

  public areFiltersPopulated(): boolean {
    //function to tell UI if any of the text filters have values (changes message if empty list)
    if (this.filterStr != '' ||
    this.inspectionTypeFilter.isFiltering() ||
    this.areaFilter.isFiltering() ||
    this.subAreaFilter.isFiltering() ||
    this.projectFilter.isFiltering() ||
    this.groupFilter.isFiltering() ||
    this.orgFilter.isFiltering() ||
    this.dueToday ||
    this.hideSubmitted ||
    this.equipmentPropertyFilteringEnabled()) {
      return true;
    } else {
      return false;
    }
  }

  public onHideSubmittedChange(){
    this.hideSubmitted = !this.hideSubmitted;
    this.filter();
  }

  public onDueTodayChange(){
    this.dueToday = !this.dueToday;
    this.filter();
  }

 trimWODocsandResponses(woOrders:any):any{
  return woOrders.map( workOrder => {
    workOrder.inspectionResponses = [];
    return workOrder;
  })

 }
}
