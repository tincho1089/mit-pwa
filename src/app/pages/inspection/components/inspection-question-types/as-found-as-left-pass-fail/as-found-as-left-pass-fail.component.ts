import { Component } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DomainModel } from 'src/app/core/models/local/domain.model';

@Component({
  selector: 'app-as-found-as-left-pass-fail',
  templateUrl: './as-found-as-left-pass-fail.component.html',
  styleUrls: ['./as-found-as-left-pass-fail.component.scss']
})
export class AsFoundAsLeftPassFailComponent extends BaseInspection
implements QuestionTypesModel
{

  showHelper: boolean;

  options: DomainModel[] = [new DomainModel('Pass'), new DomainModel('Fail')];
  failOptions: DomainModel[] = [];
  formGroup:FormGroup;
  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.failOptions = this.getOptionsObject();
  }

  private _createForm() {
    const answer = this._getAnswer();
    this.formGroup = new FormGroup({
      'As Found': new FormControl(answer[0], Validators.required),
      'As Left': new FormControl(answer[1]),
      'Failure Code': new FormControl(answer[2])
    },
    [this._validateAsLeft, this._validateFailure]
    );

    this.subscription.add(
      this.formGroup.get('As Found').valueChanges.subscribe((value) => {
        if (value === 'Pass')
          this.formGroup.patchValue({
            'As Left': null,
            'Failure Code': null
          });
      })
    );
    this.setControl(this.formGroup);
  }

  private _validateAsLeft(group: FormGroup) {
    if (group.get('As Found').value !== 'Pass') {
      return Validators.required(group.controls['As Left']);
    }
    return null;
  }

  private _validateFailure(group: FormGroup) {
    if (group.get('As Found').value !== 'Pass') {
      return Validators.required(group.controls['Failure Code']);
    }
    return null;
  }

  private _getAnswer(): Array<string> {

    let splitted = this.response.answer ? this.response.answer.split('|') : [];
    return splitted.length !== 3 ? [null, null] : splitted;
  }

}
