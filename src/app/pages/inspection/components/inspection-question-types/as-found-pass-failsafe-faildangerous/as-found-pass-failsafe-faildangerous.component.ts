import { Component, Input, OnInit } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-as-found-pass-failsafe-faildangerous',
  templateUrl: './as-found-pass-failsafe-faildangerous.component.html',
  styleUrls: ['./as-found-pass-failsafe-faildangerous.component.scss']
})
export class AsFoundPassFailSafeFailDangerous extends BaseInspection implements QuestionTypesModel, OnInit {
  @Input()
  showHelper: boolean = false;

  options: DomainModel[] = [new DomainModel('Pass'), new DomainModel('Fail-Safe'), new DomainModel('Fail-Dangerous')];
  failOptions: DomainModel[] = [];
  formGroup: FormGroup;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.createForm();
    this.failOptions = this.getOptionsObject();
  }

  private createForm() {
    const answer = this._getAnswer();
    this.formGroup = new FormGroup(
      {
        'As Found': new FormControl(answer[0], Validators.required),
        'As Left': new FormControl(answer[1]),
        'Failure Code': new FormControl(answer[2]),
        'Comments': new FormControl(answer[3])
      },
      [this._validateAsLeft, this._validateFailure,this._validateComment]
    );
    this.subscription.add(
      this.formGroup.get('As Found').valueChanges.subscribe((value) => {
        if (value === 'Pass') {
          this.formGroup.patchValue({
            'As Left': null,
            'Failure Code': null,
            'Comments':null
          });
        }
      })
    );

    this.setControl(this.formGroup);
    this._subscribeOnChange();
  }

  //condition to display AsLeft, FailureCode and Comment
  public showQuestion(): boolean {
    return this.formGroup?.value['As Found'] === 'Fail-Safe' || this.formGroup?.value['As Found'] === 'Fail-Dangerous';
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
  private _validateComment(group: FormGroup) {
    if (group.get('As Found').value !== 'Pass') {
      return Validators.required(group.controls['Comments']);
    }
    return null;
  }

  private _subscribeOnChange() {
    this.subscription.add(
      this.formGroup.valueChanges.subscribe( (val) => {
        this._setAnswer(val);
      })
    );
  }

  private _getAnswer(): Array<string> {
    const splitted = this.response.answer ? this.response.answer.split('|') : [];
    return splitted.length !== 4 ? [null, null, null, null] : splitted;
  }
  private _setAnswer(ans: object) {
    this.response.answer = ans['As Found'] + '|' +
        ans['As Left'] + '|' +
        ans['Failure Code'] + '|' +
        ans['Comments'];
    this.saveResponse();
  }

}