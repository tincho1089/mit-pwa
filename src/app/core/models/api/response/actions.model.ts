export class ActionsModel {
    constructor(
      public ID: string,
      public InspectionWorkOrderId: string,
      public InspectionItemCode: string,
      public WOCreatedDate: string,
      public WOCreatedBy: string,
      public FollowUpWorkOrderCode: string
    ) {}
}