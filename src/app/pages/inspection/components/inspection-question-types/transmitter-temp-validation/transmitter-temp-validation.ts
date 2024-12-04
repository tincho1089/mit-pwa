import { Component, Input } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";

@Component({
  selector: "transmitter-temp-validation",
  templateUrl: "transmitter-temp-validation.html",
  styleUrls: ['./transmitter-temp-validation.scss']
})
export class TransmitterTempValidationComponent extends BaseInspection {
  @Input()
  showHelper: boolean = false;
  formGroup: FormGroup;
  failOptions: Array<DomainModel> = [];
  detailsDomain: Array<DomainModel> = [
    new DomainModel("AsFound", "As Found"),
    new DomainModel("AsLeft", "As Left")
  ];
  columns: Array<DomainModel> = [];
  rows = [0, 1];
  units: string = "";
  commonUnit: string = "(mA)";

  constructor() {
    super();
  }

  override ngOnInit(){
    super.ngOnInit();
    this.createForm();
    this.failOptions = this.getOptionsObject();
    try {
      this.units = this.getSetting("Unit");
      if (!this.units)
        this.units = this.getSetting("Span Unit");
      if (!this.units)
        this.units = this.getSetting("Set Point Unit");
      if (this.units) this.units = " (" + this.units + ")";
    } catch {}
    this.columns = [
      new DomainModel("Test Input", "Test Input" + this.units),
      new DomainModel("Target Output", "Target Output " + this.commonUnit),
      new DomainModel("Target Output2", "Target Output " + this.commonUnit),
      new DomainModel("Actual Output", "Actual Output " + this.commonUnit),
      new DomainModel("Error", "%Error")
    ];
  }

  private createForm() {
    const answer = this.getAnswerObject();
    let asFPassFail = null;
    let asLPassFail = null;
    let failureCode = null;

    const asFoundForm = new FormArray(
      this.rows.map(
        (row): FormGroup => {
          let testInputValue = null;
          let targetOutputValue = null;
          let targetOutput2Value = null;
          let actualOutputValue = null;
          let errorValue = null;
          try {
            testInputValue = answer.details.AsFound[row]["Test Input"];
            targetOutputValue = answer.details.AsFound[row]["Target Output"];
            targetOutput2Value = answer.details.AsFound[row]["Target Output2"];
            actualOutputValue = answer.details.AsFound[row]["Actual Output"];
            errorValue = answer.details.AsFound[row]["Error"];
          } catch {}
          const testInput = new FormControl(
            testInputValue,
            Validators.required
          );
          const targetOutput2 = new FormControl(
            targetOutput2Value,
            Validators.required
          );
          const group = new FormGroup({
            "Test Input": testInput,
            "Target Output": new FormControl(
              targetOutputValue,
              Validators.required
            ),
            "Target Output2": targetOutput2,
            "Actual Output": new FormControl(
              actualOutputValue,
              Validators.required
            ),
            Error: new FormControl(errorValue, Validators.required)
          });

          this.subscription.add(
            testInput.valueChanges.subscribe(
              this.onTestInputValueChanges.bind(this, group, true)
            )
          );

          this.subscription.add(
            targetOutput2.valueChanges.subscribe(
              this.onTargetOutput2ValueChanges.bind(this, group, true)
            )
          );

          this.subscription.add(
            group.valueChanges.subscribe(
              this.onGroupValueChanges.bind(this, "AsFound")
            )
          );

          return group;
        }
      )
    );
    const asLeftForm = new FormArray(
      this.rows.map(
        (row): FormGroup => {
          let testInputValue = null;
          let targetOutputValue = null;
          let targetOutput2Value = null;
          let actualOutputValue = null;
          let errorValue = null;
          try {
            testInputValue = answer.details.AsLeft[row]["Test Input"];
            targetOutputValue = answer.details.AsLeft[row]["Target Output"];
            targetOutput2Value = answer.details.AsLeft[row]["Target Output2"];
            actualOutputValue = answer.details.AsLeft[row]["Actual Output"];
            errorValue = answer.details.AsLeft[row]["Error"];
          } catch {}
          const testInput = new FormControl(
            testInputValue,
            Validators.required
          );
          const targetOutput2 = new FormControl(
            targetOutput2Value,
            Validators.required
          );
          const group = new FormGroup({
            "Test Input": testInput,
            "Target Output": new FormControl(
              targetOutputValue,
              Validators.required
            ),
            "Target Output2": targetOutput2,
            "Actual Output": new FormControl(
              actualOutputValue,
              Validators.required
            ),
            Error: new FormControl(errorValue, Validators.required)
          });

          this.subscription.add(
            testInput.valueChanges.subscribe(
              this.onTestInputValueChanges.bind(this, group, false)
            )
          );

          this.subscription.add(
            targetOutput2.valueChanges.subscribe(
              this.onTargetOutput2ValueChanges.bind(this, group, false)
            )
          );

          this.subscription.add(
            group.valueChanges.subscribe(
              this.onGroupValueChanges.bind(this, "AsLeft")
            )
          );

          return group;
        }
      )
    );

    try {
      asFPassFail = answer.passFail.AsFPassFail;
      asLPassFail = answer.passFail.AsLPassFail;
      failureCode = answer.passFail.FailureCode;
    } catch {}

    this.formGroup = new FormGroup(
      {
        details: new FormGroup({
          AsFound: asFoundForm,
          AsLeft: asLeftForm
        }),
        passFail: new FormGroup({
          AsFPassFail: new FormControl(asFPassFail, Validators.required),
          AsLPassFail: new FormControl(asLPassFail),
          FailureCode: new FormControl(failureCode)
        })
      },
      [this.validateFailure, this.validateAsLPassFail]
    );
    if (asFPassFail === "Pass") {
      this.formGroup
        .get("details.AsLeft")
        .disable({ onlySelf: false, emitEvent: false });
    }

    this.setControl(this.formGroup);
  }

