import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { BaseInspection } from '../../../classes/base-inspection';
import { MeridiumModel } from 'src/app/core/models/local/meridium.model';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { MIUtilities } from 'src/app/shared/utility';
import { InspectionDetailsService } from '../../../services/inspection-details.service';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { MatRadioChange } from '@angular/material/radio';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'nimiirna',
  templateUrl: 'nimiirna.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NimiirnaComponent
  extends BaseInspection
  implements OnInit, QuestionTypesModel
{
  @Input()
  showHelper: boolean = false;
  @Output()
  triggerShowHelper = new EventEmitter();

  previous = new MeridiumModel();
  selected = new MeridiumModel();
  circuitPipingList: Array<string> = new Array<string>();
  circuitPiping: string;
  options: MeridiumModel[] = [
    new MeridiumModel('No Issue', 'NI'),
    new MeridiumModel('Comment', 'MI', true, true),
    new MeridiumModel('Recommended', 'IR', true, true, true),
    new MeridiumModel('N/A', 'NA'),
  ];
  static staticOptions: MeridiumModel[] = [
    new MeridiumModel('No Issue', 'NI'),
    new MeridiumModel('Comment', 'MI', true, true),
    new MeridiumModel('Recommended', 'IR', true, true, true),
    new MeridiumModel('N/A', 'NA'),
  ];

  private formControl: AbstractControl;
 
  constructor() {
    super();
  }

  override ngOnInit() {
    this.formControl = this.form.get([this.section, this.response.questionId]);

    this._onControlFormChanges();

    this.selected = NimiirnaComponent.staticOptions.find((o) => o.value === this.response.answer);
    this.triggerShowHelper.emit(this.selected);
    this.circuitPiping = this.response.circuitPiping;
  }

  private _onControlFormChanges() {
    this.subscription.add(
      this.formControl.valueChanges.subscribe((value: string) => {
        if (value === null) this.selected = new MeridiumModel();
        else this.selected = NimiirnaComponent.staticOptions.find((o) => o.value === value);
        this.triggerShowHelper.emit(this.selected);
      })
    );
  }

  onCiruitPipingChanges() {
    this.response.circuitPiping = this.circuitPiping;
    this.form.get(this.sectionArray).updateValueAndValidity();
  }

  static async create(inspection: InspectionResponse): Promise<FormControl> {
    const form = new FormControl(inspection.answer, [
      (input: FormControl) => {
        // blank response
        if (!input.value) return { selected: false };
        else {
          const selected = this.staticOptions.find(
            (o) => o.value === input.value
          );
          return this.calcIsValid(selected,inspection);
        }
      },
    ]);
    return form;
  }

  static calcIsValid(selected: MeridiumModel, inspection: InspectionResponse) {
    // clear recommendation if not recommend
    if (selected.value != 'IR' && inspection.recommendation)
      inspection.recommendation = '';

    // No issue or Not Applicable
    if ( ['NI','NA'].includes(selected.value) )
      {
        selected.commentRequired = false;
        selected.showRecommendations = false;
        selected.showComment = false;
        return null;
      }
    // Needs Comments
    if (selected.value == 'MI') {
      selected.commentRequired = true;
      selected.showRecommendations = false;
      selected.showComment = true;
      if (inspection.comments) 
        return null;
      return { hasComments: false };
    }
    // Needs Comments & Recommendation
    if (selected.value == 'IR') {
      selected.showComment = true;
      selected.commentRequired = true;
      selected.showRecommendations = true;
      if (inspection.comments && inspection.recommendation)
        return null;
      return { hasComments: false };
    }
    return null; // might as well let them complete the inspection
  }

}
