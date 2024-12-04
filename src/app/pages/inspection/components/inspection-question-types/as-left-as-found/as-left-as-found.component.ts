import { Component } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-as-left-as-found',
  templateUrl: './as-left-as-found.component.html',
  styleUrls: ['./as-left-as-found.component.scss']
})
export class AsLeftAsFoundComponent extends BaseInspection
implements QuestionTypesModel
{
  showHelper: boolean;
  formGroup:FormGroup;
  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
  }

  private _createForm() {
    const answer = this._getAnswer();
    this.formGroup = new FormGroup({
      'As Found': new FormControl({value:answer[0], disabled: this.isDisabled()}, Validators.required),
      'As Left': new FormControl({value:answer[1], disabled:this.isDisabled()}, Validators.required)
    });
    this.setControl(this.formGroup);
  }

  private _getAnswer(): Array<string> {

    let splitted = this.response.answer ? this.response.answer.split('|') : [];
    return splitted.length !== 2 ? [null, null] : splitted;
  }

}
