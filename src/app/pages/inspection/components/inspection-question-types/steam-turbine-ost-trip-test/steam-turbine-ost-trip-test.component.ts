import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { debounceTime, map } from "rxjs/operators";
import { DecimalPipe } from '@angular/common';
import { GovernorTypes, GovernorTypeOptions, OSTLimits, OSTDeltas, SUCCESSFUL_TEST_MSG, FAIL_TEST_MSG } from "./steam-trubine-ost-trip-test.model";
import { InspectionResponse } from 'src/app/core/sync/entities/inspection-response';
import { merge } from 'rxjs';
import { ValidateTestCase } from './validate-test';

@Component({
  selector: 'app-steam-turbine-ost-trip-test',
  templateUrl: './steam-turbine-ost-trip-test.component.html',
  styleUrls: ['./steam-turbine-ost-trip-test.component.scss']
})
export class SteamTurbineOstComponentTripTest extends BaseInspection
  implements QuestionTypesModel {
  @Input()
  override editable: boolean = true;
  @Input()
  showHelper: boolean = false;
  formGroup: FormGroup;

  governorTypeOptions = GovernorTypeOptions;

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
    return SteamTurbineOstComponentTripTest.formGroupKeys.STREAM_TURBINE_OST;
  }
  get GET_MAXIMUM_SEARCH_SPEED() {
    return SteamTurbineOstComponentTripTest.formGroupKeys.MAXIMUM_SEARCH_SPEED;
  }
  get GET_GOVERNOR_TYPE() {
    return SteamTurbineOstComponentTripTest.formGroupKeys.GOVERNOR_TYPE;
  }
  get GET_ALLOWABLE_TRIP_SPEED_RANGE() {
    return SteamTurbineOstComponentTripTest.formGroupKeys.ALLOWABLE_TRIP_SPEED_RANGE;
  }
  get GET_TEST1() {

    return SteamTurbineOstComponentTripTest.formGroupKeys.TEST1;
  }
  get GET_TEST2() {
    return SteamTurbineOstComponentTripTest.formGroupKeys.TEST2;
  }
  get GET_TEST3() {
    return SteamTurbineOstComponentTripTest.formGroupKeys.TEST3;
  }
  get GET_TEST1_RESULT() {
    return SteamTurbineOstComponentTripTest.formGroupKeys.TEST1_RESULT;
  }
  get GET_TEST2_RESULT() {
    return SteamTurbineOstComponentTripTest.formGroupKeys.TEST2_RESULT;
  }
  get GET_TEST3_RESULT() {
    return SteamTurbineOstComponentTripTest.formGroupKeys.TEST3_RESULT;
  }

  private prepareForm(): void {
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;
  }

  static async create(inspection: InspectionResponse): Promise<FormGroup> {

    const answer = SteamTurbineOstComponentTripTest.getAnswerObject(inspection);

    const fromGroup = new FormGroup({
      [this.formGroupKeys.STREAM_TURBINE_OST]: new FormControl(this.setAnswer(answer, this.formGroupKeys.STREAM_TURBINE_OST), Validators.required),
      [this.formGroupKeys.MAXIMUM_SEARCH_SPEED]: new FormControl(this.setAnswer(answer, this.formGroupKeys.MAXIMUM_SEARCH_SPEED)),
      [this.formGroupKeys.GOVERNOR_TYPE]: new FormControl(this.setAnswer(answer, this.formGroupKeys.GOVERNOR_TYPE), Validators.required),
      [this.formGroupKeys.ALLOWABLE_TRIP_SPEED_RANGE]: new FormControl(this.setAnswer(answer, this.formGroupKeys.ALLOWABLE_TRIP_SPEED_RANGE), Validators.required),
      [this.formGroupKeys.TEST1]: new FormControl(this.setAnswer(answer, this.formGroupKeys.TEST1), Validators.required),
      [this.formGroupKeys.TEST2]: new FormControl(this.setAnswer(answer, this.formGroupKeys.TEST2), Validators.required),
      [this.formGroupKeys.TEST3]: new FormControl(this.setAnswer(answer, this.formGroupKeys.TEST3), Validators.required),
      [this.formGroupKeys.TEST1_RESULT]: new FormControl(this.setAnswer(answer, this.formGroupKeys.TEST1_RESULT), ValidateTestCase),
      [this.formGroupKeys.TEST2_RESULT]: new FormControl(this.setAnswer(answer, this.formGroupKeys.TEST2_RESULT), ValidateTestCase),
      [this.formGroupKeys.TEST3_RESULT]: new FormControl(this.setAnswer(answer, this.formGroupKeys.TEST3_RESULT), ValidateTestCase),
    });

    return fromGroup;
  }

  private static setAnswer(answer: any, name: string): any {
    return answer ? answer[name] : null;
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


  runTests() {
    const test1 = Number(this.formGroup.get([this.GET_TEST1]).value);
    const test2 = Number(this.formGroup.get([this.GET_TEST2]).value);
    const test3 = Number(this.formGroup.get([this.GET_TEST3]).value);
    const testInputs = [test1, test2, test3]
    testInputs.forEach((value, index) => {
      this.runTest(value, index, testInputs)
    });
  }

  runTest(value: number, index: number, testInputs: number[]) {
    let governorType = this.formGroup.get([this.GET_GOVERNOR_TYPE]).value;
    let streamTurbineOST = this.formGroup.get([this.GET_STREAM_TURBINE_OST]).value;
    const rdl = streamTurbineOST * OSTLimits.Rdl;
    const rdh = streamTurbineOST * OSTLimits.Rdh;
    const ral = streamTurbineOST * OSTLimits.Ral;
    const rah = streamTurbineOST * OSTLimits.Rah;

    let result = '';
    if (governorType === GovernorTypes.NemaD) {
      const lowDelta = streamTurbineOST * OSTDeltas.Ddl;
      const highDelta = streamTurbineOST * OSTDeltas.Ddh;
      result = this.evaluateTest(value, rdl, rdh, lowDelta, highDelta, testInputs, result);
    }

    else if (governorType === GovernorTypes.NemaA) {
      const lowDelta = streamTurbineOST * OSTDeltas.Dal;
      const highDelta = streamTurbineOST * OSTDeltas.Dah;
      result = this.evaluateTest(value, ral, rah, lowDelta, highDelta, testInputs, result);
    }

    this.setTestResult(index, result);
  }

  private evaluateTest(value: number, low: number, high: number, lowDelta: number, highDelta: number, testInputs: number[], result: string) {
    const isBetween = low <= value && value <= high;
    const test1 = testInputs[0];
    const test2 = testInputs[1];
    const test3 = testInputs[2];

    if ((isBetween && (test1 <= test2 && test2 >= test3)) ||
      (isBetween && (test1 >= test2 && test2 <= test3)) ||
      (isBetween && (
        (lowDelta <= test1 && test1 <= highDelta) &&
        (lowDelta <= test2 && test2 <= highDelta) &&
        (lowDelta <= test3 && test3 <= highDelta)))) {
      result = SUCCESSFUL_TEST_MSG;
    } else if (!isBetween ||
      (test1 <= test2 && test2 <= test3) ||
      (test1 >= test2 && test2 >= test3)) {
      result = FAIL_TEST_MSG;
    }
    return result;
  }

  private setTestResult(index: number, result: string) {
    switch (index) {
      case 0:
        this.formGroup.get([this.GET_TEST1_RESULT]).setValue(result);
        break;
      case 1:
        this.formGroup.get([this.GET_TEST2_RESULT]).setValue(result);
        break;
      case 2:
        this.formGroup.get([this.GET_TEST3_RESULT]).setValue(result);
        break;

      default:
        break;
    }
  }

  getGovernorTypeText(key: string): string {
    return this.governorTypeOptions.find(g => g.value == this.formGroup.get([key]).value).description;
  }

  getClassName(message: string) {
    return {
      success: message === SUCCESSFUL_TEST_MSG,
      fail: message === FAIL_TEST_MSG
    }
  }

  getIconName(message: string) {
    if (message === SUCCESSFUL_TEST_MSG) {
      return "check_circle";
    } else if (message === FAIL_TEST_MSG) {
      return "highlight_off";
    } else {
      return "";
    }
  }

   disabled() : boolean {
    return this.formGroup.get([this.GET_STREAM_TURBINE_OST]).invalid || 
    this.formGroup.get([this.GET_TEST1]).invalid ||
    this.formGroup.get([this.GET_TEST2]).invalid ||
    this.formGroup.get([this.GET_TEST3]).invalid;
  }

  reset() {
    this.formGroup.get([this.GET_STREAM_TURBINE_OST]).reset();
    this.formGroup.get([this.GET_GOVERNOR_TYPE]).reset();
    this.formGroup.get([this.GET_ALLOWABLE_TRIP_SPEED_RANGE]).reset();
    this.formGroup.get([this.GET_TEST1]).reset();
    this.formGroup.get([this.GET_TEST2]).reset();
    this.formGroup.get([this.GET_TEST3]).reset();
    this.formGroup.get([this.GET_TEST1_RESULT]).reset();
    this.formGroup.get([this.GET_TEST2_RESULT]).reset();
    this.formGroup.get([this.GET_TEST3_RESULT]).reset();
    return false;
  }

}
