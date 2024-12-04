import { Component, Input } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { DomainModel } from 'src/app/core/models/local/domain.model';

@Component({
  selector: 'app-multiselect',
  templateUrl: './multiselect.component.html',
  styleUrls: ['./multiselect.component.scss']
})
export class MultiselectComponent extends BaseInspection
  implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;

  measurements: DomainModel[] = [];
  formArray: FormArray;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.createForm();
  }


  private createForm() {

    this.measurements = this.getOptionsObject();
    const answer = MultiselectComponent.getAnswerObject(this.response);

    this.formArray = new FormArray(
      this.measurements.map(
        (measurement): FormGroup => {
          let value = null;
          try {
            value = answer.find(e => e.Measurement === measurement.value).Value;
          } catch { }

          return new FormGroup({
            Measurement: new FormControl(
              measurement.value,
              Validators.required
            ),
            Value: new FormControl(value ? value : null, Validators.required),
            Unit: new FormControl(this.response.units)
          });
        }
      )
    );
    this.setControl(this.formArray);
  }

  clearInput(section: string, responseQuestionId: string, index: number) {
    this.form.get([section, responseQuestionId, index]).reset();
  }

}