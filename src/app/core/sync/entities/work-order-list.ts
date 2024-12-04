import * as dayjs from 'dayjs';
import { MIUtilities } from 'src/app/shared/utility';
import { InspectionResponse } from './inspection-response';
import { WorkOrderDocument } from './work-order-document';
import { EquipDetails } from './visions-details';
import { VisionsTML } from './visions-tml';
import { MeridiumDetails } from './meridium-details';
import { VisionDetailsModel } from '../../models/local/vision-details.model';

export interface IWorkOrderList {
  inspectionResponses: InspectionResponse[];
  inspectionWorkOrderDocuments: WorkOrderDocument[];
  id: number;
  code: string; // unique
  inspectionType: string;
  revisionVersion: string;
  equipment: number;
  aiInternalStatus: number;
  eqDetails: EquipDetails[];
  tmlDetails: VisionsTML;
  meridiumDetails: MeridiumDetails;
  workOrderCodeLabel: string;
  workOrderDescriptionLabel: string;
  equipmentCodeLabel: string;
  equipmentDescriptionLabel: string;
  subEquipmentData: string;
  areaLabel: string;
  subAreaLabel: string;
  op_Desc: string;
  wo_Type_Description: string;
  summary: string;
  hiddenSummary: string;
  jobpackNumber: string;
  flangeNumber: string;
}

export class WorkOrderList implements IWorkOrderList {
  id: number;
  code: string;
  description: string | null;
  statusDesc: string | null;
  statusCode: string | null;
  targetDate: string | null;
  inspectionType: string;
  revisionVersion: string | null;
  equipment: number;
  aiInternalStatus: number;
  summaryComments: string | null;
  costCode: string | null;
  equipmentCode: string | null;
  equipmentNumber: string | null;
  equipmentDescription: string | null;
  equipmentClassDesc: string | null;
  ic: string | null;
  area: string | null;
  department: string | null;
  manufacturer: string | null;
  model: string | null;
  userId: string | null;
  userName: string | null;
  users: string | null;
  reassigned_id: string | null;
  reassigned_user: string | null;
  returnComment: string | null;
  sendtovisions: boolean | null;
  responseCreatedDate: string | null;
  eqDetails: EquipDetails[] | null;
  eqProp: EquipDetails[] | null;
  tmlDetails: VisionsTML | null;
  serviceType: string | null;
  circuitPipingList: string | null;
  scheduledEndDate: string | null;
  aiDateCompleted: string | null;
  bu: string | null;
  org: string | null;
  groupId: string | null;
  groups: string | null;
  source: string | null;
  meridiumData: boolean | null;
  meridiumDetails: MeridiumDetails | null;
  project: string | null;
  reviewRequired: boolean = true;
  workOrderCodeLabel: string | null;
  workOrderDescriptionLabel: string | null;
  equipmentCodeLabel: string | null;
  equipmentDescriptionLabel: string | null;
  subEquipmentData: string | null;
  areaLabel: string | null;
  subAreaLabel: string | null;
  op_Desc: string | null;
  wo_Type_Description: string | null;
  summary: string | null;
  hiddenSummary: string | null;
  jobpackNumber: string | null;
  flangeNumber: string | null;
  goToSummary: boolean = false;
  inspectionResponses: InspectionResponse[];
  inspectionWorkOrderDocuments: WorkOrderDocument[];
  isImported: boolean = false;
  isChanged: string | null;
  equipmentPropertyFilterLabel = {
    "startText": "",
    "boldText": "",
    "endText": ""
  };

  init(json: any): void {
    try {
      this.id = json["ID"];
      this.code = json["Code"];
      this.description = json["Description"];
      this.statusDesc = json["StatusDescription"];
      this.statusCode = json["StatusCode"];
      this.scheduledEndDate = json["ScheduledEndDate"];
      this.inspectionType = json["InspectionType"];
      this.revisionVersion = json["RevisionVersion"];
      this.equipment = json["EquipmentID"];
      this.aiInternalStatus = +json["Status"];
      if(this.aiInternalStatus == 5)
      {
        this.aiInternalStatus = 99; //if in submitted but no review needed, set status 5 (Submitted, No Review Needed) to status 99 (Submitted, In Review) for viewing on PWA
      }
      this.summaryComments = json["CloseComment"];
      this.hiddenSummary = json["CloseComment"];
      this.costCode = json["CostCode"] == "null" ? "" : json["CostCode"];
      this.equipmentCode = json["EquipmentCode"];
      this.equipmentNumber = json["EquipmentNumber"];
      this.equipmentDescription = json["EquipmentDescription"];
      this.equipmentClassDesc = json["EquipmentClassDescription"];
      this.ic = json["IC"];
      this.area = json["AreaDescription"];
      this.department = json["DeptDescription"];
      this.manufacturer = json["Manufacturer"];
      this.model = json["Model"];
      this.userId = json["UserId"] ? json["UserId"] : "";
      this.userName = json["UserName"] ? json["UserName"] : "";
      this.users = json["Users"] ? JSON.stringify(json["Users"]) : "";
      this.reviewRequired = json["ReviewRequired"];
      this.returnComment =
        json["ReturnComment"] == "null" ? "" : json["ReturnComment"];
      this.circuitPipingList = json["CircuitPiping"];
      this.tmlDetails = null;
      this.eqDetails = null;
      this.eqProp = this.parseEquipmentProperties(json["EquipmentDetails"], json["ID"]);
      this.source = json["Source"];
      this.summary = json["Summary"];
      this.serviceType = json["ServiceType"];
      this.setTargetDate();
      this.setSendToVisions(json["EquipmentDetails"]);
      this.setMeridiumData(json["EquipmentDetails"]);
      this.setSubEquipmentData(json["EquipmentDetails"]);
      this.setSource(json["TMLPoints"]);
      this.responseCreatedDate = json["ResponsesCreateDate"];
      this.bu = json["BU"];
      this.org = json["Org"];
      this.groupId = MIUtilities.isNullOrUndefined(json["GroupId"])
        ? null
        : json["GroupId"];
      this.groups = MIUtilities.isNullOrUndefined(json["Groups"]) ? "" : json["Groups"];
      this.project = MIUtilities.isNullOrUndefined(json["Project"])
        ? ""
        : json["Project"];

      this.setLabels(json);
      this.op_Desc = MIUtilities.isNullOrUndefined(json["op_Desc"]) ? "" : json["op_Desc"];
      this.wo_Type_Description = MIUtilities.isNullOrUndefined(json["wo_Type_Description"]) ? "" : json["wo_Type_Description"];
      this.flangeNumber = json["Flange_Number"];
      this.jobpackNumber = json["JobPackNumber"];
      this.inspectionResponses = null;
      this.setDocuments(json);
      this.initialiseEquipmentPropertyFilterLabel();
    } catch (e) {
      console.log(e);
    }
  }

