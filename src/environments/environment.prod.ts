export const ENV = {


  appInsights: {
    connectionString: 'InstrumentationKey=8483102b-cee4-480c-a4b4-ec5eae20b257;IngestionEndpoint=https://southcentralus-0.in.applicationinsights.azure.com/;LiveEndpoint=https://southcentralus.livediagnostics.monitor.azure.com/;ApplicationId=34a3471c-0b62-4136-852f-e6c24e50b829'
  },

  // enable version updater
  versioningEnabled: true,

  // external urls
  BaseAPI: "https://mobileinspections-api.azure.chevron.com/api/",
  documents_api: "https://mobileinspections-api.azure.chevron.com/api/inspection-workorder",
  webUrl: "https://inspections.chevron.com",

  // environment definition
  shortName: "Prod",
  faviconHref: "assets/icons/icon-prod.png",

  // mobile WO deep links
  cmmsScheme: "x-msauth-com-chevron-fwe-mobilecmms://",
  cmmsBundle: "com.chevron.fwe.mobilecmms",
  
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
