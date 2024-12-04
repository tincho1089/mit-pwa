import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { SectionModel } from 'src/app/core/models/local/section.model';
import { WorkOrderList, EquipDetails, InspectionResponseImage } from 'src/app/core/sync/entities';
import { MIUtilities } from 'src/app/shared/utility';
import { InspectionDetailsService } from '../../../services/inspection-details.service';
import { LoadingIndicatorService } from 'src/app/core/services/loading-indicator.service';
import dayjs from 'dayjs';
import { db } from 'src/databases/db';
import { MatDialog } from '@angular/material/dialog';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from 'src/app/core/services/shared.service';
import { Router } from '@angular/router';
import { InspectionSummaryDropdownComponent } from '../inspection-summary-dropdown/inspection-summary-dropdown.component';
import { Subject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-summary-tab',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
})
export class SummaryComponent implements OnInit, OnDestroy {
  @Input() inspection: WorkOrderList;
  summaryForm: FormGroup;
  sections: Array<SectionModel> = [];
  os: string = null;
  allCommentsString: string;
  enableFlag: boolean;
  equipDetails: EquipDetails[];
  selectedOption: string ='';
  private userInputSubject = new Subject<any>();
  inspectionImages: Array<InspectionResponseImage> = [];
  
  constructor(
    private inspectionDetailsService: InspectionDetailsService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private sharedService: SharedService,
    private router: Router
  ) {}

  openDialog() {
    let option1, option2, option3;
    this.translate
    .get([
      'summary.eqoption1',
      'summary.eqoption2',
      'summary.eqoption3'
    ])
    .subscribe((values) => {
      option1 = values['summary.eqoption1'];
      option2 = values['summary.eqoption2'];
      option3 = values['summary.eqoption3'];
    });
    const dialogRef = this.dialog.open(InspectionSummaryDropdownComponent, {
      width: '380px',
      data: { options: [option1, option2, option3] }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.selectedOption = result;
        console.log("this.inspection")
        console.log(this.inspection)
        this.inspection.summary = result;
         db.updateWorkOrder(this.inspection);
        // Do something with the selected option
      }
    });
  }

  async ngOnInit() {
    await this.getEquipDetails();
    this.summaryForm = null;
    await this.createForm();
  }

  ngAfterViewInit(): void
  {
    this.userInputSubject.pipe(debounceTime(1000)) 
    .subscribe((inspection) => {
      this.handleInspectionSummaryAndCommentsOnChange(inspection);
    });
  }

  @HostListener('unloaded')
  ngOnDestroy() {
    this.inspection = null;
    this.sections = null;
    this.summaryForm = null;
    this.equipDetails = null;
    this.sharedService = null;
    this.allCommentsString = null;
    this.inspectionImages = null;
  }

  handleInspectionSummaryAndCommentsOnChange (inspection: WorkOrderList)
  {
    inspection.summaryComments = inspection.summaryComments.replace(
      '<',
      ''
    );
    inspection.summaryComments = inspection.summaryComments.replace(
      '>',
      ''
    );
    db.updateWorkOrder(inspection);
  }

  // fire after the user is done changing
  async onCommentChanges() {
    this.userInputSubject.next(this.inspection);
  }

  // fire after the user is done changing
  async onSummaryChanges() {
    this.userInputSubject.next(this.inspection);
  }

  async finish() {

    this.sharedService.loadIndicatorSvc.show();
    // note the below WO will not be in sync with indexedDB.
    let workOrder = this.inspectionDetailsService.workorder;
    await db.workOrderList.update(workOrder.id,{
      aiInternalStatus: 2,
      aiDateCompleted : dayjs().format('YYYY-MM-DDTHH:mm:ss')
    });
    this.sharedService.loadIndicatorSvc.hide();
    this.router.navigateByUrl('/home');
    this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: {
        showOkButton: true,
        title: 'Sync',
        content: 'The inspection has been completed. Sync to apply your changes.'
      },
      panelClass: 'custom-dialog',
    });

    // mark as uploadable after clicking 'finish inspection', so that it gets uploaded even
    // if there were no changes to the responses. we need this so that it will change the status in the server
    await db.setInspectionUpdated(this.inspection.id);
  }

  async getEquipDetails() {
    this.equipDetails = this.inspection.eqDetails ?
      this.inspection.eqDetails:
      [];

  }

  private async createForm() {
    let workOrderFailure = '';
    await this.translate
      .get(['commons.workOrderFailure', 'commons.ok'])
      .subscribe((values) => {
        workOrderFailure = values['commons.workOrderFailure'];
      });
    this.sections = [];
    this.summaryForm = undefined;
    let subFlag: boolean = false;
    this.enableFlag = true;
  
    await this.inspectionDetailsService
      .getInspectionBySections(this.inspection, true)
      .then(async () => {
        this.summaryForm = this.inspectionDetailsService.form;
        this.sections = this.inspectionDetailsService.sections;
        // Fetching all images in a single call to Dexie is more efficient than retrieving them response by response.
        this.inspectionImages = await db.getImagesByWorkOrderId(this.inspection.id);

        if (this.sections) {
          this.sections.forEach((section) => {
            if (MIUtilities.displaySection(section)) {
              const summaryFormGroup = this.summaryForm.controls[section.title];
              section.subSections.forEach((subsection) => {
                subFlag = false;
                for (let i = 0; i < subsection.responses.length; i++) {
                  let insObj = subsection.responses[i];
                  if (insObj.isShow === true) {
                    subFlag = true;
                    break;
                  }
                }
                if (subFlag) {
                  subsection.isShow = subFlag;
                }

                // Validate Helpers for Required Comments
                const inspections = subsection.responses.filter(
                  (i) =>
                    (i.followUpWO || i.attention) &&
                    MIUtilities.isNullOrUndefined(i.comments)
                );
                if (inspections && inspections.length > 0) {
                  this.enableFlag = false;
                }
              });
              if (
                !MIUtilities.isNullOrUndefinedObject(summaryFormGroup) &&
                !(
                  summaryFormGroup.status === 'VALID' ||
                  summaryFormGroup.status === 'DISABLED'
                ) &&
                this.enableFlag
              ) {
                this.enableFlag = false;
              }
            }
          });

        this.sharedService.loadIndicatorSvc.hide();

        }
      })
      .catch((error) => {
        this.sharedService.loadIndicatorSvc.hide();

        this.dialog.open(PromptInfoComponent, {
          width: '350px',
          data: {
            showOkButton: true,
            title: workOrderFailure,
            content: error['message']
              ? error['message']
              : JSON.stringify(error),
          },
        });
      });
  }

  async loadAllComments() {
    this.allCommentsString = '';

    for (let i = 0; i < this.sections.length; i++) {
      for (let j = 0; j < this.sections[i].subSections.length; j++) {
        for (
          let k = 0;
          k < this.sections[i].subSections[j].responses.length;
          k++
        ) {
          if (this.sections[i].subSections[j].responses[k]) {
            let tmpContain = '';
            if (
              this.sections[i].subSections[j].responses[k].comments &&
              this.sections[i].subSections[j].responses[k].comments != ''
            ) {
              tmpContain =
                this.sections[i].subSections[j].responses[k].comments + '\r\n';
              this.allCommentsString += tmpContain;
            }
          }
        }
      }
    }
    if (this.allCommentsString != '') {
      this.inspection.summaryComments = this.allCommentsString;
    }
  }

  async previewPDF() {
    await this.sharedService.previewPDF(this.inspection, true);
  }
}