  private onTestInputValueChanges(
    group: FormGroup,
    resetPassFail = false,
    value: number
  ) {
    let target = null;
    let error = null;
    try {
      if (value) {
        target = (0.04 * value).toFixed(2);
        error =
          ((parseFloat(group.get("Target Output2").value) -
            parseFloat(target)) /
            16) *
          100;
        error = isNaN(error) ? null : error.toFixed(2);
      }
    } catch {}
    group.patchValue(
      {
        "Target Output": target,
        Error: error
      },
      {
        onlySelf: true,
        emitEvent: false
      }
    );
    if (resetPassFail && !value) {
      this.formGroup.get("details.AsLeft").reset({
        onlySelf: true,
        emitEvent: false
      });
      this.formGroup.get("passFail").reset({
        onlySelf: true,
        emitEvent: false
      });
    }
  }

  private onTargetOutput2ValueChanges(
    group: FormGroup,
    resetPassFail = false,
    value: number
  ) {
    let error = null;
    try {
      if (value) {
        error =
          ((value - parseFloat(group.get("Target Output").value)) / 16) * 100;
        error = isNaN(error) ? null : error.toFixed(2);
      }
    } catch {}
    group.patchValue(
      {
        Error: error
      },
      {
        onlySelf: true,
        emitEvent: false
      }
    );
    if (resetPassFail && !value) {
      this.formGroup.get("details.AsLeft").reset({
        onlySelf: true,
        emitEvent: false
      });
      this.formGroup.get("passFail").reset({
        onlySelf: true,
        emitEvent: false
      });
    }
  }

  private onGroupValueChanges(detail: string) {
    let validation = "Pass";
    for (let i = 0; i < this.rows.length; i++) {
      const value = this.formGroup.get(
        "details." + detail + "." + this.rows[i] + ".Error"
      ).value;
      if (value === null) {
        validation = null;
        break;
      } else if (!this.isValidError(value)) {
        validation = "Fail";
      }
    }
    const asLeftControl = this.formGroup.get("details.AsLeft");
    let failureCode = undefined;
    if (validation === "Pass" && detail === "AsFound") {
      asLeftControl.reset();
      asLeftControl.disable({
        onlySelf: true,
        emitEvent: false
      });
      failureCode = null;
    } else {
      asLeftControl.enable({
        onlySelf: true,
        emitEvent: false
      });
    }
    const passFail = detail.substring(0, 3) + "PassFail";
    this.formGroup.patchValue(
      {
        passFail: {
          [passFail]: validation,
          ...(failureCode !== undefined ? { FailureCode: failureCode } : {})
        }
      },
      {
        onlySelf: true,
        emitEvent: false
      }
    );
  }

  private validateFailure(group: FormGroup) {
    if (group.get("passFail.AsFPassFail").value !== "Pass") {
      return Validators.required(group.get("passFail.FailureCode"));
    }
    return null;
  }

  private validateAsLPassFail(group: FormGroup) {
    if (group.get("passFail.AsFPassFail").value !== "Pass") {
      return Validators.required(group.get("passFail.AsLPassFail"));
    }
    return null;
  }
}
