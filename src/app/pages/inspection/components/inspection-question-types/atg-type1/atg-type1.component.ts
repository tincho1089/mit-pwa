import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MIUtilities } from 'src/app/shared/utility';
import { BaseAtg } from '../../../classes/components-shared/base-atg';

@Component({
  selector: 'app-atg-type1',
  templateUrl: './atg-type1.component.html',
  styleUrls: ['./atg-type1.component.scss']
})
export class AtgType1Component extends BaseAtg
implements QuestionTypesModel, BaseAtg {

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
    if(this.response?.answer){
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
      details : new FormGroup({
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
      "MoreDetails":moreDetails
    });
    if(this.items["Msg"] && this.items["Msg"].length>0){
      this.showMsg = true;
    }
    this.setControl(this.formGroup);
  }


  

  addNewRow() {
    this.moreDetails.push(
      new FormGroup({point: new FormControl('')})
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
      if(!answer)
        {
          answer = {};
          answer.details = {};
          answer.details["ATGBeginning"] = "";
          answer.details["ATGEnd"] = "";
          answer.details["Manual"] = [];
          for(let i =0;i<3; i++){
            answer.details["Manual"+i] = "";
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
      for(let i =0;i<3; i++){
        answer.details["Manual"+i] = "";
      }
      answer.details["Avg1"] = "";
      answer.details["Avg2"] = "";
      answer.details["Diff"] = "";
      answer.details["Msg"] = "";
      answer.details["MoreDetails"] = [];
      return answer.details;
    }
  }

  getUpdated(value) {
    let fVal = value.split('-').join('');
    if (fVal.length > 0) {
      fVal = fVal.match(new RegExp('.{1,2}', 'g')).join('-');
    }
    return fVal;
  }

  onChange(inputValue: string) {
    let avg1, avg2, finalVal: string;
    let part1, part2, part3 : number;
    finalVal = this.getUpdatedCtrlValue(inputValue);
      //Calculate avg1 or avg2
      if(inputValue?.startsWith("ATG")){
        this.formGroup.get('details.' + inputValue).setValue(finalVal);
        const atgBegin : string = this.formGroup.get('details.ATGBeginning').value;
        const atgEnd : string = this.formGroup.get('details.ATGEnd').value;
        if(atgBegin && atgEnd){
          if (atgBegin.length === 8 && atgEnd.length === 8){
            part1 = (Number(atgBegin.substring(0,2)) + Number(atgEnd.substring(0,2)))/2;
            part2 = (Number(atgBegin.substring(3,5)) + Number(atgEnd.substring(3,5)))/2;
            part3 = (Number(atgBegin.substring(6,8)) + Number(atgEnd.substring(6,8)))/2;
            this.formGroup.get('details.Avg1').setValue(MIUtilities.leftPad(Math.trunc(part1),2) + "-" + MIUtilities.leftPad(Math.trunc(part2),2) + "-" + MIUtilities.leftPad(Math.trunc(part3),2));
          }else{
            this.formGroup.get('details.Avg1').setValue("");
          }
        }else{
          this.formGroup.get('details.Avg1').setValue("");
        }
      }else if(inputValue?.startsWith("Manual")){
          this.formGroup.get('details.' + inputValue).setValue(finalVal);
          this.formGroup.get('details.Avg2').setValue(this.getDetailsAverage(false));
      }else{
          if(inputValue == "0"){
            this.moreDetails.controls[0]['controls'].point.setValue(finalVal);
          }else{
            this.moreDetails.controls[1]['controls'].point.setValue(finalVal);
          }
          this.formGroup.get('details.Avg2').setValue(this.getDetailsAverage(true));
      }
      this.getDifference();
    }
  
  getUpdatedCtrlValue(inputValue){
    let ctrl;
    let finalVal : string = null;
    if(inputValue?.startsWith("ATG") || inputValue?.startsWith("Manual")){
        ctrl = this.formGroup.get('details.' + inputValue);
    } else if(inputValue == 0){
        ctrl = this.moreDetails.controls[0];
        ctrl = ctrl?.controls ? ctrl.controls.point : "";
    } else if(inputValue == 1){
        ctrl = this.moreDetails.controls[1];
        ctrl = ctrl?.controls ? ctrl.controls.point : "";
    }
    if(ctrl?.value){
      let ele = ctrl.value.split('-').join(''); 
      finalVal = ele.match(/.{1,2}/g).join('-');
    }
    return finalVal;
  }

  getDetailsAverage(ismore : boolean) {
    const manual1 : string = this.formGroup.get('details.Manual1').value;
    const manual2 : string = this.formGroup.get('details.Manual2').value;
    const manual3 : string = this.formGroup.get('details.Manual3').value;
    let moreDetail1 : string = null;
    let moreDetail2 : string = null;
    let average : string = null;
    let part1, part2, part3 : number;
    if(manual1 && manual2 && manual3){
        if (manual1.length === 8 && manual2.length === 8 && manual3.length === 8){
            if(!ismore){
              part1 = Math.round((Number(manual1.substring(0,2)) + Number(manual2.substring(0,2)) + Number(manual3.substring(0,2)))/3);
              part2 = Math.round((Number(manual1.substring(3,5)) + Number(manual2.substring(3,5)) + Number(manual3.substring(3,5)))/3);
              part3 = Math.round((Number(manual1.substring(6,8)) + Number(manual2.substring(6,8)) + Number(manual3.substring(6,8)))/3);
              average =  MIUtilities.leftPad(Math.trunc(part1),2) + "-" + MIUtilities.leftPad(Math.trunc(part2),2) + "-" + MIUtilities.leftPad(Math.trunc(part3),2);
            }else{
              switch (this.columns) {
                case 1:
                  moreDetail1 = this.moreDetails.controls[0]['controls'].point.value;
                  if(moreDetail1?.length === 8){
                    part1 = Math.round((Number(manual1.substring(0,2)) + Number(manual2.substring(0,2)) + 
                          Number(manual3.substring(0,2)) + Number(moreDetail1.substring(0,2)))/4);
                    part2 = Math.round((Number(manual1.substring(3,5)) + Number(manual2.substring(3,5)) + 
                          Number(manual3.substring(3,5)) + Number(moreDetail1.substring(3,5)))/4);
                    part3 = Math.round((Number(manual1.substring(6,8)) + Number(manual2.substring(6,8)) + 
                          Number(manual3.substring(6,8)) + Number(moreDetail1.substring(6,8)))/4);
                    average =  MIUtilities.leftPad(Math.trunc(part1),2) + "-" + MIUtilities.leftPad(Math.trunc(part2),2) + "-" + MIUtilities.leftPad(Math.trunc(part3),2);
                  }
                  break;
                case 2:
                  moreDetail1 = this.moreDetails.controls[0]['controls'].point.value;
                  moreDetail2 = this.moreDetails.controls[1]['controls'].point.value;
                  if(moreDetail1?.length === 8 && moreDetail2?.length === 8){
                    part1 = Math.round((Number(manual1.substring(0,2)) + Number(manual2.substring(0,2)) + 
                          Number(manual3.substring(0,2)) + Number(moreDetail1.substring(0,2)) +
                          Number(moreDetail2.substring(0,2)))/5) ;
                    part2 = Math.round((Number(manual1.substring(3,5)) + Number(manual2.substring(3,5)) + 
                          Number(manual3.substring(3,5)) + Number(moreDetail1.substring(3,5)) +
                          Number(moreDetail2.substring(3,5)))/5) ;
                    part3 = Math.round((Number(manual1.substring(6,8)) + Number(manual2.substring(6,8)) + 
                          Number(manual3.substring(6,8)) + Number(moreDetail1.substring(6,8)) +
                          Number(moreDetail2.substring(6,8)))/5) ;
                    average =  MIUtilities.leftPad(Math.trunc(part1),2) + "-" + MIUtilities.leftPad(Math.trunc(part2),2) + "-" + MIUtilities.leftPad(Math.trunc(part3),2);
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

   getDifference(){
     let avg1, avg2, diff : string = null;
     avg1 = this.formGroup.get('details.Avg1').value;
     avg2 = this.formGroup.get('details.Avg2').value;
     let msg : string = "";
     let quotient, reminder = 0;
     if(avg1 && avg2 && avg1.length === 8 && avg2.length === 8){
        let j22, k22, l22 : number = 0;
        let n22, o22, p22 : number = 0;
        let m22, q22 : number = 0;
        let r22, s22, t22, u22, total : number = 0;
        j22 = Number(avg1.substring(0,2));
        k22 = Number(avg1.substring(3,5));
        l22 = Number(avg1.substring(6,8));

        n22 = Number(avg2.substring(0,2));
        o22 = Number(avg2.substring(3,5));
        p22 = Number(avg2.substring(6,8));

        m22 = (j22 + (k22/12) + (l22/192)).toFixed(3);
        q22 = (n22 + (o22/12) + (p22/192)).toFixed(3);
        r22 = Math.abs(m22 - q22);
        s22 = Math.trunc(r22);
        t22 = Math.trunc(r22 * 12);
        u22 = Math.round(r22*192);
        total = (s22 * 192) + (t22 * 16) + u22;
        if(total > 16){
          quotient = Math.trunc(total/16);
          reminder = total%16;
          if(reminder != 0){
            diff = quotient + "\"" + reminder + "/16";
          }else{
            diff = quotient + "\"";
          }
        }else if(total == 16){
          diff = "1\"";
        }else{
          diff = total + "/16";
        }
        if(total > 3){
          msg="Notice: Tank cannot be used for custody transfers until corrections are made.";
          this.showMsg = true;
        }else{
          this.showMsg = false;
        }
     }else{
       diff = "";
       this.showMsg = false;
     }
     this.formGroup.get('details.Diff').setValue(diff);
     this.formGroup.get('details.Msg').setValue(msg);
   }

}
