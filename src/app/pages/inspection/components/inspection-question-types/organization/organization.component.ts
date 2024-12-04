import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { InspectionDetailsService } from '../../../services/inspection-details.service';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { db } from 'src/databases/db';

@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss']
})
export class OrganizationComponent extends BaseInspection {
  @Input() override response: InspectionResponse;
  bu = "";

  constructor(private inspectionDetailsService: InspectionDetailsService) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.bu = this.inspectionDetailsService.workorder.bu;
    if(this.response.answer !== this.bu) {
      this.response.answer = this.bu;
      db.updateAnswer(this.response);
    }
  }
}
