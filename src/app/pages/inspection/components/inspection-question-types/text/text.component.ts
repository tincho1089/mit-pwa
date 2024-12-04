import { Component, Input } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { FormGroup } from '@angular/forms';
@Component({
  selector: 'text',
  templateUrl: 'text.component.html',
  styleUrls: ['./text.component.scss'],
})
export class TextComponent extends BaseInspection implements QuestionTypesModel {
  isInValid: boolean = false;
  @Input() showHelper: boolean = false;
  @Input() override form: FormGroup;

  constructor() {
    super();
  }



  clearInput() {
    this.form.get(this.sectionArray).reset();
  }

  onRememberToggleChange($event: MatSlideToggleChange) {
    this.isCacheable = $event.checked;

    if (this.isCacheable) {
      localStorage.setItem(this.response.questionId, this.response.answer);
    } else {
      localStorage.removeItem(this.response.questionId);
    }
  }


  onInputValueChange() {

    this.isInValid = this.response.answer.length > 0 ? false : true;

    if (this.section === 'General' && this.isCacheable) {
      localStorage.setItem(this.response.questionId, this.response.answer);
    }
  }


}