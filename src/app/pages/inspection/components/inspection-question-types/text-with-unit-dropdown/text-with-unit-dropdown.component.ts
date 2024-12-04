import { Component, Input } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-text-with-unit-dropdown',
  templateUrl: './text-with-unit-dropdown.component.html',
  styleUrls: ['./text-with-unit-dropdown.component.scss']
})
export class TextWithUnitDropdownComponent extends BaseInspection implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;
  options: DomainModel[] = [];
  formGroup: FormGroup;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.options = this.getOptionsObject();
    this._createForm();
  }

  private _createForm(): void {
    const answer = this._getAnswer();
    this.formGroup = new FormGroup({
      Value: new FormControl(answer[0], Validators.required),
      Unit: new FormControl(answer[1], Validators.required)
    });


    this.setControl(this.formGroup);
  }
  private _getAnswer(): Array<string> {
    const splitted = this.response.answer ? this.response.answer.split("|") : [];
    return splitted.length !== 2 ? [null, null] : splitted;
  }

  clearInput() {
    this.form.get(this.sectionArray).reset();
  }
}
