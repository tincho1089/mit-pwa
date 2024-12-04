import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Type,
  ViewChild,
} from '@angular/core';
import { DynamicQuestionTypeDirective } from '../../../directives/dynamic-question-type.directive';
import { EquipDetails, InspectionResponse } from 'src/app/core/sync/entities';
import { QuestionTypesModel } from 'src/app/core/models/local/question-types.model';
import { TextComponent } from '../../inspection-question-types/text/text.component';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';
import { CheckboxComponent } from '../../inspection-question-types/checkbox/checkbox.component';
import { InfoMessagesComponent } from '../../inspection-question-types/info-messages/info-messages.component';
import { FormGroup } from '@angular/forms';
import { Subscription, BehaviorSubject, Subject, debounceTime } from 'rxjs';
import { MIUtilities } from 'src/app/shared/utility';
import { db } from 'src/databases/db';
import dayjs from 'dayjs';
import { PhotoComponent } from '../../inspection-question-types/photo/photo.component';
import { SignatureComponent } from '../../inspection-question-types/signature/signature.component';
import { GPSComponent } from '../../inspection-question-types/gps/gps.component';
import { TextAreaComponent } from '../../inspection-question-types/textarea/textarea.component';
import { DateComponent } from '../../inspection-question-types/date/date.component';
import { YesNoComponent } from '../../inspection-question-types/yesno/yesno.component';
import { NumericComponent } from '../../inspection-question-types/numeric/numeric.component';
import { InspectionAcceptableNaComponent } from '../../inspection-question-types/inspection-acceptable-na/inspection-acceptable-na.component';
import { YesNoCommentComponent } from '../../inspection-question-types/yesnocomment/yesnocomment.component';
import { TaskComponent } from '../../inspection-question-types/task/task.component';
import { CorrosionComponent } from '../../inspection-question-types/corrosion/corrosion.component';
import { MeridiumInspectionComponent } from '../../inspection-question-types/meridium-inspection/meridium-inspection.component';
import { DropdownComponent } from '../../inspection-question-types/dropdown/dropdown.component';
import { MultiselectComponent } from '../../inspection-question-types/multiselect/multiselect.component';
import { ConditionComponent } from '../../inspection-question-types/condition/condition.component';
import { LinkComponent } from '../../inspection-question-types/link/link.component';
import { OrganizationComponent } from '../../inspection-question-types/organization/organization.component';
import { CheckpointComponent } from '../../inspection-question-types/checkpoint/checkpoint.component';
import { TextWithUnitDropdownComponent } from '../../inspection-question-types/text-with-unit-dropdown/text-with-unit-dropdown.component';
import { PercentSpanComponent } from '../../inspection-question-types/percent-span/percent-span.component';
import { PassFailComponent } from '../../inspection-question-types/pass-fail/pass-fail.component';
import { LeakTestComponent } from '../../inspection-question-types/leak-test/leak-test';
import { AsLeftAsFoundComponent } from '../../inspection-question-types/as-left-as-found/as-left-as-found.component';
import { AsFoundAsLeftPassFailComponent } from '../../inspection-question-types/as-found-as-left-pass-fail/as-found-as-left-pass-fail.component';
import { AsLeftAsFoundDropdownComponent } from '../../inspection-question-types/as-left-as-found-dropdown/as-left-as-found-dropdown.component';
import { AsFoundPassFailSafeFailDangerous } from '../../inspection-question-types/as-found-pass-failsafe-faildangerous/as-found-pass-failsafe-faildangerous.component';
import { NimiirnaComponent } from '../../inspection-question-types/nimiirna/nimiirna.component';
import { CalibrationPercentSpanComponent } from '../../inspection-question-types/calibration-percent-span/calibration-percent-span';
import { ValveClosureComponent } from '../../inspection-question-types/valve-closure/valve-closure';
import { AverageComponent } from '../../inspection-question-types/average/average.component';
import { DifferenceComponent } from '../../inspection-question-types/difference/difference.component';
import { RangeComponent } from '../../inspection-question-types/range/range.component';
import { AtgType2Component } from '../../inspection-question-types/atg-type2/atg-type2.component';
import { AtgType1Component } from '../../inspection-question-types/atg-type1/atg-type1.component';
import { AtgType3Component } from '../../inspection-question-types/atg-type3/atg-type3.component';
import { AtgType4Component } from '../../inspection-question-types/atg-type4/atg-type4.component';
import { AtgType5Component } from '../../inspection-question-types/atg-type5/atg-type5.component';
import { ChecklistComponent } from '../../inspection-question-types/checklist/checklist.component';
import { TransmitterCalibrationRateComponent } from '../../inspection-question-types/transmitter-calibration-rate/transmitter-calibration-rate.component';
import { InstructionComponent } from '../../inspection-question-types/instruction/instruction.component';
import { EquipmentHierarchyComponent } from '../../inspection-question-types/equipment-hierarchy/equipment-hierarchy';
import { HMIInfoComponent } from '../../inspection-question-types/hmi-info/hmi-info';
import { AlarmSettingComponent } from '../../inspection-question-types/alarm-setting/alarm-setting';
import { SatisfactoryUnsatisfactoryFailureCodeComponent } from '../../inspection-question-types/satisfactory-unsatisfactory-failure-code/satisfactory-unsatisfactory-failure-code';
import { ThreePointCalibrationComponent } from '../../inspection-question-types/three-point-calibration/three-point-calibration';
import { SwitchSetPointComponent } from '../../inspection-question-types/switch-set-point/switch-set-point';
import { TransmitterValidationComponent } from '../../inspection-question-types/transmitter-validation/transmitter-validation';
import { TransmitterTempValidationComponent } from '../../inspection-question-types/transmitter-temp-validation/transmitter-temp-validation';
import { ValveResponseTestComponent } from '../../inspection-question-types/valve-response-test/valve-response-test';
import { Api12TankComponent } from '../../inspection-question-types/api2tank/api12tank.component';
import { LocalhmiCloseComponent } from '../../inspection-question-types/localhmi-close/localhmi-close.component';
import { ValveOpenComponent } from '../../inspection-question-types/valve-open/valve-open.component';
import { LocalhmiOpenComponent } from '../../inspection-question-types/localhmi-open/localhmi-open.component';
import { SteamTurbineOstComponent } from '../../inspection-question-types/steam-turbine-ost/steam-turbine-ost.component';
import { PressureValidationComponent } from '../../inspection-question-types/pressure-validation/pressure-validation.component';
import { FailDirectionComponent } from '../../inspection-question-types/fail-direction/fail-direction.component';
import { IeAlarmAndTripValidationComponent } from '../../inspection-question-types/ie-alarm-and-trip-validation/ie-alarm-and-trip-validation.component';
import { EventService } from 'src/app/core/services/event.service';
import { SteamTurbineOstComponentTripTest } from '../../inspection-question-types/steam-turbine-ost-trip-test/steam-turbine-ost-trip-test.component';
import { MultiAsleftasfoundComponent } from '../../inspection-question-types/multi-asleftasfound/multi-asleftasfound.component';
import { SettingsService } from 'src/app/core/services/app-settings.service';
import { MeridiumModel } from 'src/app/core/models/local/meridium.model';
import { DifferentialPressureComponent } from '../../inspection-question-types/differential-pressure/differential-pressure';
import { CorrosionModel } from 'src/app/core/models/local/corrosion.model';
import { TransmitterCalibrateThreePointComponent } from '../../inspection-question-types/transmitter-calibrate-three-point/transmitter-calibrate-three-point.component';
import { TransmitterCalibrateTwoPointComponent } from '../../inspection-question-types/transmitter-calibrate-two-point/transmitter-calibrate-two-point.component';
import { PercentErrWithSetPointComponent } from '../../inspection-question-types/percent-err-with-setpoint/percent-err-with-setpoint';
import { PercentErrorWithInputsComponent } from '../../inspection-question-types/percent-error-with-inputs/percent-error-with-inputs.component';

