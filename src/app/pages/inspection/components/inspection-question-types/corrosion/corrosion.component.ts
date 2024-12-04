import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { BaseInspection } from '../../../classes/base-inspection';
import { CorrosionModel } from 'src/app/core/models/local/corrosion.model';

@Component({
  selector: 'corrosion',
  templateUrl: 'corrosion.component.html',
  styleUrls: ['./corrosion.component.scss'],
})
export class CorrosionComponent extends BaseInspection implements OnInit {
  @Input()
  showHelper: boolean = false;
  @Output()
  triggerShowHelper = new EventEmitter();

  selected = new CorrosionModel();
  options: CorrosionModel[] = [
    new CorrosionModel('None', 'None', 'assets/images/norust.png'),
    new CorrosionModel('Light', 'Light', 'assets/images/rust1.png'),
    new CorrosionModel('Moderate', 'Moderate', 'assets/images/rust2.png', true,true),
    new CorrosionModel('Heavy', 'Heavy', 'assets/images/rust3.png', true,true),
  ];

  private formControl: AbstractControl;

  constructor() {
    super();
  }

  override ngOnInit() {
    this.formControl = this.form.get([this.section, this.response.questionId]);

    this._onControlFormChanges();

    this.selected = this.options.find((o) => o.value === this.response.answer);
    this.triggerShowHelper.emit(this.selected);
  }

  private _onControlFormChanges() {
    this.subscription.add(
      this.formControl.valueChanges.subscribe((value: string) => {
        if (value === null) this.selected = new CorrosionModel();
        else this.selected = this.options.find((o) => o.value === value);
        this.triggerShowHelper.emit(this.selected);
      })
    );
  }
}
