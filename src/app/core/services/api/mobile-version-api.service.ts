import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MIUtilities } from "src/app/shared/utility";
import { GetMobileVersionResponseModel } from "../../models/api/response/get-mobile-version.response.model";

@Injectable()
export class MobileVersionAPIService {
    constructor(private http: HttpClient){}

    public getMobileVersion(buildVersion: string){
        this.http.get<GetMobileVersionResponseModel>("MobileVersion?versionNumber="+ buildVersion + "&" + MIUtilities.getDeviceInfo(),{})
    }
}