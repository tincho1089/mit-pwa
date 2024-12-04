import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef, Input, HostListener } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { FormControl, FormGroup } from "@angular/forms";
import { WorkOrderList } from "src/app/core/sync/entities/work-order-list";
import { SectionModel } from "src/app/core/models/local/section.model";
import { InspectionDetailsService } from "../../../services/inspection-details.service";
import { SECTIONS } from "src/app/core/enums/sections.enum";
import { InspectionResponse, EquipDetails } from "src/app/core/sync/entities";
import { MIUtilities } from "src/app/shared/utility";
import { QUESTIONTYPES } from "src/app/core/enums/question-types.enum";
import { db } from "src/databases/db";
import { EventService } from "src/app/core/services/event.service";
import { SettingsService } from "src/app/core/services/app-settings.service";
import dayjs from "dayjs";
import { MatDialog } from "@angular/material/dialog";
import { PromptInfoComponent } from "src/app/core/components/promptInfo/promptInfo.component";
import { Subscription } from "rxjs";

@Component({
  selector: "app-general-tab",
  templateUrl: "./general.component.html",
  styleUrls: ['./general.component.scss'],
})
export class GeneralComponent implements OnInit, OnDestroy {
  @ViewChild("generalContentRef", { static: false }) generalContentRef: ElementRef;
  @Input() inspection: WorkOrderList;
  workOrder = new WorkOrderList();
  sections: Array<SectionModel>;
  generalForm: FormGroup;
  os: string;
  equipDetails: EquipDetails[];
  subscription = new Subscription();

  constructor(
    private route: ActivatedRoute, 
    private inspectionDetailsService: InspectionDetailsService, 
    private cdr: ChangeDetectorRef,
    private eventService: EventService,
    private settingsService: SettingsService,
    public dialog: MatDialog
  ) { }

