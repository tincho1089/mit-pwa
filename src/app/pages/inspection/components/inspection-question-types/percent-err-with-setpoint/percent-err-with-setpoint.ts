import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { BaseInspection } from "../../../classes/base-inspection";
import { InspectionDetailsService } from '../../../services/inspection-details.service';
import { DomainModel } from "src/app/core/models/local/domain.model";
import { MIUtilities } from "src/app/shared/utility";
import { EquipDetails } from 'src/app/core/sync/entities';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'percent-err-with-setpoint',
  templateUrl: 'percent-err-with-setpoint.html',
  styleUrls: ['./percent-err-with-setpoint.scss']
})
export class PercentErrWithSetPointComponent extends BaseInspection implements OnInit {
  @Input()
  override editable: boolean = true;
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  options: Array<EquipDetails> = [];
  setPointOptions: any = [];
  filteredSetPointOptions: ReplaySubject<any[]> = new ReplaySubject<any[]>();
  units: string = '';
  setPoint: string = '';
  failOptions: DomainModel[] = [];

  filterControl: FormControl<string> = new FormControl<string>('');

  protected _onDestroy = new Subject<void>();

  constructor(private inspectionDetailsService: InspectionDetailsService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.failOptions = this.getOptionsObject();
    this._createForm();
    console.log("this.failOptions =", this.failOptions);

     // load the initial options list
     this.filteredSetPointOptions.next(this.setPointOptions.slice());

     // listen for search field value changes
     this.filterControl.valueChanges
       .pipe(takeUntil(this._onDestroy))
       .subscribe(() => {
         this.filterSetPointOptions();
       });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this._onDestroy.next();
    this._onDestroy.complete();
  }


  private _createForm(): void {
    const answer = this.getAnswerObject();
    this.options = this.inspectionDetailsService.getSetPointSettings();
    const fieldsToRemove = ['Set Point', 'Set Point Unit'];
    this.setPointOptions = this.options.filter(item => !fieldsToRemove.includes(item.fieldName));
    try {
      this.options = this.options.filter((item: any) => {
        if (item.fieldName === 'Set Point') {
          this.setPoint = this.inspectionDetailsService.getSetting('Set Point');
        } else if (item.fieldName === 'Set Point Unit') {
          this.units = this.inspectionDetailsService.getSetting('Set Point Unit');
        } else {
          return true;
        }
        return false;
      });
    } catch { }

    let setting = null;
    let asFoundValue = null;
    let errorFValue = null;
    let asLeftValue = null;
    let errorLValue = null;
    let passFail = null;
    let failureCode = null;
    try {
      setting = answer['details']['Setting'];
      asFoundValue = answer['details']['AsFound'];
      errorFValue = answer['details']['ErrorF'].replace('%', '');
      asLeftValue = answer['details']['AsLeft'];
      errorLValue = answer['details']['ErrorL'].replace('%', '');
      passFail = answer['passFail']['PassFail'];
      failureCode = answer['passFail']['FailureCode'];
    } catch { }

    const AsFound = new FormControl(asFoundValue, Validators.required);
    const ErrorF = new FormControl(
      {
        value: errorFValue,
        disabled: true
      },
      Validators.required
    );
    const AsLeft = new FormControl(asLeftValue);
    const ErrorL = new FormControl({
      value: errorLValue,
      disabled: true
    });



    const details = new FormGroup(
      {
        Setting: new FormControl(setting, Validators.required),
        'Set Point Unit': new FormControl(
          {
            value: this.setPoint,
            disabled: true
          },
          Validators.required
        ),
        AsFound,
        ErrorF,
        AsLeft,
        ErrorL
      },
      [this._validateErrorLeft.bind(this)]
    );

    this.formGroup = new FormGroup({
      details,
      passFail: new FormGroup(
        {
          PassFail: new FormControl(passFail, Validators.required),
          FailureCode: new FormControl(failureCode),
        },
        this._validatePassFail
      ),

    });
    this.setDisabledState(details);

    this.subscription.add(
      details.get("AsFound").valueChanges.subscribe(
        this._onAsFoundChange.bind(this, ErrorF, this.setPoint, AsLeft, ErrorL)
      )
    );
    this.subscription.add(
      details.get("AsLeft").valueChanges.subscribe(
        this._onAsLeftChange.bind(this, ErrorL, this.setPoint)
      )
    );

    this.subscription.add(
      details.valueChanges.subscribe(this._onDetailsChange.bind(this, details))
    );
  
    this.setControl(this.formGroup);
  }

