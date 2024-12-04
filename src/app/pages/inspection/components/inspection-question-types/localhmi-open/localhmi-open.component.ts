import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { db } from 'src/databases/db';

@Component({
  selector: 'app-localhmi-open',
  templateUrl: './localhmi-open.component.html',
  styleUrls: ['./localhmi-open.component.scss']
})
export class LocalhmiOpenComponent extends BaseInspection implements QuestionTypesModel {


  @ViewChildren('chkboxslcmiopen') checkboxes: QueryList<MatCheckbox>;
  @Input()
  showHelper: boolean = false;
  selected = -1;
  details: FormGroup;
  failOptions: DomainModel[] = [];


  formGroup: FormGroup;
  options: DomainModel[] = [
    new DomainModel('open', 'Open'),
    new DomainModel('close', 'Close')
  ];

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.failOptions = this.getOptionsObject();

  }

  private _createForm(): void {
    const items = this._getAnswer();

    this.formGroup = new FormGroup({
      details: new FormGroup({
        "Local Status": new FormControl(
          items['details']['Local Status'] ? items['details']['Local Status'] : null,
          Validators.required
        ),
        "HMI Status": new FormControl(
          items['details']['HMI Status'] ? items['details']['HMI Status'] : null,
          Validators.required
        )
      }),
      passFail: new FormGroup({
        "PassFail": new FormControl(
          items['passFail']['PassFail'] ? items['passFail']['PassFail'] : null, Validators.required),
        "FailureCode": new FormControl(
          items['passFail']['FailureCode'] ? items['passFail']['FailureCode'] : null)
      }, this._validatePassFail)
    });

    this.subscription.add(
      this.formGroup.get('details').valueChanges.subscribe((value) => {
        value = this._getAnswer()['details'];
        let openStatus = [value['Local Status'], value['HMI Status']].indexOf('close') >= 0
          ? 'Fail'
          : 'Pass';
        let PassFail =
          !value['Local Status'] || !value['HMI Status']
            ? null
            : openStatus;
        this.formGroup.get('passFail').patchValue(
          {
            PassFail,
            ...(['Pass', null].indexOf(PassFail) >= 0
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

    this.subscription.add(
      this.formGroup.get('passFail').valueChanges.subscribe((value) => {
        let jsonRepsonseAnswer = JSON.parse(this.response.answer);
        jsonRepsonseAnswer['passFail'] = value;
        this.response.answer = JSON.stringify(jsonRepsonseAnswer);
        db.updateAnswer(this.response);
      })
    );

    this.setControl(this.formGroup);
  }

  onSelection(ob: MatCheckboxChange, key: string, index: number): void {
    if (ob.checked) {
      this.checkboxes.forEach((c) => { if (c.id.indexOf('chkboxslcmiopen-' + key) >= 0) c.checked = false; });
      let jsonRepsonseAnswer = this._getAnswer();
      jsonRepsonseAnswer['details'][key] = ob.source.value;
      this.response.answer = JSON.stringify(jsonRepsonseAnswer);

      db.updateAnswer(this.response);
      this.checkboxes.forEach((c) => { if (c.id.indexOf('chkboxslcmiopen-' + key + '-' + index) >= 0) c.checked = true; });
      this.formGroup.get('details').patchValue(jsonRepsonseAnswer['details']);
    } else {
      // To disable uncheck section
      this.checkboxes.forEach((c) => { if (c.id.indexOf('chkboxslcmiopen-' + key + '-' + index) >= 0) c.checked = true; });
    }


  }

  private _getAnswer(): Array<string> {
    let answer = null;
    let emptyresponse = null;
    emptyresponse = {};
    emptyresponse.details = {};
    emptyresponse.details["Local Status"] = "";
    emptyresponse.details["HMI Status"] = "";
    emptyresponse.passFail = {};
    emptyresponse.passFail["PassFail"] = "";
    emptyresponse.passFail["FailureCode"] = "";
    try {
      if (this.response.answer === "NA" || this.response.answer === "") {
        return emptyresponse;
      };
      answer = JSON.parse(this.response.answer);
      return answer ? answer : emptyresponse;
    } catch {
      return emptyresponse;
    }
  }
  private _validatePassFail(group: FormGroup): any {
    if (group.controls['PassFail'].value === 'Pass') return null;
    return Validators.required(group.controls['FailureCode']);
  }
}
