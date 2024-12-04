import { OnInit, Component, ChangeDetectorRef, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { MeridiumModel } from 'src/app/core/models/local/meridium.model';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { FormControl } from '@angular/forms';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-inspection-acceptable-na',
  templateUrl: './inspection-acceptable-na.component.html',
  styleUrls: ['./inspection-acceptable-na.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InspectionAcceptableNaComponent
  extends BaseInspection
  implements OnInit, QuestionTypesModel
{
  @Input()
  showHelper: boolean = false;
  @Output()
  triggerShowHelper = new EventEmitter();

  previous = new MeridiumModel();
  selected = new MeridiumModel();
  options: MeridiumModel[] = [
    new MeridiumModel('Acceptable', 'Acceptable'),
    new MeridiumModel('Not Acceptable', 'Not Acceptable', true, true),
    new MeridiumModel('NA', 'NA'),
  ];
  static staticOptions: MeridiumModel[] = [
    new MeridiumModel('Acceptable', 'Acceptable'),
    new MeridiumModel('Not Acceptable', 'Not Acceptable', true, true),
    new MeridiumModel('NA', 'NA'),
  ];
  private formControl: AbstractControl;
 
  constructor() {
    super();
  }

  override ngOnInit() {
    this.formControl = this.form.get([this.section, this.response.questionId]);

    this._onControlFormChanges();

    this.selected = InspectionAcceptableNaComponent.staticOptions.find((o) => o.value === this.response.answer);
    this.triggerShowHelper.emit(this.selected);
  }

  private _onControlFormChanges() {
    this.subscription.add(
      this.formControl.valueChanges.subscribe((value: string) => {
        if (value === null) this.selected = new MeridiumModel();
        else this.selected = InspectionAcceptableNaComponent.staticOptions.find((o) => o.value === value);
        this.triggerShowHelper.emit(this.selected);
      })
    );
  }

  static calcIsValid(selected: MeridiumModel, inspection: InspectionResponse) {
    // No issue or Not Applicable
    if ( ['Acceptable','NA'].includes(selected.value) ) {
        selected.commentRequired = false;
        selected.showRecommendations = false;
        selected.showComment = false;
        return null;
    }
    // Needs Comments and Recommendations
    if (selected.value == 'Not Acceptable') {
      selected.showComment = true;
      selected.commentRequired = true;
      selected.showRecommendations = false;
      if (inspection.comments) 
        return null;
      return { hasComments: false };
    }

    // We dont know what happened
    return { hasComments: false }; // might as well let them complete the inspection
}

static async create(inspection: InspectionResponse): Promise<FormControl> {
  const form = new FormControl(inspection.answer, [
    (input: FormControl) => {
      // blank response
      if (!input.value) {
        return { selected: false }
      }
      else {
        const selected = InspectionAcceptableNaComponent.staticOptions.find(
          (o) => o.value === input.value
        );
        return this.calcIsValid(selected,inspection);
      }
    },
  ]);
  return form;
}    


}
