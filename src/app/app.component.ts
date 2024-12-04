import { Component, OnInit, Renderer2 } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType } from '@azure/msal-browser';
import { Observable, Subject } from 'rxjs';
import { User } from './core/sync/entities';
import { UserAPIService } from './core/services/api/user-api.service';
import { UserResponse } from './core/models/api/response/user-response.model';
import { GetConfigModel } from './core/models/api/response/get-config.model';
import { ENV } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { SyncService } from './core/services/sync/sync.service';
import { db } from 'src/databases/db';
import { HomeService } from './pages/home/services/home.service';
import { SharedService } from './core/services/shared.service';
import { SettingsService } from './core/services/app-settings.service';
import { ApplicationInsightsService } from './core/services/applicationInsights.service';
import { ErrorDialogService } from './core/services/error.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'mit-pwa';
  usrData$: Observable<User>;
  config = new GetConfigModel();

  constructor(
    private renderer: Renderer2,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private userAPI: UserAPIService,
    private translate: TranslateService,
    private titleService: Title,
    private syncService:SyncService,
    private homeService: HomeService,
    private sharedService:SharedService,
    public settingsService: SettingsService,
    public errorDialogService: ErrorDialogService,
    private appInsightService: ApplicationInsightsService 
  ) { 
    
    this.translate.addLangs(['en','es','fr','lzh','ru','vi','nl','kk'])
    this.translate.setDefaultLang('en');
    this.sharedService.checkUpdates();
  }

  ngOnInit(): void {
    this.titleService.setTitle('Field Inspections - ' + ENV.shortName)
    this.changeFavicon();
    this.checkLoginValid();
    let previousUser = localStorage.getItem("lastKnownUser");

    this.msalBroadcastService.msalSubject$
    .subscribe((event: EventMessage) => {
      if ( event.eventType === EventType.LOGIN_SUCCESS ) {
        // A successful login event has occurred
        this.saveUserInfo(this.homeService.userInformationCompleteOnLogin); // Call your getUser() function here
        let user = this.settingsService.getUser();
        this.appInsightService.setUser(user?.Email);

        db.isLocalDBEmpty().then((result:boolean) => {
          // need to wait for user information to be populated on login
          this.homeService.userInformationCompleteOnLogin.subscribe((success: boolean) => {
            this.homeService.userInformationComplete.next(true); // calling 2nd time this was originally done via this.safeUserInfo() method
            let user = this.settingsService.getUser();
            let isOnlineSearch:boolean = user.OnlineSearchEnabled;
            
            if(result && !isOnlineSearch) // if no data, and not online search-enabled, sync
            {
              this.syncService.initiateSync();
            }
            else if (!result) 
            {
              // if there is data, and not online search, get previous user, if current user is different from last logged-in user, clear data and sync this new user's data
              if (previousUser && previousUser != user?.Email)
              {
                // wipe db then sync if non-online search
                // if online search, just wipe db and dont sync
                db.clearDataFromTables().then( () => 
                {
                  if (!isOnlineSearch)
                  {
                    this.syncService.initiateSync();
                  }
                });
              }
            }
          });   
        }
        );
      }
    });

    let user = this.settingsService.getUser();
    this.appInsightService.setUser(user?.Email);

    // initialize settings:
    this.setLanguage();
    this.setIsCompressImage();
    this.setWipeDataOnLogout();
    this.setFilters();

    // fire up the lazy-loaded indexed db connection on startup
    // this.connectToIndexedDbOnFocus();

    // force check for updates on app launch on startup
    this.checkForUpdatesOnFocus();

    // handler to reconnect to indexed db for when the app goes to the foreground after being minimized
    this.addEventHandlersOnFocus(); // https://forums.developer.apple.com/forums/thread/681201
    
    // handler to reconnect on interval for when the app is active but idle
    // this.refreshIndexedDbConnectionOnInterval(); // https://bugs.webkit.org/show_bug.cgi?id=197050
  }

  refreshIndexedDbConnectionOnInterval() {
    // try to re-establish indexed db connection every 3 minutes
    setInterval(this.connectToIndexedDbOnFocus, 3 * 60 * 1000);
  }

  addEventHandlersOnFocus() {
    let wasPreviouslyHidden = false;
    
    document.addEventListener(
      "visibilitychange"
      , (event) => {
        event.stopPropagation(); 
        
        if (document.hidden) 
        { 
          wasPreviouslyHidden = true;
        }
        else if (wasPreviouslyHidden)
        {
          // connect to indexed db on demand on focus in
          // this.connectToIndexedDbOnFocus();

          // check for updates on demand on focus in
          this.checkForUpdatesOnFocus();
        }
      }
    )
  }

  connectToIndexedDbOnFocus()
  {
    try
    {
      let db = window.indexedDB;
      setTimeout(() => {
        try
        {
          let request = db.open('ngdexieliveQuery');
          request.onerror = function(event) {
            event.preventDefault();
            event.stopPropagation();
            throw new Error('Could not connect to indexed db on focus in. ' + request.error.message);
          };
          request.onsuccess = function(event) {
            console.log('connected to indexed db successfully on focus in');
          };
        }
        catch (e)
        {
          this.errorDialogService.openDialog("The connection to the Indexed Database was lost. Please refresh the application.", e.message);
        }
      }
      , 500);
    }
    catch (e) // if for whatever reason there was an exception with just accessing indexed DB
    {
      if (this.sharedService.checkNetworkStatus())
      {
        alert('There was an error when accessing Indexed Database. Refresh the app and try again.');
        window.location.href = window.location.href;
      }
    }
  }

  checkForUpdatesOnFocus()
  {
    setTimeout( () =>
    {
      console.log('checking for updates on focus in');
      this.sharedService.updates.checkSWVersionUpdatesAndPrompt();
    }, 500);
  }

  setLanguage() {
    const lang = this.settingsService.get('language') || 'en';
    this.translate.use(lang)
    this.settingsService.set('language',lang);
  }

  setIsCompressImage() {
    const compressImageToggle = this.settingsService.get('isCompressImage') ?? true; //default to "yes" compress images
    this.settingsService.set("isCompressImage", compressImageToggle);
  }

  setWipeDataOnLogout() {
    const wipeLocalDatabaseOnLogout = this.settingsService.get('wipeDataOnLogout') ?? false; //default to "no" 
    this.settingsService.set("wipeDataOnLogout", wipeLocalDatabaseOnLogout);
  }

  setFilters() {
    let filters = this.settingsService.get('filters') || {};
    this.settingsService.set('filters', filters);
  }

  //set favicon based on environment
  changeFavicon() {
    const linkElement = this.renderer.selectRootElement('link[rel="icon"]');
    if (linkElement) {
      this.renderer.setAttribute(linkElement, 'href', ENV.faviconHref);
    }
  }

  private checkLoginValid() {
    // added to satisy edge case where:
    // there's a valid login, but the settingsservice user context disappeared.
    let accountsMsal = this.authService.instance.getAllAccounts();
    let user = this.settingsService.getUser();

    if (accountsMsal && !user.ID) {
      this.saveUserInfo(this.homeService.userInformationComplete);
    }
    else if(user?.Email && (!localStorage.getItem("Email") || !localStorage.getItem("lastKnownUser"))) {
      localStorage.setItem("Email", user?.Email)
      localStorage.setItem("lastKnownUser", user?.Email);
    }

  }

  //fetch and store user
  private saveUserInfo(subject : Subject<boolean>) {
   this.userAPI.getCurrentUser().subscribe((user: UserResponse) => {
    this.settingsService.set('user',user);
    localStorage.setItem("Email",user?.Email);
    localStorage.setItem("lastKnownUser", user?.Email);

    subject.next(true);
    });
    let accounts = this.authService.instance.getAllAccounts();
    this.authService.instance.setActiveAccount(accounts[0])
  }
}
