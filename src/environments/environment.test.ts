export const ENV = {
    // app insights
  appInsights: {
      connectionString: 'InstrumentationKey=b0fc0ce9-f000-4a83-b2a1-8334d1d9905c;IngestionEndpoint=https://southcentralus-0.in.applicationinsights.azure.com/;LiveEndpoint=https://southcentralus.livediagnostics.monitor.azure.com/;ApplicationId=45a583c9-53fa-4d98-bb30-f1a9da4adcc0'
    },

  // enable version updater
  versioningEnabled: true,

  // external urls
  BaseAPI: "https://mobileinspections-api-test-cvx.azurewebsites.net/api/",
  documents_api: "https://mobileinspections-api-test-cvx.azurewebsites.net/api/inspection-workorder",
  webUrl: "https://mobileinspections-test-cvx.azurewebsites.net",

  // environment definition
  shortName: "Test",
  faviconHref: "assets/icons/icon-test.png",

  // mobile WO deep links
  cmmsScheme: "x-msauth-com-chevron-fwe-mobilecmms-dev://",
  cmmsBundle: "com.chevron.fwe.mobilecmms.dev",

  // MSAL config
  appRegistryB2C: {
    clientId: 'a92f1cf4-bb4e-4940-9cfd-c2719235c4aa',
    redirectUri: '/',
    postLogoutRedirectUri: '/',
    names: {
      signUpSignIn: 'B2C_1_v1_signupandsignin_fwe'
    },
    authorities: {
      signUpSignIn: {
        authority: 'https://chevronb2c.b2clogin.com/chevronb2c.onmicrosoft.com/B2C_1_v1_signupandsignin_fwe'
      }
    },
    knownAuthorities: ['chevronb2c.b2clogin.com']
  },
};
