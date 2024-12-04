import { Component, Input, OnInit } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomainModel } from 'src/app/core/models/local/domain.model';

@Component({
  selector: 'base-pass-fail',
  templateUrl: './base-pass-fail.component.html',
  styleUrls: ['./base-pass-fail.component.scss']
})
export class BasePassFailComponent extends BaseInspection implements OnInit
 {
  @Input('parent')
  parent: FormGroup;

  failOptions: DomainModel[] = [];

  override ngOnInit() {
    super.ngOnInit();
    this.failOptions = this.getOptionsObject();
    const answer = this.getAnswerObject();
    let PassFail = null;
    let FailureCode = null;
    try {
      PassFail = answer['passFail']['PassFail'];
      FailureCode = answer['passFail']['FailureCode'];
    } catch {}

    this.form.addControl(
      'passFail',
      new FormGroup(
        {
          PassFail: new FormControl(
            {
              value: PassFail,
              disabled: true
            },
            Validators.required
          ),
          FailureCode: new FormControl(FailureCode)
        },
        this._validatePassFail
      )
    );
  }

  private _validatePassFail(group: FormGroup): any {
    if (group.controls['PassFail'].value === 'Pass') return null;
    return Validators.required(group.controls['FailureCode']);
  }

}
