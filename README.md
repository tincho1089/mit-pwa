# MIT PWA (mobile inspection tool - progressive web app)

This is an offline-first angular application made possible through [PWA tech](https://web.dev/explore/progressive-web-apps) & [IndexedDB](https://web.dev/articles/indexeddb). This application is installable on all platforms that utilize a [Chromium](https://www.chromium.org/Home/) or [Webkit](https://webkit.org/) based browser.


This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.2.

## Insallation Steps

- Install node js v~17
- cd into project directory
- `npm install`

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

To serve into other environments:

- `ng serve --configuration=local` configuration opts: `dev test prod local`

## Service Worker config

All deployed environments are using the serviceworker in [./ngnw-config.json)(/ngsw-config.json). When running locally, a dummy service worker is initialized that does nothing.
This application is offline first, so our goal is to ensure all assets are cached by the serviceworker cache (and not the browser cache). 

## Database config

This app uses IndexedDB wrapped around DexieJS. The schema is nested, and almost everything is stored in the `workOrderList` table. Most of our db operations are stored in our (less than exemplary) [./src/databases/db.ts](/src/databases/db.ts) file.

## Versioning

We have 2 version numbers that should be directly correlated with one another. We have an app version, and a SW version. The app version is generated on build and is essentially the build date- stored in the footer of the site. We use the app version to validate that the user is on the latest version with a simple glance of the footer (this works well since the version is literally the build date). The service worker version is also generated on build and is essentially an epoch. The application has an update service that will poll for the service worker version, and will prompt the user to update once a new service worker version is live. All version management is handled in the following file: [.\src\app\core\services\check-version-update.service.ts](src\app\core\services\check-version-update.service.ts).


## Translations

To create a new translation, navigate to [.\src\assets\i18n\en.json](src\assets\i18n\en.json) and add a new keyvalue pair to either an existing or new sub-object.

Adding in the code can be handled several ways:

### Adding in html

Simply use jinja templating syntax like this:
`{{ 'sub-object.newKey' | translate }}`

### Adding in JS

The component must first import the translation service, and define it within the compoent's constructor. Once defined, the component class can reference translations like this

```js
var t = await lastValueFrom(this.translate.get(['inspection.reset','inspection.resetDesc']));

// then referencing
t['inspection.reset']

```

### Translating to other languages

You can execute the auto-translate script by running [.\scripts\sync-translations.ps1](scripts\sync-translations.ps1). This script will leverage the azure translation API to translate into the other desired languages.
**PRO TIP**: if you have execution policy issues, run this: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Adding new languages

To add a new language, figure out the language code you want to translate to here [MS - Language Support](https://learn.microsoft.com/en-us/azure/ai-services/translator/language-support#translation). Once you find the language you want to translate to, add the language code to this file: [.\src\assets\i18n\auto-translate.py](src\assets\i18n\auto-translate.py). Specifically, the global variable `DEST_LANGS`.

After completing that step, run the auto-translate script mentioned above, and a new json file should be created named `<languageCode>.json`. Then you need to add your new language to the translations array here: [.\src\app\core\components\header\header.component.ts](src\app\core\components\header\header.component.ts) (please retain the alphabetical order).

Finally, add the language code to the constructor of: [.\src\app\app.component.ts](src\app\app.component.ts). Your new language should now be visualized in the app.

### Changing existing translations

If you have a keyvalue pair that needs to have an updated version of the english translation, you will need to update the english key/value pair, then delete the existing pair from all other language json files. The easiest way to do this is by using a regex search on the project: `"confirmDelete": ".*`


## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.