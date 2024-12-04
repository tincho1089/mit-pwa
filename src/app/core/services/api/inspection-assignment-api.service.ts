import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MIUtilities } from "src/app/shared/utility";

@Injectable()
export class InspectionAssignmentAPIService {
    constructor(private http: HttpClient){}

    //unsure how this starts an inspection but the reOpen url is the same
    //only difference is {} vs "{}"
    public startInspection(inspectionId: number){
        return this.http.put("inspection-assignment/" + inspectionId + "/Start?" + MIUtilities.getDeviceInfo, {})
    }

    public reOpenInspection(inspectionId: number){
        return this.http.put("inspection-assignment/" + inspectionId + "/Start?" + MIUtilities.getDeviceInfo, "{}")
    }

    public resetInspection(inspectionId: number){
        return this.http.get("inspection-workorder/ResetInspection/"+ inspectionId + "?" + MIUtilities.getDeviceInfo(),{})
    }
}