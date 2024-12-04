import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable, Subscription, of, switchMap } from 'rxjs';
import { WorkOrderList, InspectionResponse, EquipDetails, InspectionResponseImage } from 'src/app/core/sync/entities';
import { InspectionDetailsService } from '../../../services/inspection-details.service';
import { MIUtilities } from 'src/app/shared/utility';
import { SECTIONS } from 'src/app/core/enums/sections.enum';
import { SectionModel } from 'src/app/core/models/local/section.model';
import { SubSectionModel } from 'src/app/core/models/local/subsection.model';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { MatStepper } from '@angular/material/stepper';
import { MatDialog } from "@angular/material/dialog";
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import * as dayjs from 'dayjs';
import { db } from 'src/databases/db';
import { ErrorDialogService } from 'src/app/core/services/error.service';
import { LoadingIndicatorService } from 'src/app/core/services/loading-indicator.service';
import { EventService } from 'src/app/core/services/event.service';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';
import { SettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-detail-tab',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true },
    },
  ],
})
export class DetailComponent implements OnInit, OnDestroy {
  @Input() inspection: WorkOrderList;
  detailForm: FormGroup;
  sections: Array<SectionModel>;
  sectionsToDisplay: Array<SectionModel>;
  events = new Observable();
  equipDetails: EquipDetails[];
  stepperRendered: boolean = false;
  showControl: boolean = true;
  @ViewChild('stepper') private stepper: MatStepper;
  subscription = new Subscription();
  private hideSectionContents: boolean = false;

  constructor(
    private ref: ChangeDetectorRef,
    private inspectionDetailsService: InspectionDetailsService,
    private loadingIndicatorService: LoadingIndicatorService,
    private errorService: ErrorDialogService,
    public dialog: MatDialog,
    private eventService: EventService,
    private settingsService: SettingsService
  ) { }

