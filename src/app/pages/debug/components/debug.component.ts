import { Component, OnInit } from "@angular/core";
import { DeviceInfoService } from 'src/app/core/services/device-info.service';
import { LoadingIndicatorService } from "src/app/core/services/loading-indicator.service";
import { PromptInfoComponent } from "src/app/core/components/promptInfo/promptInfo.component";
import { SharedService } from "src/app/core/services/shared.service";
import { ErrorDialogService } from "src/app/core/services/error.service";
import { MatDialog } from "@angular/material/dialog";
import { db } from 'src/databases/db';
import { WorkOrderList } from "src/app/core/sync/entities";
import { SettingsService } from "src/app/core/services/app-settings.service";
import { CheckVersionUpdateService } from "src/app/core/services/check-version-update.service";
import { WorkOrderAPIService } from "src/app/core/services/api/workorder-api.service";
import { TranslateService } from "@ngx-translate/core";
import { MIUtilities } from "src/app/shared/utility";
import { lastValueFrom } from "rxjs";

@Component({
    selector: 'app-debug',
    templateUrl: './debug.component.html',
    styleUrls: ['./debug.component.scss'],
})
export class DebugComponent implements OnInit {
    OS: string = "";
    browser: string = "";
    version: string = "";
    isPWA: boolean;
    isOnlineSearch: boolean;
    swState: string = "";
    lat: string = "-";
    lng: string = "-";
    storageQuota: string = "";
    storageUsage: string = "";
    cacheNames: Array<string> = [];
    totalCacheSize: string = '';
    isDebug: boolean = false;

    constructor(
        private deviceInfoService: DeviceInfoService,
        private loadingIndicatorService: LoadingIndicatorService,
        private errorDialogService: ErrorDialogService,
        public dialog: MatDialog,
        private settingsService: SettingsService,
        private sharedservice: SharedService,
        private updateService: CheckVersionUpdateService,
        private workOrderAPIService: WorkOrderAPIService,
        private translate: TranslateService
    ){}

    async ngOnInit() {
        this.OS = this.deviceInfoService.getOS();
        this.browser = this.deviceInfoService.getBrowser();
        this.version = require("../../../../../package.json").version;
        this.isPWA = this.deviceInfoService.isPWA();
        this.swState = this.deviceInfoService.getServiceWorkerStatus();
        this.fetchOnlineSearchState();
        this.getEstimatedQuota();
        this.updateDebugMode();
        await this.getCaches();
    }

    public logout() {
        localStorage.clear();
       this.sharedservice.logout()
    }

    public fetchOnlineSearchState() {
        this.isOnlineSearch = this.settingsService.getUser()?.OnlineSearchEnabled;
    }

    public toggleOnlineSearch() {
        let usr = this.settingsService.get('user');
        usr.OnlineSearchEnabled = !usr.OnlineSearchEnabled;
        this.settingsService.set('user',usr);
        this.fetchOnlineSearchState();

        this.dialog.open(PromptInfoComponent, {
            width: '350px',
            data: {
                title: 'debug.configurationChange',
                content: 'debug.serversideSettingWarn',
                showOkButton: true,
            },
            panelClass: 'custom-dialog'
        });
    }

    public async wipeDB() {
        this.loadingIndicatorService.show();
        try{
            await db.clearDataFromTables().then( () => {
                this.dialog.open(PromptInfoComponent, {
                    width: '350px',
                    data: {title: 'debug.alert', content: 'debug.dbCleared', showOkButton: true},
                    panelClass: 'custom-dialog'
                })
            })
        }
        catch (error){
            this.errorDialogService.openDialog('debug.debugClearFailure', error.message);
        }
        this.loadingIndicatorService.hide();
    }

    public async reopenSubmittedInspections() {
      let networkStatus = await this.sharedservice.checkOfflineAndAlert('home.offlineReopenInspections'); //check if device is online status
      if(networkStatus) //device is online status
      {
        let t = await lastValueFrom(this.translate.get(['debug.reopenInspectionWarn','debug.reopenInspectionWarn2']))
        let confirmDialogRef = this.dialog.open(PromptInfoComponent, {
          width: '350px',
          data: { title: t['debug.reopenInspectionWarn'],
          content: t['debug.reopenInspectionWarn2'],
          showYesButton: true, showNoButton: true },
          panelClass: 'custom-dialog'
        });

        confirmDialogRef.afterClosed().subscribe(async (res) => {
          if(res)
          {
            this.loadingIndicatorService.show();
            let failedToReopen: string[] = [];
            let completedIds = await db.getWorkOrderIDsByStatus([99]); //get inspection IDs with status submitted (99)
            await Promise.all(completedIds.map(async WO => {
                try {
                  const response = await lastValueFrom(this.workOrderAPIService.startInspection(WO));
                  console.log("Start Inspection response is " + JSON.stringify(response));
                  const msg = MIUtilities.getRespValidationResult(response);
                  if (MIUtilities.isNullOrUndefined(msg) || msg.length === 0) {
                    await db.workOrderList.update(WO,{
                    aiInternalStatus: 2, //move to completed status
                    });
                    await db.setInspectionUpdated(WO);
                  }
                  else {
                    failedToReopen.push("WO#" + (await db.workOrderList.get(WO)).code);
                  }
                }
                catch (error){
                  this.errorDialogService.openDialog('debug.reopenSubmittedFailure', error.message)
                }
                }));
            if(failedToReopen.length > 0)
              {
                let reopenSubmittedFailure = "";
                this.translate.get(['debug.reopenSubmittedFailure']).subscribe(values => {
                  reopenSubmittedFailure = values['debug.reopenSubmittedFailure'];
                });
                this.dialog.open(PromptInfoComponent, {
                  width: '350px',
                  data: {title: 'debug.alert', content: reopenSubmittedFailure.replace('{{failedToReopen}}', failedToReopen.join(', ')), showOkButton: true},
                  panelClass: 'custom-dialog'
              });
              }
              else //none failed, show success dialog
              {
                let submittedReopened = "";
                this.translate.get(['debug.submittedReopened']).subscribe(values => {
                    submittedReopened = values['debug.submittedReopened'];
                  });
                this.dialog.open(PromptInfoComponent, {
                    width: '350px',
                    data: {title: 'debug.alert', content: submittedReopened.replace('{{affectedNumber}}', completedIds.length.toString()), showOkButton: true},
                    panelClass: 'custom-dialog'
                });
              }
            this.loadingIndicatorService.hide();
          }
        });
      }
    }

