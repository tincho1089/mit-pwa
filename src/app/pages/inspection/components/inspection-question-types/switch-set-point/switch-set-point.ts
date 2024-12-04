import { Component, Input } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";
import { MIUtilities } from "src/app/shared/utility";

@Component({
  selector: "switch-set-point",
  templateUrl: "switch-set-point.html",
  styleUrls: ['switch-set-point.scss']
})
export class SwitchSetPointComponent extends BaseInspection {

  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  failOptions: DomainModel[] = [];
  asFoundGreen: boolean = false;
  asLeftGreen: boolean = false;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.failOptions = this.getOptionsObject();
  }

  private _validatePassFail(group: FormGroup): any {
    if (group.controls["PassFail"].value === "Pass") return null;
    return Validators.required(group.controls["FailureCode"]);
  }

  private async _createForm() {
    const answer = this.getAnswerObject();
    let switchSetPoint = null;
    let spanUnit = null;
    let acc = null;
    let accuracy = null;
    let asFoundSwitchTripPoint = null;
    let asLeftSwitchTripPoint = null;
    let failureCodeFound = null;
    let failureCodeLeft = null;
    let asFoundResult = null;
    let asLeftResult = null;
    let asFoundError = null;
    let asLeftError = null;

    switchSetPoint = await this.getSwitchSetPoint(answer);

    spanUnit = await this.getSpanUnit();

    accuracy = await this.getAccuracy(answer);

    try {
      asFoundSwitchTripPoint = answer["details"]["As Found Switch Trip Point"];
      asFoundError = answer["details"]["As Found Error"];
      asLeftSwitchTripPoint = answer["details"]["As Left Switch Trip Point"];
      asLeftError = answer["details"]["As Left Error"];

      asFoundResult = answer["asFoundResult"]["PassFail"];
      failureCodeLeft = answer["asFoundResult"]["FailureCode"];

      asLeftResult = answer["asLeftResult"]["PassFail"];
      failureCodeFound = answer["asLeftResult"]["FailureCode"];
    } catch {
      console.log("Error getting the information");
    }

    const formGroupConfig: FormGroupConfig = {
      details: {
        switchSetPoint,
        spanUnit,
        accuracy,
        asFoundSwitchTripPoint,
        asFoundError,
        asLeftSwitchTripPoint,
        asLeftError,
      },
      asFoundResult: {
        PassFail: asFoundResult,
        FailureCode: failureCodeLeft,
      },
      asLeftResult: {
        PassFail: asLeftResult,
        FailureCode: failureCodeFound,
      },
    };
    
    this.setFormGroup(formGroupConfig);
    

    this.checkValidations();

    this.subScribeForSwitchSetPoint();

    this.subscribeAsFSwitchTripPoint();

    this.subscribeAsLSwitchTripPoint();

    this.setControl(this.formGroup);
  }

  private async getAccuracy(answer) {
    let acc, accuracy;
    acc = this.getSetting("Accuracy"); //get accuracy from db
    if(!acc) //if undefined in db
    {
      if(!answer?.details?.Accuracy) //if text box is blank, default to 2
        acc = 2;
      else //else acc equals the input in text box
        acc = answer?.details?.Accuracy;
    }
    try {
      accuracy = MIUtilities.parseDynamicNumericString(acc)
    }
    catch {
      console.warn('[SwitchSetPoint] Failed to parse accuracy');
    }
    return accuracy; //if null, value will be editable
  }

  private async getSwitchSetPoint(answer) {
    let switchSetPoint = answer?.details?.["Switch Set Point"];
    let ans = null;
    if (!switchSetPoint)
       switchSetPoint = this.getSetting("Cal TP1");
    if (switchSetPoint)
      ans = MIUtilities.parseDynamicNumericString(switchSetPoint);
    return ans;
  }

  private async getSpanUnit() {
    let spanUnit = this.getSetting("Unit");
    if (!spanUnit) {
      spanUnit = this.getSetting("Span Unit");
    }
    if (!spanUnit) {
      spanUnit = this.getSetting("Set Point Unit");
    }

    if (!spanUnit) {
      spanUnit = "seconds";
    }
    return spanUnit;
  }
  
  private setFormGroup(config: FormGroupConfig) {
    const { details, asFoundResult, asLeftResult } = config;
  
    this.formGroup = new FormGroup({
      details: new FormGroup({
        "Switch Set Point": new FormControl(
          {
            value: details.switchSetPoint,
            disabled: false, //if exists, disable
          },
          Validators.required
        ),
        "Span Unit": new FormControl(
          {
            value: details.spanUnit,
            disabled: true,
          },
          Validators.required
        ),
        Accuracy: new FormControl(
          {
            value: details.accuracy,
            disabled: (this.getSetting("Accuracy")), // if exists, disable
          },
          Validators.required
        ),
        "As Found Switch Trip Point": new FormControl(
          details.asFoundSwitchTripPoint,
          Validators.required
        ),
        "As Found Error": new FormControl(
          {
            value: details.asFoundError,
            disabled: true
          }, Validators.required),
        "As Left Switch Trip Point": new FormControl(
          details.asLeftSwitchTripPoint,
          Validators.required
        ),
        "As Left Error": new FormControl(
          {
            value: details.asLeftError,
            disabled: true
          }, Validators.required),
      }),
      asFoundResult: new FormGroup(
        {
          PassFail: new FormControl(asFoundResult.PassFail, Validators.required),
          FailureCode: new FormControl(asFoundResult.FailureCode),
        },
        this._validatePassFail
      ),
      asLeftResult: new FormGroup({
        PassFail: new FormControl(asLeftResult.PassFail, Validators.required),
        FailureCode: new FormControl(asLeftResult.FailureCode),
      }),
    });
  }
  
  private subScribeForSwitchSetPoint() {
    this.subscription.add(
      this.formGroup
        .get("details.Switch Set Point")
        .valueChanges.subscribe((value) => {
          this.formGroup.get("details.Switch Set Point").patchValue(value, {
            onlySelf: true,
            emitEvent: false,
          });

          this.formGroup
            .get("details.As Found Switch Trip Point")
            .setValue(
              this.formGroup.get("details.As Found Switch Trip Point").value
            );

          this.formGroup
            .get("details.As Left Switch Trip Point")
            .setValue(
              this.formGroup.get("details.As Left Switch Trip Point").value
            );
        })
    );
  }

  private subscribeAsFSwitchTripPoint() {
    this.subscription.add(
      this.formGroup
        .get("details.As Found Switch Trip Point")
        .valueChanges.subscribe((value) => {
          const leftSideOp =
            (1 - this.formGroup.get("details.Accuracy").value / 100) *
            this.formGroup.get("details.Switch Set Point").value;
          const rightSideOp =
            (1 + this.formGroup.get("details.Accuracy").value / 100) *
            this.formGroup.get("details.Switch Set Point").value;
          let PassFail = this.determinePassFail(value, leftSideOp, rightSideOp);

          this.asFoundGreen = PassFail === "Pass";
          const error =
            ((Number(value) -
              this.formGroup.get("details.Switch Set Point").value) /
              this.formGroup.get("details.Switch Set Point").value) *
            100;
          this.formGroup
            .get("details.As Found Error")
            .patchValue(!isFinite(error) ? 0.0 : error.toFixed(2));
          this.formGroup.get("asFoundResult").patchValue(
            {
              PassFail,
              ...(["Pass", null].indexOf(PassFail) >= 0
                ? { FailureCode: null }
                : {}),
            },
            {
              onlySelf: true,
              emitEvent: true,
            }
          );

          // When as found failed, we show as left
          this.checkValidations();
        })
    );
  }

  private subscribeAsLSwitchTripPoint() {
    this.subscription.add(
      this.formGroup
        .get("details.As Left Switch Trip Point")
        .valueChanges.subscribe((value) => {
          const leftSideOp =
            (1 - this.formGroup.get("details.Accuracy").value / 100) *
            this.formGroup.get("details.Switch Set Point").value;
          const rightSideOp =
            (1 + this.formGroup.get("details.Accuracy").value / 100) *
            this.formGroup.get("details.Switch Set Point").value;
          let PassFail = this.determinePassFail(value, leftSideOp, rightSideOp);
          this.asLeftGreen = PassFail === "Pass";
          const error =
            ((Number(value) -
              this.formGroup.get("details.Switch Set Point").value) /
              this.formGroup.get("details.Switch Set Point").value) *
            100;
          this.formGroup
            .get("details.As Left Error")
            .patchValue(!isFinite(error) ? 0.0 : error.toFixed(2));
          this.formGroup.get("asLeftResult").patchValue(
            {
              PassFail,
              ...(["Pass", null].indexOf(PassFail) >= 0
                ? { FailureCode: null }
                : {}),
            },
            {
              onlySelf: true,
              emitEvent: true,
            }
          );
        })
    );
  }

  private determinePassFail(value: any, leftSideOp: number, rightSideOp: number): string | null {
    if (!value) {
      return null;
    }

    const numericValue = Number(value);

    if (leftSideOp < numericValue && numericValue < rightSideOp) {
      return "Pass";
    } else {
      return "Fail";
    }
  }

  checkValidations() {
    const hideAsLeft =
      this.formGroup.get("asFoundResult.PassFail").value === "Pass";
    if (hideAsLeft) {
      // reset as Left values previously selected
      this.formGroup.get("details.As Left Switch Trip Point").patchValue(0.0);

      // reset validations
      this.formGroup.get("details.As Left Switch Trip Point").clearValidators();
      this.formGroup.get("details.As Left Error").clearValidators();
      this.formGroup.get("asLeftResult.PassFail").clearValidators();
      this.formGroup.get("asLeftResult.PassFail").updateValueAndValidity();
      this.formGroup.get("asLeftResult.FailureCode").clearValidators();
      this.formGroup.get("asLeftResult").clearValidators();
      this.formGroup.get("asLeftResult").updateValueAndValidity();
      this.formGroup.updateValueAndValidity({
        emitEvent: false
      });
    } else {
      // add validations
      this.formGroup
        .get("details.As Left Switch Trip Point")
        .setValidators([Validators.required]);
      this.formGroup
        .get("details.As Left Error")
        .setValidators([Validators.required]);
      this.formGroup
        .get("asLeftResult.PassFail")
        .setValidators([Validators.required]);
      this.formGroup.get("asLeftResult").setValidators(this._validatePassFail);
      this.formGroup.updateValueAndValidity({
        emitEvent: false
      });
    }
  }
}

interface FormGroupConfig {
  details: {
    switchSetPoint: any;
    spanUnit: any;
    accuracy: any;
    asFoundSwitchTripPoint: any;
    asFoundError: any;
    asLeftSwitchTripPoint: any;
    asLeftError: any;
  };
  asFoundResult: {
    PassFail: any;
    FailureCode: any;
  };
  asLeftResult: {
    PassFail: any;
    FailureCode: any;
  };
}
