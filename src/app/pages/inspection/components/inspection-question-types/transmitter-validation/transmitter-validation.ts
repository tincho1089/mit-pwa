import { Component, Input, OnInit } from "@angular/core";
import { FormGroup, FormControl, Validators, FormArray } from "@angular/forms";
import { InspectionResponse } from "src/app/core/sync/entities/inspection-response";
import { EquipDetails } from "src/app/core/sync/entities/visions-details";
import { BaseInspection } from '../../../classes/base-inspection';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { MIUtilities } from 'src/app/shared/utility';

@Component({
  selector: "transmitter-validation",
  templateUrl: "transmitter-validation.html",
  styleUrls: ["transmitter-validation.scss"]
})
export class TransmitterValidationComponent extends BaseInspection
  implements OnInit {
  @Input()
  override editable: boolean = true;
  @Input()
  showHelper: boolean = false;
  formGroup: FormGroup;
  failOptions: Array<DomainModel> = [];
  detailsDomain: Array<DomainModel> = [
    new DomainModel("AsFound", "As Found"),
    new DomainModel("AsLeft", "As Left")
  ];
  static columns: Array<DomainModel> = [];
  columns = TransmitterValidationComponent.columns;
  static rows = [0, 1];
  rows = TransmitterValidationComponent.rows;
  static units: string = "";
  units = TransmitterValidationComponent.units;
  static outputUnits: string = "";
  outputUnits = TransmitterValidationComponent.outputUnits;
  static defaultUnits = "mA";
  defaultUnits = TransmitterValidationComponent.defaultUnits;
  static low: number = 0;
  low = TransmitterValidationComponent.low;
  static defaultSignalMin: number = 4;
  defaultSignalMin = TransmitterValidationComponent.defaultSignalMin;
  static high: number = 0;
  high = TransmitterValidationComponent.high;
  static defaultSignalMax = 20;
  defaultSignalMax = TransmitterValidationComponent.defaultSignalMax;

  static signalMin: number = 0;
  signalMin = TransmitterValidationComponent.signalMin;
  static signalMax: number = 0;
  signalMax = TransmitterValidationComponent.signalMax;

  static showSignal: boolean = false;
  showSignal = TransmitterValidationComponent.showSignal;
  static showFivePoint: boolean = false;
  showFivePoint = TransmitterValidationComponent.showFivePoint;
  static showEngUnit: boolean = false;
  showEngUnit = TransmitterValidationComponent.showEngUnit;
  static engUnit: string = "";
  engUnit = TransmitterValidationComponent.engUnit;
  static engMin: number = -1;
  engMin = TransmitterValidationComponent.engMin;
  static engMax: number = -1;
  engMax = TransmitterValidationComponent.engMax;
  static defaultVal: number = -99999;
  defaultVal = TransmitterValidationComponent.defaultVal;

  static tp1: number = -99999;
  tp1 = TransmitterValidationComponent.tp1;
  static tp2: number = -99999;
  tp2 = TransmitterValidationComponent.tp2;
  static tp3: number = -99999;
  tp3 = TransmitterValidationComponent.tp3;
  static tp4: number = -99999;
  tp4 = TransmitterValidationComponent.tp4;
  static tp5: number = -99999;
  tp5 = TransmitterValidationComponent.tp5;

  static accuracy: number = 0;
  accuracy = TransmitterValidationComponent.accuracy;
  static formGroup: any;

  constructor() {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.failOptions = this.getOptionsObject();
    this.prepareForm();
  }


  private prepareForm() {
    this.formGroup = this.form.get(this.sectionArray) as FormGroup;
    const details = this.formGroup.get("details") as FormGroup;
    const asFound = details.get("AsFound") as FormArray;
    const asLeft = details.get("AsLeft") as FormArray;

    asFound.controls.forEach((group: FormGroup) => {
      this.subscription.add(
        group
          .get("Test Input")
          .valueChanges.subscribe(this.onTestInputValueChanges.bind(this,group, false)
)
      );

      this.subscription.add(
        group
          .get("Actual Output")
          .valueChanges.subscribe(
            this.onTargetActualValueChanges.bind(this,group, false))
      );

      this.subscription.add(
        group.valueChanges.subscribe(this.onGroupValueChanges.bind(this, "AsFound"))
      );
    });


    asLeft.controls.forEach((group: FormGroup) => {
      this.subscription.add(
        group
          .get("Test Input")
          .valueChanges.subscribe(this.onTestInputValueChanges.bind(this,group, false))
      );

      this.subscription.add(
        group
          .get("Actual Output")
          .valueChanges.subscribe(this.onTargetActualValueChanges.bind(this,group, false))
      );

      this.subscription.add(
        group.valueChanges.subscribe(this.onGroupValueChanges.bind(this, "AsLeft"))
      );
    });


    this.subscription.add(
      this.formGroup
        .get("details.Accuracy")
        .valueChanges.subscribe((value) => {
          this.accuracy = value;

          for (let i = 0; i < this.rows.length; i++) {
            const control = this.formGroup.get("details.AsFound." + this.rows[i]) as FormGroup;
            const actualOutputFound = this.formGroup.get("details.AsFound." + this.rows[i] + ".Actual Output");
            const testInputFound = this.formGroup.get("details.AsFound." + this.rows[i] + ".Test Input");
            this.onTestInputValueChanges(control, true, testInputFound.value);
            this.onTargetActualValueChanges(control, true, actualOutputFound.value);
            this.onGroupValueChanges("AsFound");
          }
        })
    );

  }


  static getTPs(equipDetails: Array<EquipDetails>) {
    try {
      const strTp1 = this.getSetting("Cal TP1", equipDetails);
      const strTp2 = this.getSetting("Cal TP2", equipDetails);
      const strTp3 = this.getSetting("Cal TP3", equipDetails);
      const strTp4 = this.getSetting("Cal TP4", equipDetails);
      const strTp5 = this.getSetting("Cal TP5", equipDetails);

      this.tp1 = strTp1 ? Number(strTp1) : this.defaultVal;
      this.tp2 = strTp2 ? Number(strTp2) : this.defaultVal;
      this.tp3 = strTp3 ? Number(strTp3) : this.defaultVal;
      this.tp4 = strTp4 ? Number(strTp4) : this.defaultVal;
      this.tp5 = strTp5 ? Number(strTp5) : this.defaultVal;

      if (this.tp1 != this.defaultVal || this.tp2 != this.defaultVal || this.tp3 != this.defaultVal ||
        this.tp4 != this.defaultVal || this.tp5 != this.defaultVal) {
        this.showFivePoint = true;
      }
    } catch { }
  }

  static getEngUnit(equipDetails: Array<EquipDetails>) {
    try {
      const strEngUnit = this.getSetting("Eng Unit", equipDetails);
      const strEngMin = this.getSetting("Eng Min", equipDetails);
      const strEngMax = this.getSetting("Eng Max", equipDetails);

      this.engUnit = strEngUnit ? strEngUnit : "";
      this.engMin = strEngMin ? Number(strEngMin) : 0;
      this.engMax = strEngMax ? Number(strEngMax) : 0;

      if (this.engUnit.length > 0 || this.engMin > 0 || this.engMax > 0) {
        this.showEngUnit = true;
        if (this.engUnit) this.engUnit = " (" + this.engUnit + ")";
      }
    } catch { }
  }

  static async create(inspection: InspectionResponse, equipDetails: Array<EquipDetails>
  ): Promise<FormGroup> {
    const answer = this.getAnswerObject(inspection);
    let asFPassFail = null;
    let asLPassFail = null;
    let failureCode = null;

    this.getTPs(equipDetails);
    this.getEngUnit(equipDetails);
    if (this.showFivePoint) {
      var rows: Array<number> = [];
      if (this.tp1 > this.defaultVal) {
        rows.push(0);
      }
      if (this.tp2 > this.defaultVal) {
        rows.push(1);
      }
      if (this.tp3 > this.defaultVal) {
        rows.push(2);
      }
      if (this.tp4 > this.defaultVal) {
        rows.push(3);
      }
      if (this.tp5 > this.defaultVal) {
        rows.push(4);
      }
      this.rows = rows;
    } else {
      this.rows = [0, 1];
    }
    try {
      this.units = this.getSetting("Unit", equipDetails);
      this.outputUnits = this.getSetting("Signal Unit", equipDetails);
      if (!this.units) {
        this.units = this.getSetting("Set Point Unit", equipDetails);
      }
      if (!this.units) {
        this.units = this.getSetting("Span Unit", equipDetails);
      }
      if (!this.units) {
        this.units = this.defaultUnits;
      }

      if (this.units) this.units = " (" + this.units + ")";
      if (!this.outputUnits) {
        this.outputUnits = this.defaultUnits;
      }
      if (this.outputUnits) this.outputUnits = " (" + this.outputUnits + ")";
    } catch (error) {

      this.units = " (" + this.defaultUnits + ")";
      let temp = this.outputUnits;
      this.outputUnits = '';
      this.outputUnits = " (" + temp + ")";
    }

    try {
      this.accuracy = this.getSetting("accuracy", equipDetails)
        ? Number(this.getSetting("accuracy", equipDetails))
        : 2;
    } catch (ex) {
      this.accuracy = 2;
    }

    if (this.showEngUnit) {
      TransmitterValidationComponent.columns = [
        new DomainModel("Test Input", "Test Input" + this.units),
        new DomainModel("Eng Unit", "Eng Unit" + this.engUnit),
        new DomainModel("Target Output", "Target Output" + this.outputUnits),
        new DomainModel("Actual Output", "Actual Output" + this.outputUnits),
        new DomainModel("Error", "%Error")
      ];
    } else {
      TransmitterValidationComponent.columns = [
        new DomainModel("Test Input", "Test Input" + this.units),
        new DomainModel("Target Output", "Target Output" + this.outputUnits),
        new DomainModel("Actual Output", "Actual Output" + this.outputUnits),
        new DomainModel("Error", "%Error")
      ];
    }

    try {
      const lowValue = this.getSetting("Min Span", equipDetails);
      this.low = lowValue ? Number(lowValue) : 0;
      const highValue = this.getSetting("Max Span", equipDetails);
      this.high = highValue ? Number(highValue) : 0;
    } catch { }

    try {
      const signalMin = this.getSetting("Signal Min", equipDetails);
      this.signalMin = signalMin ? Number(signalMin) : this.defaultSignalMin;
      const signalMax = this.getSetting("Signal Max", equipDetails);
      this.signalMax = signalMax ? Number(signalMax) : this.defaultSignalMax;
      this.showSignal = signalMin ? true : false;
    } catch { }

    const asFoundForm = new FormArray(
      this.rows.map(
        (row): FormGroup => {
          let testInputValue = null;
          let targetOutputValue = null;
          let actualOutputValue = null;
          let errorValue = null;
          let tmpTestInput = null;
          let flag: boolean = false;
          let engOutputValue = null;

          try {
            flag = MIUtilities.isAnsDetailNullOrUndefined(
              answer,
              true,
              "F",
              row
            );
            if (!flag) {
              tmpTestInput = answer.details.AsFound[row]["Test Input"];
              testInputValue = !MIUtilities.isNullOrUndefined(
                answer.details.AsFound[row]["Test Input"]
              )
                ? answer.details.AsFound[row]["Test Input"]
                : this.getTestInput(row);
              engOutputValue = !MIUtilities.isNullOrUndefined(tmpTestInput) &&
                tmpTestInput == 0 ? answer.details.AsFound[row]["Eng Unit"] : this.getEngOutput(testInputValue);
              targetOutputValue = !MIUtilities.isNullOrUndefined(tmpTestInput) &&
                !MIUtilities.isNullOrUndefined(answer.details.AsFound[row]["Target Output"])
                ? answer.details.AsFound[row]["Target Output"]
                : this.getTargetOutput(testInputValue);
              actualOutputValue = answer.details.AsFound[row]["Actual Output"];
              errorValue = answer.details.AsFound[row]["Error"];
            } else {
              testInputValue = this.getTestInput(row);
              targetOutputValue = this.getTargetOutput(testInputValue);
              engOutputValue = this.getEngOutput(testInputValue);
              actualOutputValue = "";
              errorValue = "";
            }
          } catch { }
          const testInput = new FormControl(
            testInputValue,
            Validators.required
          );

          const engOutput = new FormControl(engOutputValue && !isNaN(engOutputValue) ? engOutputValue : "");
          const actualOutput = new FormControl(
            actualOutputValue && !isNaN(actualOutputValue) ? actualOutputValue : "",
            Validators.required
          );
          const group = new FormGroup({
            "Test Input": testInput,
            "Eng Unit": engOutput,
            "Target Output": new FormControl(
              targetOutputValue && !isNaN(targetOutputValue) ? targetOutputValue : ""

            ),
            "Actual Output": actualOutput,
            "Error": new FormControl(errorValue)
          });

          return group;
        }
      )
    );
    const asLeftForm = new FormArray(
      this.rows.map(
        (row): FormGroup => {
          let testInputValue = null;
          let targetOutputValue = null;
          let actualOutputValue = null;
          let errorValue = null;
          let tmpTestInput = null;
          let flag: boolean = false;
          let engOutputValue = null;
          try {
            flag = MIUtilities.isAnsDetailNullOrUndefined(
              answer,
              true,
              "L",
              row
            );
            if (!flag) {
              tmpTestInput = answer.details.AsLeft[row]["Test Input"];
              testInputValue = !MIUtilities.isNullOrUndefined(tmpTestInput)
                ? tmpTestInput
                : this.getTestInput(row);
              engOutputValue = !MIUtilities.isNullOrUndefined(tmpTestInput) &&
                tmpTestInput == 0 ? answer.details.AsFound[row]["Eng Unit"] : this.getEngOutput(testInputValue);
              targetOutputValue = !MIUtilities.isNullOrUndefined(tmpTestInput) &&
                tmpTestInput != 0 && !MIUtilities.isNullOrUndefined(answer.details.AsLeft[row]["Target Output"])
                ? answer.details.AsLeft[row]["Target Output"]
                : this.getTargetOutput(testInputValue);
              actualOutputValue = answer.details.AsLeft[row]["Actual Output"];
              errorValue = answer.details.AsLeft[row]["Error"];
            } else {
              testInputValue = this.getTestInput(row);
              engOutputValue = this.getEngOutput(testInputValue);
              targetOutputValue = this.getTargetOutput(testInputValue);
              actualOutputValue = "";
              errorValue = "";
            }
          } catch { }

          let testInput = null;
          testInput = new FormControl(testInputValue, Validators.required);
          if(asFPassFail == "Fail")
            {
              testInput = new FormControl(testInputValue, Validators.required)
            }
            else
            {
              testInput = new FormControl(testInputValue);
            }

          const engOutput = new FormControl(engOutputValue);

          let actualOutput = null;
          if(asFPassFail == "Fail")
            {
              actualOutput = new FormControl(actualOutputValue, Validators.required)
            }
            else
            {
              actualOutput = new FormControl(actualOutputValue);
            }
          const group = new FormGroup({
            "Test Input": testInput,
            "Eng Unit": engOutput,
            "Target Output": new FormControl(
              targetOutputValue
            ),
            "Actual Output": actualOutput,
            "Error": new FormControl(errorValue)
          });

          return group;
        }
      )
    );

    try {
      asFPassFail = answer.passFail.AsFPassFail;
      asLPassFail = answer.passFail.AsLPassFail;
      failureCode = answer.passFail.FailureCode;
    } catch { }

    this.accuracy = answer.details && answer.details.Accuracy ? answer.details.Accuracy : this.accuracy;
    const formGroup = new FormGroup(
      {
        details: new FormGroup({
          Accuracy: new FormControl(this.accuracy, Validators.required),
          AsFound: asFoundForm,
          AsLeft: asLeftForm
        }),
        passFail: new FormGroup({
          AsFPassFail: new FormControl(asFPassFail),
          AsLPassFail: new FormControl(asLPassFail),
          FailureCode: new FormControl(failureCode)
        })
      },
      [this.validateFailure, this.validateAsLPassFail]

    );

    if (asFPassFail === "Pass") {
      formGroup
        .get("details.AsLeft")
        .disable({ onlySelf: true, emitEvent: false });
    }

    return formGroup;
  }

  static getSetting(
    fieldName: string,
    equipDetails: Array<EquipDetails>
  ): string {

    const equipProp =
      equipDetails != null
        ? equipDetails.find((field) => field.fieldName === fieldName)
        : null;

    let value = "";

    if (equipProp) {
      if (MIUtilities.isNullOrUndefined(equipProp["updatedVal"])) {
        value = equipProp['currVal'];
      } else {
        value = equipProp['updatedVal'];
      }
    }
    return value;
  }

  private onTestInputValueChanges(
    group: FormGroup,
    resetPassFail = false,
    value: number
  ) {
    let target = null;
    let error = null;
    let engTarget = null;
    try {
      if (value) {
        target = TransmitterValidationComponent.getTargetOutput(value);
        let parsedTarget = target ? parseFloat(target) : target;
        error =
          ((parseFloat(group.get("Actual Output").value) - parsedTarget) /
            16) *
          100;
        error = isNaN(error) ? null : error.toFixed(2);
        engTarget = TransmitterValidationComponent.getEngOutput(value);
      }
    } catch { }
    group.patchValue(
      {
        "Eng Unit": engTarget,
        "Target Output": target,
        Error: error
      },
      {
        onlySelf: true,
        emitEvent: false
      }
    );
    if (resetPassFail && !value) {

      this.formGroup.get("details.AsFound").reset({
        onlySelf: true,
        emitEvent: false
      });
      this.formGroup.get("passFail").reset({
        onlySelf: true,
        emitEvent: false
      });
    }
  }

  private onTargetActualValueChanges(
    group: FormGroup,
    resetPassFail = false,
    value: number
  ) {
    let error = null;
    try {
      if (value) {
        error =
          ((value - parseFloat(group.get("Target Output").value)) / 16) * 100;
        error = isNaN(error) || !isFinite(error) ? null : error.toFixed(2);
      }
    } catch { }
    group.patchValue(
      {
        Error: error
      },
      {
        onlySelf: true,
        emitEvent: false
      }
    );
    if (resetPassFail && !value) {
      this.formGroup.get("details.AsLeft").reset({
        onlySelf: true,
        emitEvent: false
      });
      this.formGroup.get("passFail").reset({
        onlySelf: true,
        emitEvent: false
      });
    }
  }

  override isValidError(error: string | number): boolean {
    return Number(error) >= -this.accuracy && Number(error) <= this.accuracy;
  }

  private onGroupValueChanges(detail: string) {
    let validation = "Pass";
    for (let i = 0; i < this.rows.length; i++) {
      const value = this.formGroup.get(
        "details." + detail + "." + this.rows[i] + ".Error"
      ).value;
      if (value === null || value === undefined || value.trim().length == 0) {
        validation = null;
        break;
      } else if (!this.isValidError(value)) {
        validation = "Fail";
      }
    }

    if (validation === "Fail" && detail === "AsFound") {
      for (let i = 0; i < this.rows.length; i++) {
        const asLeftTestInput = this.formGroup.get("details.AsLeft." + this.rows[i] + ".Test Input").value;
        if (MIUtilities.isNullOrUndefined(asLeftTestInput) && asLeftTestInput != 0) {
          const asFoundTestInput = this.formGroup.get("details.AsFound." + this.rows[i] + ".Test Input").value;
          const asLeftControlRow = this.formGroup.get("details.AsLeft." + this.rows[i]);
          asLeftControlRow.patchValue(
            {
              "Test Input": asFoundTestInput
            },
            {
              onlySelf: true,
              emitEvent: false
            }
          );
        }
      }
    }
    const asLeftControl = this.formGroup.get("details.AsLeft");
    let failureCode = null;
    if ((validation === "Pass" || validation === null) && detail === "AsFound") {
      this.resetAsLeft();
      asLeftControl.disable({
        onlySelf: true,
        emitEvent: false
      });
      failureCode = null;
    } else {
      asLeftControl.enable({
        onlySelf: true,
        emitEvent: false
      });
    }
    const passFail = detail.substring(0, 3) + "PassFail";
    this.formGroup.patchValue(
      {
        passFail: {
          [passFail]: validation,
          ...(failureCode !== undefined ? { FailureCode: failureCode } : {})
        }
      },
      {
        onlySelf: true,
        emitEvent: false
      }
    );
  }

  private resetAsLeft() {
    for (let i = 0; i < this.rows.length; i++) {
      const asLeftRow = this.formGroup.get("details.AsLeft." + this.rows[i]);
      if (!MIUtilities.isNullOrUndefinedObject(asLeftRow)) {
        asLeftRow.patchValue(
          {
            "Actual Output": ""
          },
          {
            onlySelf: true,
            emitEvent: false
          }
        );
        asLeftRow.patchValue(
          {
            "Error": ""
          },
          {
            onlySelf: true,
            emitEvent: false
          }
        );
      }
    }
    this.formGroup.patchValue(
      {
        passFail: {
          "AsLPassFail": "",
          "FailureCode": ""
        }
      },
      {
        onlySelf: true,
        emitEvent: false
      }
    );
  }


  static validateFailure(group: FormGroup) {
    if (group.get("passFail.AsFPassFail").value !== "Pass") {
      return Validators.required(group.get("passFail.FailureCode"));
    }
    return null;
  }

  static validateAsLPassFail(group: FormGroup) {
    if (group.get("passFail.AsFPassFail").value !== "Pass") {
      return Validators.required(group.get("passFail.AsLPassFail"));
    }
    return null;
  }

  static getTestInput(row: number) {
    if (this.showFivePoint) {
      var factor = 0.0;
      switch (row) {
        case 0:
          factor = this.tp1;
          break;
        case 1:
          factor = this.tp2;
          break;
        case 2:
          factor = this.tp3;
          break;
        case 3:
          factor = this.tp4;
          break;
        case 4:
          factor = this.tp5;
          break;
        default:
          break;
      }
      return factor;
    } else {
      return row === 0
        ? this.low + (this.high - this.low) * 0.05
        : this.low + (this.high - this.low) * 0.95;
    }
  }

  static getTargetOutput(value) {
    const numr = Number(value) - Number(this.low);
    const denr = Number(this.high) - Number(this.low);
    let factor = 0;
    if (this.showSignal) {
      if (!(denr == 0 || isNaN(numr) || isNaN(denr))) {
        factor = (numr / denr) * (this.signalMax - this.signalMin);
      }
      return factor != null ? (this.signalMin + factor).toFixed(2) : null;
    } else {
      if (!(denr == 0 || isNaN(numr) || isNaN(denr))) {
        factor = (numr / denr) * 16;
      }
      return factor != null ? (4 + factor).toFixed(2) : null;
    }
  }

  static getEngOutput(value) {
    // Formula: ((TestInput - Min Span) / (Max Span - Min Span) * (Eng Max - Eng Min)) + Eng Min
    let factor = 0;
    try {
      const numr = Number(value) - Number(this.low);
      const denr = Number(this.high) - Number(this.low);
      if (!(denr == 0 || isNaN(numr) || isNaN(denr) || isNaN(this.engMax) || isNaN(this.engMin))) {
        factor = (numr) * ((Number(this.engMax) - Number(this.engMin)) / denr);
      }

      return factor || factor == 0 ? (factor + Number(this.engMin)).toFixed(2) : null;
    } catch (err) {
      console.log("getEngOutput>>INSIDE CATCH>>" + factor);
      return null;
    }
  }

}