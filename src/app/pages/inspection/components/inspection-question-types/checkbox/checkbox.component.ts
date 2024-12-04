import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Validators } from '@angular/forms';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';

@Component({
  selector: 'checkbox',
  templateUrl: 'checkbox.component.html',
})
export class CheckboxComponent
  extends BaseInspection
  implements QuestionTypesModel
{
  @Input()
  showHelper: boolean = true;
  @Output()
  triggerShowHelper = new EventEmitter();

  isShowHelper: boolean = false;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
  }

  toggleHelper(show: boolean) {
    this.isShowHelper = show;
    this.triggerShowHelper.emit(this.isShowHelper);
  }

  private _createForm() {
    const formControl = this.form.get([this.section, this.response.questionId]);
    formControl.setValidators(Validators.requiredTrue);
    if (this.response.answer !== 'NA') {
      formControl.setValue(this.response.answer === 'Completed', {
        onlySelf: true,
        emitEvent: false,
      });
    }
  }
}
