import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  Input,
  OnDestroy,
} from '@angular/core';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';
import { InspectionResponse, EquipDetails, InspectionResponseImage } from 'src/app/core/sync/entities';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'answer',
  templateUrl: 'answer.component.html',
  styleUrls: ['./answer.component.scss'],
})
export class AnswerComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() response: InspectionResponse;
  @Input() section: string;
  @Input() form: FormGroup;
  @Input() showQuestionTitle: boolean = true;
  @Input() editable: boolean = true;
  @Input() equipDetails: EquipDetails[];
  @Input() responseImages: InspectionResponseImage[];
  needFactory = false;
  isValid = false;
  componentName = '';
  photoEnum = QUESTIONTYPES.PHOTO_ONLY;

  constructor(private _cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (
      [
        QUESTIONTYPES.NIMIIRNA,
        QUESTIONTYPES.GPS,
        QUESTIONTYPES.ASFOUNDASLEFT_PASSFAIL,
        QUESTIONTYPES.ASFOUNDASLEFT_PASSFAIL_Dangerous,
        QUESTIONTYPES.ASLEFTASFOUND,
        QUESTIONTYPES.PASSFAIL,
        QUESTIONTYPES.MULTISELECT,
        QUESTIONTYPES.MULTI_ASLEFTASFOUND,
        QUESTIONTYPES.PERCENT_SPAN,
        QUESTIONTYPES.LEAK_TEST,
        QUESTIONTYPES.CALIBRATION_PERCENT_SPAN,
        QUESTIONTYPES.VALVE_CLOSURE,
        QUESTIONTYPES.PERCENT_ERR_WITH_INPUTS,
        QUESTIONTYPES.LOCALHMI_CLOSE,
        QUESTIONTYPES.LOCALHMI_OPEN,
        QUESTIONTYPES.API12TANK,
        QUESTIONTYPES.VALVE_OPEN,
        QUESTIONTYPES.PRESSURE_VALIDATION,
        QUESTIONTYPES.FAIL_DIRECTION,
        QUESTIONTYPES.IE_ALARM_AND_TRIP_VALIDATION,
        QUESTIONTYPES.TRANSMITTER_TEMP_VALIDATION,
        QUESTIONTYPES.TRANSMITTER_VALIDATION,
        QUESTIONTYPES.VALVE_RESPONSE_TEST,
        QUESTIONTYPES.RANGE,
        QUESTIONTYPES.DIFFERENCE,
        QUESTIONTYPES.AVERAGE,
        QUESTIONTYPES.ASLEFTASFOUND_DROPDOWN,
        QUESTIONTYPES.YESNOCOMMENT,
        QUESTIONTYPES.TEXT_WITH_UNIT_DROPDOWN,
        QUESTIONTYPES.TRANSMITTER_CALIBRATION_RATE,
        QUESTIONTYPES.HMI_INFO,
        QUESTIONTYPES.THREE_POINT_CALIBRATION,
        QUESTIONTYPES.TRANSMITTER_CALIBRATION_THREE_POINT,
        QUESTIONTYPES.TRANSMITTER_CALIBRATION_TWO_POINT,
        QUESTIONTYPES.ALARM_SETTING,
        QUESTIONTYPES.SATISFACTORY_UNSATISFACTORY_FAILURE_CODE,
        QUESTIONTYPES.SWITCH_SET_POINT,
        QUESTIONTYPES.EQUIPMENT_HIERARCHY,
        QUESTIONTYPES.STEAM_TURBINE_OST,
        QUESTIONTYPES.STEAM_TURBINE_OST_TRIP_TEST,
        QUESTIONTYPES.ATG_TYPE_1,
        QUESTIONTYPES.ATG_TYPE_2,
        QUESTIONTYPES.ATG_TYPE_3,
        QUESTIONTYPES.ATG_TYPE_4,
        QUESTIONTYPES.ATG_TYPE_5,
        QUESTIONTYPES.DIFFERENTIAL_PRESSURE,
        QUESTIONTYPES.PERCENT_ERR_WITH_SETPOINT
      ].indexOf(this.response.itemType) > -1 &&
      this.response.answer !== 'NA'
    ) {
      this.needFactory = true;
    }
  }

  ngAfterViewInit(): void {
    const formControl = this.form.get([this.section, this.response.questionId]);
    if (formControl.status === 'VALID' || formControl.status === 'DISABLED') {
      this.isValid = true;
    }
    this._cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.response = null;
    this.section = null;
    this.form = null;
    this.equipDetails = null;
    this.componentName = null;
    this.responseImages = null;
  }
  
  validateCompletedSectionClass() {
    return this.form.get([this.section, this.response.questionId])?.valid || this.response.isNA ? 'complete' : 'incomplete'
  }
}
