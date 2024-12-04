import { Component, Input} from "@angular/core";
import { OnlineSearchWorkOrderModel } from "src/app/core/sync/entities/online-search-work-order-model";
import { MIUtilities } from "src/app/shared/utility";

@Component({
    selector: "app-online-search-inspection-list",
    templateUrl: "online-search-inspection-list.component.html",
    styleUrls: ['./online-search-inspection-list.component.scss']
  })
  export class OnlineSearchInspectionList {
    
    private _selectAll : boolean = false;
    
    get selectAll() : boolean { 
      return this._selectAll; 
    }

    set selectAll(value: boolean) { 
      this._selectAll =  value;
    }

    get hasDownloadableSearchResults() : boolean {
      return this.hasSearchResults && OnlineSearchWorkOrderModel.checkDownloadableSearchResults(this.workorders);
    }

    get hasSearchResults() : boolean {
      let result : boolean = !MIUtilities.isNullOrUndefinedObject(this.workorders) && this.workorders.length > 0;
      return result;
    }
    
    @Input("workorders")
    workorders: Array<OnlineSearchWorkOrderModel>;

    @Input()
    displayOnlineSearchMaxRecordWarning: boolean;

    public onSelectAllClick(event: Event) {
      this.workorders.forEach(x => x.isSelected = (x.isDownloaded || this.selectAll));
    }
    
    public onValueChange(newValue : OnlineSearchWorkOrderModel) {
      this.selectAll = this.workorders.every(x => x.isSelected === true);
    }
}