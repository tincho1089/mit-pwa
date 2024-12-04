import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { enableProdMode } from '@angular/core';

platformBrowserDynamic().bootstrapModule(AppModule).then( () =>
{
  if ('serviceWorker' in navigator) {
    console.log('[core] Attempting ServiceWorker Registration');
    const host = location.hostname;
    if(!host.includes('localhost')){
      enableProdMode();
      navigator.serviceWorker
      .register('/ngsw-worker.js') // Path to the service worker file
      .then((registration) => {
        console.log('[core] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[core] Service Worker registration failed:', error);
        console.error(error);
      });
    }
    else{
      navigator.serviceWorker
      .register('/ngsw-worker-local.js') // Path to the service worker file
      .then((registration) => {
        console.log('[core] Local Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('[core] Local Service Worker registration failed:', error);
        console.error(error);
      });
    }
  }
})
  .catch(err => console.error(err));
