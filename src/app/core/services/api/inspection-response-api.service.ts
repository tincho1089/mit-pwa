import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { MIUtilities } from "src/app/shared/utility";
import { WorkOrderUpdates } from "../../models/api/request/response.model";

@Injectable()
export class InspectionResponseAPIService {
    constructor(private http: HttpClient) { }
    httpOpts = {
        headers: new HttpHeaders({
        "Content-Type":"application/json"})
      };

    public syncResponses(url: string, response: WorkOrderUpdates) {
        
        return this.http.put<any>(url, JSON.parse(response.requestModel));
    }

    public getBulkResponses(ids: Array<number>) {
        return this.http.post<any>("inspection-response/bulk?" + MIUtilities.getDeviceInfo(), ids);
    }

    public deleteResponses(responseIds) {
        return this.http.post("inspection-response/DeleteResponses?" + MIUtilities.getDeviceInfo(), 
        responseIds,
        this.httpOpts);
    }
}