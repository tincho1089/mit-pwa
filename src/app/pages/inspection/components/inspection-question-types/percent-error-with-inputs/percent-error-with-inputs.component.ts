import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { BaseInspection } from '../../../classes/base-inspection';
import { InspectionDetailsService } from '../../../services/inspection-details.service';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { MIUtilities } from 'src/app/shared/utility';
import { EquipDetails } from 'src/app/core/sync/entities';

@Component({
  selector: 'percent-error-with-inputs',
  templateUrl: 'percent-error-with-inputs.component.html',
  styleUrls: ['./percent-error-with-inputs.component.scss'],
})
// Set point validation 2% 
export class PercentErrorWithInputsComponent
  extends BaseInspection
  implements OnInit
{
  @Input()
  override editable: boolean = true;
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  items: Array<EquipDetails> = new Array<EquipDetails>();
  units: string = '';
  failOptions: DomainModel[] = [];

  constructor(private inspectionDetailsService: InspectionDetailsService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.failOptions = this.getOptionsObject();
    this._createForm();
  }

  private _createForm(): void {
    const answers = this.getAnswerObject();

    this.items = this.inspectionDetailsService.getSetPointSettings();
    this.items.forEach((item) => {
      item.currVal = item.updatedVal ? item.updatedVal : item.currVal;
    });
    this.items = this.items.filter((item) => !!item.currVal);
    try {
      const index = this.items.findIndex((i) => {
        if (i.fieldName === 'Set Point Unit') {
          this.units = i.currVal;
          return true;
        } else return false;
      });
      if (index > -1) {
        this.items.splice(index, 1);
      } else {
        this.units = this.inspectionDetailsService.getSetting('Span Unit');
      }
    } catch {}
    let PassFail = null;
    let FailureCode = null;

    try {
        PassFail = answers['passFail']['PassFail'];
        FailureCode = answers['passFail']['FailureCode'];
      } catch {}

    const details = new FormArray(
      this.items.map((item): FormGroup => {
        let asFoundValue = null;
        let errorFValue = null;
        let asLeftValue = null;
        let errorLValue = null;

        try {
          const answer = answers['details'].find(
            (a) => a['Setting'] === item.fieldName
          );
          asFoundValue = answer['AsFound'];
          errorFValue = answer['ErrorF'].replace('%', '');
          asLeftValue = answer['AsLeft'];
          errorLValue = answer['ErrorL'].replace('%', '');
        } catch {}

        const AsFound = new FormControl(asFoundValue, Validators.required);
        const ErrorF = new FormControl(
          {
            value: errorFValue,
            disabled: true,
          },
          Validators.required
        );
        const AsLeft = new FormControl(asLeftValue);
        const ErrorL = new FormControl({
          value: errorLValue,
          disabled: true,
        });

        this.subscription.add(
          AsFound.valueChanges.subscribe(
            this._onAsFoundChange.bind(
              this,
              ErrorF,
              item.currVal,
              AsLeft,
              ErrorL
            )
          )
        );

        this.subscription.add(
          AsLeft.valueChanges.subscribe(
            this._onAsLeftChange.bind(this, ErrorL, item.currVal)
          )
        );

        return new FormGroup(
          {
            Setting: new FormControl(
              {
                value: item.fieldName,
                disabled: true,
              },
              Validators.required
            ),
            'Set Point': new FormControl({
              value: item.currVal,
              disabled: true,
            }),
            'Set Point Unit': new FormControl(
              {
                value: this.units,
                disabled: true,
              },
              Validators.required
            ),
            AsFound,
            ErrorF,
            AsLeft,
            ErrorL,
          },
          [this._validateErrorLeft.bind(this)]
        );
      })
    );

    this.formGroup = new FormGroup({
      details,
      'passFail': new FormGroup(
        {
          PassFail: new FormControl(
            {
              value: PassFail,
              disabled: true
            },
            Validators.required
          ),
          FailureCode: new FormControl(FailureCode)
        },
        this._validatePassFail
      )
    });

    this.subscription.add(
      details.valueChanges.subscribe(this._onDetailsChange.bind(this, details))
    );

    this.setControl(this.formGroup);
  }

  private _validateErrorLeft(group: FormGroup): any {
    return this.isValidError(group.controls['ErrorF'].value)
      ? null
      : Validators.required(group.controls['AsLeft']);
  }

  private _onDetailsChange(form: FormArray) {
    if (
      !MIUtilities.isNullOrUndefinedObject(this.formGroup) &&
      !MIUtilities.isNullOrUndefined(this.formGroup.status) &&
      this.formGroup.status !== 'DISABLED'
    ) {
      const values = form.getRawValue();
      let PassFail = '';
      if (form.valid) PassFail = values.some((e) => e.ErrorL) ? 'Fail' : 'Pass';
      this.formGroup.get('passFail').patchValue({
        PassFail,
        ...(['Pass', null].indexOf(PassFail) >= 0 ? { FailureCode: null } : {}),
      });
    }
  }

  private _onAsFoundChange(
    errorControl: FormControl,
    point: string,
    asLeftControl: FormControl,
    errorLControl: FormControl,
    value: string
  ) {
    if (
      !MIUtilities.isNullOrUndefinedObject(this.formGroup) &&
      !MIUtilities.isNullOrUndefined(this.formGroup.status) &&
      this.formGroup.status !== 'DISABLED'
    ) {
      const errorF = this.setError(parseFloat(point), Number(value));
      errorControl.setValue(errorF ? errorF.toFixed(2) : errorF, {
        onlySelf: true,
        emitEvent: true,
      });
      if (
        this.isValidError(errorF) ||
        (!this.isValidError(errorF) && !errorLControl.value)
      ) {
        asLeftControl.setValue('', {
          onlySelf: true,
          emitEvent: true,
        });
      }
    }
  }

  private _onAsLeftChange(
    errorControl: FormControl,
    point: string,
    value: string
  ) {
    if (
      !MIUtilities.isNullOrUndefinedObject(this.formGroup) &&
      !MIUtilities.isNullOrUndefined(this.formGroup.status) &&
      this.formGroup.status !== 'DISABLED'
    ) {
      const errorF = this.setError(parseFloat(point), Number(value));
      errorControl.setValue(errorF ? errorF.toFixed(2) : errorF, {
        onlySelf: true,
        emitEvent: true,
      });
    }
  }

  private setError(point: number, value: number) {
    return value ? ((point - value) / point) * 100 : '';
  }

  private _validatePassFail(group: FormGroup): any {
    if (group.controls['PassFail'].value === 'Pass') return null;
    return Validators.required(group.controls['FailureCode']);
  }
}
