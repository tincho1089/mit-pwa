import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { InspectionDetailsService } from '../../../services/inspection-details.service';

@Component({
  selector: 'app-ie-alarm-and-trip-validation',
  templateUrl: './ie-alarm-and-trip-validation.component.html',
  styleUrls: ['./ie-alarm-and-trip-validation.component.scss']
})
export class IeAlarmAndTripValidationComponent extends BaseInspection
implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  answerParsed: any;
  options = [];

  constructor(private _detailsProvider: InspectionDetailsService,
    private _cdr: ChangeDetectorRef, ) {
    super();
  }

  override ngOnInit() {
    this.answerParsed = this.getAnswerObject();
    this.createForm();
  }

  public validateFailureCode(): boolean {
    return (
    (this.formGroup.get('details.As Found HH').value && this.formGroup.get('details.As Found HH').value == 'Fail')
    ||
    (this.formGroup.get('details.As Found H').value && this.formGroup.get('details.As Found H').value == 'Fail')
    ||
    (this.formGroup.get('details.As Found L').value && this.formGroup.get('details.As Found L').value == 'Fail')
    ||
    (this.formGroup.get('details.As Found LL').value && this.formGroup.get('details.As Found LL').value == 'Fail')
    )
  }

  public showAsLeft(): boolean {
    return !(
      this.formGroup.get('details.As Found HH').value == 'Pass'
      &&
      this.formGroup.get('details.As Found H').value == 'Pass'
      &&
      this.formGroup.get('details.As Found L').value == 'Pass'
      &&
      this.formGroup.get('details.As Found LL').value == 'Pass'
      )
  }

  private createForm(): void {


    this.options = this.getOptionsObject();
    let HSetPoint = null;
    let HHSetPoint = null;
    let LSetPoint = null;
    let LLSetPoint = null;


    try {
      HSetPoint = this._detailsProvider.getSetting('H Set Point');
      HHSetPoint = this._detailsProvider.getSetting('HH Set Point');
      LSetPoint = this._detailsProvider.getSetting('L Set Point');
      LLSetPoint = this._detailsProvider.getSetting('LL Set Point');
    } catch { }

    try {
      this.formGroup = new FormGroup({
        details: new FormGroup({
          'As Found H': new FormControl(this.answerParsed.details['As Found H']),
          'As Found H Input': new FormControl(this.answerParsed.details['As Found H Input'], 
            HSetPoint ? Validators.required : null),
          'As Found HH': new FormControl(this.answerParsed.details['As Found HH']),
          'As Found HH Input': new FormControl(this.answerParsed.details['As Found HH Input'], 
            HHSetPoint ? Validators.required : null),
          'As Found L': new FormControl(this.answerParsed.details['As Found L']),
          'As Found L Input': new FormControl(this.answerParsed.details['As Found L Input'], 
            LSetPoint ? Validators.required : null),
          'As Found LL': new FormControl(this.answerParsed.details['As Found LL']),
          'As Found LL Input': new FormControl(this.answerParsed.details['As Found LL Input'], 
            LLSetPoint ? Validators.required : null),
          'As Left H': new FormControl(this.answerParsed.details['As Left H']),
          'As Left H Input': new FormControl(this.answerParsed.details['As Left H Input'], (this.answerParsed.details['As Found H'] === 'Fail' ? Validators.required : null)),
          'As Left HH': new FormControl(this.answerParsed.details['As Left HH']),
          'As Left HH Input': new FormControl(this.answerParsed.details['As Left HH Input'], (this.answerParsed.details['As Found HH'] === 'Fail' ? Validators.required : null)),
          'As Left L': new FormControl(this.answerParsed.details['As Left L']),
          'As Left L Input': new FormControl(this.answerParsed.details['As Left L Input'], (this.answerParsed.details['As Found L'] === 'Fail' ? Validators.required : null)),
          'As Left LL': new FormControl(this.answerParsed.details['As Left LL']),
          'As Left LL Input': new FormControl(this.answerParsed.details['As Left LL Input'], (this.answerParsed.details['As Found LL'] === 'Fail' ? Validators.required : null)),
          'AsFPassFail': new FormControl(this.answerParsed.details['AsFPassFail']),
          'AsLPassFail': new FormControl(this.answerParsed.details['AsLPassFail']),
          'FailureCode': new FormControl(this.answerParsed.details['FailureCode']),
          'H Set Point': new FormControl(HSetPoint),
          'HH Set Point': new FormControl(HHSetPoint),
          'L Set Point': new FormControl(LSetPoint),
          'LL Set Point': new FormControl(LLSetPoint)
        })
      });
    } catch{
      this.formGroup = new FormGroup({
        details: new FormGroup({
          'As Found H': new FormControl(null),
          'As Found H Input': new FormControl(null, Validators.required),
          'As Found HH': new FormControl(null),
          'As Found HH Input': new FormControl(null, Validators.required),
          'As Found L': new FormControl(null),
          'As Found L Input': new FormControl(null, Validators.required),
          'As Found LL': new FormControl(null),
          'As Found LL Input': new FormControl(null, Validators.required),
          'As Left H': new FormControl(null),
          'As Left H Input': new FormControl(null),
          'As Left HH': new FormControl(null),
          'As Left HH Input': new FormControl(null),
          'As Left L': new FormControl(null),
          'As Left L Input': new FormControl(null),
          'As Left LL': new FormControl(null),
          'As Left LL Input': new FormControl(null),
          'AsFPassFail': new FormControl(null),
          'AsLPassFail': new FormControl(null),
          'FailureCode': new FormControl(null),
          'H Set Point': new FormControl(HSetPoint),
          'HH Set Point': new FormControl(HHSetPoint),
          'L Set Point': new FormControl(LSetPoint),
          'LL Set Point': new FormControl(LLSetPoint)
        })
      });
    }
    this.setControl(this.formGroup);
  }

  validatePassControl(setPoint: string, rowName: string, newValidationControlName: string, setValidator: boolean) {

    let controlToUpdate = this.formGroup.get('details.' + newValidationControlName + ' Input');
    let currentAsFound = this.formGroup.get('details.' + rowName + ' Input').value;
    let passOrFail = this.formGroup.get('details.' + rowName);
    passOrFail.setValue(setPoint == currentAsFound ? 'Pass' : 'Fail');
    if (setValidator) {
      if (passOrFail.value == 'Fail') {
        controlToUpdate.setValidators([Validators.required]);
      } else {
        controlToUpdate.setValue('');
        controlToUpdate.setValidators(null);
      }
      controlToUpdate.updateValueAndValidity();
      this._cdr.detectChanges();
    }
  }

}
