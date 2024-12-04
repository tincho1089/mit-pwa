import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpBackend, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { IPublicClientApplication, PublicClientApplication, InteractionType, LogLevel } from "@azure/msal-browser";
import { MsalGuard, MsalInterceptor, MsalInterceptorConfiguration, MsalModule, MsalGuardConfiguration, MsalRedirectComponent } from "@azure/msal-angular";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ENV } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { AuthenticationInterceptor } from './core/interceptors/authentication.interceptor';
import { msalConfig, protectedResources } from './auth-config';
import { CoreModule } from './core/core.module';
import { ServiceModule } from './core/services/services.module';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { SharedModule } from './shared/shared.module';
import { HomeService } from './pages/home/services/home.service';
import { ApplicationinsightsAngularpluginErrorService } from '@microsoft/applicationinsights-angularplugin-js';
import { OnlineSearchFilterService } from './pages/home/services/online-search-filter.service';
import { AppDB } from 'src/databases/db';


const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1;

export function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(message);
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [ENV.appRegistryB2C.clientId, 'openid']
    }
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
      [protectedResources.mobileInspectionsApi.endpoint, protectedResources.mobileInspectionsApi.scopes]
    ])
  };
}

@NgModule({ declarations: [
        AppComponent
    ],
    bootstrap: [AppComponent, MsalRedirectComponent], imports: [CoreModule,
        SharedModule,
        BrowserModule,
        AppRoutingModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpBackend]
            }
        }),
        ServiceModule,
        FormsModule,
        MsalModule.forRoot(MSALInstanceFactory(), MSALGuardConfigFactory(), MSALInterceptorConfigFactory()),
        BrowserAnimationsModule], providers: [
        MsalGuard,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: AuthenticationInterceptor,
            multi: true
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        },
        {
            provide: ErrorHandler,
            useClass: ApplicationinsightsAngularpluginErrorService
        },
        HomeService,
        OnlineSearchFilterService,
        provideHttpClient(withInterceptorsFromDi()),
        AppDB
    ] })

export class AppModule { }

export function createTranslateLoader(handler: HttpBackend) {
  const http = new HttpClient(handler);
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
