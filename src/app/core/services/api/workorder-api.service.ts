import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MIUtilities } from "src/app/shared/utility";
import { WorkOrderList } from "../../sync/entities/work-order-list";
import { PagedResult } from "../../models/api/response/paged-result.model";
import { OnlineSearchWorkOrderModel } from "../../sync/entities/online-search-work-order-model";
import { map } from 'rxjs/operators';

@Injectable()
export class WorkOrderAPIService {
    constructor(private http: HttpClient) { }

    //requestModel is type any because there was a bunch of unsafe type logic on the old app
    public compareWorkOrder(requestModel: any) {
        return this.http.post<any>("mobileapi/CompareInspectionsV2?" + MIUtilities.getDeviceInfo(), JSON.stringify(requestModel))
    }

    public resetInspection(inspectionId: number) {
        return this.http.get("inspection-workorder/ResetInspection/" + inspectionId + "?" + MIUtilities.getDeviceInfo(), {})
    }

    public getWorkOrders(ids) {
        return this.http.post<Array<WorkOrderList>>("user/mobile-inspection-workorders-ids?" +
            MIUtilities.getDeviceInfo(),
            ids
        );
    }

    public startInspection(inspectionid: number) {
        return this.http
          .put("inspection-assignment/" + inspectionid + "/Start?" + MIUtilities.getDeviceInfo(), {});
    }

    public search(workOrderCodeTerm: string) {
        let url: string = `mobileapi/search?req.workOrderCode=${workOrderCodeTerm}`;

        return this.http.get<PagedResult<WorkOrderList>>(url).pipe(
            map( (x: PagedResult<WorkOrderList>) => this.MapResponse(x))
          );
    }

    private MapResponse(response: PagedResult<WorkOrderList>) : PagedResult<OnlineSearchWorkOrderModel> {
        let tempArray: OnlineSearchWorkOrderModel[] = response.Items.map<OnlineSearchWorkOrderModel>( x => { 
          let wo: OnlineSearchWorkOrderModel = new OnlineSearchWorkOrderModel();
          wo.init(x);
          return wo;
        });
        
        let pagedResult = new PagedResult<OnlineSearchWorkOrderModel>() 
        pagedResult.LastPage = response.LastPage;
        pagedResult.PageSize = response.PageSize;
        pagedResult.Total = response.Total;
        pagedResult.WOArray = response.WOArray;
        pagedResult.Items = tempArray;
        
        response.Items = tempArray;
        return pagedResult;   
      }
}