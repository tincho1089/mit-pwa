import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MIUtilities } from "src/app/shared/utility";
import { UserResponse } from "../../models/api/response/user-response.model";
import { GetConfigModel } from "../../models/api/response/get-config.model";
import { WorkOrderList } from "../../sync/entities";

@Injectable()
export class UserAPIService {
    constructor(private http: HttpClient){}

    public getCurrentUser(){
        return this.http.get<UserResponse>("user/current?" + MIUtilities.getDeviceInfo());
    }

    public getConfig(){
        return this.http.get<GetConfigModel>("user/getConfig?" + MIUtilities.getDeviceInfo(), {})
    }

    public mobileInspectionWorkOrderIds(ids: string){
        return this.http.post<Array<WorkOrderList>>("user/mobile-inspection-workorders-ids?" + MIUtilities.getDeviceInfo(), JSON.stringify(ids))
    }
}