  public updateEquipmentPropertyLabel(filterEPField: string, filterEPStr: string) {
    let start: string = '';
    let mid: string = '';
    let end: string = '';

    const ep: EquipDetails = this.eqProp?.find(ep => ep.fieldName == filterEPField)
    if(ep && filterEPStr != '') {
      const val = ep.currVal;
      const startIndex = MIUtilities.standardiseStr(val).indexOf(MIUtilities.standardiseStr(filterEPStr));

      start = `${filterEPField}: ${val.substring(0, startIndex)}`;
      mid = val.substring(startIndex, startIndex + filterEPStr.length);
      end = val.substring(startIndex + filterEPStr.length);
    }

    if(!this.equipmentPropertyFilterLabel) {
      this.initialiseEquipmentPropertyFilterLabel();
    }
    this.equipmentPropertyFilterLabel.startText = start;
    this.equipmentPropertyFilterLabel.boldText = mid;
    this.equipmentPropertyFilterLabel.endText = end;
  }

  private initialiseEquipmentPropertyFilterLabel() {
    this.equipmentPropertyFilterLabel = {
      "startText": "",
      "boldText": "",
      "endText": ""
    };
  }

  private setTargetDate() {
    try {
      this.targetDate = dayjs(this.scheduledEndDate).format("YYYY-MM-DDTHH:mm:ss");
    } catch {
      this.targetDate = this.scheduledEndDate;
    }
  }
  private setLabels(eqDetails) {
    this.workOrderCodeLabel = MIUtilities.isNullOrUndefined(eqDetails["workOrderCodeLabel"]) ? "" : eqDetails["workOrderCodeLabel"];
    this.workOrderDescriptionLabel = MIUtilities.isNullOrUndefined(eqDetails["workOrderDescriptionLabel"]) ? "" : eqDetails["workOrderDescriptionLabel"];
    this.equipmentCodeLabel = MIUtilities.isNullOrUndefined(eqDetails["equipmentCodeLabel"]) ? "" : eqDetails["equipmentCodeLabel"];
    this.equipmentDescriptionLabel = MIUtilities.isNullOrUndefined(eqDetails["equipmentDescriptionLabel"]) ? "" : eqDetails["equipmentDescriptionLabel"];
    this.areaLabel = MIUtilities.isNullOrUndefined(eqDetails["areaLabel"]) ? "" : eqDetails["areaLabel"];
    this.subAreaLabel = MIUtilities.isNullOrUndefined(eqDetails["subAreaLabel"]) ? "" : eqDetails["subAreaLabel"];

  }

  private setDocuments(eqDetails) {
    this.inspectionWorkOrderDocuments = eqDetails["Documents"]?.map(document => {
      const workOrderDocument = new WorkOrderDocument();
      workOrderDocument.init(document);
      workOrderDocument.inspectionId = eqDetails["ID"];
      return workOrderDocument;
    });
  }

  private setSendToVisions(eqDetails) {
    if (eqDetails) {
      this.sendtovisions = JSON.parse(eqDetails)["SendToVisions"];
    }
  }

  private setMeridiumData(eqDetails) {
    if (eqDetails) {
      this.meridiumData = JSON.parse(eqDetails)["MeridiumData"];
    }
  }

  private setSubEquipmentData(eqDetails) {
    if (eqDetails) {
      this.subEquipmentData = JSON.parse(eqDetails)["SubEquipmentData"];
    }
  }

  private setSource(tmlPoints) {
    if (tmlPoints) {
      this.source = tmlPoints["Source"];
    }
  }

  private parseEquipmentProperties(eqProp, inspectionId: number) : EquipDetails[] {
    let equipmentProperties: Array<EquipDetails> = null;
    if(eqProp) {
      const eqDetailsObj = JSON.parse(eqProp)
      const eqDetailsFields: Array<VisionDetailsModel> = eqDetailsObj["Fields"] ? eqDetailsObj["Fields"] : eqDetailsObj["EquipmentDetail"];
      if(eqDetailsFields) {
        equipmentProperties = new Array<EquipDetails>();
        eqDetailsFields.forEach((field) => equipmentProperties.push(EquipDetails.fromVision(field)));
        equipmentProperties.forEach((ep) => ep.inspectionId = inspectionId)
      }
    }
    return equipmentProperties;
  }
}
