import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MIUtilities } from "src/app/shared/utility";
import { WorkOrderDocumentRequestModel } from "../../models/api/request/work-order-documents.model";
import { ENV } from "src/environments/environment";

@Injectable()
export class WorkOrderDocumentAPIService {
    constructor(private http: HttpClient){}

    public uploadDocument(workOrderDocumentRequest: WorkOrderDocumentRequestModel){
        return this.http.post<WorkOrderDocumentRequestModel>(
            `${ENV.documents_api}/${workOrderDocumentRequest.workOrderId}/documents` +
            MIUtilities.getDeviceInfo(),
            workOrderDocumentRequest
        )
    }
}