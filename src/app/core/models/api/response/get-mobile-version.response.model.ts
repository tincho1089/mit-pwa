/**
 * Response model for version checker
 * @param version - Version code of application
 * @param status - Status of application version
 */
export class GetMobileVersionResponseModel {
  constructor(public Version: string = "", public Status: string) {}
}
