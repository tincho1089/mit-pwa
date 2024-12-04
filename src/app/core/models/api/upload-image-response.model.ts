/**
 * Response model of update image
 * @param ID - Server image ID
 * @param httpStatusCode - code of http request
 * @param opstatus - operation status by server
 */
export class UploadImageResponseModel {
  constructor(
    public ID: string,
    public InspectionResponseID: number,
    public httpStatusCode: number,
    public opstatus: number
  ) {}
}
