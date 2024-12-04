import { Injectable } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';
import { SectionModel } from 'src/app/core/models/local/section.model';
import { SubSectionModel } from 'src/app/core/models/local/subsection.model';
import {
  InspectionResponse,
  EquipDetails,
  WorkOrderList,
  InspectionResponseImage,
} from 'src/app/core/sync/entities';
import { MIUtilities } from 'src/app/shared/utility';
import { NimiirnaComponent } from '../components/inspection-question-types/nimiirna/nimiirna.component';
import { PercentSpanComponent } from '../components/inspection-question-types/percent-span/percent-span.component';
import { CalibrationPercentSpanComponent } from '../components/inspection-question-types/calibration-percent-span/calibration-percent-span';
import { Observable, Subject } from 'rxjs';
import { HMIInfoComponent } from '../components/inspection-question-types/hmi-info/hmi-info';
import { AlarmSettingComponent } from '../components/inspection-question-types/alarm-setting/alarm-setting';
import { ThreePointCalibrationComponent } from '../components/inspection-question-types/three-point-calibration/three-point-calibration';
import { SteamTurbineOstComponent } from '../components/inspection-question-types/steam-turbine-ost/steam-turbine-ost.component';
import { SteamTurbineOstComponentTripTest } from '../components/inspection-question-types/steam-turbine-ost-trip-test/steam-turbine-ost-trip-test.component';
import { ValveResponseTestComponent } from '../components/inspection-question-types/valve-response-test/valve-response-test';
import { TransmitterValidationComponent } from '../components/inspection-question-types/transmitter-validation/transmitter-validation';
import { YesNoCommentComponent } from '../components/inspection-question-types/yesnocomment/yesnocomment.component';
import { TaskComponent } from '../components/inspection-question-types/task/task.component';
import { MatStepper } from '@angular/material/stepper';
import { ChecklistComponent } from '../components/inspection-question-types/checklist/checklist.component';
import { TransmitterCalibrateThreePointComponent } from '../components/inspection-question-types/transmitter-calibrate-three-point/transmitter-calibrate-three-point.component';
import { TransmitterCalibrateTwoPointComponent } from '../components/inspection-question-types/transmitter-calibrate-two-point/transmitter-calibrate-two-point.component';
import { RangeComponent } from '../components/inspection-question-types/range/range.component';
import { InspectionAcceptableNaComponent } from '../components/inspection-question-types/inspection-acceptable-na/inspection-acceptable-na.component';
import { MeridiumInspectionComponent } from '../components/inspection-question-types/meridium-inspection/meridium-inspection.component';
import { PhotoComponent } from '../components/inspection-question-types/photo/photo.component';
import { AverageComponent } from '../components/inspection-question-types/average/average.component';
import { AppDB } from 'src/databases/db';

@Injectable({
  providedIn: 'root',
})
export class InspectionDetailsService {
  inspectionTypes = QUESTIONTYPES;
  hasInspectionImages: boolean = false;

  private _form: FormGroup;
  private _workorder: WorkOrderList;
  private _inspectionImage: InspectionResponseImage;
  private _sections: Array<SectionModel> = new Array<SectionModel>();
  private _inspectionImages: Array<InspectionResponseImage> = [];
  private equipDetails: Array<EquipDetails> = [];
  private showHomeIconSubject: Subject<boolean>;
  public activePage: Subject<string>;
  public detailStepper: MatStepper;

  constructor(private db: AppDB) {
    this.showHomeIconSubject = new Subject<boolean>();
    this.activePage = new Subject<string>();
  }

  get form(): FormGroup {
    return this._form;
  }
  set form(form: FormGroup) {
    this._form = form;
  }

  get workorder(): WorkOrderList {
    return this._workorder;
  }
  set workorder(workorder: WorkOrderList) {
    this._workorder = workorder;
  }

  get sections(): Array<SectionModel> {
    return this._sections;
  }
  set sections(sections: Array<SectionModel>) {
    this._sections = sections;
  }

  get visionsSettings(): Array<EquipDetails> {
    return this.equipDetails;
  }
  set visionsSettings(visionsSettings: Array<EquipDetails>) {
    this.equipDetails = visionsSettings;
  }

  get inspectionImage(): InspectionResponseImage {
    return this._inspectionImage;
  }
  set inspectionImage(inspectionImage: InspectionResponseImage) {
    this._inspectionImage = inspectionImage;
  }

  get inspectionImages(): Array<InspectionResponseImage> {
    return this._inspectionImages;
  }

