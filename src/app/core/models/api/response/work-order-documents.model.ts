/**
 * Response model for work order document response
 * @param ID - WorkOrder ID from server
 * @param InspectionWorkOrderId - WorkOrder Id
 * @param InspectionWorkOrderCode - WorkOrder Code
 * @param DocumentName -
 * @param DocumentLink -
 * @param BlobReference -
 * @param ContentType -
 * @param Content -
 */
export class WorkOrderDocumentResponseModel {
  constructor(
    public ID: number,
    public InspectionWorkOrderId: number,
    public InspectionWorkOrderCode: string,
    public DocumentName: string,
    public DocumentLink: string,
    public BlobReference: string,
    public ContentType: string,
    public Content: string
  ) {}
}
