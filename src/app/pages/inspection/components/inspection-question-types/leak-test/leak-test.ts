import { Component, Input, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { LeakTestModel } from "./leak-test.model";
import { QuestionTypesModel } from "src/app/core/models/local/question-types.model";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";

@Component({
  selector: "leak-test",
  templateUrl: "leak-test.html",
  styleUrls: ['./leak-test.scss']
})
export class LeakTestComponent extends BaseInspection implements QuestionTypesModel, OnInit {

  @Input()
  showHelper: boolean = false;
  measurements: LeakTestModel[] = [
    new LeakTestModel(
      "PInitial",
      "Initial Pressure",
      "(P <span>initial</span>)"
    ),
    new LeakTestModel("PFinal", "Final Pressure", "(P <span>final</span>)"),
    new LeakTestModel(
      "VSystem",
      "Leakage monitoring volume",
      "(V<span>system</span>)"
    ),
    new LeakTestModel("Time", "Monitoring time", "(10-30 Min)"),
    new LeakTestModel("LeakRate", "Leak rate", "")
  ];

  formGroup: FormGroup;

  failOptions: DomainModel[] = [];

  maxLeak = 35;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.createForm();
  }

  private createForm() {
    this.failOptions = this.getOptionsObject();


    let items =
      this.response.answer && this.response.answer != "NA"
        ? JSON.parse(this.response.answer)
        : {};
    let details = new FormGroup({
      PInitial: new FormControl(
        items["details"] ? items["details"]["PInitial"] : null,
        Validators.required
      ),
      PFinal: new FormControl(
        items["details"] ? items["details"]["PFinal"] : null,
        Validators.required
      ),
      VSystem: new FormControl(
        items["details"] ? items["details"]["VSystem"] : null,
        Validators.required
      ),
      Time: new FormControl(
        items["details"] ? items["details"]["Time"] : null,
        Validators.required
      ),
      LeakRate: new FormControl(
        {
          value: items["details"] ? items["details"]["LeakRate"] : null,
          disabled: true
        },
        Validators.required
      )
    });

    let passFail = new FormGroup({
      "PassFail": new FormControl(items['passFail'] ? items['passFail']['PassFail'] ? items['passFail']['PassFail'] : null : null),
      "FailureCode": new FormControl(items['passFail'] ? items['passFail']['FailureCode'] ? items['passFail']['FailureCode'] : null : null)
    });


    this.subscription.add(
      details.valueChanges.subscribe(this.onDetailsChanges.bind(this))
    );

    this.formGroup = new FormGroup({
      details,
      passFail
    });

    this.setControl(this.formGroup);
  }
  

  private onDetailsChanges(values) {
    if (this.formGroup.status !== "DISABLED") {
      let LeakRate = this.calculateLeakRate(values);
      let passFail = this.calculatePassFail(LeakRate);
  
      this.updateFormGroup(LeakRate, passFail);
  
      console.log(this.formGroup);
    }
  }
  
  private calculateLeakRate(values): number | null {
    if (this.hasNullValue(values)) {
      return null;
    }
  
    return +(
      ((Number(values.PFinal) - Number(values.PInitial)) *
        Number(values.VSystem)) /
      (Number(values.PInitial) * Number(values.Time))
    ).toFixed(2);
  }
  
  private hasNullValue(values): boolean {
    for (let key in values) {
      if (!values[key] && key !== "LeakRate") {
        return true;
      }
    }
    return false;
  }
  
  private calculatePassFail(LeakRate): string | null {
    return !LeakRate
      ? null
      : LeakRate < this.maxLeak
      ? "Pass"
      : "Fail";
  }
  
  private updateFormGroup(LeakRate, passFail) {
    this.formGroup.patchValue(
      {
        details: { LeakRate },
        passFail: {
          PassFail: passFail,
          ...(["Pass", null].indexOf(passFail) >= 0
            ? { FailureCode: null }
            : {})
        }
      },
      {
        onlySelf: true,
        emitEvent: false
      }
    );
  }
  
}
