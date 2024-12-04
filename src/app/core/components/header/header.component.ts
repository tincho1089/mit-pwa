import { Component, OnInit } from '@angular/core';
import { SyncService } from 'src/app/core/services/sync/sync.service';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { Subject, lastValueFrom } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { InspectionDetailsService } from 'src/app/pages/inspection/services/inspection-details.service';
import { ENV } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { DeleteInspectionComponent } from '../delete-inspection/delete-inspection.component';
import { SharedService } from '../../services/shared.service';
import { SettingsService } from '../../services/app-settings.service';
import { TranslateService } from '@ngx-translate/core';
import { HomeService } from 'src/app/pages/home/services/home.service';
import { db } from 'src/databases/db';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  private readonly _destroying$ = new Subject<void>();
  public isOnlineSearch: boolean = false;
  public isLoggedIn: boolean = false;
  public hideHomePageIcons: boolean = false;
  public environment: string = '';
  public userFullName: string = '';
  public translations: Array<any> = [
    ['lzh', 'Chinese'],
    ['nl', 'Dutch'],
    ['en', 'English'],
    ['fr', 'French'],
    [ 'kk', 'Kazakh'],
    ['ru', 'Russian'],
    ['es', 'Spanish'],
    ['vi', 'Vietnamese'],
    ['de','German'],
    
  ]

  constructor(
    private syncSrv: SyncService,
    private homeService: HomeService,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private inspectionDetailsService: InspectionDetailsService,
    public settingsService: SettingsService, 
    private dialog: MatDialog,
    private sharedService: SharedService,
    public translateService: TranslateService
  ) {}

  ngOnInit(): void {
    this.environment = ENV.shortName;
    this.msalBroadcastService.inProgress$
      .pipe(
        filter(
          (status: InteractionStatus) => status === InteractionStatus.None
        ),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        this.setLoginDisplay();
        this.sharedService.promptUserLoginExpiry(15);
      });

    this.inspectionDetailsService.onShowHomeIcon().subscribe((opening) => {
      if (opening) {
        this.hideHomePageIcons = opening;
      } else {
        this.hideHomePageIcons = false;
      }
    });
    this.userFullName = this.settingsService.getUser().FullName;

    this.isOnlineSearch = this.settingsService.getUser().OnlineSearchEnabled;

    // getting the user for the first time
    this.homeService.userInformationComplete.subscribe((success: boolean) => {
      this.isOnlineSearch = this.settingsService.getUser().OnlineSearchEnabled;
    });
  }

  setLoginDisplay() {
    this.isLoggedIn = this.authService.instance.getAllAccounts().length > 0;
  }

  openFeedbackForm() {
    window.open('https://go.chevron.com/inspections-support','_blank');
  }

  async initiateSync() {
    let networkStatus = await this.sharedService.checkOfflineAndAlert('home.offlineSync');

    if(networkStatus)
    {
      this.syncSrv.initiateSync();
    }
  }

  async logout(){
      let message = await lastValueFrom(this.translateService.get(
        [
          'filters.confirmLogout',
          'filters.confirmLogoutMessage',
          'filters.confirmLogoutMessageNoClearData'
        ]
      ));
      const dialogRef = this.dialog.open(PromptInfoComponent, {
        width: '350px',
        data: {
          showYesButton: true,
          showNoButton: true,
          title: message['filters.confirmLogout'],
          content: this.settingsService.get('wipeDataOnLogout') ? message['filters.confirmLogoutMessage'] : message['filters.confirmLogoutMessageNoClearData'],
        },
        panelClass: 'custom-dialog',
      });
      dialogRef.afterClosed().subscribe( async (result) => {
        if (result) {
          localStorage.clear();
          if(this.settingsService.get('wipeDataOnLogout'))
          {
            db.clearDataFromTables();
          } else {
            await this.deleteUnassignedWOs();
          }

          let userEmail = this.settingsService.getUser()?.Email;
          if(userEmail)
          {
            localStorage.setItem("lastKnownUser", userEmail);
          }

          this.sharedService.logout();
        }
      });
  }

  open(homeIcon) {
    homeIcon.open();
  }

  close(homeIcon) {
    homeIcon.close();
  }

  setLanguage(lang: string) {
    this.settingsService.set('language',lang);
    this.translateService.use(lang);
  }

  setIsCompressImage(value) {
    this.invertToggle('isCompressImage', value);
  }

  setWipeDataOnLogout(value) {
    this.invertToggle('wipeDataOnLogout', value);
  }

  invertToggle(setting, value)
  {
    // if true then set to false, else if false (or empty) then set to true
    if(value)
    this.settingsService.set(setting, false);
    else{ 
      this.settingsService.set(setting, true);
    }
  }

  openDeletePanel()
  {
    this.dialog.open(DeleteInspectionComponent, {
      width: '700px',
      height: '500px',
      data: {title: 'Delete Inspections', content: '', showOkButton: true},
      panelClass: 'custom-dialog'
  })
  }

  async deleteUnassignedWOs(){
    let unassignedWos = await db.getWorkOrderIDsByStatus([99,100])
    if(unassignedWos.length > 0)
      await db.deleteWorkorderIds(unassignedWos)
  }
}
