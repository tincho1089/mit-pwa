import { Component, Input } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";
import { InspectionResponse } from "src/app/core/sync/entities";

const MINIMUM = "Minimum Response Time";
const MAXIMUM = "Maximum Response Time";
const ACTUAL = "Actual Response Time";
@Component({
  selector: "valve-response-test",
  templateUrl: "valve-response-test.html",
  styleUrls: ['./valve-response-test.scss'],
})
export class ValveResponseTestComponent extends BaseInspection {;
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  minResponseTime: string = '0';
  maxResponseTime: string = null;
  failOptions: Array<DomainModel> = [];

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.prepareForm();
    this.failOptions = this.getOptionsObject();
  }

  private prepareForm() {
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;
    const min = this.getSetting(MINIMUM);
    if (min) { //defaults min response time to 0
      this.minResponseTime = min;
    }
    
    this.maxResponseTime = this.getSetting(MAXIMUM);
    this.updatePassFail();

    this.formGroup.get("details." + MINIMUM).setValue(this.minResponseTime);
    this.formGroup.get("details." + MAXIMUM).setValue(this.maxResponseTime);
    this.subscription.add(
      this.formGroup.get("details." + ACTUAL).valueChanges.subscribe(value => {
        this.updatePassFail();
      })
    );
  }

  static async create(
    inspection: InspectionResponse
  ): Promise<FormGroup> {
    const answer = this.getAnswerObject(inspection);
    let actualResponseTime = null;
    let minResponseTime = null;
    let maxResponseTime = null;

    actualResponseTime = answer?.details ?
          answer.details[ACTUAL]:
          null;
    let PassFail = null;
    let FailureCode = null;
    try {
      PassFail = answer['passFail']['PassFail'];
      FailureCode = answer['passFail']['FailureCode'];
    } catch {}

    const form = new FormGroup({
      details: new FormGroup({
        [MINIMUM]: new FormControl(
          {
            value: minResponseTime,
            disabled: true
          },
          Validators.required
        ),
        [MAXIMUM]: new FormControl({
          value: maxResponseTime,
          disabled: true
        }),
        [ACTUAL]: new FormControl(actualResponseTime, Validators.required)
      }),
      passFail: new FormGroup(
        {
          PassFail: new FormControl(PassFail, Validators.required),
          FailureCode: new FormControl(FailureCode),
        },
        this._validatePassFail
      )
    });
    return form;
  }
  updatePassFail() {
    let PassFail = this.getPassFail();
    this.formGroup.get("passFail").patchValue(
      {
        PassFail,
        ...(["Pass", null].indexOf(PassFail) >= 0
          ? { FailureCode: null }
          : {})
      },
      {
        onlySelf: true,
        emitEvent: true
      }
    );
  }
  getPassFail(): string {
    let value = this.formGroup.get("details." + ACTUAL).value;
    if (value && this.maxResponseTime) {
        
      return Number(value) >= Number(this.minResponseTime) &&
        Number(value) <= Number(this.maxResponseTime)
          ? "Pass"
          : "Fail";
    } else if (value && !this.maxResponseTime) {
      return Number(value) > Number(this.minResponseTime) ? "Pass" : "Fail";
    }
    return 'Fail'
  }

  private static _validatePassFail(group: FormGroup): any {
    if (group.controls['PassFail'].value === 'Pass') return null;
    return Validators.required(group.controls["FailureCode"]);
  }
}
