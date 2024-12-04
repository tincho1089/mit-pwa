import { Component, Input } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
@Component({
  selector: 'yesno',
  templateUrl: 'yesno.component.html',
  styleUrls: ['yesno.component.scss']
})
export class YesNoComponent
  extends BaseInspection
  implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  constructor() {
    super();
  }
}
