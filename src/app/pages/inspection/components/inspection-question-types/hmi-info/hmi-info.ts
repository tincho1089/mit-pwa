import { Component, Input } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";
import { InspectionResponse } from "src/app/core/sync/entities";

@Component({
  selector: "hmi-info",
  templateUrl: "hmi-info.html",
})
export class HMIInfoComponent extends BaseInspection {
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
        let epValue = null;
        let hmiValue = null;
        try {
          epValue = answer["details"][index]["EP"];
          hmiValue = answer["details"][index]["HMI"];
        } catch {}
        const group = new FormGroup({
          Parameter: new FormControl(span.value),
          EP: new FormControl(epValue, Validators.required),
          HMI: new FormControl(hmiValue, Validators.required),
        });
        return group;
      })
    );
    return new FormGroup({
      details,
    });
  }
  private prepareForm(): void {
    this.spans = HMIInfoComponent.staticSpans;
    this.spanUnit = HMIInfoComponent.spanUnit;
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;
  }
  private static getSpans(): Array<DomainModel> {
    return [
      new DomainModel("Transmitter Range"),
      new DomainModel("Transmitter Engineering Units (EU)"),
      new DomainModel("Low Low Alarm Setting"),
      new DomainModel("Low Alarm Setting"),
      new DomainModel("High Alarm Setting"),
      new DomainModel("High High Alarm Setting"),
      new DomainModel("Failure Mode (Hi/Lo)"),
    ];
  }
}