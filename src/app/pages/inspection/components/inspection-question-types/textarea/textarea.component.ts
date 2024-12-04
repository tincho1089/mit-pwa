import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss']
})
export class TextAreaComponent extends BaseInspection implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  constructor() {
    super();
  }
}
