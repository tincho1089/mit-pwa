import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { MsalService,MsalBroadcastService, MSAL_INSTANCE, MSAL_GUARD_CONFIG } from '@azure/msal-angular';
import { msalConfig, protectedResources } from './auth-config';
import { UserAPIService } from './core/services/api/user-api.service';
import { TranslateService } from '@ngx-translate/core';
import { Title } from '@angular/platform-browser';
import { SyncService } from './core/services/sync/sync.service';
import { HomeService } from './pages/home/services/home.service';
import { SharedService } from './core/services/shared.service';
import { SettingsService } from './core/services/app-settings.service';
import { ErrorDialogService } from './core/services/error.service';
import { ApplicationInsightsService } from './core/services/applicationInsights.service';
import { HeaderComponent } from './core/components/header/header.component';


describe('AppComponent', () => {
  const mockMsalService = jasmine.createSpyObj('MsalService',['acquireTokenSilent'],['instance']);
  const mockMsalBroadcastService = jasmine.createSpyObj('MsalBroadcastService',[],['msalSubject$'])
  const mockMsalInstance = jasmine.createSpy('MSAL_INSTANCE')
  const mockUserAPI = jasmine.createSpyObj('userAPI',['getCurrentUser'])
  const mockTranslateService = jasmine.createSpyObj('translate',['addLangs','setDefaultLang','use'])
  const mockTitleService = jasmine.createSpyObj('titleService',['setTitle'])
  const mockSyncService= jasmine.createSpyObj('syncService',['initiateSync'])
  const mockHomeService = jasmine.createSpyObj('homeService',[],['userInformationComplete'])
  const mockSharedService = jasmine.createSpyObj('sharedService',['checkUpdates','checkNetworkStatus'],['updates'])
  const mockSettingsService = jasmine.createSpyObj('settingsService',['getUser','get','set'])
  const mockErrorDialogService = jasmine.createSpyObj('errorDialogService',['openDialog'])
  const mockApplicationInsightsService = jasmine.createSpyObj('appInsightService',['setUser'])
  let settingsService:SettingsService;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
      ],
      declarations: [
        AppComponent
      ],
      providers: [{ provide: MsalService, useValue: mockMsalService },
        {provide: MsalBroadcastService, useValue: mockMsalBroadcastService },
        {provide: UserAPIService, useValue: mockUserAPI},
        {provide: TranslateService, useValue: mockTranslateService},
        {provide: Title, useValue: mockTitleService},
        {provide: SyncService, useValue: mockSyncService},
        {provide: HomeService, useValue: mockHomeService},
        {provide: SharedService, useValue: mockSharedService},
        {provide: SettingsService, useValue: mockSettingsService},
        {provide: ErrorDialogService, useValue: mockErrorDialogService},
        {provide: ApplicationInsightsService, useValue: mockApplicationInsightsService}
      ],
      errorOnUnknownElements: false, // enable it as required
      errorOnUnknownProperties: false // enable it as required
    }).compileComponents();

    settingsService =  TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'mit-pwa'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('mit-pwa');
  });
  it(`setLanguage should call setting service`,() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.setLanguage();
    expect(settingsService.get).toHaveBeenCalled();
  })
});
