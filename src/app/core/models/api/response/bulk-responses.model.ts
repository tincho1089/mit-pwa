export class BulkResponsesModel {
  constructor(
    public Answers: Array<AnswerModel>,
    public Success: string,
    public MessageDetail: string,
    public Message: string,
    public opstatus?: number,
    public httpStatusCode?: number
  ) {}
}

export class AnswerModel {
  constructor(
    public InspectionItemType: string,
    public InspectionItemSubsection: string,
    public InspectionItemCode: string,
    public InspectionItemDescription: string,
    public ConditionalExpression: string,
    public Recommendation: string,
    public FollowUpWO: string,
    public DisplayImmediateAttentionRequired: string,
    public DisplayComments: string,
    public CircuitPiping: string,
    public DisplayFollowUpWO: string,
    public DisplayCopy: string,
    public InspectionWorkOrderId: number,
    public CreatedDate: string,
    public Answer: string,
    public DisplayNA: string,
    public CreatedBy: string,
    public InspectionItemOptions: string,
    public IsImmediateAttentionRequired: string,
    public Comments: string,
    public ID: number,
    public InspectionSection: string,
    public DisplayPhoto: string,
    public Units: string,
    public QuestionImage: string,
    public Images: Array<any>
  ) {}
}
