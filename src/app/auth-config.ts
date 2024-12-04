import { LogLevel, Configuration, BrowserCacheLocation } from '@azure/msal-browser';
import { ENV } from '../environments/environment';

const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1;

export function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(message);
}

export const msalConfig: Configuration = {
    auth: {
        clientId: ENV.appRegistryB2C.clientId,
        authority: ENV.appRegistryB2C.authorities.signUpSignIn.authority,
        knownAuthorities: ENV.appRegistryB2C.knownAuthorities,
        redirectUri: ENV.appRegistryB2C.redirectUri, 
        postLogoutRedirectUri: ENV.appRegistryB2C.postLogoutRedirectUri
    },
    cache: {
        cacheLocation: BrowserCacheLocation.LocalStorage,
        storeAuthStateInCookie: isIE, 
    },
    system: {
        loggerOptions: {
          loggerCallback,
          logLevel: LogLevel.Error,
          piiLoggingEnabled: true
        }
    }
}

export const protectedResources = {
    mobileInspectionsApi: {
        endpoint: ENV.BaseAPI,
        scopes: [ENV.appRegistryB2C.clientId],
    },
}
export const loginRequest = {
 scopes: []
};