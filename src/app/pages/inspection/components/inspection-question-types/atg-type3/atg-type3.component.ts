import { Component, Input } from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MIUtilities } from 'src/app/shared/utility';
import { BaseAtg } from '../../../classes/components-shared/base-atg';

@Component({
  selector: 'app-atg-type3',
  templateUrl: './atg-type3.component.html',
  styleUrls: ['./atg-type3.component.scss']
})
export class AtgType3Component extends BaseAtg
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
        "CPL": new FormControl(this.items["CPL"], Validators.required),
        "Terminal": new FormControl(this.items["Terminal"], Validators.required),
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
        answer.details["CPL"] = "";
        answer.details["Terminal"] = "";
        answer.details["Diff"] = "";
        answer.details["Msg"] = "";
        answer.details["MoreDetails"] = [];
        return answer.details;
      }
      return answer["details"] ? answer["details"] : {};
    } catch {
      answer = {};
      answer.details = {};
      answer.details["CPL"] = "";
      answer.details["Terminal"] = "";
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
    let finalVal: string;
    finalVal = this.getUpdatedCtrlValue(inputValue);
      if(inputValue?.startsWith("CPL") || inputValue?.startsWith("Terminal")){
          this.formGroup.get('details.' + inputValue).setValue(finalVal);
      //Calculate avg
      }
      this.getDifference();
    }
  
  getUpdatedCtrlValue(inputValue){
    let ctrl;
    let finalVal : string = null;
    if(inputValue?.startsWith("CPL") || inputValue?.startsWith("Terminal")){
        ctrl = this.formGroup.get('details.' + inputValue);
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
     avg1 = this.formGroup.get('details.CPL').value;
     avg2 = this.formGroup.get('details.Terminal').value;
     let msg : string = "";
     let quotient, reminder = 0;
     if(avg1?.length === 8 && avg2?.length === 8){
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
     }else{
       diff = "";
       this.showMsg = false;
     }
     this.formGroup.get('details.Diff').setValue(diff);
     this.formGroup.get('details.Msg').setValue(msg);
   }

}
