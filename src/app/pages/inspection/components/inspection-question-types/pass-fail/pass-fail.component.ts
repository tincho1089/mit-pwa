import { Component, Input } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';

@Component({
  selector: 'app-pass-fail',
  templateUrl: './pass-fail.component.html',
  styleUrls: ['./pass-fail.component.scss']
})
export class PassFailComponent extends BaseInspection implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  options: DomainModel[] = [new DomainModel('Pass'), new DomainModel('Fail')];
  failOptions: DomainModel[] = [];
  formGroup: FormGroup;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.failOptions = this.getOptionsObject();
  }

  private _createForm(): void {
    const answer = this._getAnswer();
      this.formGroup = new FormGroup(
        {
          'pass-fail': new FormControl(answer[0], Validators.required),
          'failure': new FormControl(answer[1])
        },
        this._validatePassFail.bind(this)
      );

    this.subscription.add(
      this.formGroup.get('pass-fail').valueChanges.subscribe((value) => {
        let patchValue = null;
        if (value === 'Fail' && this.failOptions.length === 1) {
          patchValue = this.failOptions[0].value;
        }
        this.formGroup.get('failure').setValue(patchValue, {
          onlySelf: true,
          emitEvent: false
        });
      })
    );

    this.setControl(this.formGroup);
  }

  private _validatePassFail(group: FormGroup): object | ValidationErrors {
    const isValid = (group.get('pass-fail').value === 'Fail' && this.failOptions.length > 0 && this.response.isShow === true)
      ? Validators.required(group.controls['failure'])
      : null;
      return isValid;
  }
  
  private _getAnswer(): Array<string> {
    const splitted = this.response.answer ? this.response.answer.split("|") : [];
    return splitted.length !== 2 ? [null, null] : splitted;
  }

}
