import { ChangeDetectorRef, Component, Input } from "@angular/core";
import { FormGroup, FormControl, FormArray, Validators } from "@angular/forms";
import { BaseInspection } from "../../../classes/base-inspection";
import { DomainModel } from "src/app/core/models/local/domain.model";

@Component({
  selector: "satisfactory-unsatisfactory-failure-code",
  templateUrl: "satisfactory-unsatisfactory-failure-code.html",
})
export class SatisfactoryUnsatisfactoryFailureCodeComponent extends BaseInspection {

  @Input()
  showHelper: boolean = false;
  static conditionOptions: DomainModel[] = [];
  static anomalyCodesOptions: DomainModel[] = [];
  static rustLevelsOptions: DomainModel[] = [];
  static rustGradeOptions: DomainModel[] = [];
  static staticAnomaliesArray: FormArray;

  conditions: DomainModel[] = [];
  anomalyCodes: DomainModel[] = [];
  rustLevels: DomainModel[] = [];
  rustGrades: DomainModel[] = [];
  anomaliesArray: FormArray;
  formGroup: FormGroup;

  constructor(private ref: ChangeDetectorRef) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
  }

  private _createForm(): void {
    const answer = this.getAnswerObject();
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;
    this.conditions = this.getConditions();
    this.anomalyCodes = this.getAnomalyCodes();
    this.rustLevels = this.getRustLevels();
    this.rustGrades = this.getRustGrades();
    this.anomaliesArray = this.getAnomaliesArray(answer);

    let condition = null;
    try {
      condition = answer["details"]["Condition"];
    } catch {}

    const details = new FormGroup({
      Condition: new FormControl(condition, Validators.required),
      AnomaliesArray: this.anomaliesArray,
    });

    this.formGroup = new FormGroup({
      details,
    });

    // on condition change,
    this.subscription.add(
      this.formGroup
        .get("details.Condition")
        .valueChanges.subscribe((value) => {
          const opt = this.conditions.filter((x) => x.value == value);
          if (opt.length > 0) {
            if (opt[0].value === "Satisfactory") {
              while (this.anomaliesArray.length !== 0) {
                this.anomaliesArray.removeAt(0);
                (this.formGroup?.get('details') as FormGroup).removeControl('AnomaliesArray');
              }
            } else {
              this.addAnomalyCode(); // add empty anomaly code
              (this.formGroup?.get('details') as FormGroup).addControl('AnomaliesArray', this.anomaliesArray);
            }

            this.ref?.detectChanges();
          }
        })
    );

    this.setControl(this.formGroup);
  }

  addAnomalyCode() {
    this.anomaliesArray.push(
      new FormGroup({
        AnomalyCode: new FormControl("", Validators.required),
        RustGrade: new FormControl(""),
        RustLevel: new FormControl(""),
      })
    );

    this.ref?.detectChanges();
  }

  private getAnomaliesArray(answer: any) {
    const data = new FormArray([]);
    try {
      const anomalyAnswer = answer["details"]["AnomaliesArray"];
      anomalyAnswer.forEach((response) => {
        data.push(
          new FormGroup({
            AnomalyCode: new FormControl(
              response["AnomalyCode"],
              Validators.required
            ),
            RustGrade: new FormControl(response["RustGrade"]),
            RustLevel: new FormControl(response["RustLevel"]),
          })
        );
      });
    } catch {}
    return data;
  }



  getItemDescription(value: string, type: string): string {
    let description = "";
    let item = null;
    switch (type) {
      case "AC":
        item = this.anomalyCodes.find((ac) => ac.value === value);
        description = item ? item.description : "";
        break;
      case "RL":
        item = this.rustLevels.find((rl) => rl.value === value);
        description = item ? item.description : "";
        break;
      case "RG":
        item = this.rustGrades.find((rg) => rg.value === value);
        description = item ? item.description : "";
        break;
    }
    return description;
  }

  private getConditions(): Array<DomainModel> {
    return [
      new DomainModel("Satisfactory", "Satisfactory"),
      new DomainModel("Unsatisfactory", "Unsatisfactory"),
    ];
  }

  private getAnomalyCodes(): Array<DomainModel> {
    return [
      new DomainModel("NA", "NA - Not available"),
      new DomainModel("INT", "INT - Intact condition"),
      new DomainModel("ABD", "ABD - As-built difference"),
      new DomainModel("BEN", "BEN - Bent member"),
      new DomainModel("BOL", "BOL - Bolt tightness"),
      new DomainModel("COD", "COD - Coating damage"),
      new DomainModel("COR", "COR - Corrosion"),
      new DomainModel("CPR", "CPR - Low CP reading"),
      new DomainModel("CRK", "CRK - Visual crack"),
      new DomainModel("DEN", "DEN - Dented member"),
      new DomainModel("ECI", "ECI - Eddy Current Indication"),
      new DomainModel("HOL", "HOL - Hole in member"),
      new DomainModel("LAC", "LAC - Lack of access for inspection"),
      new DomainModel("LEK", "LEK - Leak"),
      new DomainModel("MGR", "MGR - Marine growth"),
      new DomainModel("MIS", "MIS - Missing parts"),
      new DomainModel("MOV", "MOV - Relative Movement"),
      new DomainModel("MPI", "MPI - MPI indication"),
      new DomainModel("WDF", "WDF - Weld defects"),
      new DomainModel("WTH", "WTH - Reduced wall thickness"),
    ];
  }

  private getRustLevels(): Array<DomainModel> {
    return [
      new DomainModel("S", "S"),
      new DomainModel("G", "G"),
      new DomainModel("P", "P"),
    ];
  }

  private getRustGrades(): Array<DomainModel> {
    return [
      new DomainModel("1", "1"),
      new DomainModel("2", "2"),
      new DomainModel("3", "3"),
      new DomainModel("4", "4"),
      new DomainModel("5", "5"),
      new DomainModel("6", "6"),
      new DomainModel("7", "7"),
      new DomainModel("8", "8"),
      new DomainModel("9", "9"),
      new DomainModel("10", "10"),
    ];
  }
}
