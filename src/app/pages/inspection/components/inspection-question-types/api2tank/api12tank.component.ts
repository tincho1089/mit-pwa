import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-api2tank',
  templateUrl: './api12tank.component.html',
  styleUrls: ['./api12tank.component.scss']
})
export class Api12TankComponent
  extends BaseInspection
  implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  items: Array<string>;
  options = [];
  columns: Array<string> = [
    "Nominal",
    "#1",
    "#2",
    "#3",
    "#4",
    "#5",
    "Average"
  ];

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.getOptions();
  }

  private _createForm(): void {
    this.items = this.getItems();
    this.options = this.getOptions();
    const details = new FormArray(
      this.options?.map(
        (option, index): FormGroup => {
          let group = {};
          this.setColumnOptions(index, group);

          const form = new FormGroup(group);
          this.subscription.add(
            form.valueChanges.subscribe(this.onGroupChanges.bind(this, index))
          );
          return form;
        }
      )
    );

    this.formGroup = new FormGroup({
      details,
      unit: new FormControl(null)
    });
    this.setControl(this.formGroup);
  }

  private setColumnOptions(index: number, group: {}) {
    this.columns.forEach(item => {
      let control = null;
      if (this.response.isShow === false) {
        control = new FormControl(
          this.averageValue(item, index)
        );
      } else {
        control = new FormControl(
          this.averageValue(item, index),
          index === 0 ? Validators.required : null
        );
      }
      group[item] = control;
    });
  }

  private averageValue(item: string, index: number): any {
    return item === "Average"
      ? {
        value: this.getValue(index, item),
        disabled: true
      }
      : this.getValue(index, item);
  }

  private getValue(index: number, item: string): any {
    return this.items[index] ? this.items[index][item] : null;
  }

  private calculateAverage(numbers: object): number {
    let sum = 0;
    let length = 0;
    for (const key in numbers) {
      if (["Average", "Nominal"].indexOf(key) === -1) {
        sum += Number(numbers[key]);
        length++;
      }
    }
    return sum / length;
  }

  private onGroupChanges(index: number, values: object) {
    this.formGroup
      .get("details." + index + ".Average")
      .setValue(this.calculateAverage(values).toFixed(2), {
        onlySelf: true,
        emitEvent: false
      });
  }

  private getItems(): Array<string> {
    try {
      if (this.response.answer === "NA") return [];
      let answer = JSON.parse(this.response.answer);
      if(!answer)
          return [];
      return answer["details"] ? answer.details : [];
    } catch {
      return [];
    }
  }

  private getOptions(): object[] {
    const options = JSON.parse(this.response.options);
    return options;
  }
}
