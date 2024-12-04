import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MIUtilities } from 'src/app/shared/utility';
import { BaseAtg } from '../../../classes/components-shared/base-atg';

@Component({
  selector: 'app-atg-type4',
  templateUrl: './atg-type4.component.html',
  styleUrls: ['./atg-type4.component.scss']
})
export class AtgType4Component extends BaseAtg
  implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  items: Array<string>;
  columns: number;
  showMsg: boolean = false;
  details;

  constructor() {
    super();
  }

  override ngOnInit() {
    this.columns = 0;
    super.ngOnInit();
    this.createForm();
  }

  private createForm(): void {
    this.items = this.getItems();
    let moreDetails = new FormArray([]);
    if (this.response?.answer) {
      JSON.parse(this.response.answer)["MoreDetails"].forEach((element, index) => {
        this.columns++;
        const data = element[Object.keys(element)[0]];
        (moreDetails).push(
          new FormGroup({
            point: new FormControl(data)
          })
        )
      })
    }
    this.formGroup = new FormGroup({
      details: new FormGroup({
        "ATGBeginning": new FormControl(this.items["ATGBeginning"], Validators.required),
        "ATGEnd": new FormControl(this.items["ATGEnd"], Validators.required),
        "Manual1": new FormControl(this.items["Manual1"], Validators.required),
        "Manual2": new FormControl(this.items["Manual2"], Validators.required),
        "Manual3": new FormControl(this.items["Manual3"], Validators.required),
        "Avg1": new FormControl(this.items["Avg1"], Validators.required),
        "Avg2": new FormControl(this.items["Avg2"], Validators.required),
        "Msg": new FormControl(this.items["Msg"], null),
        "Diff": new FormControl(this.items["Diff"], Validators.required)
      }),
      "MoreDetails": moreDetails
    });
    if (this.items["Msg"] && this.items["Msg"].length > 0) {
      this.showMsg = true;
    }
    this.setControl(this.formGroup);
  }

  addNewRow() {
    this.moreDetails.push(
      new FormGroup({ point: new FormControl('') })
    );
    this.columns++;
  }

  get moreDetails() {
    return this.formGroup.get('MoreDetails') as FormArray;
  }

  eraseRow(index) {
    this.moreDetails.removeAt(index);
    this.columns--;
  }

  private getItems(): Array<string> {
    let answer = null;
    try {
      if (this.response.answer === "NA") return [];
      answer = JSON.parse(this.response.answer);
      if (!answer) {
        answer = {};
        answer.details = {};
        answer.details["ATGBeginning"] = "";
        answer.details["ATGEnd"] = "";
        answer.details["Manual"] = [];
        for (let i = 0; i < 3; i++) {
          answer.details["Manual" + i] = "";
        }
        answer.details["Avg1"] = "";
        answer.details["Avg2"] = "";
        answer.details["Diff"] = "";
        answer.details["Msg"] = "";
        answer.details["MoreDetails"] = [];
        return answer.details;
      }
      return answer["details"] ? answer["details"] : {};
    } catch {
      answer = {};
      answer.details = {};
      answer.details["ATGBeginning"] = "";
      answer.details["ATGEnd"] = "";
      answer.details["Manual"] = [];
      for (let i = 0; i < 3; i++) {
        answer.details["Manual" + i] = "";
      }
      answer.details["Avg1"] = "";
      answer.details["Avg2"] = "";
      answer.details["Diff"] = "";
      answer.details["Msg"] = "";
      answer.details["MoreDetails"] = [];
      return answer.details;
    }
  }

  getUpdatedCtrlValue(inputValue) {
    let ctrl;
    let finalVal: string = null;
    if (inputValue?.startsWith("ATG") || inputValue?.startsWith("Manual")) {
      ctrl = this.formGroup.get('details.' + inputValue);
    } else if (inputValue == 0) {
      ctrl = this.moreDetails.controls[0];
      ctrl = ctrl?.controls ? ctrl.controls.point : "";
    } else if (inputValue == 1) {
      ctrl = this.moreDetails.controls[1];
      ctrl = ctrl?.controls ? ctrl.controls.point : "";
    }
    
    finalVal = ctrl?.value;
    return finalVal;
  }

  onChange(inputValue: string) {
    let avg1, finalVal: string;

    finalVal = this.getUpdatedCtrlValue(inputValue);

    //Calculate avg1 or avg2
    if (inputValue?.startsWith("ATG")) {
      this.formGroup.get('details.' + inputValue).setValue(finalVal);
      const atgBegin: string = this.formGroup.get('details.ATGBeginning').value;
      const atgEnd: string = this.formGroup.get('details.ATGEnd').value;
      // NOTE TO OPTIMIZE THE IF ELSE branching later
      if (atgBegin && atgEnd) {
        if (atgBegin.length <= 8 && atgEnd.length <= 8) {
          avg1 = (Number(atgBegin) + Number(atgEnd)) / 2;
          this.formGroup.get('details.Avg1').setValue("" + avg1); // convert avg to string
        }
      } else {
        this.formGroup.get('details.Avg1').setValue("");
      }
    } else if (inputValue?.startsWith("Manual")) {
      this.formGroup.get('details.' + inputValue).setValue(finalVal);
      this.formGroup.get('details.Avg2').setValue(this.getDetailsAverage(false));
    } else {
      if (inputValue == "0") {
        this.moreDetails.controls[0]['controls'].point.setValue(finalVal);
      } else {
        this.moreDetails.controls[1]['controls'].point.setValue(finalVal);
      }
      this.formGroup.get('details.Avg2').setValue(this.getDetailsAverage(true));
    }
    this.getDifference();
  }

  getDetailsAverage(ismore: boolean) {
    const manual1: string = this.formGroup.get('details.Manual1').value;
    const manual2: string = this.formGroup.get('details.Manual2').value;
    const manual3: string = this.formGroup.get('details.Manual3').value;
    let moreDetail1: string = null;
    let moreDetail2: string = null;
    let avgInt: number = 0;
    let average: string = null;
    
    if (manual1 && manual2 && manual3) {
      // Keeping the lenght as: min = 1 and max = 8
      // NOTE: max valid character from string to number is 16 // const maxSafeIntegerLength = Number.MAX_SAFE_INTEGER.toString().length; // 9007199254740991.length -> 16
      if (manual1.length <= 8 && manual2.length <= 8 && manual3.length <= 8) {
        if (!ismore) {
          avgInt = (Number(manual1) + Number(manual2) + Number(manual3)) / 3;
          average = "" + avgInt;
        } else {
          switch (this.columns) {
            case 1:
              moreDetail1 = this.moreDetails.controls[0]['controls'].point.value;
              avgInt = (Number(manual1) + Number(manual2) + Number(manual3) + Number(moreDetail1)) / 4;
              average = "" + avgInt;
              break;

            case 2:
              moreDetail1 = this.moreDetails.controls[0]['controls'].point.value;
              moreDetail2 = this.moreDetails.controls[1]['controls'].point.value;
              avgInt = (Number(manual1) + Number(manual2) + Number(manual3) + Number(moreDetail1) + Number(moreDetail2)) / 5;
              average = "" + avgInt;
              break;

            default:
              break;
          }
        }
      }
    }

    return average ? average : "";
  }

  getDifference() {
    let avg1, avg2, diff: string = null;
    avg1 = this.formGroup.get('details.Avg1').value;
    avg2 = this.formGroup.get('details.Avg2').value;
    let msg: string = "";

    let diffInt = Math.abs(Number(avg1) - Number(avg2));
    if (avg1 && avg2) {
      diff = "" + diffInt;
    } else {
      diff = "";
      this.showMsg = false;
    }
    this.formGroup.get('details.Diff').setValue(diff);

    if (diffInt > 4) {
      msg = "Notice: Tank cannot be used for custody transfers until corrections are made.";
      this.showMsg = true;
    } else {
      this.showMsg = false;
    }
    this.formGroup.get('details.Msg').setValue(msg);

  }
}



