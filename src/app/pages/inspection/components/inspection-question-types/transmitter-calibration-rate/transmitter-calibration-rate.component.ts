import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { BaseInspection } from '../../../classes/base-inspection';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { MIUtilities } from 'src/app/shared/utility';

@Component({
  selector: 'transmitter-calibration-rate',
  templateUrl: 'transmitter-calibration-rate.component.html',
  styleUrls: ['./transmitter-calibration-rate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransmitterCalibrationRateComponent
  extends BaseInspection
  implements OnInit
{
  @Input()
  showHelper: boolean = false;
  formGroup: FormGroup;
  failOptions: Array<DomainModel> = [];
  detailsDomain: Array<DomainModel> = [
    new DomainModel('AsFound', 'As Found'),
    new DomainModel('AsLeft', 'As Left'),
  ];
  columns: Array<DomainModel> = [];
  rows = [0, 1];
  units: string = '';
  defaultUnits = 'mA';

  low: number = 0;
  defaultSignalMin: number = 4;
  high: number = 0;
  defaultSignalMax = 20;
  signalMin: number = 0;
  signalMax: number = 0;
  showSignal: boolean = false;
  showFivePoint: boolean = false;
  showEngUnit: boolean = false;
  engUnit: string = '';
  engMin: number = -1;
  engMax: number = -1;
  defaultVal: number = -99999;
  accuracy: number = 0;
  tp1: number = -99999;
  tp2: number = -99999;
  tp3: number = -99999;
  tp4: number = -99999;
  tp5: number = -99999;

  constructor(private ref: ChangeDetectorRef) {
    super();
  }

  override async ngOnInit() {
    super.ngOnInit();
    await this.getTPs();
    await this.getEngUnit();
    await this.initRows();
    await this.initUnits();
    await this.initColumns();
    await this.initAccuracy();
    this.failOptions = this.getOptionsObject();
    
    this.createForm();
    this.ref.markForCheck();
  }

  private initRows() {
    if (this.showFivePoint) {
      let rows: Array<number> = [];
      if (this.tp1 > this.defaultVal) {
        rows.push(0);
      }
      if (this.tp2 > this.defaultVal) {
        rows.push(1);
      }
      if (this.tp3 > this.defaultVal) {
        rows.push(2);
      }
      if (this.tp4 > this.defaultVal) {
        rows.push(3);
      }
      if (this.tp5 > this.defaultVal) {
        rows.push(4);
      }
      this.rows = rows;
    } else {
      this.rows = [0, 1];
    }
  }
  
  private initAccuracy() {
    this.accuracy = Number(this.getSetting('accuracy'))
    if (!this.accuracy) {
      this.accuracy = 2
    }
  }

  private initColumns() {
    if (this.showEngUnit) {
      this.columns = [
        new DomainModel('Test Input', 'Test Input' + this.units),
        new DomainModel('Eng Unit', 'Eng Unit' + this.engUnit),
        new DomainModel('Target Output', 'Target Output' + this.units),
        new DomainModel('Actual Output', 'Actual Output' + this.units),
        new DomainModel('Error', '%Error'),
        new DomainModel('Status', 'Status'),
      ];
    } else {
      this.columns = [
        new DomainModel('Test Input', 'Test Input' + this.units),
        new DomainModel('Target Output', 'Target Output' + this.units),
        new DomainModel('Actual Output', 'Actual Output' + this.units),
        new DomainModel('Error', '%Error'),
        new DomainModel('Status', 'Status'),
      ];
    }
  }
  private initUnits() {
    try {
      this.units = this.getSetting('Unit');
      if (!this.units) {
        this.units = this.getSetting('Units');
      }
      if (!this.units) {
        this.units = this.getSetting('Signal Unit');
      }
      if (!this.units) {
        this.units = this.getSetting('Set Point Unit');
      }
      if (!this.units) {
        this.units = this.getSetting('Span Unit');
      }
      if (!this.units) {
        this.units = this.defaultUnits;
      }
      if (this.units) this.units = ' (' + this.units + ')';
    } catch {
      this.units = ' (' + this.defaultUnits + ')';
    }
  }

  private async getTPs() {
    try {
      let strTp1 = '';
      let strTp2 = '';
      let strTp3 = '';
      let strTp4 = '';
      let strTp5 = '';

      strTp1 = this.getSetting('Cal TP1');
      strTp2 = this.getSetting('Cal TP2');
      strTp3 = this.getSetting('Cal TP3');
      strTp4 = this.getSetting('Cal TP4');
      strTp5 = this.getSetting('Cal TP5');

      this.tp1 = strTp1 ? Number(strTp1) : this.defaultVal;
      this.tp2 = strTp2 ? Number(strTp2) : this.defaultVal;
      this.tp3 = strTp3 ? Number(strTp3) : this.defaultVal;
      this.tp4 = strTp4 ? Number(strTp4) : this.defaultVal;
      this.tp5 = strTp5 ? Number(strTp5) : this.defaultVal;

      if (
        this.tp1 != this.defaultVal ||
        this.tp2 != this.defaultVal ||
        this.tp3 != this.defaultVal ||
        this.tp4 != this.defaultVal ||
        this.tp5 != this.defaultVal
      ) {
        this.showFivePoint = true;
      }
    } catch {}
  }

  private async getEngUnit() {
    try {
      let strEngUnit = '';
      let strEngMin = '';
      let strEngMax = '';
      strEngUnit = this.getSetting('Eng Unit');
      strEngMin = this.getSetting('Eng Min');
      strEngMax = this.getSetting('Eng Max');

      this.engUnit = strEngUnit ? strEngUnit : '';
      this.engMin = strEngMin ? Number(strEngMin) : 0;
      this.engMax = strEngMax ? Number(strEngMax) : 0;

      if (this.engUnit.length > 0 || this.engMin > 0 || this.engMax > 0) {
        this.showEngUnit = true;
        if (this.engUnit) this.engUnit = ' (' + this.engUnit + ')';
      }
    } catch {}
  }

  private async createForm() {
    const answer = this.getAnswerObject();
    let asFPassFail = null;
    let asLPassFail = null;
    let failureCode = null;
    let maxErr,
      testResult: string = null;
    try {
      let lowValue = '';
      lowValue = this.getSetting('Min Span');
      this.low = lowValue ? Number(lowValue) : 0;

      let highValue = '';
      highValue = this.getSetting('Max Span');
      this.high = highValue ? Number(highValue) : 0;
    } catch {}

    try {
      let signalMin = '';
      signalMin = this.getSetting('Signal Min');
      this.signalMin = signalMin ? Number(signalMin) : this.defaultSignalMin;
      let signalMax = '';
      signalMax = this.getSetting('Signal Max');
      this.signalMax = signalMax ? Number(signalMax) : this.defaultSignalMax;
      this.showSignal = signalMin ? true : false;
    } catch {}

    const asFoundForm = new FormArray(
      this.rows.map((row): FormGroup => {
        let testInputValue = null;
        let targetOutputValue = null;
        let actualOutputValue = null;
        let errorValue = null;
        let tmpTestInput = null;
        let flag: boolean = false;
        let engOutputValue = null;
        let status = null;

        try {
          flag = MIUtilities.isAnsDetailNullOrUndefined(answer, true, 'F', row);
          if (!flag) {
            tmpTestInput = answer.details.AsFound[row]['Test Input'];
            testInputValue = !MIUtilities.isNullOrUndefined(
              answer.details.AsFound[row]['Test Input']
            )
              ? answer.details.AsFound[row]['Test Input']
              : this.getTestInput(row);
            engOutputValue = !MIUtilities.isNullOrUndefined(tmpTestInput)
              ? answer.details.AsFound[row]['Eng Unit']
              : this.getEngOutput(testInputValue);
            targetOutputValue = !MIUtilities.isNullOrUndefined(tmpTestInput)
              ? answer.details.AsFound[row]['Target Output']
              : this.getTargetOutput(testInputValue);
            
            actualOutputValue = !MIUtilities.isNullOrUndefined(answer.details.AsFound[row]['Actual Output']) ? answer.details.AsFound[row]['Actual Output'] : 0;
            errorValue = !MIUtilities.isNullOrUndefined(answer.details.AsFound[row]['Error']) ? answer.details.AsFound[row]['Error'] : null;
            status = !MIUtilities.isNullOrUndefined(answer.details.AsFound[row]['Status']) ? answer.details.AsFound[row]['Status'] : null;
          } else {
            testInputValue = this.getTestInput(row);
            targetOutputValue = this.getTargetOutput(testInputValue);
            engOutputValue = this.getEngOutput(testInputValue);
            actualOutputValue = 0;
            errorValue = null;
            status = null;
          }
        } catch {}
        const testInput = new FormControl(testInputValue, Validators.required);
        const engOutput = new FormControl(
          engOutputValue && !isNaN(engOutputValue) ? engOutputValue : ''
        );
        const actualOutput = new FormControl(
          actualOutputValue && !isNaN(actualOutputValue)
            ? actualOutputValue
            : '',
          Validators.required
        );
        const group = new FormGroup({
          'Test Input': testInput,
          'Eng Unit': engOutput,
          'Target Output': new FormControl(
            targetOutputValue && !isNaN(targetOutputValue)
              ? targetOutputValue
              : '',
            Validators.required
          ),
          'Actual Output': actualOutput,
          Error: new FormControl(errorValue, Validators.required),
          Status: new FormControl(status, Validators.required),
        });

        this.subscription.add(
          testInput.valueChanges.subscribe(
            this.onTestInputValueChanges.bind(this, group, true)
          )
        );

        this.subscription.add(
          actualOutput.valueChanges.subscribe(
            this.onTargetActualValueChanges.bind(this, group, false)
          )
        );

        this.subscription.add(
          group.valueChanges.subscribe(
            this.onGroupValueChanges.bind(this, 'AsFound')
          )
        );

        return group;
      })
    );
    maxErr = answer?.details?.AsFound[this.rows.length]?.['Maximum Error'] || '';

    testResult =
      answer?.details?.AsFound[this.rows.length]?.['Test Result'] || '';

    let asFGroupSummary = new FormGroup({
      'Maximum Error': new FormControl(maxErr),
      'Test Result': new FormControl(testResult),
    });

    asFoundForm.push(asFGroupSummary);

    const asLeftForm = new FormArray(
      this.rows.map((row): FormGroup => {
        let testInputValue = null;
        let targetOutputValue = null;
        let actualOutputValue = null;
        let errorValue = null;
        let tmpTestInput = null;
        let flag: boolean = false;
        let engOutputValue = null;
        let status = null;
        try {
          flag = MIUtilities.isAnsDetailNullOrUndefined(answer, true, 'L', row);
          if (!flag) {
            tmpTestInput = answer.details.AsLeft[row]['Test Input'];
            testInputValue = !MIUtilities.isNullOrUndefined(tmpTestInput)
              ? tmpTestInput
              : this.getTestInput(row);
            engOutputValue = !MIUtilities.isNullOrUndefined(tmpTestInput)
              ? answer.details.AsFound[row]['Eng Unit']
              : this.getEngOutput(testInputValue);
            targetOutputValue = !MIUtilities.isNullOrUndefined(tmpTestInput)
              ? answer.details.AsLeft[row]['Target Output']
              : this.getTargetOutput(testInputValue);

            actualOutputValue = !MIUtilities.isNullOrUndefined(answer.details.AsLeft[row]['Actual Output']) ? answer.details.AsLeft[row]['Actual Output'] : 0;
            errorValue = !MIUtilities.isNullOrUndefined(answer.details.AsLeft[row]['Error']) ? answer.details.AsLeft[row]['Error'] : null;
            status = !MIUtilities.isNullOrUndefined(answer.details.AsLeft[row]['Status']) ? answer.details.AsLeft[row]['Status'] : null;
          } else {
            testInputValue = this.getTestInput(row);
            engOutputValue = this.getEngOutput(testInputValue);
            targetOutputValue = this.getTargetOutput(testInputValue);
            actualOutputValue = 0;
            errorValue = null;
            status = null;
          }
        } catch {}
        const testInput = new FormControl(testInputValue, Validators.required);
        const engOutput = new FormControl(engOutputValue);
        const actualOutput = new FormControl(
          actualOutputValue,
          Validators.required
        );
        const group = new FormGroup({
          'Test Input': testInput,
          'Eng Unit': engOutput,
          'Target Output': new FormControl(
            targetOutputValue,
            Validators.required
          ),
          'Actual Output': actualOutput,
          Error: new FormControl(errorValue, Validators.required),
          Status: new FormControl(status, Validators.required),
        });

        this.subscription.add(
          testInput.valueChanges.subscribe(
            this.onTestInputValueChanges.bind(this, group, false)
          )
        );

        this.subscription.add(
          actualOutput.valueChanges.subscribe(
            this.onTargetActualValueChanges.bind(this, group, false)
          )
        );

        this.subscription.add(
          group.valueChanges.subscribe(
            this.onGroupValueChanges.bind(this, 'AsLeft')
          )
        );

        return group;
      })
    );
    maxErr = answer?.details?.AsLeft[this.rows.length]?.['Maximum Error'] || '';
    testResult = answer?.details?.AsLeft[this.rows.length]?.['Test Result'] || '';

    this.accuracy = answer?.details?.Accuracy || this.accuracy;

    let asLGroupSummary = new FormGroup({
      'Maximum Error': new FormControl(maxErr),
      'Test Result': new FormControl(testResult),
    });

    asLeftForm.push(asLGroupSummary);
    try {
      asFPassFail = answer.passFail.AsFPassFail;
      asLPassFail = answer.passFail.AsLPassFail;
      failureCode = answer.passFail.FailureCode;
    } catch {}

    this.formGroup = new FormGroup(
      {
        details: new FormGroup({
          Accuracy: new FormControl(this.accuracy),
          AsFound: asFoundForm,
          AsLeft: asLeftForm,
        }),
        passFail: new FormGroup({
          AsFPassFail: new FormControl(asFPassFail, Validators.required),
          AsLPassFail: new FormControl(asLPassFail),
          FailureCode: new FormControl(failureCode),
        }),
      },
      [this.validateFailure, this.validateAsLPassFail]
    );

    this.subscription.add(
      this.formGroup.get('details.Accuracy').valueChanges.subscribe((value) => {
        this.accuracy = value;
        for (let row of this.rows) {
          const control = this.formGroup.get(
            'details.AsFound.' + row
          ) as FormGroup;
          const actualOutputFound = this.formGroup.get(
            'details.AsFound.' + row + '.Actual Output'
          );
          const testInputFound = this.formGroup.get(
            'details.AsFound.' + row + '.Test Input'
          );
          this.onTestInputValueChanges(control, true, testInputFound.value);
          this.onTargetActualValueChanges(
            control,
            true,
            actualOutputFound.value
          );
          this.onGroupValueChanges('AsFound');
          if (this.formGroup.get('passFail.AsFPassFail').value === 'Fail') {
            this.onGroupValueChanges('AsLeft');
          }
        }
      })
    );

    if (asFPassFail === 'Pass') {
      this.formGroup
        .get('details.AsLeft')
        .disable({ onlySelf: true, emitEvent: false });
    }

    this.setControl(this.formGroup);
  }

  private onTestInputValueChanges(
    group: FormGroup,
    resetPassFail,
    value: number
  ) {
    let target = null;
    let error = null;
    let engTarget = null;
    let status = null;
    try {
      if (value) {
        target = this.getTargetOutput(value);
        error =
          ((parseFloat(group.get('Actual Output').value) - parseFloat(target)) /
            16) *
          100;
        error = isNaN(error) ? null : error.toFixed(2);
        engTarget = this.getEngOutput(value);
        if (!MIUtilities.isNullOrUndefined(error)) {
          status = this.getStatusValue(error);
        } else {
          status = '';
        }
      }
    } catch {}
    group.patchValue(
      {
        'Eng Unit': engTarget,
        'Target Output': target,
        Error: error,
        Status: status,
      },
      {
        onlySelf: true,
        emitEvent: false,
      }
    );
    if (resetPassFail && !value) {
      this.formGroup.get('details.AsLeft').reset({
        onlySelf: true,
        emitEvent: false,
      });
      this.formGroup.get('passFail').reset({
        onlySelf: true,
        emitEvent: false,
      });
    }
  }

  private getStatusValue(error): string {
    if (!MIUtilities.isNullOrUndefined(error)) {
      return Math.abs(error) > this.accuracy ? 'Fail' : 'Pass';
    } else {
      return null;
    }
  }

  private onTargetActualValueChanges(
    group: FormGroup,
    resetPassFail,
    value: number
  ) {
    let target = null;
    let error = null;
    let status = null;
    try {
      if (value) {
        target = !MIUtilities.isNullOrUndefined(group.get('Target Output').value) ? group.get('Target Output').value : 0;
        error =
          ((value - parseFloat(target)) / 16) * 100;
        error = isNaN(error) || !isFinite(error) ? null : error.toFixed(2);
        if (!MIUtilities.isNullOrUndefined(error)) {
          status = this.getStatusValue(error);
        } else {
          status = '';
        }
      }
    } catch {}
    group.patchValue(
      {
        Error: error,
        Status: status,
      },
      {
        onlySelf: true,
        emitEvent: false,
      }
    );
    if (resetPassFail && !value) {
      this.formGroup.get('details.AsLeft').reset({
        onlySelf: true,
        emitEvent: false,
      });
      this.formGroup.get('passFail').reset({
        onlySelf: true,
        emitEvent: false,
      });
    }
  }

  override isValidError(error: string | number): boolean {
    return Number(error) >= -this.accuracy && Number(error) <= this.accuracy;
  }

  private onGroupValueChanges(detail: string) {
    let validation = 'Pass';
    for (let row of this.rows) {
      const value = this.formGroup.get(
        'details.' + detail + '.' + row + '.Error'
      ).value;
      if (value === null || value === '' || value === undefined) {
        validation = null;
        break;
      } else if (!this.isValidError(value)) {
        validation = 'Fail';
      }
    }
    const detailCtrl = this.formGroup.controls['details'];
    const maxErrControl = detailCtrl.get(
      detail + '.' + this.rows.length + '.' + 'Maximum Error'
    );
    const testResultControl = detailCtrl.get(
      detail + '.' + this.rows.length + '.' + 'Test Result'
    );
    maxErrControl.setValue(this.getMaxError(this.formGroup, detail), {
      onlySelf: true,
      emitEvent: false,
    });
    testResultControl.setValue(this.getTestResult(this.formGroup, detail), {
      onlySelf: true,
      emitEvent: false,
    });
    if (validation === 'Fail' && detail === 'AsFound') {
      for (let row of this.rows) {
        const asLeftTestInput = this.formGroup.get(
          'details.AsLeft.' + row + '.Test Input'
        ).value;
        if (MIUtilities.isNullOrUndefined(asLeftTestInput)) {
          const asFoundTestInput = this.formGroup.get(
            'details.AsFound.' + row + '.Test Input'
          ).value;
          const asLeftControlRow = this.formGroup.get('details.AsLeft.' + row);
          asLeftControlRow.patchValue(
            {
              'Test Input': asFoundTestInput,
            },
            {
              onlySelf: true,
              emitEvent: true,
            }
          );
        }
      }
    }
    const asLeftControl = this.formGroup.get('details.AsLeft');
    let failureCode = undefined;
    if (validation === 'Pass' && detail === 'AsFound') {
      asLeftControl.clearValidators();
      asLeftControl.disable({
        onlySelf: true,
        emitEvent: false,
      });
      failureCode = null;
    } else {
      asLeftControl.enable({
        onlySelf: true,
        emitEvent: false,
      });
    }
    const passFail = detail.substring(0, 3) + 'PassFail';
    this.formGroup.patchValue(
      {
        passFail: {
          [passFail]: validation,
          ...(failureCode !== undefined ? { FailureCode: failureCode } : {}),
        }
      },
      {
        onlySelf: true,
        emitEvent: false,
      }
    );
  }

  private validateFailure(group: FormGroup) {
    if (group.get('passFail.AsFPassFail').value !== 'Pass') {
      return Validators.required(group.get('passFail.FailureCode'));
    }
    return null;
  }

  private validateAsLPassFail(group: FormGroup) {
    if (group.get('passFail.AsFPassFail').value !== 'Pass') {
      return Validators.required(group.get('passFail.AsLPassFail'));
    }
    return null;
  }

  private getTestInput(row: number) {
    if (this.showFivePoint) {
      let factor = 0.0;
      switch (row) {
        case 0:
          factor = this.tp1;
          break;
        case 1:
          factor = this.tp2;
          break;
        case 2:
          factor = this.tp3;
          break;
        case 3:
          factor = this.tp4;
          break;
        case 4:
          factor = this.tp5;
          break;
        default:
          break;
      }
      return factor;
    } else {
      return row === 0
        ? this.low + (this.high - this.low) * 0.05
        : this.low + (this.high - this.low) * 0.95;
    }
  }

  private getTargetOutput(value) {
    const numr = Number(value) - Number(this.low);
    const denr = Number(this.high) - Number(this.low);
    let factor = null;
    if (this.showSignal) {
      if (!(denr == 0 || isNaN(numr) || isNaN(denr))) {
        factor = (numr / denr) * (this.signalMax - this.signalMin);
      }
      return factor != null ? (this.signalMin + factor).toFixed(2) : 0;
    } else {
      if (!(denr == 0 || isNaN(numr) || isNaN(denr))) {
        factor = (numr / denr) * 16;
      }
      return factor != null ? (4 + factor).toFixed(2) : 0;
    }
  }

  private getEngOutput(value) {
    // Formula: ((TestInput - Min Span) / (Max Span - Min Span) * (Eng Max - Eng Min)) + Eng Min
    const numr = Number(value) - Number(this.low);
    const denr = Number(this.high) - Number(this.low);
    let factor = null;
    if (
      !(
        denr == 0 ||
        isNaN(numr) ||
        isNaN(denr) ||
        isNaN(this.engMax) ||
        isNaN(this.engMin)
      )
    ) {
      factor = (numr / denr) * (Number(this.engMax) - Number(this.engMin));
    }
    return factor || factor == 0
      ? (factor + Number(this.engMin)).toFixed(2)
      : null;
  }

  private getMaxError(group, detail) {
    let obj = null;
    let max: number = -1;
    let err: number;
    let row = null;

    obj = group.get('details.' + detail);
    for (let i = 0; i < this.rows.length; i++) {
      try {
        row = obj.controls[i].value;
        err = Math.abs(Number(row.Error.replace('%', '')));
        if (max < err) {
          max = err;
        }
      } catch (err) {
        console.log('ignore...');
      }
    }
    return max != -1 ? max + '%' : '';
  }

  private getTestResult(group, detail) {
    let result: string = '';
    let obj = null;
    let row = null;
    let passNum: number = 0;
    obj = group.get('details.' + detail);
    for (let i = 0; i < this.rows.length; i++) {
      row = obj.controls[i].value;
      if (row.Status == 'Fail') {
        result = 'Fail';
        break;
      } else if (row.Status == 'Pass') {
        passNum++;
      }
    }
    if (result != 'Fail' && passNum == this.rows.length) {
      result = 'Pass';
    }
    return result;
  }
}
