import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';

@Component({
  selector: 'percent-span',
  templateUrl: './percent-span.component.html',
  styleUrls: ['./percent-span.component.scss'],
})
export class PercentSpanComponent
  extends BaseInspection
  implements QuestionTypesModel, OnInit
{
  @Input()
  showHelper: boolean = false;

  static staticSpans: DomainModel[] = [];
  static spanUnit: string = '';
  spans: DomainModel[] = [];
  formGroup: FormGroup;
  spanUnit: string = '';
  failOptions: DomainModel[] = [];
  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.prepareForm();
    this.failOptions = this.getOptionsObject();
  }

  static async create(inspection: InspectionResponse): Promise<FormGroup> {
    const answer = this.getAnswerObject(inspection);
    this.staticSpans = this.initializeSpans();
    const details = new FormArray(
      this.staticSpans.map((span, index): FormGroup => {
        let asFoundValue = null;
        let errorFValue = null;
        let asLeftValue = null;
        let errorLValue = null;
        try {
          asFoundValue = answer['details'][index]['AsFound'];
          errorFValue = answer['details'][index]['ErrorF'].replace('%', '');
          asLeftValue = answer['details'][index]['AsLeft'];
          errorLValue = answer['details'][index]['ErrorL'].replace('%', '');
        } catch {}

        const group = new FormGroup(
          {
            ActualSpan: new FormControl(span.value),
            AsFound: new FormControl(asFoundValue, Validators.required),
            ErrorF: new FormControl(
              {
                value: errorFValue,
                disabled: true,
              },
              Validators.required
            ),
            AsLeft: new FormControl(asLeftValue),
            ErrorL: new FormControl({
              value: errorLValue,
              disabled: true,
            }),
          },
          [this.validateAsLeft.bind(this)]
        );
        return group;
      })
    );

    let passFail = null;
    let failureCode = null;
    try {
      passFail = answer['passFail']['PassFail'];
      failureCode = answer['passFail']['FailureCode'];
    } catch {}

    return new FormGroup({
      details,
      passFail: new FormGroup(
        {
          PassFail: new FormControl(passFail, Validators.required),
          FailureCode: new FormControl(failureCode),
        },
        this._validatePassFail
      ),
    });
  }

  static _validatePassFail(group: FormGroup): any {
    if (group.controls['PassFail'].value === 'Pass') return null;
    return Validators.required(group.controls['FailureCode']);
  }

  private prepareForm(): void {
    this.spans = this.getSpans();
    this.getSpanUnits();

    // Make sure `this.form` is correctly set as a FormGroup and not any other type.
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;

    const details = this.formGroup.get('details') as FormArray;
    details?.controls.forEach((group, index) => {
      group.get('ActualSpan').setValue(this.spans[index].value);
      this.subscription.add(
        group
          .get('AsFound')
          .valueChanges.subscribe(
            this.onValueChanges.bind(this, group, 'ErrorF')
          )
      );
      this.subscription.add(
        group
          .get('AsLeft')
          .valueChanges.subscribe(
            this.onValueChanges.bind(this, group, 'ErrorL')
          )
      );
    });
    this.subscription.add(
      details?.valueChanges?.subscribe(this.onDetailsChange.bind(this, details))
    );
  }

  private onDetailsChange(group: FormGroup) {
    if (group.status !== 'DISABLED') {
      let PassFail = '';
      if (group.status === 'VALID') {
        PassFail = this.spans.some((span, index) => {
          let value = group.get(index + '.ErrorL').value;
          return !this.isValidError(value);
        })
          ? 'Fail'
          : 'Pass';
      }
      this.formGroup.get('passFail').patchValue(
        {
          PassFail,
          ...(['Pass', null].indexOf(PassFail) >= 0
            ? { FailureCode: null }
            : {}),
        },
        {
          onlySelf: true,
          emitEvent: true,
        }
      );
    }
  }

  private onValueChanges(group: FormGroup, control: string, value: number) {
    if (group.status !== 'DISABLED') {
      let maxValue = Number(this.spans[this.spans.length - 1].value);
      let minValue = Number(this.spans[0].value);
      let error = value
        ? ((value - Number(group.get('ActualSpan').value)) /
            (maxValue - minValue)) *
          100
        : '';
      group.get(control).setValue(error);
      if (control === 'ErrorF' && this.isValidError(error))
        group.get('AsLeft').setValue('', {
          onlySelf: true,
          emitEvent: true,
        });
    }
  }

  private getSpanUnits() {
    this.spanUnit = this.getSetting('Span Unit');
  }

  private getSpans(): Array<DomainModel> {
    let maxSpan = '0';
    let midSpan = '0';
    let minSpan = '0';
    try {
      maxSpan = this.getSetting('Max Span');
      minSpan = this.getSetting('Min Span');
      midSpan = (
        (Number(maxSpan) - Number(minSpan)) / 2 +
        Number(minSpan)
      ).toString();
    } catch {}
    return [
      new DomainModel(minSpan),
      new DomainModel(midSpan),
      new DomainModel(maxSpan),
    ];
  }

  private static initializeSpans() {
    return [new DomainModel('0'), new DomainModel('0'), new DomainModel('0')];
  }

  getFormGroup(index: number): FormGroup {
    const details = this.formGroup.get('details') as FormArray;
    return details.at(index) as FormGroup;
  }
}
