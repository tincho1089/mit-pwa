import { Component, Input, EventEmitter, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BaseInspection } from '../../../classes/base-inspection';
import { MeridiumModel } from 'src/app/core/models/local/meridium.model';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { MatRadioChange } from '@angular/material/radio';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'task',
  templateUrl: 'task.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComponent extends BaseInspection implements OnInit, BaseInspection {
  @Input()
  showHelper: boolean = false;
  triggerShowHelper = new EventEmitter();

  previous = new MeridiumModel();
  selected = new MeridiumModel();
  options: MeridiumModel[] = [
    new MeridiumModel('Completed', 'Completed'),
    new MeridiumModel('Not Completed', 'Not Completed', true, true, true),
  ];
  static staticOptions: MeridiumModel[] = [
    new MeridiumModel('Completed', 'Completed'),
    new MeridiumModel('Not Completed', 'Not Completed', true, true, true),
  ];
  private formControl: AbstractControl;

  constructor() {
    super();
  }

  override ngOnInit() {
    this.formControl = this.form.get([this.section, this.response.questionId]);

    this._onControlFormChanges();

    this.selected = TaskComponent.staticOptions.find((o) => o.value === this.response.answer);
    this.triggerShowHelper.emit(this.selected);
  }

  private _onControlFormChanges() {
    this.subscription.add(
      this.formControl.valueChanges.subscribe((value: string) => {
        if (value === null) this.selected = new MeridiumModel();
        else this.selected = TaskComponent.staticOptions.find((o) => o.value === value);
        this.triggerShowHelper.emit(this.selected);
      })
    );
  }

  static async create(inspection: InspectionResponse): Promise<FormControl> {
    const form = new FormControl(inspection.answer, [
      (input: FormControl) => {
        // blank response
        if (!input.value) {
          return { selected: false }
        }
        else {
          const selected = TaskComponent.staticOptions.find(
            (o) => o.value === input.value
          );
          return this.calcIsValid(selected,inspection);
        }
      },
    ]);
    return form;
  }    

  static calcIsValid(selected: MeridiumModel, inspection: InspectionResponse) {
    if(selected){
      // clear recommendation if not recommend
      if (selected.value != 'Not Completed' && inspection.recommendation){
        inspection.recommendation = '';
      }

      if (selected.value == 'Completed') {
        selected.commentRequired = false;
        selected.showRecommendations = false;
        selected.showComment = false;
        return null;
      }
      // Needs Comments and Recommendations
      if (selected.value == 'Not Completed') {
        selected.showComment = true;
        selected.commentRequired = true;
        selected.showRecommendations = true;
        if (inspection.comments && inspection.recommendation) 
          return null;
          return { hasComments: false };
      }
    }
    // We dont know what happened
    return null; // might as well let them complete the inspection
  }
}
