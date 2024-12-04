import { Component, Input, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { DomainModel } from "src/app/core/models/local/domain.model";
import { QuestionTypesModel } from "src/app/core/models/local/question-types.model";
import { BaseInspection } from "../../../classes/base-inspection";
import { InspectionResponse } from "src/app/core/sync/entities";
@Component({
  selector: "calibration-percent-span",
  templateUrl: "calibration-percent-span.html",
  styleUrls: ['./calibration-percent-span.scss']
})
export class CalibrationPercentSpanComponent extends BaseInspection implements QuestionTypesModel, OnInit {
  @Input()
  override editable: boolean = true;
  @Input()
  showHelper: boolean = false;

  static staticSpans: DomainModel[] = [
    new DomainModel("0%"),
    new DomainModel("50%"),
    new DomainModel("100%")
  ];
  spans: DomainModel[] = [];
  formGroup: FormGroup;
  failOptions: DomainModel[] = [];
  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.failOptions = this.getOptionsObject();
    this.prepareForm();
  }

  static async create(inspection: InspectionResponse): Promise<FormGroup> {
    const answer = this.getAnswerObject(inspection);
    let passFail = null;
    let failureCode = null;
    const details = new FormArray(
      this.staticSpans.map(
        (span, index): FormGroup => {
          let asFoundValue = null;
          let errorFValue = null;
          let asLeftValue = null;
          let errorLValue = null;

          try {
            asFoundValue = answer["details"][index]["AsFound"];
            errorFValue = answer["details"][index]["ErrorF"].replace("%", "");
            asLeftValue = answer["details"][index]["AsLeft"];
            errorLValue = answer["details"][index]["ErrorL"].replace("%", "");

          } catch {

          }
          const group = new FormGroup(
            {
              PercentSpan: new FormControl(span.value ? span.value : ""),
              AsFound: new FormControl(asFoundValue , Validators.required),
              ErrorF: new FormControl(
                {
                  value: errorFValue,
                  disabled: true
                },
                Validators.required
              ),
              AsLeft: new FormControl(asLeftValue),
              ErrorL: new FormControl({
                value: errorLValue,
                disabled: true
              })
            },
            [this.validateAsLeft.bind(this)]
          );
          return group;
        }
      )
    );
    try {
      passFail = answer['passFail']['PassFail'];
      failureCode = answer['passFail']['FailureCode'];
    } catch { }
    const form = new FormGroup({
      details,
      passFail: new FormGroup(
        {
          PassFail: new FormControl(passFail, Validators.required),
          FailureCode: new FormControl(failureCode),
        },
        [this._validatePassFail]
      )
    });

    return form;
  }

  private setDisabledState(group: FormGroup) {
    // Moved this away from the html b/c console warning
    // Pretty complex conditional - may need some love
    if (this.form.get(this.sectionArray)?.status !== 'DISABLED') {
      group.get('ErrorF').disable();
      group.get('ErrorL').disable();
      group.get('AsLeft').enable();
      group.get('AsFound').enable();
      if (this.isValidError(group.get('ErrorF').value)) {
        group.get('AsLeft').disable();
        group.get('AsLeft').setValue('', {
          onlySelf: true,
          emitEvent: false
        });
      }
    } else {
      group.get('AsFound').disable();
      group.get('AsLeft').disable();
      group.get('ErrorF').enable();
      group.get('ErrorL').enable();
    }
  }

  private prepareForm(): void {
    this.spans = CalibrationPercentSpanComponent.staticSpans;
    this.formGroup = this.form?.get(this.sectionArray) as FormGroup;
    const details = this.formGroup?.get("details") as FormArray;
    details.controls.forEach(group => {
      this.subscription.add(
        group
          .get("AsFound")
          .valueChanges.subscribe(
            this.onValueChanges.bind(this, group, "ErrorF")
          )
      );
      this.subscription.add(
        group
          .get("AsLeft")
          .valueChanges.subscribe(
            this.onValueChanges.bind(this, group, "ErrorL")
          )
      );
      this.setDisabledState(group as FormGroup);
    });
    this.subscription.add(
      details.valueChanges.subscribe(this.onDetailsChange.bind(this, details))
    );
  }

  static _validatePassFail(group: FormGroup): any {
    if (group.controls['PassFail'].value === 'Pass') return null;
    return Validators.required(group.controls['FailureCode']);
  }

  private onValueChanges(group: FormGroup, control: string, value: number) {
    if (group.status !== "DISABLED") {
    let error = (value === 0 || value)
      ? (value - parseFloat(group.get("PercentSpan").value))
      : "";
      group.get(control).setValue(error);
      if (control === "ErrorF") {
        if (this.isValidError(error) === true) {
          group.get('AsLeft').disable({
            onlySelf: true,
            emitEvent: false
          });
          group.get('AsLeft').setValue('', {
            onlySelf: true,
            emitEvent: true
          });
        }
        else {
          group.get('AsLeft').enable({
            onlySelf: true,
            emitEvent: true
          });

        }
      }
    }
    else {
      console.log(" elseHere---")
    }
  }

  private onDetailsChange(group: FormGroup) {
    if (group.status !== "DISABLED") {
      let PassFail = "";
      if (group.status === "VALID") {
        PassFail = CalibrationPercentSpanComponent.staticSpans.some(
          (span, index) => {
            let valueF = group.get(index + ".ErrorF").value;
            let valueL = group.get(index + ".ErrorL").value;
            return !this.isValidError(valueF) && !this.isValidError(valueL);
          }
        )
          ? "Fail"
          : "Pass";
      }
      this.formGroup.get("passFail").patchValue({
        PassFail,
        ...(["Pass", null].indexOf(PassFail) >= 0 ? { FailureCode: null } : {})
      });
    }
  }

  getPassFailStatus() {
    let PassFail = "";
    if (this.formGroup.status === "VALID") {
      PassFail = CalibrationPercentSpanComponent.staticSpans.some(
        (span, index) => {
          let valueF = this.formGroup.get(index + ".ErrorF").value;
          let valueL = this.formGroup.get(index + ".ErrorL").value;
          return !this.isValidError(valueF) && !this.isValidError(valueL);
        }
      )
        ? "Fail"
        : "Pass";
    }
    return PassFail;
  }


}
