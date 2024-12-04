import { NgModule } from "@angular/core";
import { FeedbackAPIService } from "./feedback-api.service";
import { InspectionAssignmentAPIService } from "./inspection-assignment-api.service";
import { InspectionQuestionImageAPIService } from "./inspection-question-image-api.service";
import { InspectionResponseAPIService } from "./inspection-response-api.service";
import { InspectionResponseImageAPIService } from "./inspection-response-image-api.service";
import { MobileVersionAPIService } from "./mobile-version-api.service";
import { UserAPIService } from "./user-api.service";
import { WorkOrderAPIService } from "./workorder-api.service";
import { WorkOrderDocumentAPIService } from "./workorder-document-api.service";

@NgModule({
  declarations: [],
  imports: [],
  providers: [
    FeedbackAPIService,
    InspectionAssignmentAPIService,
    InspectionQuestionImageAPIService,
    InspectionResponseAPIService,
    InspectionResponseImageAPIService,
    MobileVersionAPIService,
    UserAPIService,
    WorkOrderAPIService,
    WorkOrderDocumentAPIService
  ],
  exports: []
})
export class APIModule { }
