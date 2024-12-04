import { Component, Input } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";
import { InspectionResponse } from "src/app/core/sync/entities";

@Component({
  selector: "alarm-setting",
  templateUrl: "alarm-setting.html",
})
export class AlarmSettingComponent extends BaseInspection {
  @Input()
  showHelper: boolean = false;
  static staticSpans: DomainModel[] = [];
  static spanUnit: string = "";
  spans: DomainModel[] = [];
  formGroup: FormGroup;
  spanUnit: string = "";
  constructor() {
    super();
  }
  override ngOnInit() {
    super.ngOnInit();
    this.prepareForm();
  }
  static async create(inspection: InspectionResponse): Promise<FormGroup> {
    const answer = this.getAnswerObject(inspection);
    this.staticSpans = this.getSpans();
    const details = new FormArray(
      this.staticSpans.map((span, index): FormGroup => {
        let alarmSettingValue = null;
        let calculatedValue = null;
        let asFoundValue = null;
        let errorValue = null;
        let cccAlarmValue = null;
        try {
          alarmSettingValue = answer["details"][index]["AlarmSetting"];
          calculatedValue = answer["details"][index]["Calculated"];
          asFoundValue = answer["details"][index]["AsFound"];
          errorValue = answer["details"][index]["Error"].replace("%", "");
          cccAlarmValue = answer["details"][index]["CccAlarm"];
        } catch {}
        const group = new FormGroup({
          Alarm: new FormControl(span.value),
          AlarmSetting: new FormControl(alarmSettingValue, Validators.required),
          Calculated: new FormControl(calculatedValue, Validators.required),
          AsFound: new FormControl(asFoundValue, Validators.required),
          Error: new FormControl(errorValue, Validators.required),
          CccAlarm: new FormControl(cccAlarmValue, Validators.required),
        });
        return group;
      })
    );
    return new FormGroup({
      details,
    });
  }
  private prepareForm(): void {
    this.spans = AlarmSettingComponent.staticSpans;
    this.spanUnit = AlarmSettingComponent.spanUnit;
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;
  }
  private static getSpans(): Array<DomainModel> {
    return [
      new DomainModel("LL"),
      new DomainModel("L"),
      new DomainModel("HH"),
      new DomainModel("H"),
    ];
  }
}