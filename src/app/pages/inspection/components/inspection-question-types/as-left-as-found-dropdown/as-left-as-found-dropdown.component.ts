import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-as-left-as-found-dropdown',
  templateUrl: './as-left-as-found-dropdown.component.html',
  styleUrls: ['./as-left-as-found-dropdown.component.scss']
})
export class AsLeftAsFoundDropdownComponent extends BaseInspection
implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  options: DomainModel[] = [];
  formGroup: FormGroup;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.options = this.getOptionsObjectWithPassFail();
    this.createForm();
    
    console.log(this.options);
  }

  private createForm() {
    const answer = this._getAnswer();
    this.formGroup = new FormGroup(
      {
        'As Found': new FormControl(answer[0], Validators.required),
        'As Found Pass/Fail': new FormControl(answer[1]),
        'As Left': new FormControl(answer[2]),
        'As Left Pass/Fail': new FormControl(answer[3])
      },
      [this._validateAsLeft.bind(this)]
    );
    this.subscription.add(
      this.formGroup.get('As Found').valueChanges.subscribe((value) => {
        const opt = this.options.filter(x => x.value == value);
        if (opt.length > 0) {
          this.formGroup.patchValue({
            'As Found Pass/Fail': opt[0].passFail,
            'As Left': null,
            'As Left Pass/Fail': null
          });
        }
      })
    );

    this.subscription.add(
      this.formGroup.get('As Left').valueChanges.subscribe((value) => {
        const opt = this.options.filter(x => x.value == value);
        if (opt.length > 0) {
          this.formGroup.patchValue({
            'As Left Pass/Fail': opt[0].passFail
          });
        }
      })
    );
    this.setControl(this.formGroup);
  }

  private _validateAsLeft(group: FormGroup) {
    if (group.get('As Found Pass/Fail').value !== "Pass") {
      return Validators.required(group.controls['As Left']);
    }
    return null;
  }

  private _getAnswer(): Array<string> {
    let splitted = this.response.answer ? this.response.answer.split('|') : [];
    return splitted.length !== 4 ? [null, null, null, null] : splitted;
  }
}
