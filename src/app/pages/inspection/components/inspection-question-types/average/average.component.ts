import { Component, Input, OnInit } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { InspectionResponse } from 'src/app/core/sync/entities';

@Component({
  selector: 'app-average',
  templateUrl: './average.component.html',
  styleUrls: ['./average.component.scss']
})
export class AverageComponent
  extends BaseInspection
  implements QuestionTypesModel, OnInit {

  @Input()
  showHelper: boolean = false;


  formGroup: FormGroup;
  items: Array<string>;
  columns: Array<string> = [];
  details;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.createForm();
    this.getItems();
  }

  private createForm(): void {
    this.items = this.getItems();
    let details;

    details = new FormArray([]);
    if (this.items.length) {
      this.items.forEach((element, index) => {
        this.columns.push((index + 1).toString());
        (details as FormArray).push(

          new FormGroup({
            [index + 1]: new FormControl(element[Object.keys(element)[0]] ? Number(element[Object.keys(element)[0]]) : null, Validators.required)
          })
        )
      })
    }
    else {
      this.columns.push((this.columns.length + 1).toString());
      (details as FormArray).push(
        new FormGroup({
          '1': new FormControl(null, Validators.required)
        })
      );
    }

    this.formGroup = new FormGroup({
      details,
      unit: new FormControl(null)
    });
    this.setControl(this.formGroup);
  }

  addNewRow() {
    let index = (this.columns.length + 1).toString();

    this.columns.push(index);
    (this.formGroup.get('details') as FormArray).push(
      new FormGroup({ [index]: new FormControl(null, Validators.required) })
    );
  }

  getValue(index) {
    const obj = (this.formGroup.get('details') as FormArray).controls[index].value;
    return obj[Object.keys(obj)[0]]
  }

  eraseRow(index) {
    let avgFormArray = (this.formGroup.get('details') as FormArray);
    avgFormArray.removeAt(index);
    this.columns.splice(index, 1);
    avgFormArray.updateValueAndValidity();
  }

  getAverage() {
    let validValues = (this.formGroup.get('details') as FormArray).controls.filter(element => !!element.value[Object.keys(element.value)[0]]);
    let average = validValues.reduce((total, element) => total + Number(element.value[Object.keys(element.value)[0]]), 0) / validValues.length;
    return isNaN(average) ? 0 : average.toFixed(2);
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
 
  // For Inspection Details Service FormControl
  private static getItemDetails(response: InspectionResponse): Array<string> {
    try {
      if (response.answer === "NA") return [];
      let answer = JSON.parse(response.answer);
      if(!answer)
        return [];
      return answer["details"] ? answer.details : [];
    } catch {
      return [];
    }
  }

  static async create(inspection: InspectionResponse): Promise<FormGroup> {
    let item = this.getItemDetails(inspection);

    let details;
    details = new FormArray([]);
    
    if(item.length) {
      item.forEach((element, index) => {
        (details as FormArray).push(
          new FormGroup({
            [index + 1]: new FormControl(element[Object.keys(element)[0]] ? Number(element[Object.keys(element)[0]]) : null, Validators.required)
          })
        )
      })        
    }

    else {
      (details as FormArray).push(
        new FormGroup({
          '1': new FormControl(null, Validators.required)
        })
      );
    }
    
    return new FormGroup({
      details,
      unit: new FormControl(null)
    });
  }
  // 
}
