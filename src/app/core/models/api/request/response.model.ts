/**
 * Model for made a upload WorkOrderUpdates
 * @param completionDate - completion date from workorder
 * @param inspectionid - workorder inspectionid
 * @param requestModel - changes made in a workder
 * @param status - workorder status
 */
export class WorkOrderUpdates {
  
  constructor(
    public inspectionid: number = 0,
    public userid: string = "",
    public status: number = 1,
    public requestModel: string = "",
    public completionDate: string = ""
  ) {}
}

/**
 * Model to define de params of Image Object Model that it's needed by RequestModel
 * @param Responses - updated responses from work order
 * @param TMLPoints - updated tmlpoints from workorder
 */
export class RequestModel {
  constructor(
    public Responses: Array<Responses> = [],
    public TMLPoints: string = "",
    public Comment: string = ""
  ) {}
}

/**
  * Model to define de params of Image Object Model that it's needed by Responses

  */
class Responses {
  constructor(
    public Answer: string = "",
    public Comments: string = "",
    public CreatedBy: string = "",
    public CreatedDate: string = "",
    public FollowUpWO: string = "",
    public ID: number = null,
    public InspectionItemCode: string = "",
    public InspectionItemConditions: string = "",
    public InspectionItemDescription: string = "",
    public InspectionItemOptions: string = "",
    public InspectionItemSubsection: string = "",
    public InspectionItemType: null,
    public InspectionSection: string = "",
    public IsImmediateAttentionRequired: string = "",
    public Recommendation: any = null,
    public Units: string = "",
    // public WorkOrderId: number = null,
    public InspectionWorkOrderCode: string = "",
    public CircuitPiping: string = ""
  ) {}
}
