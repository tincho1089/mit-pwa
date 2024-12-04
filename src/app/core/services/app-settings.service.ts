import { Injectable } from '@angular/core';
import { User } from '../sync/entities';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private _key = 'app-settings';
  private _settings = null;


  public get(key: string): any {
    const settings = this.getAll();
    return settings[key];
  }

  public set(key: string, val: any) {
    const settings = this.getAll();
    settings[key] = val;
    this._settings = settings;
    this._save();
  }

  public getAll() {
    if (this._settings == null)
      this._fetch();
    return this._settings;
  }

  public getUser(): User {
    const usrRaw = this.get('user');
    let user = new User(usrRaw);
    return user;
  }

  private _fetch() {
    // ideally this only gets run once, we dont want this running
    // every time a get() is executed
    console.log('[UserSettings] Fetching from localstorage')
    let settingsRaw = localStorage.getItem(this._key);
    try {
      this._settings = JSON.parse(settingsRaw) || {};
    } catch {
      console.warn('[UserSettings] Parsed invalid json from localstorage, clearing');
      this._settings = {};
      this._save();
    }

  }
  private _save() {
    let settingsRaw = JSON.stringify(this._settings);
    localStorage.setItem(this._key,settingsRaw);
  }

}
