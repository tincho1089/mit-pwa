import { ApplicationRef, Injectable, NgZone } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PromptInfoComponent } from '../components/promptInfo/promptInfo.component';
import { Subscription, interval } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from './app-settings.service';

@Injectable({ providedIn: 'root' })
export class CheckVersionUpdateService {
  constructor(
    private dialog: MatDialog,
    private zone: NgZone,
    private translate: TranslateService,
    private settings: SettingsService
  ) { }
  currentTimeStampValue = 0;
  versionChecksubscription: Subscription;
  ngswPath: string = `${location.protocol}//${location.host}/ngsw.json`;

  async checkForVersionUpdates() {

    let timestamp = await this.getCurrentSWTimeStamp();
    this.currentTimeStampValue = timestamp;

    //Checks every 1 minutes and unsubscribe after first alert to user
    const checkAppVersionTimer$ = interval(60 * 1000);
    this.versionChecksubscription = checkAppVersionTimer$.subscribe(
      () => {
        this.checkSWVersionUpdatesAndPrompt();
      }
    );

  }

  showPrompt() {
    let title = '';
    let content = '';
    this.translate.get(['version.newVersionTitle','version.newVersionDesc']).subscribe((values) => {
      title = values['version.newVersionTitle'];
      content = values['version.newVersionDesc'];
    })
    this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: {
        title,
        content,
        showCancelButton: true,
        showReloadButton: true,
      },
      panelClass: 'custom-dialog',
    });
  }

  private async unregisterServiceWorkers() {
    let registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      console.log(`[UpdateService] Service Worker: '${registration.scope}' unregistered`);
      await registration.unregister();
    }
  }
  public async getCaches() {
    return await caches.keys();
  }
  

  public async getCurrentSWTimeStamp() {
    
    let version: number = this.settings.get('sw-version');
    let updateSW: boolean = this.settings.get('sw-update');
    try {
      if (!version || updateSW) {
        // will happen in following scenarios:
        //  - Just upgraded
        //  - First time opened
        //  - cleared appcache
        // this will not cause update prompt, b/c the IDEAL STATE is if this isnt cached,
        // there wasnt a existing installed SW 
        let newVersion = (await (await fetch(this.ngswPath)).json())?.timestamp;
        
        console.log(`[UpdateService] SW version upgraded: ${version} > ${newVersion}`);
        version = newVersion;
        this.settings.set('sw-version',version);
        this.settings.set('sw-update',false);
      }
      
      console.log(`[UpdateService] Current SW version: ${version}`);
    } catch(e) {
      console.error('[UpdateService] Unable to fetch the SW');
      console.error(e);
    }
    
    return version;
  }

  private cancelVersionCheck() {
    try {
      this.versionChecksubscription.unsubscribe();
    } catch {
      console.warn('[UpdateService] Unsubscribe from version check failed.')
    }
    
  }

  public async checkSWVersionUpdatesAndPrompt() {
    let intDate = +new Date();
    let serverTimeStampValue = 0;

    let serverUrl = `${this.ngswPath}?ngsw-cachebust=${Math.random() * intDate}`

    if (!this.currentTimeStampValue) {
      console.info('[UpdateService] No SW timestamp discovered. Disabling version check.');
      this.cancelVersionCheck();
      return;
    }

    try {
      await fetch(serverUrl)
        .then((res) => res.json())
        .then((json) => {
          serverTimeStampValue = json.timestamp;
          if (this.currentTimeStampValue != serverTimeStampValue) {
            this.initializeUpgrade();
          }
          else
            console.log('pulled timestamp from ngsw.json is the same as  the current time stamp value: ' + this.currentTimeStampValue);
        });
    } catch(e) {
      console.error('[UpdateService] Failed to check for updates: \n', e);
    }
    
  }

  private async deleteCaches() {
    let names = await caches.keys();
    for (let name of names) {
      caches.delete(name);
    }
  }

  public async initializeUpgrade() {
    console.log('[UpdateService] A new appversion found!');
    await this.unregisterServiceWorkers();
    // used to delete SW caches here
    this.zone.run(async () => {
      this.cancelVersionCheck();
      this.showPrompt();
    });
  }

  public async finalizeUpgrade() {
    // this needs to be run to stop the upgrade prompt from showing every
    // time the app is loaded (assuming SW was updated)

    // clear sw version and allow next load to pull latest
    this.settings.set('sw-update',true);
    await this.deleteCaches();
    
  }
}
