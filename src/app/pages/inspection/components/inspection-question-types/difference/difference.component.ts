import { Component, Input, OnInit } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-difference',
  templateUrl: './difference.component.html',
  styleUrls: ['./difference.component.scss']
})
export class DifferenceComponent extends BaseInspection
  implements QuestionTypesModel, OnInit {
  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  firstValueName: string = "";
  secondValueName: string = "";

  varianceOptions:any = [];
  varianceFormControl: FormControl<Number> = new FormControl;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.setVarianceControl();
  }

  private _createForm() {
    const options = JSON.parse(this.response.options);
    this.firstValueName = options ? options[0]?.Description : 'First Value';
    this.secondValueName = options ? options[1]?.Description : 'Second Value';
    const answer = this._getAnswer();
    this.formGroup = new FormGroup({
      'First Value': new FormControl(answer[0], Validators.required),
      'Second Value': new FormControl(answer[1], Validators.required),
      'Difference Value': new FormControl(answer[2])
    });
    this.setControl(this.formGroup);

    this.formGroup.get('First Value').valueChanges.subscribe(val => {
      if (val === "") {
        this.formGroup.patchValue({
          'Difference Value': ''
        })
      } else if (this.formGroup.get('Second Value').value) {
        let answer = Number(val) - Number(this.formGroup.get('Second Value').value);
        this.formGroup.patchValue({
          'Difference Value': answer
        })
      }
    });

    this.formGroup.get('Second Value').valueChanges.subscribe(val => {
      if (val === "") {
        this.formGroup.patchValue({
          'Difference Value': ''
        })
      } else if (this.formGroup.get('First Value').value) {
        let answer = Number(this.formGroup.get('First Value').value) - Number(val);
        this.formGroup.patchValue({
          'Difference Value': answer
        })
      }
    })
  }

  setVarianceControl() {
    let variance = JSON.parse(this.response.options) || [];
    variance.splice(0,2);

    if(variance.length) {
      this.varianceOptions = variance.map(x => Number(x.Description));
    }
    else {
      this.varianceOptions.push(0.1);
    }

    this.varianceFormControl.setValue(this.varianceOptions[0]);
  }

  getHeader(index) {
    switch (index) {
      case 0: return this.firstValueName;
      case 1: return this.secondValueName;
      default: return 'Difference Value'
    }
  }

  private _getAnswer(): Array<string> {
    let splitted = this.response.answer ? this.response.answer.split('|') : [];
    return splitted.length !== 3 ? [null, null, null] : splitted;
  }

  getDifference() {
    try {
      let diff = Math.abs(Number(this.formGroup.get('Difference Value').value));   
      if (this.formGroup.get('First Value').value && this.formGroup.get('Second Value').value && diff > Number(this.varianceFormControl.value))
        return true;
    } catch {
    }
    return false;
  }

  getControlLabel(type: string){
    return this.formGroup.controls[type].value;
  }

  clearInput(formGroup: FormGroup, key: string) {
    formGroup.get([key]).reset();
  }
}
