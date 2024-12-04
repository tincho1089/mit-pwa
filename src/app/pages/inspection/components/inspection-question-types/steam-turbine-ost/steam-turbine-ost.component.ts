import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { debounceTime, map } from "rxjs/operators";
import { DecimalPipe } from '@angular/common';
import { GovernorTypes, GovernorTypeOptions, OSTLimits } from "./steam-trubine-ost.model";
import { InspectionResponse } from 'src/app/core/sync/entities/inspection-response';
import { merge } from 'rxjs';

@Component({
  selector: 'app-steam-turbine-ost',
  templateUrl: './steam-turbine-ost.component.html',
  styleUrls: ['./steam-turbine-ost.component.scss']
})
export class SteamTurbineOstComponent extends BaseInspection
  implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;
  formGroup: FormGroup;

  governorTypeOptions = GovernorTypeOptions;
  SUCCESSFUL_TEST_MSG = "Successful OST Test";
  FAIL_TEST_MSG = "OST Test Failure";
  static formGroupKeys = {
    STREAM_TURBINE_OST: "Steam turbine overspeed trip (OST) setpoint (i.e., authorized trip speed)",
    MAXIMUM_SEARCH_SPEED: "Maximum search speed (rpm)",
    GOVERNOR_TYPE: "Governor Type",
    ALLOWABLE_TRIP_SPEED_RANGE: "Allowable Trip Speed Range (rpm)",
    TEST1: "Test1",
    TEST1_RESULT: "Test1 Result",
    TEST2: "Test2",
    TEST2_RESULT: "Test2 Result",
    TEST3: "Test3",
    TEST3_RESULT: "Test3 Result"
  }

  constructor(private decimalPipe: DecimalPipe) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.prepareForm();
    this.valueChangeEvents();
  }

  get GET_STREAM_TURBINE_OST() {
    return SteamTurbineOstComponent.formGroupKeys.STREAM_TURBINE_OST;
  }
  get GET_MAXIMUM_SEARCH_SPEED() {
    return SteamTurbineOstComponent.formGroupKeys.MAXIMUM_SEARCH_SPEED;
  }
  get GET_GOVERNOR_TYPE() {
    return SteamTurbineOstComponent.formGroupKeys.GOVERNOR_TYPE;
  }
  get GET_ALLOWABLE_TRIP_SPEED_RANGE() {
    return SteamTurbineOstComponent.formGroupKeys.ALLOWABLE_TRIP_SPEED_RANGE;
  }

  private prepareForm(): void {
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;
  }

  static async create(inspection: InspectionResponse): Promise<FormGroup> {
    const answer = SteamTurbineOstComponent.getAnswerObject(inspection);
    const fromGroup = new FormGroup({
      [this.formGroupKeys.STREAM_TURBINE_OST]: new FormControl(answer[this.formGroupKeys.STREAM_TURBINE_OST], Validators.required),
      [this.formGroupKeys.MAXIMUM_SEARCH_SPEED]: new FormControl(answer[this.formGroupKeys.MAXIMUM_SEARCH_SPEED]),
      [this.formGroupKeys.GOVERNOR_TYPE]: new FormControl(answer[this.formGroupKeys.GOVERNOR_TYPE], Validators.required),
      [this.formGroupKeys.ALLOWABLE_TRIP_SPEED_RANGE]: new FormControl(answer[this.formGroupKeys.ALLOWABLE_TRIP_SPEED_RANGE], Validators.required),
    });

    return fromGroup;
  }

  getControlValue(key: string) {
    return this.formGroup.get([key])?.value;
  }

  private valueChangeEvents() {
    this.formGroup.get([this.GET_STREAM_TURBINE_OST]).valueChanges.pipe(
      debounceTime(500),
      map((value) => value)
    ).subscribe((value: number) => {
      if (!value) {
        this.formGroup.get([this.GET_ALLOWABLE_TRIP_SPEED_RANGE]).reset();
        this.formGroup.get([this.GET_MAXIMUM_SEARCH_SPEED]).reset();
      }

      const maximumSearchSpeed = value * 1.05;
      this.formGroup.get([this.GET_MAXIMUM_SEARCH_SPEED]).setValue(maximumSearchSpeed);
    });

    merge(
      this.formGroup.get([this.GET_GOVERNOR_TYPE])?.valueChanges.pipe(
        debounceTime(500)
      ),
      this.formGroup.get([this.GET_STREAM_TURBINE_OST])?.valueChanges.pipe(
        debounceTime(500)
      )).subscribe(() => {
        this.displayAllowableTripSpeedRange();
      })
  }

  displayAllowableTripSpeedRange() {
    let governorType = this.formGroup.get([this.GET_GOVERNOR_TYPE]).value;
    if (governorType === GovernorTypes.NemaA) {
      this.setAllowableTripSpeedRange(OSTLimits.Ral, OSTLimits.Rah)
    } else if (governorType === GovernorTypes.NemaD) {
      this.setAllowableTripSpeedRange(OSTLimits.Rdl, OSTLimits.Rdh)
    }
  }

  setAllowableTripSpeedRange(low: number, high: number) {
    let streamTurbineOST = this.formGroup.get([this.GET_STREAM_TURBINE_OST])?.value;
    if (streamTurbineOST) {
      let lowFormat = this.decimalPipe.transform(streamTurbineOST * low, '1.2-2');
      let highFormat = this.decimalPipe.transform(streamTurbineOST * high, '1.2-2');
      this.formGroup.get([this.GET_ALLOWABLE_TRIP_SPEED_RANGE]).setValue(`${lowFormat} rpm - ${highFormat} rpm`);
    }
  }

  getGovernorTypeText(key: string): string {
    return this.governorTypeOptions.find(g => g.value == this.formGroup.get([key]).value).description;
  }

  getClassName(message: string) {
    return {
      success: message === this.SUCCESSFUL_TEST_MSG,
      fail: message === this.FAIL_TEST_MSG
    }
  }

  getIconName(message: string) {
    if (message === this.SUCCESSFUL_TEST_MSG) {
      return "check_circle";
    } else if (message === this.FAIL_TEST_MSG) {
      return "highlight_off";
    } else {
      return "";
    }
  }

  reset() {
    this.formGroup.get([this.GET_STREAM_TURBINE_OST]).reset();
    this.formGroup.get([this.GET_GOVERNOR_TYPE]).reset();
    this.formGroup.get([this.GET_ALLOWABLE_TRIP_SPEED_RANGE]).reset();
    return false;
  }

}
