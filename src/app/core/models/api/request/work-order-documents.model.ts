/**
 * Request model for download image response
 * @param workOrderId - WorkOrder ID that you are looking for
 * @param File - Inspection Response ID
 */
export class WorkOrderDocumentRequestModel {
  constructor(public workOrderId: number, public File: FormData) {}
}
