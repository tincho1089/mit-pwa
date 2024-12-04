/**
 * Request model for download image response
 * @param workOrderId - WorkOrder ID that you are looking for
 * @param File - Inspection Response ID
 */
export class WorkOrderToCompareModel {
  constructor(
    public WoId: number = 0,
    public WoCode: string,
    public woStatus: number = 0,
    public GroupId: number,
    public ResponseCreatedDate: string,
    public ResponsesCount: number,
    public UserId: number,
    public FileNamea: string,
    public DocNames: string
  ) {}
}
