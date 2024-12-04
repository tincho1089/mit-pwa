import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { SharedService } from 'src/app/core/services/shared.service';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';

@Component({
  selector: 'app-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.scss']
})
export class LinkComponent extends BaseInspection implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  constructor(private sharedService: SharedService) {
    super();
  }

  openLink(link: string) {
    this.sharedService.openLink(link);
  }

}