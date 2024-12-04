import { OnDestroy, Input, OnInit, Injectable, HostListener } from '@angular/core';
import { Subscription, BehaviorSubject } from 'rxjs';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { FormGroup, AbstractControl, Validators } from '@angular/forms';
import { InspectionResponse, EquipDetails } from 'src/app/core/sync/entities';
import { db } from 'src/databases/db';
import { MIUtilities } from 'src/app/shared/utility';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';

@Injectable()
export class BaseInspection implements OnDestroy, OnInit {
  idControl = null;
  subscription = new Subscription();
  displayNA: boolean = true;
  sectionArray: Array<string> = [];
  helperTrigger: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false); // hide comments by default unless showComments is true at the response level
  interface = 'action-sheet';
  public isCacheable: boolean = false;
  //formDetails;

  @Input()
  response: InspectionResponse;
  @Input()
  form: FormGroup;
  @Input()
  section: string;
  @Input()
  showControl: boolean = true;
  @Input()
  showQuestionTitle: boolean;
  @Input()
  editable: boolean;
  @Input()
  equipDetails: EquipDetails[];


  ngOnInit() {
    this.idControl = this.section + '.' + this.response.questionId;
    this.idControl = this.idControl.replace('..', '.');
    this.sectionArray = [this.section, this.response.questionId];

    if((this.section === 'General' && this.response.itemType === QUESTIONTYPES.TEXT) || this.response.itemType === QUESTIONTYPES.GPS){
      const savedAnswer = localStorage.getItem(this.response.questionId);

      if(savedAnswer){
        this.isCacheable = true;
        this.response.answer = savedAnswer;

        const formControl = this.form.get([
          this.section,
          this.response.questionId
        ]);
        formControl.setValue(this.response.answer);
      }

    }

    this.getEquipDetails();
  }

  async getEquipDetails() {
    // heavy preference on getting this val from the parent.
    // large templates will overload db otherwise (saw overload rendering ~50 questions)
    if (this.equipDetails == null) {
      console.warn('[BaseInspection] Equipment props needs fetch from DB! this will cause timing problems!!!')
      this.equipDetails = await db.getEquipmentDetailsByWorkOrder(this.response.inspectionId);
    }
  }

  @HostListener('unloaded')
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.helperTrigger?.unsubscribe();
    this.sectionArray = null;
    this.form = null;
    this.idControl = null;
    this.response = null;
    this.section = null;
    this.equipDetails = null;
  }

  onShowHelperTrigger = (isShowHelper: boolean) =>
    this.helperTrigger.next(isShowHelper);

  getOptionsObject() {
    let opts = DomainModel.parseOptions(this.response.options, 'Description');

    // if nothing configured in template
    if (!opts.length)
      opts = DomainModel.parseOptions(`
        [{
          "ID": 0,
          "Description": "Default Option (No options configured in template)",
          "Value": "Default Option",
          "PassFail": null
        }]`,'Description')

    return opts;
  }

  getOptionsObjectWithPassFail() {
    let opts = DomainModel.parseOptionsPassFail(
      this.response.options,
      'Description',
      'Description',
      'PassFail'
    );
    // if nothing configured in template
    if (!opts.length)
      opts = DomainModel.parseOptionsPassFail(`[
        {
          "ID": 0,
          "Description": "Default Pass (No options configured in template)",
          "Value": "Default Pass",
          "PassFail": "Pass"
        },
        {
          "ID": 1,
          "Description": "Default Fail (No options configured in template)",
          "Value": "Default Fail",
          "PassFail": "Fail"
        }
      ]`,'Description','Description','PassFail')

    return opts;
  }

  setControl(abstractControl: AbstractControl) {
    (this.form.controls[this.section] as FormGroup).setControl(
      this.response?.questionId?.toString(),
      abstractControl
    );
  }

  static getAnswerObject(inspection: InspectionResponse) {
    if (inspection.answer && inspection.answer !== 'NA') {
      if (typeof inspection.answer == 'object') {
        return inspection.answer;
      }
      return JSON.parse(inspection.answer)
    }
    else return {};
  }

  getAnswerObject() {
    return this.response.answer && this.response.answer !== "NA"
      ? JSON.parse(this.response.answer)
      : [];
  }

  isValidError(error: string | number): boolean {
    return Number(error) >= -2 && Number(error) <= 2;
  }

  static isValidError(error: string | number): boolean {
    return Number(error) >= -2 && Number(error) <= 2;
  }

  static validateAsLeft(formGroup: FormGroup) {
    if (BaseInspection.isValidError(formGroup?.get('ErrorF').value))
      return null;
    return Validators.required(formGroup?.get('AsLeft'));
  }

  getSetting(
    fieldName: string
  ): string {
    let equipDetails = this.equipDetails;
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

  async getSubEquipmentData(id: number) {
    return await db.getSubEquipmentData(id);
  }

  isDisabled() {
    return this.form.get(this.sectionArray) && this.form.get(this.sectionArray).status === 'DISABLED'
  }

  saveResponse(response: InspectionResponse = null) {
    //USE THIS TO SAVE CUSTOM RESPONSES
    if (response == null) {
      response = this.response;
    }
    db.updateAnswer(response);
  }

}
