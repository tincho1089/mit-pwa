import { Component, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { BaseInspection } from '../../../classes/base-inspection';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';

@Component({
  selector: 'app-multi-asleftasfound',
  templateUrl: './multi-asleftasfound.component.html',
  styleUrls: ['./multi-asleftasfound.component.scss']
})
export class MultiAsleftasfoundComponent extends BaseInspection
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
    console.log(this.response)
  }

  private createForm() {
    this.measurements = this.getOptionsObject();
    const answer = this.getAnswerObject();

    const group = {};
    this.formArray = new FormArray(
      this.measurements.map(
        (measurement, index): FormGroup => {
          let values = null;
          let asFound = null;
          let asLeft = null;
          try {
            values = answer.find((e) => e.Measurement === measurement.value);
            asFound = values ? values.Value.split('|')[0] : null;
            asLeft = values ? values.Value.split('|')[1] : null;
          } catch { }
          const form = new FormGroup({
            ['As Found']: new FormControl(asFound, Validators.required),
            ['As Left']: new FormControl(asLeft, Validators.required)
          });
          this.subscription.add(
            form.valueChanges.subscribe(this._onGroupChanges.bind(this, index))
          );
          group[measurement.value] = form;

          return new FormGroup({
            Measurement: new FormControl(
              measurement.value,
              Validators.required
            ),
            Value: new FormControl(
              values ? values.Value : null,
              this._validateValue
            ),
            Unit: new FormControl(this.response.units),
            Row: form
          });
        }
      )
    );
    this.setControl(this.formArray);
  }

  private _validateValue(control: FormControl): object {
    if (!control.value) return null;
    return control.value.split('|').some((e) => e === '')
      ? { hasError: true }
      : null;
  }

  private _onGroupChanges(index: number, values: Array<string>) {
    let answer =
      (values['As Found'] ?? '') +
      '|' +
      (values['As Left'] ?? '');
    if (answer === '|') answer = null;
    this.formArray.get(index + '.Value').setValue(answer, {
      onlySelf: true,
      emitEvent: false
    });
  }
}