  private _validateErrorLeft(group: FormGroup): any {
    return this.isValidError(group?.get('ErrorF').value)
      ? null
      : Validators.required(group.get('AsLeft'));
  }

  private _validatePassFail(group: FormGroup): any {
    if (group.controls['PassFail'].value === 'Pass') return null;
    return Validators.required(group.controls['FailureCode']);
  }

  private _onDetailsChange(form: FormArray) {
    if(!this.setPoint){
      this.form.setValidators(Validators.requiredTrue);
      return;
    }
    if (!MIUtilities.isNullOrUndefinedObject(this.formGroup) && !MIUtilities.isNullOrUndefined(this.formGroup.status) &&
      this.formGroup.status !== 'DISABLED') {
      const values = form.getRawValue();
      let PassFail = '';
      if (form.valid) PassFail = values['AsLeft'] ? 'Fail' : 'Pass';
      this.formGroup.get('passFail')?.patchValue(
        {
          PassFail,
          ...(['Pass', null].indexOf(PassFail) >= 0
            ? { FailureCode: null }
            : {})
        },
        {
          onlySelf: true,
          emitEvent: false
        }
      );
    }
  }

  private setDisabledState(group: FormGroup) {
    if (this.form.get(this.sectionArray)?.status !== 'DISABLED') {
      if (this.isValidError(group.get('ErrorF').value)) {
        group.get('AsLeft').disable();
        group.get('AsLeft').setValue('', {
          onlySelf: true,
          emitEvent: true
        });
      }
      if(!this.setPoint){
        group.get('AsFound').setValue(null);
        group.get('AsLeft').setValue(null);
      }
    }
  }

  private _onAsFoundChange(
    errorControl: FormControl,
    point: string,
    asLeftControl: FormControl,
    errorLControl: FormControl,
    value: string
  ) {
    if (!MIUtilities.isNullOrUndefinedObject(this.formGroup) && !MIUtilities.isNullOrUndefined(this.formGroup.status)
      && this.formGroup.status !== 'DISABLED') {
      const errorF = this.setError(parseFloat(point), Number(value));      
      if(MIUtilities.isZero(errorF)) {
        this.setValForControl(errorControl, 0);
      } else {
        this.setValForControl(errorControl, errorF ? errorF.toFixed(2) : null);
      }
      console.log("___", this.isValidError(errorF))
      if (this.isValidError(errorF) === true) {
        asLeftControl?.disable({
          onlySelf: true,
          emitEvent: false
        });
        this.setValForControl(asLeftControl, '');               
      }
      else {
        asLeftControl.enable({
          onlySelf: true,
          emitEvent: true
        });

      }
     
    }
  }

  private _onAsLeftChange(
    errorControl: FormControl,
    point: string,
    value: string
  ) {
    if (!MIUtilities.isNullOrUndefinedObject(this.formGroup) && !MIUtilities.isNullOrUndefined(this.formGroup.status)
      && this.formGroup.status !== 'DISABLED') {
      const errorF = this.setError(parseFloat(point), Number(value));
      if(MIUtilities.isZero(errorF)) {
        this.setValForControl(errorControl, 0);
      } else {
        this.setValForControl(errorControl, errorF ? errorF.toFixed(2) : null);
      }
    }
  }

  private setValForControl(ctrl, val){
    ctrl?.setValue(val, {
      onlySelf: true,
      emitEvent: true
    });
  }

  private setError(point: number, value: number) {
    return value ? ((point - value) / point) * 100 : "";
  }

  filterSetPointOptions() {
    if (!this.setPointOptions) {
      return;
    }
    // get the search keyword
    let search = this.filterControl.value;
    if (!search) {
      this.filteredSetPointOptions.next(this.setPointOptions.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the options
    this.filteredSetPointOptions.next(
      this.setPointOptions.filter(option => option.fieldName.toLowerCase().indexOf(search) > -1)
    );
  }
}

