import { Component, Input, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { DomainModel } from 'src/app/core/models/local/domain.model';

@Component({
  selector: 'valve-closure',
  templateUrl: 'valve-closure.html',
  styleUrls: ['./valve-closure.scss'],
})
export class ValveClosureComponent
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
    const designClosingTime = this.getSetting('Design Closing Time');
    const asFoundClosingTime =
      answer?.details?.['As Found Closing Time'] || null;
    const asLeftClosingTime = answer?.details?.['As Left Closing Time'] || null;

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
        'Design Closing Time': new FormControl(
          { value: designClosingTime || '', disabled: true },
          Validators.required
        ),
        'As Found Closing Time': new FormControl(
          asFoundClosingTime,
          Validators.required
        ),
        'As Left Closing Time': new FormControl(
          asLeftClosingTime,
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

    this.setupAsFoundClosingTimeSubscription();
    this.setupAsLeftClosingTimeSubscription();

    this.setControl(this.formGroup);
  }

  private setupAsFoundClosingTimeSubscription() {
    const asFoundClosingTimeControl = this.formGroup.get(
      'details.As Found Closing Time'
    );
    this.subscription.add(
      asFoundClosingTimeControl.valueChanges.subscribe((value) => {
        this.handleAsTimeClosingChange(
          value,
          this.formGroup.get('details.Design Closing Time'),
          'passFailFound'
        );
      })
    );
  }

  private setupAsLeftClosingTimeSubscription() {
    const asLeftClosingTimeControl = this.formGroup.get(
      'details.As Left Closing Time'
    );
    this.subscription.add(
      asLeftClosingTimeControl.valueChanges.subscribe((value) => {
        this.handleAsTimeClosingChange(
          value,
          this.formGroup.get('details.Design Closing Time'),
          'passFailLeft'
        );
      })
    );
  }

  private handleAsTimeClosingChange(
    value: any,
    designClosingTimeControl: AbstractControl,
    passFailControlName: string
  ) {
    let PassFail = null;
    const valueNumber = Number(value);
    const designClosingTime = Number(designClosingTimeControl.value);

    if (value && !isNaN(valueNumber) && !isNaN(designClosingTime)) {
      PassFail = valueNumber <= designClosingTime ? 'Pass' : 'Fail';
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
      this.formGroup.get('details.As Left Closing Time').patchValue(0);
      this.formGroup.get('details.As Left Closing Time').clearValidators();
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
        .get('details.As Left Closing Time')
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
