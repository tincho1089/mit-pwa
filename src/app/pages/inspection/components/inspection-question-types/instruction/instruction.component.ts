import { Component, Input} from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';

@Component({
  selector: 'app-instruction',
  templateUrl: './instruction.component.html',
  styleUrls: ['./instruction.component.scss']
})
export class InstructionComponent extends BaseInspection implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  constructor() {
    super();
  }

}