import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MIUtilities } from "src/app/shared/utility";

@Injectable()
export class InspectionQuestionImageAPIService {
    constructor(private http: HttpClient){}

    public downloadQuestionImage(questionCode: string){
        return this.http.get<any>("inspection-item/"+ questionCode + "/GetQuestionImage?" + MIUtilities.getDeviceInfo(), {})
    }
}