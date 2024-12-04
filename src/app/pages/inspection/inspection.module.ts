import { CommonModule, DecimalPipe } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { InspectionRoutingModule } from './inspection-routing.module';
import { InspectionDetailComponent } from './components/inspection-detail/inspection-detail.component';
import { GeneralComponent } from './components/inspection-detail/general/general.component';
import { SummaryComponent } from './components/inspection-detail/summary/summary.component';
import { WOEquipmentComponent } from './components/inspection-detail/wo-equipment/wo-equipment.component';
import { DetailComponent } from './components/inspection-detail/detail/detail.component';
import { AddInspectionItemComponent } from './components/inspection-detail/add-inspection-item/add-inspection-item.component';
import { StepPageWrapperComponent } from './components/inspection-detail/detail/step-page-wrapper.component';
import { CheckboxComponent } from './components/inspection-question-types/checkbox/checkbox.component';
import { TextComponent } from './components/inspection-question-types/text/text.component';
import { InfoMessagesComponent } from './components/inspection-question-types/info-messages/info-messages.component';
import { DynamicQuestionTypeDirective } from './directives/dynamic-question-type.directive';
import { WebcamModule } from 'ngx-webcam';
import { PhotoComponent } from './components/inspection-question-types/photo/photo.component';
import { PhotoDialogComponent } from './components/inspection-question-types/photo/dialog/photo-dialog.component';
import { SignatureComponent } from './components/inspection-question-types/signature/signature.component';
import { SignatureDialogComponent } from './components/inspection-question-types/signature/signature-dialog.component';
import { GPSComponent } from './components/inspection-question-types/gps/gps.component';
import { TextAreaComponent } from './components/inspection-question-types/textarea/textarea.component';
import { DateComponent } from './components/inspection-question-types/date/date.component';
import { YesNoComponent } from './components/inspection-question-types/yesno/yesno.component';
import { NumericComponent } from './components/inspection-question-types/numeric/numeric.component';
import { InspectionAcceptableNaComponent } from './components/inspection-question-types/inspection-acceptable-na/inspection-acceptable-na.component';
import { YesNoCommentComponent } from './components/inspection-question-types/yesnocomment/yesnocomment.component';
import { TaskComponent } from './components/inspection-question-types/task/task.component';
import { HelperComponent } from './components/inspection-question-types/helper/helper.component';
import { CorrosionComponent } from './components/inspection-question-types/corrosion/corrosion.component';
import { MeridiumInspectionComponent } from './components/inspection-question-types/meridium-inspection/meridium-inspection.component';
import { NimiirnaComponent } from './components/inspection-question-types/nimiirna/nimiirna.component';
import { DropdownComponent } from './components/inspection-question-types/dropdown/dropdown.component';
import { MultiselectComponent } from './components/inspection-question-types/multiselect/multiselect.component';
import { LinkComponent } from './components/inspection-question-types/link/link.component';
import { InstructionComponent } from './components/inspection-question-types/instruction/instruction.component';
import { ConditionComponent } from './components/inspection-question-types/condition/condition.component';
import { OrganizationComponent } from './components/inspection-question-types/organization/organization.component';
import { CheckpointComponent } from './components/inspection-question-types/checkpoint/checkpoint.component';
import { TextWithUnitDropdownComponent } from './components/inspection-question-types/text-with-unit-dropdown/text-with-unit-dropdown.component';
import { PercentSpanComponent } from './components/inspection-question-types/percent-span/percent-span.component';
import { PassFailComponent } from './components/inspection-question-types/pass-fail/pass-fail.component';
import { LeakTestComponent } from './components/inspection-question-types/leak-test/leak-test';
import { TranslateCompiler, TranslateModule } from '@ngx-translate/core';
import { AsLeftAsFoundComponent } from './components/inspection-question-types/as-left-as-found/as-left-as-found.component';
import { AsFoundAsLeftPassFailComponent } from './components/inspection-question-types/as-found-as-left-pass-fail/as-found-as-left-pass-fail.component';
import { AsFoundPassFailSafeFailDangerous } from './components/inspection-question-types/as-found-pass-failsafe-faildangerous/as-found-pass-failsafe-faildangerous.component';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { AsLeftAsFoundDropdownComponent } from './components/inspection-question-types/as-left-as-found-dropdown/as-left-as-found-dropdown.component';
import { CalibrationPercentSpanComponent } from './components/inspection-question-types/calibration-percent-span/calibration-percent-span';
import { ValveClosureComponent } from './components/inspection-question-types/valve-closure/valve-closure';
import { AverageComponent } from './components/inspection-question-types/average/average.component';
import { DifferenceComponent } from './components/inspection-question-types/difference/difference.component';
import { RangeComponent } from './components/inspection-question-types/range/range.component';
import { AtgType2Component } from './components/inspection-question-types/atg-type2/atg-type2.component';
import { AtgType1Component } from './components/inspection-question-types/atg-type1/atg-type1.component';
import { AtgType3Component } from './components/inspection-question-types/atg-type3/atg-type3.component';
import { AtgType4Component } from './components/inspection-question-types/atg-type4/atg-type4.component';
import { AtgType5Component } from './components/inspection-question-types/atg-type5/atg-type5.component';
import { ChecklistComponent } from './components/inspection-question-types/checklist/checklist.component';
import { TransmitterCalibrationRateComponent } from './components/inspection-question-types/transmitter-calibration-rate/transmitter-calibration-rate.component';
import { EquipmentHierarchyComponent } from './components/inspection-question-types/equipment-hierarchy/equipment-hierarchy';
import { HMIInfoComponent } from './components/inspection-question-types/hmi-info/hmi-info';
import { AlarmSettingComponent } from './components/inspection-question-types/alarm-setting/alarm-setting';
import { SatisfactoryUnsatisfactoryFailureCodeComponent } from './components/inspection-question-types/satisfactory-unsatisfactory-failure-code/satisfactory-unsatisfactory-failure-code';
import { ThreePointCalibrationComponent } from './components/inspection-question-types/three-point-calibration/three-point-calibration';
import { SwitchSetPointComponent } from './components/inspection-question-types/switch-set-point/switch-set-point';
import { TransmitterValidationComponent } from './components/inspection-question-types/transmitter-validation/transmitter-validation';
import { TransmitterTempValidationComponent } from './components/inspection-question-types/transmitter-temp-validation/transmitter-temp-validation';
import { ValveResponseTestComponent } from './components/inspection-question-types/valve-response-test/valve-response-test';
import { Api12TankComponent } from './components/inspection-question-types/api2tank/api12tank.component';
import { LocalhmiCloseComponent } from './components/inspection-question-types/localhmi-close/localhmi-close.component';
import { BasePassFailComponent } from './components/inspection-question-types/base-pass-fail/base-pass-fail.component';
import { ValveOpenComponent } from './components/inspection-question-types/valve-open/valve-open.component';
import { LocalhmiOpenComponent } from './components/inspection-question-types/localhmi-open/localhmi-open.component';
import { SteamTurbineOstComponent } from './components/inspection-question-types/steam-turbine-ost/steam-turbine-ost.component';
import { PressureValidationComponent } from './components/inspection-question-types/pressure-validation/pressure-validation.component';
import { FailDirectionComponent } from './components/inspection-question-types/fail-direction/fail-direction.component';
import { AnswerComponent } from './components/inspection-detail/answer/answer.component';
import { IeAlarmAndTripValidationComponent } from './components/inspection-question-types/ie-alarm-and-trip-validation/ie-alarm-and-trip-validation.component';
import { CanvasEditPhotoComponent } from './components/inspection-question-types/photo/canvas-edit/canvas-edit-photo.component';
import { SteamTurbineOstComponentTripTest } from './components/inspection-question-types/steam-turbine-ost-trip-test/steam-turbine-ost-trip-test.component';
import { MultiAsleftasfoundComponent } from './components/inspection-question-types/multi-asleftasfound/multi-asleftasfound.component';
import { InspectionJsonViewerComponent } from './components/inspection-detail/inspection-json-viewer/inspection-json-viewer.component';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { DifferentialPressureComponent } from './components/inspection-question-types/differential-pressure/differential-pressure';
import { TransmitterCalibrateThreePointComponent } from './components/inspection-question-types/transmitter-calibrate-three-point/transmitter-calibrate-three-point.component';
import { TransmitterCalibrateTwoPointComponent } from './components/inspection-question-types/transmitter-calibrate-two-point/transmitter-calibrate-two-point.component';
import { PercentErrWithSetPointComponent } from './components/inspection-question-types/percent-err-with-setpoint/percent-err-with-setpoint';
import { InspectionSummaryDropdownComponent } from './components/inspection-detail/inspection-summary-dropdown/inspection-summary-dropdown.component';
import { PercentErrorWithInputsComponent } from './components/inspection-question-types/percent-error-with-inputs/percent-error-with-inputs.component';
import { PhotoViewComponent } from './components/inspection-question-types/photo-view/photo-view.component';
import { SummaryScrollComponent } from './components/inspection-question-types/summary-scroll/summary-scroll.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { DropdownSearchComponent } from './classes/components-shared/dropdown-search/dropdown-search.component';
import { TmlDetailAddComponent } from './components/inspection-detail/wo-equipment/tml-detail-add/tml-detail-add.component';
import { TmlDetailComponent } from './components/inspection-detail/wo-equipment/tml-detail/tml-detail.component';
import { MeridiumDetailsComponent } from './components/inspection-detail/wo-equipment/meridium-details/meridium-details.component';
import { TmlDetailMeridiumComponent } from './components/inspection-detail/wo-equipment/tml-detail-meridium/tml-detail-meridium.component';
import { TmlDetailModalComponent } from './components/inspection-detail/wo-equipment/tml-detail-modal/tml-detail-modal.component';
import { AppDB } from 'src/databases/db';

