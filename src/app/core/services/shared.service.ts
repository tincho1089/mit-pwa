import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import { SyncService } from 'src/app/core/services/sync/sync.service';
import { WorkOrderList } from 'src/app/core/sync/entities';
import { InspectionDetailsService } from 'src/app/pages/inspection/services/inspection-details.service';
import { ENV } from 'src/environments/environment';
import { MsalService } from '@azure/msal-angular';
import { CheckVersionUpdateService } from './check-version-update.service';
import { LoadingIndicatorService } from './loading-indicator.service';
import { ErrorDialogService } from './error.service';
import { DeviceInfoService } from './device-info.service';
import { Subject, Subscription, fromEvent, map, merge, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {

  networkStatus: boolean = false;
  zoomLevel: number = 1;
  networkStatus$: Subscription = Subscription.EMPTY;
  versionCheckStatus: Subject<boolean> = new Subject<boolean>();
  
  constructor(
    private inspectionDetailsService: InspectionDetailsService,
    private authService: MsalService,
    private translate: TranslateService,
    private syncSrv: SyncService,
    public dialog: MatDialog,
    public updates: CheckVersionUpdateService,
    public deviceInfoService : DeviceInfoService,
    public loadIndicatorSvc: LoadingIndicatorService,
    public errDialogSvc: ErrorDialogService
  ) {}

  getZoomLevel() {
    return this.zoomLevel;
  }

  setZoomLevel(zoomLevel: number) {
    this.zoomLevel = zoomLevel;
  }

  openLink(link: string) {
    window.open(link, '_blank');
  }
  scrollToTop() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  async previewPDF(
    workorder: WorkOrderList,
    uploadWorkorder: boolean
  ) {
    let offline = '';
    let subTitle = '';

    this.translate
      .get([
        'commons.offline',
        'home.offlinePreviewPdf',
      ])
      .subscribe(async (values) => 
        ( async () =>  {
            subTitle = values['home.offlinePreviewPdf'];
            offline = values['commons.offline'];

            if (!navigator.onLine) {
              // when offline
              this.dialog.open(PromptInfoComponent, {
                width: '350px',
                data: {
                  title: offline,
                  content: subTitle,
                  showOkButton: true,
                },
                panelClass: 'custom-dialog',
              });
            } else {
              if (uploadWorkorder) 
              {
                await this.syncSrv.uploadWorkorder(workorder);
                this.openPdf(workorder);
              } 
              else 
              {
                this.openPdf(workorder);
              }
            }
          })()
      
      );
  }

  private openPdf(workorder: WorkOrderList) {
    // Safari blocks any call to window.open() if it's made inside an async call.

    const windowReference = window.open();

    let url: string;
    if (this.isABU(workorder))
      url = `${ENV.webUrl}/Inspection/ABUReport/${workorder.code}`;
    else 
      url = `${ENV.webUrl}/Inspection/ReportByWOId/${workorder.id}`;
    
    windowReference.location = url;
  }

  private isABU(workorder: WorkOrderList): boolean {
    const bu: string = workorder.bu;
    return bu?.toLowerCase().startsWith('abu');
  }

  logout() {

    this.authService.logout();
  }

  checkUpdates() {
    if (ENV.versioningEnabled)
      this.updates.checkForVersionUpdates();
    else
      console.log('[SharedService] Environment file disabled versioning');
  }

  checkNetworkStatus():boolean {
    this.networkStatus = navigator.onLine;
    return this.networkStatus;
  }

  registerNetworkStatus() {
    this.networkStatus$ = merge(
      of(null),
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    )
      .pipe(map(() => navigator.onLine))
      .subscribe(status => {
        console.log('status', status);
        this.networkStatus = status;
      });
  }

  unsubscribeSubscriptions(){
    this.networkStatus$.unsubscribe();
  }

  async checkOfflineAndAlert(content:string){

    if (!this.checkNetworkStatus()) {

      let title = '';
      let subTitle = '';

      this.translate
        .get([
          'commons.offline',
          content,
        ])
        .subscribe((values) => {
          subTitle = values[content];
          title = values['commons.offline'];
        });

      this.dialog.open(PromptInfoComponent, {
        width: '350px',
        data: {
          title: title,
          content: subTitle,
          showOkButton: true,
        },
        panelClass: 'custom-dialog'
      });
      return false;
    }
    return true;

  }

  promptUserLoginExpiry(alertBeforeInMins:number)
  {
    let accountMSAL = this.authService.instance.getAllAccounts();
    if (accountMSAL) {
      const tokenExpiryinMs = accountMSAL[0].idTokenClaims.exp * 1000;
      const expiryDateTime = new Date(tokenExpiryinMs)
      const currentDateTime = new Date();
      let alertInTime: any;

      const currentTimeGapInMins = (expiryDateTime.getTime() - currentDateTime.getTime()) / 60000;
      // check if page is refreshed within after 15Mins of expiring window and alert at expiry
      alertInTime = (currentTimeGapInMins > alertBeforeInMins)
        ? (expiryDateTime.getTime() - alertBeforeInMins * 60 * 1000) - currentDateTime.getTime()
        : currentTimeGapInMins * 60 * 1000;

      let title = "";
      let content = "";
      this.translate
        .get([
          'commons.loginExpiration',
          'commons.loginExpirationRenew',
        ])
        .subscribe((values) => {
          title = values['commons.loginExpiration'];
          content = values['commons.loginExpirationRenew'];
        });


      //Only set alert if token is not expired
      if (alertInTime > 0) {
        console.log("Alert in minutes",alertInTime/60000);
        setTimeout(() => {
          if (this.checkNetworkStatus()) {
            this.dialog.open(PromptInfoComponent, {
              width: '350px',
              data: {
                title: title,
                content: content,
                showOkButton: true,
              },
              panelClass: 'custom-dialog'
            });

          };
        }, alertInTime)
      }
    }
  }
}