    public updateDebugMode() {
        this.isDebug = this.settingsService.get('debugMode')?
            true:
            false;
    }
    public toggleDebugMode() {
        this.settingsService.set('debugMode',!this.isDebug);
        this.updateDebugMode();
    }

    public forceUpdate() {
        this.updateService.initializeUpgrade();
    }

    public getLocation(): void {
        // Check if geolocation is supported by the browser
        if ("geolocation" in navigator) {
            // Prompt user for permission to access their location
            navigator.geolocation.getCurrentPosition(
                // Success callback function
                (position) => {
                    // Get the user's latitude and longitude coordinates
                    this.lat = position.coords.latitude.toFixed(2).toString();
                    this.lng = position.coords.longitude.toFixed(2).toString();
                },
                // Error callback function
                (error) => {
                    // Handle errors, e.g. user denied location sharing permissions
                    this.lat = "unknown";
                    this.lng = "unknown";
                }
            );
        } else {
            // Geolocation is not supported by the browser
            console.error("Geolocation is not supported by this browser.");
        }
    }

    public async getEstimatedQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimation = await navigator.storage.estimate();
            this.storageQuota = this.convertBytes(estimation.quota)
            this.storageUsage = this.convertBytes(estimation.usage)
        } else {
            console.error("StorageManager not found");
        }
    }

    //converts bytes into an appropriate unit of measure
    private convertBytes(bytes: number): string {
        if (bytes >= 1073741824) {
          // Convert to gigabytes
          const gigabytes = (bytes / 1073741824).toFixed(2);
          return `${gigabytes} GB`;
        } else if (bytes >= 1048576) {
          // Convert to megabytes
          const megabytes = (bytes / 1048576).toFixed(2);
          return `${megabytes} MB`;
        } else if (bytes >= 1024) {
          // Convert to kilobytes
          const kilobytes = (bytes / 1024).toFixed(2);
          return `${kilobytes} KB`;
        } else {
          return `${bytes} bytes`;
        }
      }

      public importInspection(file) {

        const rawFile = file.target.files[0];
        let fileReader = new FileReader();
        fileReader.onload = () => {
            const jsonObj = JSON.parse(String(fileReader.result))
            let inspection = jsonObj as WorkOrderList;
            inspection.isImported = true;
            db.insertRecordsInBatch([inspection],1);
            this.dialog.open(PromptInfoComponent, {
                width: '350px',
                data: {
                    title: 'Inspection Imported',
                    content: `Inspection: "${inspection.code}" has been added to the app`,
                    showOkButton: true
                },
                panelClass: 'custom-dialog'
            });
        }
        fileReader.readAsText(rawFile);
      }

      public unregisterServiceWorkers() {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for(let registration of registrations) {
                registration.unregister();
            }
        });
        this.showOperationSuccess();
      }

      public deleteCaches() {
        for (let cache of this.cacheNames) {
            caches.delete(cache);
        }
        this.getCaches();
        this.showOperationSuccess();
      }

      async getCaches() {
        this.cacheNames = await caches.keys();
        this.totalCacheSize = await this.cachesSize();
      }
      private cacheSize(c) {
        return c.keys().then(a => {
          return Promise.all(
            a.map(req => c.match(req).then(res => res.clone().blob().then(b => b.size)))
          ).then(a => a.reduce((acc, n) => acc + n, 0));
        });
      }
      private async cachesSize() {
        let total: number = 0;

        for (let c of this.cacheNames) {
            let cache = await caches.open(c);
             total += await this.cacheSize(cache)
        }

        return this.convertBytes(total);
      }




      public async showCaches() {
        let buffer = '<table>';
        buffer += '<tr><th>Cache Name</th><th>Cache Size</th></tr>';
        for (let cache of this.cacheNames) {
            let size = this.convertBytes(
                await this.cacheSize(
                    await caches.open(cache)
                )
            );
            buffer += `<tr><td>${cache}</td><td>${size}</tr>`;
        }
        buffer += '</table>';
        this.dialog.open(PromptInfoComponent, {
            data: {
                title: 'Caches',
                formattedContent: buffer,
                showOkButton: true
            },
            panelClass: 'custom-dialog'
        });
      }
      public showOperationSuccess() {
        this.dialog.open(PromptInfoComponent, {
            width: '350px',
            data: {
                title: 'debug.success',
                content: 'debug.operationSuccess',
                showOkButton: true,
            },
            panelClass: 'custom-dialog'
        });
      }

}
