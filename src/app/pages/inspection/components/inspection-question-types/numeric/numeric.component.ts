import { Component, Input } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';

@Component({
  selector: 'app-numeric',
  templateUrl: './numeric.component.html',
  styleUrls: ['./numeric.component.scss']
})
export class NumericComponent extends BaseInspection
  implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;

  constructor() {
    super();
  }


}
