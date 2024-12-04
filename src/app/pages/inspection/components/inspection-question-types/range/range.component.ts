import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { FormControl, FormGroup } from '@angular/forms';
import { Range, RangeType } from './range.enum';
import { InspectionResponse } from 'src/app/core/sync/entities';
@Component({
  selector: 'app-range',
  templateUrl: './range.component.html',
  styleUrls: ['./range.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeComponent extends BaseInspection
implements QuestionTypesModel, OnInit {

  @Input()
  showHelper: boolean = false;
  formGroup: FormGroup;
  type: string = null;
  minValue: string = null;
  maxValue: string = null;
  rangeInOut: string = null;
  range = Range;
  rangeType = RangeType;
  triggerShowHelper = new EventEmitter();

  constructor(private ref: ChangeDetectorRef) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
    this.triggerCommentBox();
    this.ref?.markForCheck();
  }
  
  private _createForm(): void {
    try {
      const options = JSON.parse(this.response.options);
      if (!options) return null;
      const values = options[0].Description.split('|');
      this.minValue = values[1];
      this.maxValue = values[2];
      this.type = values[0];
      this.validateRange(this.form.get(this.sectionArray).value);
    } catch { }

    this.subscription.add(
      this.form.get(this.sectionArray)
        .valueChanges.subscribe(value => {
          if (!value) {
            this.rangeInOut = null;
          }
          else {
            this.validateRange(value);
            if(value != this.response.answer) {
              this.triggerCommentBox();
              this.ref?.markForCheck();
            }
          }

        })
    );
  }

  private validateRange(value: number | string) {

    if (this.type === RangeType.Range) {
      this.rangeInOut = Number(value) >= Number(this.minValue) &&
        Number(value) <= Number(this.maxValue)
        ? Range.InRange : Range.OutOfRange;
    }
    else if (this.type === RangeType.LessThan) {
      this.rangeInOut = Number(value) <= Number(this.maxValue)
        ? Range.InRange : Range.OutOfRange;
    }
    else if (this.type === RangeType.GreaterThan) {
      this.rangeInOut = Number(value) >= Number(this.minValue)
        ? Range.InRange : Range.OutOfRange;
    }  
  }

  private triggerCommentBox() {
    if(this.rangeInOut === Range.OutOfRange) {
      this.helperTrigger.next(true);
      this.response.showHelper = true;
      this.response.isCommentRequired = true;

    }
    else {
      this.helperTrigger.next(false);
      this.response.showHelper = false;
      this.response.isCommentRequired = false;

    }

    this.ref?.markForCheck();
    this.triggerShowHelper.emit(this.response);
    this.ref?.detectChanges();
  }

  static async create(inspection: InspectionResponse): Promise<FormControl> {
    const form = new FormControl(inspection.answer, [
      (input: FormControl) => {

        if(input.value == "NA") return null;
        const options = JSON.parse(inspection.options);
        if (!options) return null;
        const values = options[0].Description.split('|');
        const { type, minValue, maxValue } = RangeComponent.getRangeValues(values);

        let rangeInOut = null;
        let inputValue = input.value;


        rangeInOut = RangeComponent.isInRange(type, rangeInOut, inputValue, minValue, maxValue);  

        if (rangeInOut === Range.InRange) {
          return null;
        }   
        else {
          if(inspection.comments) {
            return null;
          }
        }

        return { hasComments: false };
      },
    ]);
    return form;
  }

  private static isInRange(type: any, rangeInOut: any, inputValue: any, minValue: any, maxValue: any) {
    if (type === RangeType.Range) {
      rangeInOut = Number(inputValue) >= Number(minValue) &&
        Number(inputValue) <= Number(maxValue)
        ? Range.InRange : Range.OutOfRange;
    }
    else if (type === RangeType.LessThan) {
      rangeInOut = Number(inputValue) <= Number(maxValue)
        ? Range.InRange : Range.OutOfRange;
    }
    else if (type === RangeType.GreaterThan) {
      rangeInOut = Number(inputValue) >= Number(minValue)
        ? Range.InRange : Range.OutOfRange;
    }
    return rangeInOut;
  }

  private static getRangeValues(values: any) {
    const minValue = values[1];
    const maxValue = values[2];
    const type = values[0];
    return { type, minValue, maxValue };
  }
}

