import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, lastValueFrom } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';


@Injectable({
  providedIn: 'root'
})
export class LoadingIndicatorService {
  constructor(
    private translate: TranslateService
  ) {}
  private statusSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public status$: Observable<boolean> = this.statusSubject$.asObservable();
  public message: string = '';
  private shown: boolean = false;

  public show(): void {
    this.message = ''; // msg default blank
    this.shown = true;
    this.statusSubject$.next(true);
  }

  public hide(): void {
    this.shown = false
    this.statusSubject$.next(false);
    this.message = '';
  }

  public setMsg(msg: string): boolean {
    if (this.shown)
      this.message = msg;
    
    this._logMsg(msg);
    return this.shown;
  }

  
  public async setMsgTranslated(translationKey: string): Promise<boolean> {
    let ans = await lastValueFrom(this.translate.get(translationKey));
    return this.setMsg(ans)
  }
  // will show a translated msg & counter, expecting i <= total
  public async setCountMsgTranslated(translationKey: string, i: number, total:number) {
    let ans = await lastValueFrom(this.translate.get(translationKey));
    return this.setMsg(`${ans} \n ${((i/total)*100).toFixed(0)}% (${i}/${total})`);
  }


  private _logMsg(msg:string) {
    let isShown = this.shown;
    let log = {msg,isShown}

    
  }
}