import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import {
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

@Component({
  selector: 'gps',
  templateUrl: 'gps.component.html',
  styleUrls: ['./gps.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GPSComponent
  extends BaseInspection
  implements QuestionTypesModel, OnInit
{
  @Input()
  showHelper: boolean = false;
  formGroup: FormGroup;
  geoLocationError:string ="";
  fetchLocation:boolean;

  constructor(private ref: ChangeDetectorRef) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
  }

  private _createForm(): void {
    const answer = this._getAnswer();
    this.formGroup = new FormGroup({
      latitude: new FormControl(answer[0], Validators.required),
      longitude: new FormControl(answer[1], Validators.required),
    });
    this.setControl(this.formGroup);

    this.formGroup.valueChanges.subscribe((res) => {
      if(res) {
        if (this.isCacheable) {
          const formAnswer = res?.latitude +'|'+ res?.longitude;
          localStorage.setItem(this.response.questionId, formAnswer);
        }
      }
    })

  }

  private _getAnswer(): Array<string> {
    const splitted = this.response.answer
      ? this.response.answer.split('|')
      : [];
    return splitted.length !== 2 ? [null, null] : splitted;
  }

  public getLocation() {

    this.geoLocationError = "";
    this.fetchLocation = true;

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition((position: any) => {
      this.fetchLocation = false;
      this.geoLocationError = "";
      this.formGroup.setValue({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    }, (error) => {
      this.fetchLocation = false;
      this.geoLocationError = error.message;
      this.ref.detectChanges()
    }, options);
  }

  onRememberToggleChange($event: MatSlideToggleChange) {
    this.isCacheable = $event.checked;

    if (this.isCacheable) {
      localStorage.setItem(this.response.questionId, this.response.answer);
    } else {
      localStorage.removeItem(this.response.questionId);
    }
  }

}
