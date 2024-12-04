import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MIUtilities } from 'src/app/shared/utility';
import { BaseAtg } from '../../../classes/components-shared/base-atg';

@Component({
  selector: 'app-atg-type5',
  templateUrl: './atg-type5.component.html',
  styleUrls: ['./atg-type5.component.scss']
})
export class AtgType5Component extends BaseAtg
implements QuestionTypesModel {

  @Input()
  showHelper: boolean = false;

  formGroup: FormGroup;
  items: Array<string>;
  columns: number;
  details;

  constructor(//private translate: TranslateService
  ) {
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
    if(this.response?.answer) {
    JSON.parse(this.response.answer)["MoreDetails"].forEach((element, index) => {
      this.columns++;
      const keyName = Object.keys(element)[0];
      const data = element[Object.keys(element)[0]];
      (moreDetails as FormArray).push(
        new FormGroup({
          reference: new FormControl(data)
        })
      )
    })
  }
  this.formGroup = new FormGroup({
    details: new FormGroup({
      "KnownReference": new FormControl(this.items["KnownReference"], Validators.required),
      "ActualReference1": new FormControl(this.items["ActualReference1"], Validators.required),
      "ActualReference2": new FormControl(this.items["ActualReference2"], Validators.required),
      "ActualReference3": new FormControl(this.items["ActualReference3"], Validators.required),
      "Avg": new FormControl(this.items["Avg"], Validators.required)
    }),
    "MoreDetails": moreDetails
  });
  this.setControl(this.formGroup);
}

addNewRow() {
  this.moreDetails.push(
    new FormGroup({ reference: new FormControl('') })
  );
  this.columns++;
}

// getValue(index) {

// }

get moreDetails() {
  return this.formGroup.get('MoreDetails') as FormArray;
}

eraseRow(index) {
  this.moreDetails.removeAt(index);
  this.columns--;
}

private getItems(): Array < string > {
  let answer = null;
  try {
    if(this.response.answer === "NA") return [];
    answer = JSON.parse(this.response.answer);
    if(!answer) {
      answer = {};
      answer.details = {};
      answer.details["KnownReference"] = "";
      answer.details["ActualReference"] = [];
      for (let i = 0; i < 3; i++) {
        answer.details["ActualReference" + i] = "";
      }
      answer.details["Avg"] = "";
      answer.details["MoreDetails"] = [];
      return answer.details;
    }
    return answer["details"] ? answer["details"] : {};
  } catch {
    answer = {};
    answer.details = {};
    answer.details["KnownReference"] = "";
    answer.details["ActualReference"] = [];
    for(let i = 0; i < 3; i++) {
  answer.details["ActualReference" + i] = "";
}
answer.details["Avg"] = "";
answer.details["MoreDetails"] = [];
return answer.details;
  }
}

// getUpdated(value) {
//   let fVal = value.split('-').join('');
//   if (fVal.length > 0) {
//     fVal = fVal.match(new RegExp('.{1,2}', 'g')).join('-');
//   }
//   return fVal;
// }

onChange(inputValue: string) {
  let finalVal: string;
  finalVal = this.getUpdatedCtrlValue(inputValue);
  if (inputValue?.startsWith("KnownReference")) {
    this.formGroup.get('details.' + inputValue).setValue(finalVal);
    //Calculate avg
  } else if (inputValue?.startsWith("ActualReference")) {
    this.formGroup.get('details.' + inputValue).setValue(finalVal);
    this.formGroup.get('details.Avg').setValue(this.getDetailsAverage(false));
  } else {
    if (inputValue == "0") {
      this.moreDetails.controls[0]['controls'].reference.setValue(finalVal);
    } else {
      this.moreDetails.controls[1]['controls'].reference.setValue(finalVal);
    }
    this.formGroup.get('details.Avg').setValue(this.getDetailsAverage(true));
  }
}

getUpdatedCtrlValue(inputValue) {
  let ctrl;
  let finalVal: string = null;
  if ((inputValue?.startsWith("ActualReference") || inputValue?.startsWith("KnownReference"))) {
    ctrl = this.formGroup.get('details.' + inputValue);
  } else if (inputValue == 0) {
    ctrl = this.moreDetails.controls[0];
    ctrl = ctrl?.controls ? ctrl.controls.reference : "";
  } else if (inputValue == 1) {
    ctrl = this.moreDetails.controls[1];
    ctrl = ctrl?.controls ? ctrl.controls.reference : "";
  }
  // if (ctrl && ctrl.value) {
  //   let ele = ctrl.value.split('-').join('');
  //   finalVal = ele.match(/.{1,2}/g).join('-');
  // }
  finalVal = ctrl?.value;
  return finalVal;
}

getDetailsAverage(ismore: boolean) {
  const actualReference1: string = this.formGroup.get('details.ActualReference1').value;
  const actualReference2: string = this.formGroup.get('details.ActualReference2').value;
  const actualReference3: string = this.formGroup.get('details.ActualReference3').value;
  let moreDetail1: string = null;
  let moreDetail2: string = null;
  let avgInt: number = 0;
  let average: string = null;
  // let part1, part2, part3: number;
  if (actualReference1 && actualReference2 && actualReference3) {
    if (actualReference1.length <= 8 && actualReference2.length <= 8 && actualReference3.length <= 8) {
      if (!ismore) {
        avgInt = (Number(actualReference1) + Number(actualReference2) + Number(actualReference3)) / 3;
        average = "" + avgInt;
        // part1 = Math.round((Number(actualReference1.substring(0, 2)) + Number(actualReference2.substring(0, 2)) + Number(actualReference3.substring(0, 2))) / 3);
        // part2 = Math.round((Number(actualReference1.substring(3, 5)) + Number(actualReference2.substring(3, 5)) + Number(actualReference3.substring(3, 5))) / 3);
        // part3 = Math.round((Number(actualReference1.substring(6, 8)) + Number(actualReference2.substring(6, 8)) + Number(actualReference3.substring(6, 8))) / 3);
        // average = MIUtilities.leftPad(Math.trunc(part1), 2) + "-" + MIUtilities.leftPad(Math.trunc(part2), 2) + "-" + MIUtilities.leftPad(Math.trunc(part3), 2);
      } else {
        switch (this.columns) {
          case 1:
            moreDetail1 = this.moreDetails.controls[0]['controls'].reference.value;
            if (moreDetail1 && moreDetail1.length <= 8) {
              avgInt = (Number(actualReference1) + Number(actualReference2) + Number(actualReference3) + Number(moreDetail1)) / 4;
              average = "" + avgInt;
              // part1 = Math.round((Number(actualReference1.substring(0, 2)) + Number(actualReference2.substring(0, 2)) +
              //   Number(actualReference3.substring(0, 2)) + Number(moreDetail1.substring(0, 2))) / 4);
              // part2 = Math.round((Number(actualReference1.substring(3, 5)) + Number(actualReference2.substring(3, 5)) +
              //   Number(actualReference3.substring(3, 5)) + Number(moreDetail1.substring(3, 5))) / 4);
              // part3 = Math.round((Number(actualReference1.substring(6, 8)) + Number(actualReference2.substring(6, 8)) +
              //   Number(actualReference3.substring(6, 8)) + Number(moreDetail1.substring(6, 8))) / 4);
              // average = MIUtilities.leftPad(Math.trunc(part1), 2) + "-" + MIUtilities.leftPad(Math.trunc(part2), 2) + "-" + MIUtilities.leftPad(Math.trunc(part3), 2);
            }
            break;
          case 2:
            moreDetail1 = this.moreDetails.controls[0]['controls'].reference.value;
            moreDetail2 = this.moreDetails.controls[1]['controls'].reference.value;
            if (moreDetail1?.length <= 8 && moreDetail2?.length <= 8) {
              // part1 = Math.round((Number(actualReference1.substring(0, 2)) + Number(actualReference2.substring(0, 2)) +
              //   Number(actualReference3.substring(0, 2)) + Number(moreDetail1.substring(0, 2)) +
              //   Number(moreDetail2.substring(0, 2))) / 5);
              // part2 = Math.round((Number(actualReference1.substring(3, 5)) + Number(actualReference2.substring(3, 5)) +
              //   Number(actualReference3.substring(3, 5)) + Number(moreDetail1.substring(3, 5)) +
              //   Number(moreDetail2.substring(3, 5))) / 5);
              // part3 = Math.round((Number(actualReference1.substring(6, 8)) + Number(actualReference2.substring(6, 8)) +
              //   Number(actualReference3.substring(6, 8)) + Number(moreDetail1.substring(6, 8)) +
              //   Number(moreDetail2.substring(6, 8))) / 5);
              // average = MIUtilities.leftPad(Math.trunc(part1), 2) + "-" + MIUtilities.leftPad(Math.trunc(part2), 2) + "-" + MIUtilities.leftPad(Math.trunc(part3), 2);
              avgInt = (Number(actualReference1) + Number(actualReference2) + Number(actualReference3) + Number(moreDetail1) + Number(moreDetail2)) / 5;
              average = "" + avgInt;
            }
            break;
          default:
            break;
        }
      }
    }
  }
  return average ? average : "";
}
}
