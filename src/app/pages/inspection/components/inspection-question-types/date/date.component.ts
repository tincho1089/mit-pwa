import { Component, Input, ChangeDetectorRef } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormControl } from '@angular/forms';
import dayjs from 'dayjs';
import { db } from 'src/databases/db';


@Component({
  selector: 'app-date',
  templateUrl: './date.component.html',
  styleUrls: ['./date.component.scss']
})
export class DateComponent extends BaseInspection implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;
  answerDate: FormControl<Date> = new FormControl;

  constructor(
    private changeDectection: ChangeDetectorRef
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.initDate();
  }
  initDate(): void {
    const formControl = this.form.get([
      this.section,
      this.response.questionId
    ]);
    if (formControl?.value && this.response.answer !== 'NA') {
      const date = dayjs(formControl.value);
      formControl.setValue(new Date(date.year(), (date.month()), date.get('date')), //  is not considering timezone while calculating local time.
      {
        onlySelf: true,
        emitEvent: false
      });
      this.changeDectection.detectChanges();
    } 
    
  }
  changeDatePicker(): void {
    this.response.answer = (
      this.answerDate.getRawValue().toDateString()
    );
  }

}