  set inspectionImages(inspectionImages: InspectionResponseImage[]) {
    this._inspectionImages = inspectionImages;
  }

  getSetting(fieldName: string): string {
    const field = this.equipDetails?.find(
      (field) => field.fieldName.toUpperCase() === fieldName.toUpperCase()
    );
    let value = null;
    if (field) {
      try {
        // If updatedVal is null, default to currVal.
        value =
          !MIUtilities.isNullOrUndefined(field['updatedVal']) &&
            field['updatedVal'].length > 0
            ? field['updatedVal']
            : field['currVal'];
      } catch { }
    }
    return value;
  }

  getSetPointSettings(): Array<EquipDetails> {
      return this.visionsSettings.filter(vision => vision.fieldName.indexOf("Set Point") > -1);
  }

  showHomeIcon(opening: boolean): void {
    this.showHomeIconSubject.next(opening);
  }

  onShowHomeIcon(): Observable<boolean> {
    return this.showHomeIconSubject;
  }
  setActivePage(page: string) {
    this.activePage.next(page);
  }

  filterSection(section: string, exclude = false): Array<SectionModel> {
    return this._sections?.filter((s: SectionModel) => {
      if (exclude) return s.title !== section;
      else return s.title === section;
    });
  }

  async getInspectionBySections(workOrder: WorkOrderList, isSummaryPage: boolean = false): Promise<FormGroup> {
    this._sections = new Array<SectionModel>();
    this._form = undefined;
    let responses = null;

    this._sections = await this.groupBySection(workOrder.inspectionResponses);
    for (const section of this._sections) {
      let controls = {};

      for (const subSection of section.subSections) {
        if (
          subSection.responses &&
          subSection.responses[0] &&
          subSection.responses[0].sortId != null
        )
          subSection.responses.sort((ins1, ins2) =>
            ins1.sortId > ins2.sortId || ins1.sortId == ins2.sortId ? 1 : -1
          );
        controls = await this.createFormControlByQuestionType(
          subSection,
          controls,
          workOrder
        );
        responses = subSection.responses;
      }
      const sectionForm = new FormGroup(controls);
      if (!this._form) this._form = new FormGroup({});
      this._form.addControl(section.title, sectionForm);

      if (isSummaryPage) {
        const naResponses = responses.filter(response => response.isNA);
        naResponses.forEach((response) => {
          const formGroupNA = this._form.get([
            section.title,
            response.questionId,
          ]);
          
          if (formGroupNA) {
            formGroupNA.disable();
          }
        });
      }
    }
    return this.form;
  }

