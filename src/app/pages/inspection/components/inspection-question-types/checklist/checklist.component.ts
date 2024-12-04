import { Component, Input, OnInit } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { FormControl, Validators } from '@angular/forms';
import { InspectionResponse } from 'src/app/core/sync/entities';

@Component({
  selector: 'checklist',
  templateUrl: 'checklist.component.html',
})
export class ChecklistComponent extends BaseInspection implements OnInit {
  @Input()
  showHelper: boolean = false;
  options: DomainModel[] = [];

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.options = this.getOptionsObject();
  }

  static async create(response: InspectionResponse): Promise<FormControl> {
    const splitted = response.answer ? String(response.answer).split(',') : [];
    const answer = splitted.length > 0 ? splitted : null;
    return new FormControl(answer, Validators.required);
  }
}
