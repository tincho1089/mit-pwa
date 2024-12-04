import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { InspectionDetailsService } from '../../../services/inspection-details.service';

@Component({
  selector: 'app-pressure-validation',
  templateUrl: './pressure-validation.component.html',
  styleUrls: ['./pressure-validation.component.scss']
})
export class PressureValidationComponent extends BaseInspection
implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  minAirPressure: string = null;
  maxAirPressure: string = null;
  failOptions: Array<DomainModel> = [];

  constructor(private _detailsService: InspectionDetailsService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.failOptions = this.getOptionsObject();
  }

  private _createForm(): void {
    const answer = this.getAnswerObject();
    let asFoundAirPressure = null;
    let passFail = null;
    let failureCode = null;
    let asLeftAirPressure = null;

    try {
      this.minAirPressure = this._detailsService.getSetting(
        "Min Air Pressure"
      );
      this.maxAirPressure = this._detailsService.getSetting(
        "Max Air Pressure"
      );
      asFoundAirPressure = answer.details["As Found Air Pressure"];
      asLeftAirPressure = answer.passFail["As Left Air Pressure"];
      failureCode = answer.passFail["FailureCode"];
      passFail = answer.passFail["Pass Fail"];
    } catch {}

    this.formGroup = new FormGroup(
      {
        details: new FormGroup({
          "As Found Air Pressure": new FormControl(
            asFoundAirPressure,
            Validators.required
          ),
          "Min Air Pressure": new FormControl(
            {
              value: this.minAirPressure ? this.minAirPressure : "",
              disabled: true
            },
            Validators.required
          ),
          "Max Air Pressure": new FormControl(
            {
              value: this.maxAirPressure ? this.maxAirPressure : "",
              disabled: true
            },
            Validators.required
          )
        }),
        passFail: new FormGroup({
          PassFail: new FormControl(
            {
              value: passFail,
              disabled: true
            },
            Validators.required
          ),
          FailureCode: new FormControl(failureCode),
          "Pass Fail": new FormControl(
            {
              value: passFail,
              disabled: true
            },
            Validators.required
          ),
          "As Left Air Pressure": new FormControl(asLeftAirPressure)
        })
      },
      [this.validateFailure, this.validateAsLeftAirPressure]
    );

    this.subscription.add(
      this.formGroup
        .get("details.As Found Air Pressure")
        .valueChanges.subscribe(value => {
          let PassFail = Number(value) >= Number(this.minAirPressure) &&
              Number(value) <= Number(this.maxAirPressure)
            ? "Pass"
            : "Fail";
            PassFail = !value
            ? null : PassFail
          this.formGroup.get("passFail").patchValue(
            {
              PassFail,
              "Pass Fail": PassFail,
              ...(["Pass", null].indexOf(PassFail) >= 0
                ? { FailureCode: null, "As Left Air Pressure": null }
                : {})
            },
            {
              onlySelf: true,
              emitEvent: true
            }
          );
        })
    );

    this.setControl(this.formGroup);
  }

  private validateFailure(group: FormGroup) {
    if (group.get("passFail.Pass Fail").value !== "Pass") {
      return Validators.required(group.get("passFail.FailureCode"));
    }
    return null;
  }

  private validateAsLeftAirPressure(group: FormGroup) {
    if (group.get("passFail.Pass Fail").value !== "Pass") {
      return Validators.required(group.get("passFail.As Left Air Pressure"));
    }
    return null;
  }

}
