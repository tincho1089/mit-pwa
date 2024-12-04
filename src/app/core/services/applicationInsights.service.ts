import { Injectable } from '@angular/core';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { AngularPlugin } from '@microsoft/applicationinsights-angularplugin-js';
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js';
import { Router } from '@angular/router';
import { ENV } from 'src/environments/environment';


@Injectable({
    providedIn: 'root',
  })
  export class ApplicationInsightsService {
    private appInsights;

    constructor(
        private router: Router
    ){
        let angularPlugin = new AngularPlugin();
        let clickPluginInstance = new ClickAnalyticsPlugin();
        let clickPluginConfig = {
          autoCapture: true
        };
    
        this.appInsights = new ApplicationInsights({
          config: {
            connectionString: ENV.appInsights.connectionString,
            extensions: [<any>angularPlugin, clickPluginInstance],
            extensionConfig: {
              [angularPlugin.identifier]: { router: this.router },
              //*** Add the Click Analytics plug-in. ***
              [clickPluginInstance.identifier]: clickPluginConfig
          },
          
        }
          
        });

        this.appInsights.loadAppInsights();
    }

    logException(exception: Error, severityLevel?: number) {
        this.appInsights.trackException({ exception: exception, severityLevel: severityLevel});
    }

    setUser(email){
        this.appInsights.setAuthenticatedUserContext(email);
    }

    logEvent(name: string, properties?: { [key: string]: any }) {
        this.appInsights.trackEvent({ name: name}, properties);
      }
  } 