  async ngOnInit() {
    this.inspectionDetailsService.workorder = this.inspection;
    this.getEquipDetails();
    await this.setupForm(false);
    this.inspectionDetailsService.detailStepper = this.stepper;

    this.subscription.add(
      this.eventService.getEvent('copy-question:done').subscribe((data) => {

        (async () => {
          console.log("data.res", data.res)
          await this.copyInspectionQuestion(data.res);
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
  }

  private async setupForm(fromCopySubsection: boolean) {
    console.log("setupform", fromCopySubsection)
    if (this.inspection) {
      await this.createForm(0, fromCopySubsection);

      this.sectionsToDisplay = this.sections?.filter(
        (section) => section.isShow
      );

      this.subscription.add(
        this.eventService.getEvent("validateConditialExpression").subscribe(async (inspection: InspectionResponse) => {
          await this.validateConditialExpression(inspection);
        }));
    }
    this.ref?.markForCheck();
  }

  @HostListener('unloaded')
  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.sections = null;
    this.sectionsToDisplay = null;
    this.detailForm = null;
    this.equipDetails = null;
    this.eventService = null;
  }


  getEquipDetails() {
    this.equipDetails = this.inspection.eqDetails ?
      this.inspection.eqDetails :
      [];

  }

  displaySubSection(subsection: SubSectionModel) {
    return (
      subsection.responses &&
      !!subsection.responses.find((inspection) => inspection.isShow)
    );
  }

  async copyInspectionQuestion(response) {
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
    this.setupForm(true);
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
      (this.detailForm.get(section.title) as FormGroup).removeControl(response.questionId);
      this.ref?.markForCheck();
    }
    catch (error) {
      console.log('ERROR REMOVING INSPECTION ITEM', error)
    }
  }

  //prompt user if they are certain they want to copy, and if so, ask if they also want to copy the answers
  public copySubsectionPrompts(sectionIndex: number, subsectionIndex: number) {
    let section = this.sectionsToDisplay[sectionIndex];
    let subsection = section.subSections[subsectionIndex];

    this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: { title: 'inspection.copySubsection', content: 'inspection.confirmCopy', showYesButton: true, showNoButton: true },
      panelClass: 'custom-dialog'
    }).afterClosed()
      .pipe(
        switchMap((value) => {
          if (value) {
            return this.dialog.open(PromptInfoComponent, {
              width: '350px',
              data: { title: 'inspection.copyAnswer', content: 'inspection.confirmAnswerCopy', showYesButton: true, showNoButton: true },
              panelClass: 'custom-dialog'
            }).afterClosed()
          }
          else {
            return of(null)
          }
        })
      )
      .subscribe((copyAnswer) => {
        if (copyAnswer != null) {//null = don't copy, false = copy questions only, true = copy questions and answers
          this.doCopy(section, subsection, copyAnswer)
        }
      })
  }

  //perform the subsection copy
  private async doCopy(section: SectionModel, subsection: SubSectionModel, copyAnswer: boolean) {
    console.log("do copy start")
    if (subsection?.title) { //if subsection and title are valid
      this.loadingIndicatorService.show()
      this.inspection.inspectionResponses = await db.getInspectionResponses(this.inspection.id); // Get the latest update of inspection responses
      try {
        let newTitle = this.generateNewTitle(section, subsection);

        for (let res of subsection.responses) {
          
          let originalRes: InspectionResponse = this.inspection.inspectionResponses
          .find(r => r.inspectionSection == res.inspectionSection
            && r.subsection == res.subsection 
            && r.questionId == res.questionId);

          let newres: InspectionResponse = JSON.parse(JSON.stringify(originalRes)); //copy without reference
          let newImages: Array<InspectionResponseImage> = await db.getImagesByResponseId(newres.id);

          newres.subsection = newTitle;
          newres.ai_id = null;
          newres.id = null;
          newres.questionId = res.questionId + "_" + newTitle.replace(/ /g, '').trim();
          newres.isChanged = 'Y';
          newres.displayCopy = false;
          newres.createdDate = dayjs().format("YYYY-MM-DDTHH:mm:ss");
          newres.createdBy = this.settingsService.getUser().Email;
          newres.recommendation = "";
          newres.followUpWO = false;
          newres.circuitPiping = "";
          newres.attention = false;
          newres.subCopy = true;
          newres.subSectionSortId = section.getMaxSubSectionSortId() + 1;

          if (!copyAnswer) {
            newres.answer = null;
            newImages = new Array<InspectionResponseImage>();
            newres.comments = "";
            
            if (newres.displayNA) {
              newres.isNA = false;
            }
          }
          else if(copyAnswer && newImages && newImages.length > 0){
            newImages.forEach((image, index) => {
              image.isChanged = 'Y';
              image.inspectionResponseQuestionId = newres.questionId;
              image.inspectionItemCode = newres.questionId;
              image.serverId = "NS_" + Date.now() + "_" + index;
              image.fileName = newres.inspectionId + "_" + newres.questionId + "_" + Date.now() + "_" + index;
              image.inspectionResponseId = null;
            });
          }

          this.inspection.inspectionResponses.push(newres);
        }

        // Here we are adding the images separately
        await db.updateInspectionResponses(this.inspection.id, this.inspection.inspectionResponses);
        this.setupForm(true);
        this.dialog.open(PromptInfoComponent, {
          width: '350px',
          data: { title: 'debug.alert', content: 'inspection.successfullyCopied', showOkButton: true },
          panelClass: 'custom-dialog'
        })
        this.loadingIndicatorService.hide();
      }
      catch (err) {
        this.loadingIndicatorService.hide();
        this.errorService.openDialog('inspection.copySubsectionFailed', err.message);
        console.error(err)
      }
    }
    else {
      this.errorService.openDialog('inspection.copySubsectionFailed', 'invalid subsection or subsection title')
    }
  }

  public removeSubsectionPrompts(sectionIndex: number, subsectionIndex: number) {
    let subsection = this.sectionsToDisplay[sectionIndex].subSections[subsectionIndex];

    this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: { title: 'inspection.removeSubsection', content: 'inspection.confirmRemove', showYesButton: true, showNoButton: true },
      panelClass: 'custom-dialog'
    }).afterClosed()
      .subscribe((removeAnswer) => {
        if (removeAnswer) {
          this.doRemove(subsection)
        }
      })
  }

  private async doRemove(subsection: SubSectionModel) {
    if (subsection?.title) {
      this.loadingIndicatorService.show()
      try {
        this.inspection.inspectionResponses = this.inspection.inspectionResponses.filter(response => response.subsection != subsection.title) //filter out items that match the subsection title
        // here..
        const resIdAndQIdArray = subsection.responses.map(item => ({
          resId: item.id,
          qId: item.questionId
        }));
        const onlyServerResponses = resIdAndQIdArray
          .filter(res => res.resId && res.resId !== 0)
          .map(({ resId }) => `${resId}`)
          .join(",");
        let delIds = '';
        const existingDelRespIds = localStorage.getItem("delRespIds");
        if (!MIUtilities.isNullOrUndefinedObject(existingDelRespIds)) {
          delIds = `${existingDelRespIds},${onlyServerResponses}`;
        } else {
          delIds = onlyServerResponses;
        }
        await db.updateInspectionResponses(this.inspection.id, this.inspection.inspectionResponses);
        localStorage.setItem("delRespIds", delIds);
        this.setupForm(true);
        this.dialog.open(PromptInfoComponent, {
          width: '350px',
          data: { title: 'debug.alert', content: 'subsection has been removed', showOkButton: true },
          panelClass: 'custom-dialog'
        })
        this.loadingIndicatorService.hide();
      }
      catch (err) {
        this.loadingIndicatorService.hide();
        this.errorService.openDialog('Remove subsection failed', err.message);
        console.error(err)
      }
    }
    else {
      this.errorService.openDialog('Remove subsection failed', 'invalid subsection or subsection title')
    }
  }

  //generate new title for copy subsection
  private generateNewTitle(section: SectionModel, subsection: SubSectionModel): string {
    let titlePrefix: string;
    let titleMatches: SubSectionModel[];
    const regex = /\s(\d+)$/; // ends with a space character and numbers

    titlePrefix = subsection.title;
    const subsectionTitleMatch = regex.exec(subsection.title);

    if(subsectionTitleMatch){
      titlePrefix = titlePrefix.slice(0, subsectionTitleMatch.index);
    }

    titleMatches = section.subSections.filter(subsection => subsection.title?.includes(titlePrefix) && subsection.responses?.some(response => response.subCopy)); //find subsections that were copied

    let biggestNum = 0; //biggest number represents the biggest existing number on a matching subsection
    //ie, if theres title 01, title 02, title 03, biggest number should be 03

    if(titleMatches.length > 0){
      const lastCopiedSubsection = titleMatches[titleMatches.length - 1];

      if(lastCopiedSubsection){
        const matchNumber = regex.exec(lastCopiedSubsection.title);

        if(matchNumber){
          biggestNum = Number(matchNumber[1]);
        }
      }

    }

    //return new title
    if (biggestNum < 9) {
      return titlePrefix + " 0" + String(biggestNum + 1);
    }
    else {
      return titlePrefix + " " + String(biggestNum + 1);
    }

  }

  async createForm(selected: number = 0, fromCopy: boolean = false): Promise<boolean> {
    console.log("this.createForm");
    if (selected === this.stepper?.selectedIndex && !fromCopy) return false;

    this.detailForm = undefined;
    try {
      await this.inspectionDetailsService.getInspectionBySections(this.inspection);
      this._prepareDetailsPage(selected, fromCopy);
    } catch (error) {
      console.error("Error getting inspection by sections:", error);
      return false;
    }

    return true;
  }

  private _prepareDetailsPage(selected: number, fromCopy: boolean = false) {
    this.sections = this.inspectionDetailsService.filterSection(
      SECTIONS.General,
      true
    );
    this.detailForm = this.inspectionDetailsService.form;
    let idx: number = -1;
    let index: number = -1;
    if (this.sections?.length > 0 && !fromCopy) {
      this.sections.forEach((section) => {
        if (idx == -1) {
          section.subSections.forEach((subsection) => {
            idx = subsection.responses.findIndex((ins) => ins.isShow);
          });
          index++;
        }
      });
    }
    if (this.sections?.length > 0) {
      this.sections?.forEach((section) => {
        const formGroup = this.detailForm?.get([section.title]);
        section.status =
          !MIUtilities.isNullOrUndefinedObject(formGroup) &&
          !MIUtilities.isNullOrUndefined(formGroup.status) &&
          (formGroup.status === 'VALID' || formGroup.status === 'DISABLED') &&
          !this.validateHelpersBySection(section);
       

        if (
          !MIUtilities.isNullOrUndefinedObject(formGroup) &&
          !MIUtilities.isNullOrUndefinedObject(formGroup.statusChanges)
        ) {
            formGroup.statusChanges.subscribe((status: string) => {
              section.status =
                this.isStatusValidBasedOnInsVisibility(section) ||
                ((status === 'VALID' || status === 'DISABLED') &&
                  !this.validateHelpersBySection(section));
            });
        }
      });
    }
    this.ref.detectChanges();
  }

  private isStatusValidBasedOnInsVisibility(section: SectionModel): boolean {
    let flag = true;
    section.subSections.forEach((subsection) => {
      const inspections = subsection.responses.filter(
        (i) =>
          i.isShow &&
          this.detailForm?.get([section.title, i.questionId]).status == 'INVALID'
      );
      if (flag && inspections && inspections.length > 0) {
        flag = false;
      }
    });
    return flag;
  }


  private validateHelpersBySection(section: SectionModel) {
    let sectionHasError = false;
    section.subSections.forEach((subsection) => {
      const inspections = subsection.responses.filter(
        (i) =>
          (i.followUpWO || i.attention) &&
          MIUtilities.isNullOrUndefined(i.comments)
      );
      if (inspections && inspections.length > 0) {
        sectionHasError = true;
      }
    });
    return sectionHasError;
  }

  stepperChanged(stepper: MatStepper) {
    if (this.stepperRendered)
      this.scrollToStepByIndex(stepper.selectedIndex);
    else // so it doesnt scroll on initial load
      this.stepperRendered = true;
  }

  scrollToStepByIndex(i: number) {
    const identifier = `section-anchor-${i}`;
    document.getElementById(identifier).scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "nearest"
    });
  }

  private async validateConditialExpression(inspection: InspectionResponse) {
    try {
       let allQuestionIds: any[] = [];
       if (!MIUtilities.isNullOrUndefinedObject(this.inspectionDetailsService.sections)) {
        this.inspectionDetailsService.sections.forEach(sec => {
           sec.subSections.forEach(subSec => {
            subSec.responses.forEach(response => allQuestionIds.push({questionId : response.questionId, answer : response.answer}));
           });
         });
       }
       if (!MIUtilities.isNullOrUndefinedObject(this.sections)) {

        //this.inspection.inspectionResponses = await db.getInspectionResponses(this.inspection.id); // Get the latest update of inspection responses
        // commenting out this above line as inspectionResponse already holds the updated value, but triggerring this function brings the old record and updating the inspectionresponse with old one.
        let updatedResponses = false;

         this.sections.forEach(async section => {
           if (!MIUtilities.isNullOrUndefinedObject(section.subSections)) {

             section.subSections.forEach(subsection => {

               const hasConditional = subsection.responses.filter(i => i.conditionalExpression && i.conditionalExpression.indexOf(`${inspection.questionId}=`) > -1);

               if (hasConditional) {

                 hasConditional.
                 forEach(async i => {

                    i.isShow = InspectionResponse.evalConditionalExpression(
                      i,
                      allQuestionIds
                    );

                     const sectionForm = this.detailForm.get(i.inspectionSection);
                     this.settingsService.set('emit','no');
                     try {
                       if (i.isShow === true) {
                         if (this && this.detailForm && this.detailForm.get([i.inspectionSection, i.questionId])) {
                           if (i.itemType == QUESTIONTYPES.PASSFAIL) {
                             this.detailForm.get([i.inspectionSection, i.questionId]).setValue({ 'pass-fail': '', failure: '' });
                           } else if (i.itemType == QUESTIONTYPES.MULTISELECT) {
                             let frm = this.detailForm.get([i.inspectionSection, i.questionId]);
                             console.log(frm);
                             let arr = [];
                             if (i.options) {
                               for (let idx = 0; idx < i.options.length; idx++) {
                                 arr.push({ Value: "" });
                               }
                             }
                             this.detailForm.get([i.inspectionSection, i.questionId]).patchValue(arr);
                           } else {
                             this.detailForm.get([i.inspectionSection, i.questionId]).setValue(null);
                           }
                         }
                         if (this && this.detailForm && this.detailForm.get([i.inspectionSection, i.questionId])) {
                           this.detailForm.get([i.inspectionSection, i.questionId]).enable();
                         }
                         if (this.displaySection(this.sections[i.inspectionSection])) {
                           sectionForm.enable({ onlySelf: true, emitEvent: false });
                         }
                         this.settingsService.set('emit',null);
                       } else {
                         if (this && this.detailForm && this.detailForm.get([i.inspectionSection, i.questionId])) {
                           console.log("DISABLING THE QUESTION ID>> " + i.questionId);
                           this.detailForm.get([i.inspectionSection, i.questionId])?.disable();
                           i.answer = ""; // clear the answer when sending to web
                           if(this.detailForm.get([i.inspectionSection, i.questionId])?.value) {                              
                              await this.validateConditialExpression(i); // Recursive - When the parent question value changes , it should affect not only its immediate dependent but also the nested dependent question.
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
                         if (!this.displaySection(this.sections[i.inspectionSection])) {
                           sectionForm.disable({ onlySelf: true, emitEvent: false });
                         }
                         this.settingsService.set('emit',null);
                       }
 
                     } catch (err) {
                       console.warn('[Validate Cond Exp] Could not eval dependencies');
                       console.error(err);
                     }
                   })
               }
             });

           }
         });

         if(updatedResponses){
          await db.updateInspectionResponses(this.inspection.id, this.inspection.inspectionResponses);
         }

       }

       this.sectionsToDisplay = this.sections?.filter(
        (section) => section.isShow
        );

       this.ref?.detectChanges(); // To detect the updated sections manually 

     }
     catch (err) {
      console.warn('[Validate Cond Exp] Could not eval dependencies');
      console.error(err);
     }
   }


  displaySection(section) {
    return section === undefined || section.isShow;
  }

  public displaySectionContents(): boolean {
    return !this.hideSectionContents;
  }

  public toggleHideSection(currentSectionIndex : number, newSectionIndex: number): void {
    if(currentSectionIndex == newSectionIndex) {
      this.hideSectionContents = !this.hideSectionContents;
    }
    else {
      this.hideSectionContents = false;
    }
  }
}
