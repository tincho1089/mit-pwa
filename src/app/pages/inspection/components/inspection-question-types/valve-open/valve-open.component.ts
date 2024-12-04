import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';

@Component({
  selector: 'app-valve-open',
  templateUrl: './valve-open.component.html',
  styleUrls: ['./valve-open.component.scss'],
})
export class ValveOpenComponent
  extends BaseInspection
  implements QuestionTypesModel, OnInit
{
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  failOptions: DomainModel[] = [];

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.failOptions = this.getOptionsObject();
  }

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  private _validatePassFail(group: FormGroup): any {
    if (group.controls['PassFail'].value === 'Pass') return null;
    return Validators.required(group.controls['FailureCode']);
  }

  private async _createForm() {
    const answer = this.getAnswerObject();
    const valveSize = this.getSetting('Valve Size');
    const designOpeningTime = this.getSetting('Design Opening Time');
    const asFoundOpeningTime =
      answer?.details?.['As Found Opening Time'] || null;
    const asLeftOpeningTime = answer?.details?.['As Left Opening Time'] || null;

    const passFailLeft = answer?.passFailLeft?.PassFail || null;
    const failureCodeLeft = answer?.passFailLeft?.FailureCode || null;

    const passFailFound = answer?.passFailFound?.PassFail || null;
    const failureCodeFound = answer?.passFailFound?.FailureCode || null;

    this.formGroup = new FormGroup({
      details: new FormGroup({
        'Valve Size': new FormControl(
          { value: valveSize || '', disabled: true },
          Validators.required
        ),
        'Design Opening Time': new FormControl(
          { value: designOpeningTime || '', disabled: true },
          Validators.required
        ),
        'As Found Opening Time': new FormControl(
          { value: asFoundOpeningTime, disabled: this.isDisabled() },
          Validators.required
        ),
        'As Left Opening Time': new FormControl(
          { value: asLeftOpeningTime, disabled: this.isDisabled() },
          Validators.required
        ),
      }),
      passFailLeft: new FormGroup({
        PassFail: new FormControl(passFailLeft, Validators.required),
        FailureCode: new FormControl(failureCodeLeft),
      }),
      passFailFound: new FormGroup(
        {
          PassFail: new FormControl(passFailFound, Validators.required),
          FailureCode: new FormControl(failureCodeFound),
        },
        this._validatePassFail
      ),
    });

    this.checkValidations();
    this.setupAsFoundOpeningTimeSubscription();
    this.setupAsLeftOpeningTimeSubscription();
    this.setControl(this.formGroup);
  }

  private setupAsFoundOpeningTimeSubscription() {
    const asFoundOpeningTimeControl = this.formGroup.get(
      'details.As Found Opening Time'
    );
    this.subscription.add(
      asFoundOpeningTimeControl.valueChanges.subscribe((value) => {
        this.handleAsTimeOpeningChange(
          value,
          this.formGroup.get('details.Design Opening Time'),
          'passFailFound'
        );
      })
    );
  }

  private setupAsLeftOpeningTimeSubscription() {
    const asLeftOpeningTimeControl = this.formGroup.get(
      'details.As Left Opening Time'
    );
    this.subscription.add(
      asLeftOpeningTimeControl.valueChanges.subscribe((value) => {
        this.handleAsTimeOpeningChange(
          value,
          this.formGroup.get('details.Design Opening Time'),
          'passFailLeft'
        );
      })
    );
  }

  private handleAsTimeOpeningChange(
    value: any,
    designOpeningTimeControl: AbstractControl,
    passFailControlName: string
  ) {
    let PassFail = null;
    const valueNumber = Number(value);
    const designOpeningTime = Number(designOpeningTimeControl.value);

    if (value && !isNaN(valueNumber) && !isNaN(designOpeningTime)) {
      PassFail = valueNumber <= designOpeningTime ? 'Pass' : 'Fail';
    }

    const passFailControl = this.formGroup.get(passFailControlName);
    passFailControl.patchValue(
      {
        PassFail,
        ...(PassFail === 'Pass' ? { FailureCode: null } : {}),
      },
      { onlySelf: true, emitEvent: true }
    );

    if (passFailControlName === 'passFailFound') {
      this.checkValidations();
    }
  }

  checkValidations() {
    const hideAsLeft =
      this.formGroup.get('passFailFound.PassFail').value === 'Pass';

    if (hideAsLeft) {
      // Reset validations when hidding
      this.formGroup.get('details.As Left Opening Time').patchValue(0);
      this.formGroup.get('details.As Left Opening Time').clearValidators();
      this.formGroup.get('passFailLeft.PassFail').clearValidators();
      this.formGroup.get('passFailLeft.PassFail').updateValueAndValidity();
      this.formGroup.get('passFailLeft.FailureCode').clearValidators();
      this.formGroup.get('passFailLeft.FailureCode').updateValueAndValidity();
      this.formGroup.get('passFailLeft').clearValidators();
      this.formGroup.get('passFailLeft').updateValueAndValidity();
      this.formGroup.updateValueAndValidity({
        emitEvent: false,
      });
    } else {
      // add validations to AsLeft
      this.formGroup
        .get('details.As Left Opening Time')
        .setValidators([Validators.required]);
      this.formGroup
        .get('passFailLeft.PassFail')
        .setValidators([Validators.required]);
      this.formGroup.get('passFailLeft').setValidators(this._validatePassFail);
      this.formGroup.updateValueAndValidity({
        emitEvent: false,
      });
    }
  }
}