@NgModule({
  declarations: [
    InspectionDetailComponent,
    DetailComponent,
    GeneralComponent,
    SummaryComponent,
    AddInspectionItemComponent,
    WOEquipmentComponent,
    TextComponent,
    CheckboxComponent,
    InfoMessagesComponent,
    DynamicQuestionTypeDirective,
    StepPageWrapperComponent,
    PhotoComponent,
    PhotoViewComponent,
    PhotoDialogComponent,
    SignatureComponent,
    SignatureDialogComponent,
    GPSComponent,
    TextAreaComponent,
    DateComponent,
    YesNoComponent,
    NumericComponent,
    InspectionAcceptableNaComponent,
    TaskComponent,
    HelperComponent,
    CorrosionComponent,
    MeridiumInspectionComponent,
    NimiirnaComponent,
    DropdownComponent,
    MultiselectComponent,
    LinkComponent,
    InstructionComponent,
    ConditionComponent,
    OrganizationComponent,
    CheckpointComponent,
    TextWithUnitDropdownComponent,
    PercentSpanComponent,
    PassFailComponent,
    LeakTestComponent,
    YesNoCommentComponent,
    AsLeftAsFoundComponent,
    AsFoundAsLeftPassFailComponent,
    AsLeftAsFoundDropdownComponent,
    AsFoundPassFailSafeFailDangerous,
    LeakTestComponent,
    CalibrationPercentSpanComponent,
    ValveClosureComponent,
    AverageComponent,
    DifferenceComponent,
    RangeComponent,
    AtgType2Component,
    AtgType1Component,
    AtgType3Component,
    AtgType4Component,
    AtgType5Component,
    ChecklistComponent,
    TransmitterCalibrationRateComponent,
    EquipmentHierarchyComponent,
    HMIInfoComponent,
    AlarmSettingComponent,
    SatisfactoryUnsatisfactoryFailureCodeComponent,
    ThreePointCalibrationComponent,
    SwitchSetPointComponent,
    TransmitterValidationComponent,
    TransmitterTempValidationComponent,
    ValveResponseTestComponent,
    Api12TankComponent,
    LocalhmiCloseComponent,
    BasePassFailComponent,
    ValveOpenComponent,
    LocalhmiOpenComponent,
    SteamTurbineOstComponent,
    PressureValidationComponent,
    FailDirectionComponent,
    AnswerComponent,
    IeAlarmAndTripValidationComponent,
    CanvasEditPhotoComponent,
    SteamTurbineOstComponentTripTest,
    MultiAsleftasfoundComponent,
    InspectionJsonViewerComponent,
    DifferentialPressureComponent,
    TransmitterCalibrateThreePointComponent,
    TransmitterCalibrateTwoPointComponent,
    PercentErrWithSetPointComponent,
    InspectionSummaryDropdownComponent,
    PercentErrorWithInputsComponent,
    SummaryScrollComponent,
    DropdownSearchComponent,
    TmlDetailAddComponent,
    TmlDetailComponent,
    MeridiumDetailsComponent,
    TmlDetailMeridiumComponent,
    TmlDetailModalComponent
  ],
  imports: [
    CommonModule,
    InspectionRoutingModule,
    SharedModule,
    RouterModule,
    ReactiveFormsModule,
    WebcamModule,
    TranslateModule.forChild(),
    PipesModule,
    NgxJsonViewerModule,
    NgxMatSelectSearchModule
  ],
  providers: [DecimalPipe, AppDB],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InspectionModule { }
