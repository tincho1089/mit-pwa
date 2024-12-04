import { Component, Input } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";
import { InspectionResponse } from "src/app/core/sync/entities";

@Component({
  selector: "three-point-calibration",
  templateUrl: "three-point-calibration.html",
  styleUrls: ["three-point-calibration.scss"]
})
export class ThreePointCalibrationComponent extends BaseInspection {

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
    let details: FormArray = new FormArray(
      this.staticSpans.map((span, index): FormGroup => {
        let calculatedValue = null;
        let asFoundValue = null;
        let errorValue = null;
        try {
          calculatedValue = answer["details"][index]["Calculated"];
          asFoundValue = answer["details"][index]["AsFound"];
          errorValue = answer["details"][index]["Error"]
        } catch {}
        const group = new FormGroup({
          CheckPoint: new FormControl(span.value),
          Calculated: new FormControl(calculatedValue, Validators.required),
          AsFound: new FormControl(asFoundValue, Validators.required),
          Error: new FormControl(errorValue, Validators.required),
        });
        return group;
      })
    );
    return new FormGroup({
      details
    });
  }

  public getFormGroup(): FormGroup[] {
    let formGroup = (this.formGroup.controls['details'] as FormArray).controls as FormGroup[];
    return formGroup;
  }

  
  private prepareForm(): void {
    this.spans = ThreePointCalibrationComponent.staticSpans;
    this.spanUnit = ThreePointCalibrationComponent.spanUnit;
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;
  }
  private static getSpans(): Array<DomainModel> {
    return [
      new DomainModel("100"),
      new DomainModel("0"),
      new DomainModel("50"),
    ];
  }
}

