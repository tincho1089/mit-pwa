import { Component, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { MeridiumModel } from 'src/app/core/models/local/meridium.model';
import { FormControl } from '@angular/forms';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'meridium-inspection',
  templateUrl: 'meridium-inspection.component.html',
  styleUrls: ['./meridium-inspection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeridiumInspectionComponent extends BaseInspection {
  @Input()
  showHelper: boolean = false;
  @Output()
  triggerShowHelper = new EventEmitter();

  previous = new MeridiumModel();
  selected = new MeridiumModel();
  options: MeridiumModel[] = [
    new MeridiumModel('Acceptable', 'Inspected-Acceptable'),
    new MeridiumModel(
      'Not Acceptable',
      'Inspected-Not Acceptable',
      true,
      false,
      true
    ),
    new MeridiumModel('Not Inspected', 'Not Inspected'),
    new MeridiumModel('Not Part of Equipment', 'Not Part of Equipment'),
  ];
  static staticOptions: MeridiumModel[] = [
    new MeridiumModel('Acceptable', 'Inspected-Acceptable'),
    new MeridiumModel(
      'Not Acceptable',
      'Inspected-Not Acceptable',
      true,
      false,
      true
    ),
    new MeridiumModel('Not Inspected', 'Not Inspected'),
    new MeridiumModel('Not Part of Equipment', 'Not Part of Equipment'),
  ];
  private formControl: AbstractControl;

  constructor() {
    super();
  }

  override ngOnInit() {
    this.formControl = this.form.get([this.section, this.response.questionId]);

    this._onControlFormChanges();

    this.selected = MeridiumInspectionComponent.staticOptions.find((o) => o.value === this.response.answer);
    this.triggerShowHelper.emit(this.selected);
  }

  private _onControlFormChanges() {
    this.subscription.add(
      this.formControl.valueChanges.subscribe((value: string) => {
        if (value === null) this.selected = new MeridiumModel();
        else this.selected = MeridiumInspectionComponent.staticOptions.find((o) => o.value === value);
        this.triggerShowHelper.emit(this.selected);
      })
    );
  }

  static calcIsValid(selected: MeridiumModel, inspection: InspectionResponse) {
    if (selected?.value != 'Inspected-Not Acceptable' && inspection.recommendation)
      inspection.recommendation = '';

    if(selected?.value == 'Inspected-Not Acceptable')
      {
        selected.showRecommendations = true;
        selected.showComment = true;
      }
      

    return null; // None of these questions require comments or rec.
}

static async create(inspection: InspectionResponse): Promise<FormControl> {
  const form = new FormControl(inspection.answer, [
    (input: FormControl) => {
      // blank response
      if (!input.value) {
        return { selected: false }
      }
      else {
        const selected = MeridiumInspectionComponent.staticOptions.find(
          (o) => o.value === input.value
        );
        return this.calcIsValid(selected,inspection);
      }
    },
  ]);
  return form;
}    
}
