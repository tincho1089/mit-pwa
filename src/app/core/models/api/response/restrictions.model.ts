import { ActionsModel } from "./actions.model";
import { WorkOrderDocumentResponseModel } from "./work-order-documents.model";

export interface RestrictionsInterface {
  DeleteList: string;
  ExcludeDwnldVisionsList: string;
  DownloadList: string;
  ExcludeUploadVisionsList: string;
  NoChangeList: string;
  WoDiffStatusList: string;
  AlertMsg: string;
  WorkOrdersInactive: string;
  Files: string;
  Actions: Array<ActionsModel>;
}
/**
 * Response model for work order document response
 *
 *
 * @param DeleteList
 * @param ExcludeDwnldVisionsList
 * @param DownloadList
 * @param ExcludeUploadVisionsList
 * @param NoChangeList
 * @param WoDiffStatusList
 * @param AlertMsg
 * @param Files
 * @param Actions
 */
export class RestrictionsModel {
  public download: Array<string> = [];
  public delete: Array<string> = [];
  public excludeDownload: Array<string> = [];
  public excludeUpload: Array<string> = [];
  public diffStatus: Array<string> = [];
  public inactives: Array<string> = [];
  public noChange: Array<string> = [];
  public alertMsg: string;
  public files: string;
  public actions: Array<ActionsModel> = [];
  public docs: Array<WorkOrderDocumentResponseModel> = [];

  constructor(restrictions: RestrictionsInterface) {
    this.download = restrictions.DownloadList
      ? Array.from(new Set(restrictions.DownloadList.trim().split("||")))
      : [];

    this.delete = restrictions.DeleteList
      ? Array.from(new Set(restrictions.DeleteList.trim().split("||")))
      : [];

    this.excludeDownload = restrictions.ExcludeDwnldVisionsList
      ? Array.from(
          new Set(restrictions.ExcludeDwnldVisionsList.trim().split("||"))
        )
      : [];

    this.excludeUpload = restrictions.ExcludeUploadVisionsList
      ? Array.from(
          new Set(restrictions.ExcludeUploadVisionsList.trim().split("||"))
        )
      : [];

    this.diffStatus = restrictions.WoDiffStatusList
      ? Array.from(new Set(restrictions.WoDiffStatusList.trim().split("-")))
      : [];

    this.inactives = restrictions.WorkOrdersInactive
      ? Array.from(new Set(restrictions.WorkOrdersInactive.trim().split("||")))
      : [];

    this.alertMsg = restrictions.AlertMsg;
    this.files = restrictions.Files;
    this.actions = restrictions.Actions;
  }
}
