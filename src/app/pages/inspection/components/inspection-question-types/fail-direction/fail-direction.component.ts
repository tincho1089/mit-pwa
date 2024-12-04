import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { InspectionDetailsService } from '../../../services/inspection-details.service';

@Component({
  selector: 'app-fail-direction',
  templateUrl: './fail-direction.component.html',
  styleUrls: ['./fail-direction.component.scss']
})
export class FailDirectionComponent extends BaseInspection
implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  failDirection: string = null;
  failOptions: Array<DomainModel> = [];

  constructor(private _detailsProvider: InspectionDetailsService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.failOptions = this.getOptionsObject();
  }

  private _createForm(): void {
    const answer = this.getAnswerObject();
    let actualFailDirection = null;
    let passFail = null;
    let failureCode = null;

    try {
      this.failDirection = this._detailsProvider.getSetting("Fail Direction");
      actualFailDirection = answer.details["Actual Fail Direction"];
      failureCode = answer.passFail["FailureCode"];
      passFail = answer.passFail["Pass Fail"];
    } catch {}

    this.formGroup = new FormGroup(
      {
        details: new FormGroup({
          "Actual Fail Direction": new FormControl(
            actualFailDirection,
            Validators.required
          ),
          "Fail Direction": new FormControl(
            {
              value: this.failDirection,
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
          )
        })
      },
      [this.validateFailure]
    );

    this.subscription.add(
      this.formGroup
        .get("details.Actual Fail Direction")
        .valueChanges.subscribe(value => {
          let PassFail = value === this.failDirection
            ? "Pass"
            : "Fail";

            PassFail = !value ? null : PassFail
          this.formGroup.get("passFail").patchValue(
            {
              PassFail,
              "Pass Fail": PassFail,
              ...(["Pass", null].indexOf(PassFail) >= 0
                ? { FailureCode: null }
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

}
