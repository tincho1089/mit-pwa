import { HostListener, Injectable, OnDestroy } from '@angular/core';
import { SettingsService } from 'src/app/core/services/app-settings.service';
import { OnlineSearchWorkOrderModel } from 'src/app/core/sync/entities/online-search-work-order-model';
import { MIUtilities } from 'src/app/shared/utility';

@Injectable({
  providedIn: 'root'
})
export class OnlineSearchFilterService implements OnDestroy {

  fullSearchResults: Array<OnlineSearchWorkOrderModel> = null;
  selectedStatuses: number[] = [];
  EPStr: string = '';
  EPField: string = '';

  constructor(
    private settingsService: SettingsService
  ) { }

  @HostListener('unloaded')
  ngOnDestroy(): void {
    this.fullSearchResults = null;
  }

  public clearResults() {
    this.fullSearchResults = null;
    this.selectedStatuses = [];
    this.EPStr = '';
    this.EPField = '';
  }

  public filter(searchResults: Array<OnlineSearchWorkOrderModel>) : OnlineSearchWorkOrderModel[] {
    this.updateFilters();
    this.cacheFullOnlineSearchResults(searchResults);

    let filteredWorkorders = this.fullSearchResults;
    filteredWorkorders = this.onlineSearchFilterByStatus(filteredWorkorders);
    filteredWorkorders = this.onlineSearchFilterByEquipmentProperties(filteredWorkorders);
    return filteredWorkorders;
  }

  private updateFilters() {
    this.selectedStatuses = this.settingsService.get('filters')?.selectedStatuses || [];
    this.EPStr = this.settingsService.get('filters')?.filterEPStr || '';
    this.EPField = this.settingsService.get('filters')?.filterEPField || '';
  }

  private cacheFullOnlineSearchResults(onlineSearchResults: Array<OnlineSearchWorkOrderModel>) {
    if (this.fullSearchResults === null || this.fullSearchResults.length == 0) {
      this.fullSearchResults = onlineSearchResults;
    }
    this.fullSearchResults = this.fullSearchResults.map((x) => {
      return this.toggleSelectedValueIfHidden(x);
    });
  }

  private toggleSelectedValueIfHidden(item: OnlineSearchWorkOrderModel) : OnlineSearchWorkOrderModel {
    if(!item.isDownloaded && item.isSelected && !this.selectedStatuses.includes(item.aiInternalStatus))
    {
      item.isSelected = false;
    }
    return item;
  }

  private onlineSearchFilterByStatus(workorders: OnlineSearchWorkOrderModel[]) : OnlineSearchWorkOrderModel[] {
    let filteredWorkorders = workorders;
    if (this.selectedStatuses.length > 0) {
      filteredWorkorders = workorders.filter((x) => this.selectedStatuses.includes(x.aiInternalStatus));
    }
    return filteredWorkorders;
  }

  private onlineSearchFilterByEquipmentProperties(workorders: OnlineSearchWorkOrderModel[]) : OnlineSearchWorkOrderModel[] {
    let filteredWorkorders = workorders;
    if (MIUtilities.stringHasValue(this.EPField) && MIUtilities.stringHasValue(this.EPStr)) {
      const fieldName: string = this.EPField;
      const value: string = MIUtilities.standardiseStr(this.EPStr);

      filteredWorkorders = workorders.filter((x) =>
        x.eqProp &&
        MIUtilities.standardiseStr(x.eqProp.find(ep => ep.fieldName == fieldName)?.currVal).includes(value)
      );
    }
    return filteredWorkorders;
  }
}
