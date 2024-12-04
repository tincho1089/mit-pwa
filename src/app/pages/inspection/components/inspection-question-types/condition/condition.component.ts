import { Component, EventEmitter, Input, Output } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { SharedService } from 'src/app/core/services/shared.service';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-condition',
  templateUrl: './condition.component.html',
  styleUrls: ['./condition.component.scss']
})
export class ConditionComponent extends BaseInspection
  implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;

  isShowHelper: boolean = false;
  @Output()
  triggerShowHelper = new EventEmitter();

  constructor(private sharedService: SharedService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
  }

  toggleHelper(show: boolean) {
    this.showHelper = show;
    this.triggerShowHelper.emit(this.showHelper);
  }

  private _createForm() {
    const formControl = this.form.get([
      this.section,
      this.response.questionId
    ]);
    formControl.setValidators(Validators.requiredTrue);
    if (this.response.answer !== "NA") {
      formControl.setValue(this.response.answer === "Acknowledged", {
        onlySelf: true,
        emitEvent: false
      });
    }
  }
}
