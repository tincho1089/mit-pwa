import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceInfoService {

  constructor(){}

  public getOS(): string {
    const userAgent = window.navigator.userAgent;
    let os = 'Unknown operating system';
  
    if (/Win64|Win32|Windows/.test(userAgent)) {
      os = 'Windows';
    } else if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
      // iPadOS is now emulating MacOS when safari is in desktop mode
      // https://forums.developer.apple.com/forums/thread/119186?page=2
      if (navigator.maxTouchPoints > 2) { // iPad == 5
        os = 'iOS';
      } else { // MacOS (right now) == 0
        os = 'MacOS';
      }
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
      os = 'iOS';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (/Linux/.test(userAgent)) {
      os = 'Android'; //treat Linux like Android, for some android devices (like Samsung A9 tablet), they are being detected as Linux for some reason
    }
  
    return os;
  }

  public getBrowser(): string {
    const userAgent = window.navigator.userAgent;
    if (userAgent.indexOf('Firefox') !== -1) {
      return 'Mozilla Firefox';
    } else if (userAgent.indexOf('Chrome') !== -1 && userAgent.indexOf('Edge') === -1 && userAgent.indexOf('Edg') === -1) {
      return 'Google Chrome';
    } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
      return 'Apple Safari';
    } else if (userAgent.indexOf('Edg') !== -1 || userAgent.indexOf('Edge') !== -1) {
      return 'Microsoft Edge';
    } else if (userAgent.indexOf('Opera') !== -1 || userAgent.indexOf('OPR') !== -1) {
      return 'Opera';
    } else if (userAgent.indexOf('Trident') !== -1) {
      return 'Internet Explorer';
    } else {
      return 'Unknown browser';
    }
  }

  public isPWA(): boolean {
    // Check if the necessary APIs are available
    const hasServiceWorker = 'serviceWorker' in navigator;
    const hasManifest = 'getInstalledRelatedApps' in navigator;

    // Check if the app is running in a standalone mode (installed on the home screen)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Check if all PWA criteria are met
    const isPwa = hasServiceWorker && hasManifest && isStandalone;

    return isPwa;
  }

  public getServiceWorkerStatus(): string {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Service worker is registered and active
      return 'Service worker is registered and active';
    } else if ('serviceWorker' in navigator && navigator.serviceWorker.getRegistration() != null) {
      // Service worker is registered but not active
      return 'Service worker is registered but inactive';
    } else {
      // Service worker is not supported or not registered
      return 'Service worker not running';
    }
  }

}