  async createFormControlByQuestionType(
    subSection: SubSectionModel,
    controls: {},
    wo: WorkOrderList
  ): Promise<any> {
    this.equipDetails = wo.eqDetails;

    for (const inspection of subSection.responses) {
      let formControl: AbstractControl;

      switch (inspection.itemType) {
        case this.inspectionTypes.INSTRUCTIONS:
        case this.inspectionTypes.LINK:
        case this.inspectionTypes.ORGANIZATION: {
          formControl = new FormControl(null);
          break;
        }
        case this.inspectionTypes.NIMIIRNA: {
          formControl = await NimiirnaComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.INSPECTION_ACCEPTABLE_NA: {
          formControl = await InspectionAcceptableNaComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.MERIDIUM_INSPECTION: {
          formControl = await MeridiumInspectionComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.PERCENT_SPAN: {
          formControl = await PercentSpanComponent.create(
            inspection
          );
          break;
        }
        case this.inspectionTypes.CALIBRATION_PERCENT_SPAN: {
          formControl = await CalibrationPercentSpanComponent.create(
            inspection
          );
          break;
        }
        case this.inspectionTypes.HMI_INFO: {
          formControl = await HMIInfoComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.ALARM_SETTING: {
          formControl = await AlarmSettingComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.THREE_POINT_CALIBRATION: {
          formControl = await ThreePointCalibrationComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.TRANSMITTER_CALIBRATION_THREE_POINT: {
          formControl = await TransmitterCalibrateThreePointComponent.create(inspection, this.equipDetails);
          break;
        }
        case this.inspectionTypes.TRANSMITTER_CALIBRATION_TWO_POINT: {
          formControl = await TransmitterCalibrateTwoPointComponent.create(inspection, this.equipDetails);
          break;
        }
        case this.inspectionTypes.STEAM_TURBINE_OST: {
          formControl = await SteamTurbineOstComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.VALVE_RESPONSE_TEST: {
          formControl = await ValveResponseTestComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.STEAM_TURBINE_OST_TRIP_TEST: {
          formControl = await SteamTurbineOstComponentTripTest.create(
            inspection
          );
          break;
        }
        case this.inspectionTypes.TRANSMITTER_VALIDATION: {
          formControl = await TransmitterValidationComponent.create(inspection,this.equipDetails
          ); break;
        }
        case this.inspectionTypes.YESNOCOMMENT: {
          formControl = await YesNoCommentComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.TASK: {
          formControl = await TaskComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.CHECKLIST: {
          formControl = await ChecklistComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.RANGE: {
          formControl = await RangeComponent.create(inspection);
          break;
        }
        case this.inspectionTypes.PHOTO_ONLY: {
          // Fetch the photos before creating the formControl, as Angular async validators do not wait for the Dexie response.
          const photos = await this.db.getImagesByResponseId(inspection.id); 
          formControl = await PhotoComponent.create(inspection, photos);
          break;
        }
        case this.inspectionTypes.AVERAGE: {
          formControl = await AverageComponent.create(inspection);
          break;
        }
        default: {
          formControl = new FormControl(
            {
              value: inspection.answer,
              disabled: false,
            },
            [Validators.required]
          );
          break;
        }
      }

      formControl?.setValidators(
        formControl?.validator
          ? [formControl.validator, this.validateHelpers.bind(this, inspection)]
          : [this.validateHelpers.bind(this, inspection)]
      );

      if (inspection.isShow === false || formControl.status === 'DISABLED') {
        formControl.disable();
      }

      controls[inspection.questionId] = formControl;
    }
    return controls;
  }

  private validateHelpers(i: InspectionResponse, control: FormControl) {
    if (control.status === 'VALID') {
      const section = this.sections
        ? this.sections.find((e) => e.title === i.inspectionSection)
        : null;
      const subSection = section
        ? section.subSections.find(
          (e) =>
            e.title === i.subsection ||
            (e.title === '' && i.subsection === null)
        )
        : null;
      const inspection =
        subSection && subSection.responses
          ? subSection.responses.find((e) => e.id === i.id)
          : null;
      if (
        inspection &&
        (inspection.followUpWO || inspection.attention) &&
        MIUtilities.isNullOrUndefined(inspection.comments)
      ) return { hasError: true };
      return null;
    }
    return { hasError: true };
  }

  groupBySection(inspectionsResponses: Array<InspectionResponse>) {
    
    try{
      inspectionsResponses
      .sort((a, b) => {

        if(a.sectionSortId !== b.sectionSortId){
          return a.sectionSortId - b.sectionSortId;
        }
        if(a.inspectionSection !== b.inspectionSection){
          return a.inspectionSection.localeCompare(b.inspectionSection);
        }
  
        if(a.subSectionSortId !== b.subSectionSortId){
          return a.subSectionSortId - b.subSectionSortId;
        }
        if(a.subsection !== b.subsection){
          return a.subsection.localeCompare(b.subsection);
        }
  
        if(a.sortId !== b.sortId){
          return a.sortId - b.sortId;
        }
  
        return a.question.localeCompare(b.question);

    }).sort((a, b) => {
      // equal items sort equally
      if (a.id === b.id) {
        return 0;
      }

      // nulls sort after anything else
      if (a.id === null) {
        return 1;
      }
      if (b.id === null) {
        return -1;
      }

      //ascending
      return a.id < b.id ? -1 : 1;

    });
    }
    catch(error){
      console.log('Sorting responses failed: ', error);
    }
    
    return inspectionsResponses?.reduce(
      async (
        sectionsList: Promise<Array<SectionModel>>,
        response: InspectionResponse
      ) => {
        const list = await sectionsList;

        if (response.conditionalExpression) {
          response.isShow = InspectionResponse.evalConditionalExpression(
            response,
            inspectionsResponses
          );
        }
        const indexSection = list.findIndex(
          (section) => section.title === response.inspectionSection
        );
        if (indexSection === -1) {
          list.push(
            new SectionModel(response.inspectionSection, [
              new SubSectionModel(response.subsection, [response]),
            ])
          );
        } else {
          const subIndexSection = list[indexSection].subSections.findIndex(
            (section) => section.title === response.subsection
          );

          if (subIndexSection === -1) {
            list[indexSection].subSections.push(
              new SubSectionModel(response.subsection, [response])
            );
          } else {
            list[indexSection].subSections[subIndexSection].responses.push(
              response
            );
          }
        }
        return list || new Array<SectionModel>();
      },
      Promise.resolve(new Array<SectionModel>())
    );
  }

}
