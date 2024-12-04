import { Component, EventEmitter, Input, ChangeDetectorRef,ChangeDetectionStrategy } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { FormControl } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';
import { MeridiumModel } from 'src/app/core/models/local/meridium.model';
import { AbstractControl } from '@angular/forms';


@Component({
  selector: 'app-yesnocomment',
  templateUrl: './yesnocomment.component.html',
  styleUrls: ['./yesnocomment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YesNoCommentComponent extends BaseInspection {

  @Input()
  showHelper: boolean = false;
  previous = new MeridiumModel();
  selected = new MeridiumModel();
  options: MeridiumModel[] = [
    new MeridiumModel('Yes', 'yes'),
    new MeridiumModel('No', 'no', true, true),
  ];
  static staticOptions: MeridiumModel[] = [
    new MeridiumModel('Yes', 'yes'),
    new MeridiumModel('No', 'no', true, true),
  ];

  triggerShowHelper = new EventEmitter();

  private formControl: AbstractControl;

  constructor() {
    super();
  }

  override ngOnInit() {
    this.formControl = this.form.get([this.section, this.response.questionId]);

    this._onControlFormChanges();

    this.selected = YesNoCommentComponent.staticOptions.find((o) => o.value === this.response.answer);
    this.triggerShowHelper.emit(this.selected);
  }

  private _onControlFormChanges() {
    this.subscription.add(
      this.formControl.valueChanges.subscribe((value: string) => {
        if (value === null) this.selected = new MeridiumModel();
        else this.selected = YesNoCommentComponent.staticOptions.find((o) => o.value === value);
        this.triggerShowHelper.emit(this.selected);
      })
    );
  }

  static calcIsValid(selected: MeridiumModel, inspection: InspectionResponse) {
        
        if (selected.value == 'yes') {
          selected.commentRequired = false;
          selected.showRecommendations = false;
          selected.showComment = false;
          return null;
      }
      // Needs Comments and Recommendations
      if (selected.value == 'no') {
        selected.showComment = true;
        selected.commentRequired = true;
        selected.showRecommendations = false;
        if (inspection.comments) 
          return null;
        return { hasComments: false };
      }
    
      // We dont know what happened
      return null; // might as well let them complete the inspection
    }

    static async create(inspection: InspectionResponse): Promise<FormControl> {
      const form = new FormControl(inspection.answer, [
        (input: FormControl) => {
          // blank response
          if (!input.value) {
            return { selected: false }
          }
          else {
            const selected = YesNoCommentComponent.staticOptions.find(
              (o) => o.value === input.value
            );
            return this.calcIsValid(selected,inspection);
          }
        },
      ]);
      return form;
    }    
}