@Component({
  selector: 'app-question-wrapper',
  template: '<ng-template dynamicQuestionType></ng-template>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepPageWrapperComponent implements OnInit, OnDestroy {
  @ViewChild(DynamicQuestionTypeDirective, { static: false })
  dynamicQuestionType!: DynamicQuestionTypeDirective;
  @Input() response: InspectionResponse;
  @Input() section: string;
  @Input() form: FormGroup;
  @Input() showQuestionTitle: boolean = true;
  @Input() editable: boolean = true;
  @Input() helperTrigger: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  @Input() equipDetails: EquipDetails[] = null;

  private subscription = new Subscription();
  private component: ComponentRef<any>;
  isShowHelper: boolean = false;
  showControl: boolean = true;
  isValid = false;
  private replacer = null;
  private userInputSubject = new Subject<any>();
  constructor(private ref: ChangeDetectorRef,
    private eventService: EventService,
    private settingsService: SettingsService) { }

  ngOnInit(): void {
    this.replacer = (key: string, value: any) =>
      String(value) === 'null' || String(value) === 'undefined' ? '' : value;
    this.createComponent();
    this.eventService.getEvent("showComponent").subscribe( (show: boolean) => {
      this.showComponent(show);
    });
  }

  @HostListener('unloaded')
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.component?.destroy();
    this.ref.detach();
    this.eventService = null;
    this.settingsService = null;
    this.helperTrigger?.unsubscribe();
    this.equipDetails = null;
    this.response = null;
    this.section = null;
    this.form = null;
  }

  createComponent() {
    this.ref?.detectChanges();
    this.ref?.markForCheck();
    const viewContainerRef = this.dynamicQuestionType?.viewContainerRef;
    viewContainerRef.clear();
    const component = this.getComponentByQuestionType(this.response.itemType);

    const componentRef = viewContainerRef.createComponent<QuestionTypesModel>(component);

    componentRef.instance.response = this.response;
    componentRef.instance.form = this.form;
    componentRef.instance.section = this.section;
    componentRef.instance.showHelper = this.isShowHelper;
    componentRef.instance.showControl = this.showControl;
    componentRef.instance.editable = this.editable;
    componentRef.instance.showQuestionTitle = this.showQuestionTitle;
    componentRef.instance.equipDetails = this.equipDetails;
    this.component = componentRef;
    this.createHelper(componentRef);
  }

  createHelper(componentRef: ComponentRef<QuestionTypesModel>) {
    try {
      this.response.showHelper = this.isShowHelper;
      if (
        [
          QUESTIONTYPES.WARNING,
          QUESTIONTYPES.DANGER,
          QUESTIONTYPES.CAUTION,
          QUESTIONTYPES.CONDITION,
          QUESTIONTYPES.CHECKBOX,
          QUESTIONTYPES.TASK,
          QUESTIONTYPES.NIMIIRNA,
          QUESTIONTYPES.CORROSION,
          QUESTIONTYPES.MERIDIUM_INSPECTION,
          QUESTIONTYPES.INSPECTION_ACCEPTABLE_NA,
          QUESTIONTYPES.YESNOCOMMENT,
          QUESTIONTYPES.CHECKPOINT,
          QUESTIONTYPES.RANGE
        ].indexOf(this.response.itemType) > -1
      ) {
        this.subscribeHelperTrigger(componentRef);
      }
      this.ref.markForCheck();
    } catch (e) {
      console.error(e);
    }
    this.ref?.markForCheck();
  }
  subscribeHelperTrigger(compRef: ComponentRef<QuestionTypesModel>) {
    compRef.instance.triggerShowHelper.subscribe((selected) => {
      if (typeof selected === 'boolean') {
        this.isShowHelper = selected;
        this.helperTrigger.next(selected);
        this.response.showHelper = selected;
        this.setHelperProperties(selected);
      } else if (selected instanceof MeridiumModel) {
        this.setHelperProperties(selected);
        const isHelperOpen: boolean = (
          selected.showComment || selected.showRecommendations
        );
        this.helperTrigger.next(isHelperOpen);
      } else if(selected instanceof CorrosionModel)
      {
        this.setHelperProperties(selected);
        const isHelperOpen: boolean = (
          selected.showComment
        );
        this.helperTrigger.next(isHelperOpen);
      }
      else { //inspectionResponse or similar
        this.setHelperProperties(selected);
        this.helperTrigger.next(selected?.showHelper);
      }
    });
  }

  setHelperProperties(selected: boolean | {
    showComment?: boolean;
    commentRequired?: boolean;
    showRecommendations?: boolean;
    isShowPhoto?: boolean;
  }) {
    this.response.showComment = typeof selected === 'boolean' ? selected : selected?.showComment || false;
    this.response.isCommentRequired = typeof selected === 'boolean' ? selected : selected?.commentRequired || false;
    this.response.showRecommendation = typeof selected === 'boolean' ? selected : selected?.showRecommendations || false;
    this.response.showPhoto = typeof selected === 'boolean' ? selected : selected?.isShowPhoto || false;
    this.ref.detectChanges();
  }

  getComponentByQuestionType(questionType: QUESTIONTYPES): Type<any> {
    switch (questionType) {
      case QUESTIONTYPES.TEXT:
        return TextComponent;
      case QUESTIONTYPES.CHECKBOX:
        return CheckboxComponent;
      case QUESTIONTYPES.TEXTAREA:
        return TextAreaComponent;
      case QUESTIONTYPES.DATE:
        return DateComponent;
      case QUESTIONTYPES.YESNO:
        return YesNoComponent;
      case QUESTIONTYPES.TEXT_WITH_UNITS:
        return NumericComponent;
      case QUESTIONTYPES.WARNING:
      case QUESTIONTYPES.CAUTION:
      case QUESTIONTYPES.DANGER:
        return InfoMessagesComponent;
      case QUESTIONTYPES.PHOTO_ONLY:
        return PhotoComponent;
      case QUESTIONTYPES.SIGNATURE:
        return SignatureComponent;
      case QUESTIONTYPES.GPS:
        return GPSComponent;
      case QUESTIONTYPES.INSPECTION_ACCEPTABLE_NA:
        return InspectionAcceptableNaComponent;
      case QUESTIONTYPES.YESNOCOMMENT:
        return YesNoCommentComponent;
      case QUESTIONTYPES.TASK:
        return TaskComponent;
      case QUESTIONTYPES.CORROSION:
        return CorrosionComponent;
      case QUESTIONTYPES.MERIDIUM_INSPECTION:
        return MeridiumInspectionComponent;
      case QUESTIONTYPES.DROPDOWN:
        return DropdownComponent;
      case QUESTIONTYPES.MULTISELECT:
        return MultiselectComponent;
      case QUESTIONTYPES.CONDITION:
        return ConditionComponent;
      case QUESTIONTYPES.LINK:
        return LinkComponent;
      case QUESTIONTYPES.ORGANIZATION:
        return OrganizationComponent;
      case QUESTIONTYPES.CHECKPOINT:
        return CheckpointComponent;
      case QUESTIONTYPES.TEXT_WITH_UNIT_DROPDOWN:
        return TextWithUnitDropdownComponent;
      case QUESTIONTYPES.PERCENT_SPAN:
        return PercentSpanComponent;
      case QUESTIONTYPES.PASSFAIL:
        return PassFailComponent;
      case QUESTIONTYPES.LEAK_TEST:
        return LeakTestComponent;
      case QUESTIONTYPES.ASLEFTASFOUND:
        return AsLeftAsFoundComponent;
      case QUESTIONTYPES.ASFOUNDASLEFT_PASSFAIL:
        return AsFoundAsLeftPassFailComponent;
      case QUESTIONTYPES.ASFOUNDASLEFT_PASSFAIL_Dangerous:
        return AsFoundPassFailSafeFailDangerous;
      case QUESTIONTYPES.ASLEFTASFOUND_DROPDOWN:
        return AsLeftAsFoundDropdownComponent;
      case QUESTIONTYPES.CALIBRATION_PERCENT_SPAN:
        return CalibrationPercentSpanComponent;
      case QUESTIONTYPES.VALVE_CLOSURE:
        return ValveClosureComponent;
      case QUESTIONTYPES.AVERAGE:
        return AverageComponent;
      case QUESTIONTYPES.DIFFERENCE:
        return DifferenceComponent;
      case QUESTIONTYPES.RANGE:
        return RangeComponent;
      case QUESTIONTYPES.NIMIIRNA:
        return NimiirnaComponent;
      case QUESTIONTYPES.ATG_TYPE_2:
        return AtgType2Component;
      case QUESTIONTYPES.ATG_TYPE_1:
        return AtgType1Component;
      case QUESTIONTYPES.ATG_TYPE_3:
        return AtgType3Component;
      case QUESTIONTYPES.ATG_TYPE_4:
        return AtgType4Component;
      case QUESTIONTYPES.ATG_TYPE_5:
        return AtgType5Component;
      case QUESTIONTYPES.CHECKLIST:
        return ChecklistComponent;
      case QUESTIONTYPES.TRANSMITTER_CALIBRATION_RATE:
        return TransmitterCalibrationRateComponent;
      case QUESTIONTYPES.INSTRUCTIONS:
        return InstructionComponent;
      case QUESTIONTYPES.EQUIPMENT_HIERARCHY:
        return EquipmentHierarchyComponent;
      case QUESTIONTYPES.HMI_INFO:
        return HMIInfoComponent;
      case QUESTIONTYPES.ALARM_SETTING:
        return AlarmSettingComponent;
      case QUESTIONTYPES.SATISFACTORY_UNSATISFACTORY_FAILURE_CODE:
        return SatisfactoryUnsatisfactoryFailureCodeComponent;
      case QUESTIONTYPES.THREE_POINT_CALIBRATION:
        return ThreePointCalibrationComponent;
      case QUESTIONTYPES.SWITCH_SET_POINT:
        return SwitchSetPointComponent;
      case QUESTIONTYPES.TRANSMITTER_VALIDATION:
        return TransmitterValidationComponent;
      case QUESTIONTYPES.TRANSMITTER_TEMP_VALIDATION:
        return TransmitterTempValidationComponent;
      case QUESTIONTYPES.VALVE_RESPONSE_TEST:
        return ValveResponseTestComponent;
      case QUESTIONTYPES.API12TANK:
        return Api12TankComponent;
      case QUESTIONTYPES.LOCALHMI_CLOSE:
        return LocalhmiCloseComponent;
      case QUESTIONTYPES.VALVE_OPEN:
        return ValveOpenComponent;
      case QUESTIONTYPES.LOCALHMI_OPEN:
        return LocalhmiOpenComponent;
      case QUESTIONTYPES.STEAM_TURBINE_OST:
        return SteamTurbineOstComponent;
      case QUESTIONTYPES.STEAM_TURBINE_OST_TRIP_TEST:
        return SteamTurbineOstComponentTripTest;
      case QUESTIONTYPES.PRESSURE_VALIDATION:
        return PressureValidationComponent;
      case QUESTIONTYPES.FAIL_DIRECTION:
        return FailDirectionComponent;
      case QUESTIONTYPES.IE_ALARM_AND_TRIP_VALIDATION:
        return IeAlarmAndTripValidationComponent;
      case QUESTIONTYPES.MULTI_ASLEFTASFOUND:
        return MultiAsleftasfoundComponent;
      case QUESTIONTYPES.DIFFERENTIAL_PRESSURE:
        return DifferentialPressureComponent;
      case QUESTIONTYPES.TRANSMITTER_CALIBRATION_THREE_POINT:
        return TransmitterCalibrateThreePointComponent;
        case QUESTIONTYPES.TRANSMITTER_CALIBRATION_TWO_POINT:
          return TransmitterCalibrateTwoPointComponent;
      case QUESTIONTYPES.PERCENT_ERR_WITH_SETPOINT:
          return PercentErrWithSetPointComponent;
      case QUESTIONTYPES.PERCENT_ERR_WITH_INPUTS:
          return PercentErrorWithInputsComponent;
      default:
        return TextComponent;
    }
  }

  ngAfterViewInit(): void {
    // i have no idea why, but the valuechanges subscription
    // only works when there's a setTimeout
    // without it, QTs like ATG dont save to db
    try{
      setTimeout(() => {
        this.onControlFormChanges();
      });

      this.userInputSubject.pipe(debounceTime(500))
      .subscribe((formControl) => {
        this.handleUpdatesOnChange(formControl);
      });

    }catch(err){
      console.log("ERR>>>"+err.Message);
    }
  }

  handleUpdatesOnChange(formControl)
  {
    let answer = null;
        if ((formControl.status === "DISABLED" && MIUtilities.isNullOrUndefined(this.settingsService.get('emit'))) ||
          this.response.isNA) {
          answer = "NA";
        } else {
          answer = this.getAnswerByItemType(formControl);
        }
        const prevAnswer = this.response.answer;
        this.response.answer = answer;
        if (prevAnswer != answer) {
          console.log(`[FormControlChange] ${this.response.questionId} - {old: '${prevAnswer}', new: '${answer}', status: '${formControl.status}'}`);
          this.isValid =
            formControl.status === 'VALID' || formControl.status === 'DISABLED';
          this.response.isChanged = 'Y';
          db.updateAnswer(this.response);
          this.ref.markForCheck();
          this.ref.detectChanges();
          this.validateConditionalExp();
        }
  }

  private onControlFormChanges() {
    const formControl = this.form?.get([this.section, this.response.questionId]);
    this.subscription.add(
      formControl.valueChanges.subscribe((value) => {
        this.userInputSubject.next(formControl);

      })
    );
  }

  validateConditionalExp() {
    if (this.response.inspectionSection == 'General') {
      this.eventService.publishEvent("validateConditialExpressionGeneral", this.response);
    } else {
      this.eventService.publishEvent("validateConditialExpression", this.response);
    }
  }

  getAnswerByItemType(formControl: any) {
    switch (this.response.itemType) {
      case QUESTIONTYPES.CHECKBOX:
        return this.getCheckboxAnswer(formControl);
      case QUESTIONTYPES.DANGER:
      case QUESTIONTYPES.CONDITION:
      case QUESTIONTYPES.WARNING:
      case QUESTIONTYPES.CAUTION:
      case QUESTIONTYPES.CHECKPOINT:
        return this.getAcknowledgedAnswer(formControl);
      case QUESTIONTYPES.GPS:
      case QUESTIONTYPES.ASFOUNDASLEFT_PASSFAIL:
      case QUESTIONTYPES.ASFOUNDASLEFT_PASSFAIL_Dangerous:
      case QUESTIONTYPES.ASLEFTASFOUND:
      case QUESTIONTYPES.PASSFAIL:
      case QUESTIONTYPES.ASLEFTASFOUND_DROPDOWN:
      case QUESTIONTYPES.DIFFERENCE:
      // case QUESTIONTYPES.DIFFERENTIAL_PRESSURE:
      case QUESTIONTYPES.TEXT_WITH_UNIT_DROPDOWN:
        return this.getJoinedAnswer(formControl);
      case QUESTIONTYPES.MULTI_ASLEFTASFOUND:
        return this.getMultiAsLeftAsFoundAnswer(formControl);
      case QUESTIONTYPES.LEAK_TEST:
      case QUESTIONTYPES.VALVE_CLOSURE:
      case QUESTIONTYPES.LOCALHMI_CLOSE:
      case QUESTIONTYPES.LOCALHMI_OPEN:
      case QUESTIONTYPES.API12TANK:
      case QUESTIONTYPES.VALVE_OPEN:
      case QUESTIONTYPES.IE_ALARM_AND_TRIP_VALIDATION:
      case QUESTIONTYPES.MULTISELECT:
      case QUESTIONTYPES.TRANSMITTER_TEMP_VALIDATION:
      case QUESTIONTYPES.TRANSMITTER_VALIDATION:
      case QUESTIONTYPES.PRESSURE_VALIDATION:
      case QUESTIONTYPES.FAIL_DIRECTION:
      case QUESTIONTYPES.VALVE_RESPONSE_TEST:
      case QUESTIONTYPES.AVERAGE:
      case QUESTIONTYPES.ATG_TYPE_1:
      case QUESTIONTYPES.ATG_TYPE_2:
      case QUESTIONTYPES.ATG_TYPE_3:
      case QUESTIONTYPES.ATG_TYPE_4:
      case QUESTIONTYPES.ATG_TYPE_5:
      case QUESTIONTYPES.TRANSMITTER_CALIBRATION_RATE:
      case QUESTIONTYPES.HMI_INFO:
      case QUESTIONTYPES.ALARM_SETTING:
      case QUESTIONTYPES.THREE_POINT_CALIBRATION:
      case QUESTIONTYPES.TRANSMITTER_CALIBRATION_THREE_POINT:
      case QUESTIONTYPES.TRANSMITTER_CALIBRATION_TWO_POINT:
      case QUESTIONTYPES.SATISFACTORY_UNSATISFACTORY_FAILURE_CODE:
      case QUESTIONTYPES.SWITCH_SET_POINT:
      case QUESTIONTYPES.EQUIPMENT_HIERARCHY:
      case QUESTIONTYPES.STEAM_TURBINE_OST:
      case QUESTIONTYPES.STEAM_TURBINE_OST_TRIP_TEST:
      case QUESTIONTYPES.DIFFERENTIAL_PRESSURE:
        return this.getEquipHeirarchyAnswer(formControl);
      case QUESTIONTYPES.DATE:
        return this.getDateAnswer(formControl);
      case QUESTIONTYPES.PERCENT_SPAN:
      case QUESTIONTYPES.CALIBRATION_PERCENT_SPAN:
      case QUESTIONTYPES.PERCENT_ERR_WITH_INPUTS:
        return this.getPercentSpanAnswer(formControl);
      case QUESTIONTYPES.CHECKLIST:
        return this.getChecklistAnswer(formControl);
      case QUESTIONTYPES.PERCENT_ERR_WITH_SETPOINT:
          return this.getPercentErrWithSetpointAnswer(formControl);
      default:
        return this.handleDefaultAnswer(formControl);
    }
  }

  private getEquipHeirarchyAnswer(formControl: any): string {
    const value = JSON.stringify(
      (formControl as FormGroup).getRawValue(),
      this.replacer
    );
    return value;
  }

  private getDateAnswer(formControl: any): string {
    const answer = dayjs(formControl.value).format('MM/DD/YYYY');
    return answer === 'Invalid date' ? null : answer;
  }

  private getCheckboxAnswer(formControl: any): string {
    return formControl.value ? 'Completed' : '';
  }

  private getAcknowledgedAnswer(formControl: any): string {
    return formControl.value ? 'Acknowledged' : '';
  }

  private getJoinedAnswer(formControl: any): string {
    return Object.keys(formControl.value)
      .map((key) => formControl.value[key])
      .join('|');
  }

  private getMultiAsLeftAsFoundAnswer(formControl: any): string {
    const answers = (formControl as FormGroup).getRawValue();
    return JSON.stringify(answers, this.replacer);
  }

  private handleDefaultAnswer(formControl: any): any {
    return formControl.value;
  }

  private getPercentSpanAnswer(formControl: any): string {
    const rawValue = (formControl as FormGroup).getRawValue();
    if (rawValue['details']) {
      rawValue['details'].forEach((raw) => {
        if (raw['ErrorL'] || raw['ErrorL'] === 0) {
          raw['ErrorL'] = raw['ErrorL'] + '%';
        }
        if (raw['ErrorF'] || raw['ErrorF'] === 0) {
          raw['ErrorF'] = raw['ErrorF'] + '%';
        }
      });
    }
    return JSON.stringify(rawValue, this.replacer);
  }

  private getChecklistAnswer(formControl: any): string {
    return formControl.value?.toString();
  }

  showComponent(show: boolean): void {
    this.showControl = show;
    this.component.instance.showControl = this.showControl;

    let fg = this.form.get([this.section, this.response.questionId])
    fg?.updateValueAndValidity();
    this.ref?.markForCheck();
  }

  private getPercentErrWithSetpointAnswer(formControl: any): string {
    const values = (formControl as FormGroup).getRawValue();
    if(values["details"])
    {
      if(values['details']['ErrorL'] || values['details']['ErrorL'] === 0)
      {
        values['details']['ErrorL'] = values['details']['ErrorL'] + "%";
      }
      if(values['details']['ErrorF'] || values['details']['ErrorF'] === 0)
      {
        values['details']['ErrorF'] = values['details']['ErrorF'] + "%";
      }
    }
    return JSON.stringify(values);
  }


}
