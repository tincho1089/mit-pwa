import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CheckVersionUpdateService } from '../../services/check-version-update.service';
export interface DialogData {
  showOkButton: boolean;
  showCancelButton: boolean;
  showNoButton: boolean;
  showYesButton: boolean;
  showReloadButton: boolean;
  title: string;
  content: string;
  formattedContent: string;
}
@Component({
  selector: 'app-info-prompt',
  templateUrl: './promptInfo.component.html',
  styleUrls: ['./promptInfo.component.scss']
})
export class PromptInfoComponent{
  //#region 'Angular Life Cycle'
  constructor(
    public dialogRef: MatDialogRef<PromptInfoComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private appVersionService: CheckVersionUpdateService
  ) {}

  async reloadCurrentPage() {
    await this.appVersionService.finalizeUpgrade();
    window.location.href = window.location.href;
   }
  //#endregion 'Angular Life Cycle'
}