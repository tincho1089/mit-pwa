import { Component, Input } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { DomainModel } from 'src/app/core/models/local/domain.model';
@Component({
  selector: 'app-dropdown',
  templateUrl: './dropdown.component.html',
  styleUrls: ['./dropdown.component.scss'],
})
export class DropdownComponent extends BaseInspection
  implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;
  options: DomainModel[] = [];
  
  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.options = this.getOptionsObject();
  }
}
