import { Component, EventEmitter, Input, Output} from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';

@Component({
  selector: 'info-messages',
  templateUrl: 'info-messages.component.html',
  styleUrls: ['./info-messages.component.scss'],
})
export class InfoMessagesComponent
  extends BaseInspection
  implements QuestionTypesModel
{
  @Input()
  showHelper: boolean = false;
  @Output()
  triggerShowHelper = new EventEmitter();

  warningEnum = QUESTIONTYPES.WARNING;
  cautionEnum = QUESTIONTYPES.CAUTION;
  dangerEnum = QUESTIONTYPES.DANGER;

  constructor() {
    super();
  }
}
