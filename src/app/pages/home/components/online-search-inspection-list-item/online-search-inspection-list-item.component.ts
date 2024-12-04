import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WOStatus } from 'src/app/core/models/ui/workOrderStatus';
import dayjs from 'dayjs';
import { SettingsService } from 'src/app/core/services/app-settings.service';
import { OnlineSearchWorkOrderModel } from 'src/app/core/sync/entities/online-search-work-order-model';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SyncService } from 'src/app/core/services/sync/sync.service';
import { db } from 'src/databases/db';
import { WorkOrderAPIService } from 'src/app/core/services/api/workorder-api.service';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import { WorkOrderList } from 'src/app/core/sync/entities';
import { HomeService } from '../../services/home.service';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-online-search-inspection-list-item',
  templateUrl: './online-search-inspection-list-item.component.html',
  styleUrls: ['./online-search-inspection-list-item.component.scss']
})
export class OnlineSearchInspectionListItem {
  @Input()
  wo: OnlineSearchWorkOrderModel;

  @Output() valueChanged : EventEmitter<OnlineSearchWorkOrderModel> = new EventEmitter<OnlineSearchWorkOrderModel>();

  todayDate = new Date();
  userid: string;

  woStatus: WOStatus;

  isOwnedByCurrentUser : boolean;
  isContributable : boolean;


  constructor(
    private settingsService: SettingsService,
    private dialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
    private syncService: SyncService,
    private workOrderAPIService: WorkOrderAPIService,
    private homeService: HomeService,
    private sharedService: SharedService
  ) { }

  async ngOnInit() {
    this.getUser();
    this.woStatus = new WOStatus(this.wo.aiInternalStatus);
    this.isOwnedByCurrentUser = this.settingsService.getUser().ID.toString() == this.wo.userId;
    this.isContributable = this.wo.groupId && !this.isOwnedByCurrentUser;
  }

  public isOverdue(dueDate: string): string | null {
    dueDate = dayjs(dueDate).format('YYYY-MM-DD');
    const todayDate = dayjs(this.todayDate).format('YYYY-MM-DD');

    if (dayjs(dueDate).isBefore(todayDate)) return 'text-light-red';

    else return null;
  }

  private getUser() {
    this.userid = String(this.settingsService.getUser().ID)
  }

  public onCheckBoxChange(event:Event) {
   this.valueChanged.emit(this.wo);
  }

  public async startInspection(): Promise<void> {
    let woId: number = this.wo.id;
    let wo = await db.workOrderList.get(woId);
    if (wo.aiInternalStatus == 0)
    {
      //  don't not steal the inspection assignment if the inspection is already passed "not started"
      wo.userId = this.userid;
      wo.userName = this.settingsService.getUser().FullName;
    }
    wo.aiInternalStatus = 1;
    await db.workOrderList.put(wo);
    this.router.navigate(['/inspection', wo.id]);
    this.workOrderAPIService.startInspection(wo.id).subscribe((response) => {
      console.log("Start Inspection response is " + JSON.stringify(response));
    });
  }

  public async contribute() {
    let woId: number = this.wo.id;
    let wo = await db.workOrderList.get(woId);
    let users = wo.users ? JSON.parse(wo.users) : [];
    let username = !this.isOwnedByCurrentUser ? this.wo.userName : "another user"
    let contributeDialog = "";
    this.translate.get(['inspection.contributeDialog']).subscribe(values => {
      contributeDialog = values['inspection.contributeDialog'];
    });
    this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: {
        title: 'inspection.contribute', content: contributeDialog.replace('{{user}}', username), showOkButton: true, showCancelButton: true
      },
      panelClass: 'custom-dialog'
    }).afterClosed()
      .subscribe((answer) => {
        if (answer) {
          this.router.navigate(['/inspection', woId]);
          this.startInspection()
        }
      })
  }

  public async remove(workorder: WorkOrderList){
    this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: {
        title: 'Confirm Remove Inspection', content: 'inspection.removeDialog', showYesButton: true, showNoButton: true
      },
      panelClass: 'custom-dialog'
    }).afterClosed()
    .subscribe((value: boolean) => {
      if(value){
        db.deleteWorkorders([workorder]);
        this.homeService.workOrderRemoved$.next();
        this.dialog.open(PromptInfoComponent, {
          width: '350px',
          data: {title: 'Removed', content: 'Inspection has been removed from your device.', showOkButton: true},
          panelClass: 'custom-dialog'
        })
      }
    })
  }

  async uploadWO(workorder: WorkOrderList){
    let uploadFailure = "";
    let woUploaded = "";
    let woUploadedMessage = "";
    this.translate.get(['inspection.uploadFailure', 'inspection.upload', 'inspection.woUploadedMessage'], { code: workorder.code }).subscribe(values => {
      uploadFailure = values['inspection.uploadFailure'];
      woUploaded = values['inspection.upload'];
      woUploadedMessage = values['inspection.woUploadedMessage'];
    });
    let dialogRef = null;
    await this.syncService.uploadWorkorder(workorder, false).then(
      async () => {
        dialogRef = this.dialog
          .open(PromptInfoComponent, {
            width: '350px',
            data: {
            title: woUploaded,
            content: woUploadedMessage,
            showOkButton: true
            },
            panelClass: 'custom-dialog'
          });
      },
      error  => {
        dialogRef = this.dialog
        .open(PromptInfoComponent, {
          width: '350px',
          data: {
            title: uploadFailure,
            content: error["message"]
              ? error["message"]
              : JSON.stringify(error),
              showOkButton: true
            },
            panelClass: 'custom-dialog'
          });
      }
    );

    dialogRef.afterClosed().subscribe((res) => {
       this.syncService.workOrderListUpdated.next(true);
    });
  }

  async reopenCompleted(workorder: WorkOrderList) {

    workorder.aiInternalStatus = 1;
    await db.workOrderList.update(workorder.id,{
      aiInternalStatus: 1,
    });
    this.router.navigate(['/inspection', workorder.id]);
    // this.workOrderAPIService.startInspection(workorder.id).subscribe((response) => {
    //   console.log("Start Inspection response is " + JSON.stringify(response));
    // });
  }

  async reopenSubmitted(workorder: WorkOrderList) {
    let networkStatus = await this.sharedService.checkOfflineAndAlert('home.offlineReopenInspections');
    if(networkStatus) //device is online status
    {
      workorder.aiInternalStatus = 1;
      await db.workOrderList.update(workorder.id,{
      aiInternalStatus: 1,
      });
      this.router.navigate(['/inspection', workorder.id]);
      this.workOrderAPIService.startInspection(workorder.id).subscribe((response) => {
        console.log("Start Inspection response is " + JSON.stringify(response));
      });
    }
  }
  async openPDF(workorder: WorkOrderList) {
    await this.sharedService.previewPDF(workorder, false);
  }
}