  @HostListener('unloaded')
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.cdr.detach();
    this.inspectionDetailsService = null;
    this.eventService = null;
    this.workOrder = null;
    this.sections = null;
    this.equipDetails = null;
  }

  ngOnInit() {
    this.getEquipDetails();
    this.route.params.subscribe((params) => {
      const workOrderId = params["id"];
      if (workOrderId) {
        this.inspectionDetailsService
        .getInspectionBySections(this.inspection)
        .then( () => {
          this.getInspectionResponse();
        });
      }
    });

    this.subscription.add(
      this.eventService.getEvent('copy-question:done').subscribe((data) => {
        (async () => {
          await this.copyInspectionQuestion(data.res);
          this.getInspectionResponse();
          this.dialog.open(PromptInfoComponent, {
            data: {
              showOkButton: true,
              title: 'helper.copyingInspection',
              content: 'helper.successfullyCopied',
            },
            panelClass: 'custom-dialog',
          });
        })();
      })
    );

    this.subscription.add(
      this.eventService
        .getEvent('remove-copied-question:done')
        .subscribe((data) => {
          if (data.status === 'remove')
            this.onRemoveInspectionResponse(data.inspection);
        })
    );

    this.subscription.add(
      this.eventService
        .getEvent('validateConditialExpressionGeneral')
        .subscribe(async (inspection: InspectionResponse) => {
          await this.validateConditialExpression(inspection);
        })
    );
  }

  async copyInspectionQuestion(response){
    let copyResponse: InspectionResponse = { ...response };
    // Modify properties as needed
    copyResponse.ai_id = undefined;
    copyResponse.id = null;
    copyResponse.questionId = response.questionId + "-copy-" + Date.now();
    copyResponse.isChanged = "Y";
    copyResponse.displayCopy = false;
    copyResponse.createdDate = dayjs().format("YYYY-MM-DDTHH:mm:ss");
    copyResponse.createdBy = localStorage.getItem("Email");
    copyResponse.comments = "";
    copyResponse.recommendation = "";
    copyResponse.followUpWO = false;
    copyResponse.circuitPiping = "";
    copyResponse.attention = false;
    this.inspection.inspectionResponses.push(copyResponse);
    await db.updateInspectionResponses(this.inspection.id, this.inspection.inspectionResponses);
    this.inspectionDetailsService
    .getInspectionBySections(this.inspection)
    .then( () => {
      this.getInspectionResponse()
    });
  }

  private async onRemoveInspectionResponse(response: InspectionResponse) {
    try {
      const respIndex = this.inspection.inspectionResponses.findIndex((resp) => resp.questionId === response.questionId);

      if (respIndex > -1) {
        this.inspection.inspectionResponses.splice(respIndex, 1);
      }

      const section = this.sections.find(e => e.title === response.inspectionSection);
      const subSection = section.subSections.find(e => e.title === response.subsection ||
        (e.title === "" && response.subsection === null));
      const index = subSection.responses.findIndex(e => e.questionId === response.questionId);
      subSection.responses.splice(index, 1);
      (this.generalForm.get(section.title) as FormGroup).removeControl(response.questionId);
      this.cdr.markForCheck();
    }
    catch (error) {
      console.log('ERROR REMOVING INSPECTION ITEM', error)
    }
  }

  scrollToTop() {
    if (this.generalContentRef?.nativeElement) {
      this.generalContentRef.nativeElement.scrollTo(0, 0);
    }
  }

  async getInspectionResponse() {
    this.sections = this.inspectionDetailsService.filterSection(
      SECTIONS.General,
      false
    );
    this.generalForm = this.inspectionDetailsService.form;
    setTimeout(() => {
      this.scrollToTop();
    });
  }
  async getEquipDetails() {
    this.equipDetails = this.inspection.eqDetails ?
      this.inspection.eqDetails:
      [];

  }

  public shouldRender(inspection) {
    let questionID = inspection.conditionalExpression ? inspection.conditionalExpression.split("=")[0] : "";
    const section = this.sections ? this.sections.find(s => s.title === inspection.inspectionSection) : null;
    const subSection = section?.subSections?.find(
      e => e.title === inspection.subsection || (e.title === "" && inspection.subsection === null)
    ) ?? null;    
    const question = subSection?.responses?.find(q => q.questionId === questionID) ?? null;
    let answer = "";
    if (question) {
      answer = `${question.questionId}=${question.answer}`
    }
    return !(inspection?.conditionalExpression) || inspection.conditionalExpression === answer;
  }

  private async validateConditialExpression(inspection: InspectionResponse) {
    //try {
    let allInspections: InspectionResponse[] = [];
    let allSections: SectionModel[] = this.inspectionDetailsService.sections;
    if (!MIUtilities.isNullOrUndefinedObject(allSections)) {
      allSections.forEach(sec => {
        sec.subSections.forEach(subSec => {
          allInspections.push(...subSec.responses);
        });
      });
    }
    const hasConditional = allInspections.filter(i => i.conditionalExpression.indexOf(`${inspection.questionId}=`) > -1);
    if (hasConditional) {
      
      //this.inspection.inspectionResponses = await db.getInspectionResponses(this.inspection.id); // Get the latest update of inspection responses
      // commenting out this above line as inspectionResponse already holds the updated value, but triggerring this function brings the old record and updating the inspectionresponse with old one.
      let updatedResponses = false;

      for (const i of hasConditional) { 
        i.isShow = InspectionResponse.evalConditionalExpression(
          i,
          allInspections
        );
        this.settingsService.set('emit','no');
        try {
          if (this.generalForm) {
            if (i.inspectionSection == "General") {
              if (i.isShow === true) {
                if (this && this.generalForm && this.generalForm.get([i.inspectionSection, i.questionId])) {
                  if (i.itemType == QUESTIONTYPES.PASSFAIL) {
                    this.generalForm.get([i.inspectionSection, i.questionId]).setValue({ 'pass-fail': '', failure: '' });
                  } else if (i.itemType == QUESTIONTYPES.MULTISELECT) {
                    let frm = this.generalForm.get([i.inspectionSection, i.questionId]);
                    console.log(frm);
                    let arr = [];
                    if (i.options) {
                      for (let idx = 0; idx < i.options.length; idx++) {
                        arr.push({ Value: "" });
                      }
                    }
                    this.generalForm.get([i.inspectionSection, i.questionId]).patchValue(arr);
                  } else {
                    this.generalForm.get([i.inspectionSection, i.questionId]).setValue(null);
                  }
                }
                if (this && this.generalForm && this.generalForm.get([i.inspectionSection, i.questionId])) {
                  this.generalForm.get([i.inspectionSection, i.questionId]).enable();
                }
                this.cdr.markForCheck();
                this.cdr.detectChanges();
                this.settingsService.set('emit',null);
              }
              else {
                this.generalForm.get([i.inspectionSection, i.questionId]).disable({ onlySelf: true, emitEvent: false });
              }
              this.generalForm.setValidators(this.generalForm.validator ? [this.generalForm.validator, this.validateHelpers.bind(this, i)] : [this.validateHelpers.bind(this, i)]);
              this.cdr.markForCheck();
              this.cdr.detectChanges();
            }
            if (i.isShow === false) {
              i.isChanged = "Y";
              i.answer = null;
              if(this.generalForm.get([i.inspectionSection, i.questionId])?.value) { 
                await this.validateConditialExpression(i);
              }

              const dbResponse = this.inspection.inspectionResponses.find(response => response.questionId == i.questionId && response.id == i.id);

              if(dbResponse){
                dbResponse.answer = i.answer;
                dbResponse.isChanged = 'Y';
                dbResponse.comments = i.comments;
                dbResponse.attention = i.attention;
                dbResponse.circuitPiping = i.circuitPiping;
                dbResponse.recommendation = i.recommendation;
                dbResponse.followUpWO = i.followUpWO;
                dbResponse.isShow = i.isShow;
                dbResponse.isNA = i.isNA;
                dbResponse.createdDate = dayjs().format('YYYY-MM-DDTHH:mm:ss');
                dbResponse.createdBy =  localStorage.getItem("Email");
                updatedResponses = true;

              }

            }
          }
        }
        catch (error) {
          console.warn('[Validate Cond Exp] Could not eval dependencies');
          console.error(error);
        }
      }

      if(updatedResponses){
        await db.updateInspectionResponses(this.inspection.id, this.inspection.inspectionResponses);
       }
    }
    this.settingsService.set('emit',null);
  }

  private validateHelpers(i: InspectionResponse, control: FormControl) {
    if (control.status === "VALID") {
      try {
        let section = null;
        let subsection = null;
        let inspection = null;
        if (this.sections) {
          section = this.sections.find(e => e.title === i.inspectionSection);
        }
        if (section?.subsections) {
          subsection = section.subSections.find(e =>
            e.title === i.subsection || 
            (e.title === "" && i.subsection === null)
          )
        }
        if (subsection?.responses) {
          inspection = subsection.responses.find(e => e.questionId === i.questionId);
        }

        if (inspection && (inspection.followUpWO || inspection.attention) && MIUtilities.isNullOrUndefined(inspection.comments))
          return { hasError: true };
      }
      catch { }
      return null;
    } else if (i.isShow == false) {
      console.log("FALSE SHOW>>>" + i.questionId);
      return null;
    }
    return { hasError: true };
  }

}
