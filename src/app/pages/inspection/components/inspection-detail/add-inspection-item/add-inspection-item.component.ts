import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router'
import { InspectionDetailsService } from '../../../services/inspection-details.service';
import { DomainModel } from 'src/app/core/models/local/domain.model';
import { InspectionResponse, WorkOrderList } from 'src/app/core/sync/entities';
import { db } from 'src/databases/db';
import { MatRadioChange } from '@angular/material/radio';
import * as dayjs from 'dayjs'
import { SettingsService } from 'src/app/core/services/app-settings.service';

@Component({
  selector: 'app-add-inspection-item',
  templateUrl: './add-inspection-item.component.html',
  styleUrls: ['./add-inspection-item.component.scss'],
})
export class AddInspectionItemComponent implements OnInit{
    itemType: Array<DomainModel> = [
        new DomainModel('comments', 'Comment'),
        new DomainModel('recommendation', 'Recommendation')
    ];
    sections: Array<any> = [];
    selectedSection: string = '';
    subSections: Array<any> = [];

    formGroup: FormGroup;
    inspectionResponse = new InspectionResponse();
    interface: string;
    private _workOrder = new WorkOrderList();
    woID: number;

    constructor(
        private activatedRoute: ActivatedRoute,
        private router: Router, 
        private inspectionDetailsService: InspectionDetailsService,
        private settingsService: SettingsService
    ){};

    async ngOnInit(){
        let id = this.activatedRoute.snapshot.paramMap.get('id');
        this._workOrder = await db.workOrderList.get(+id)
        this.woID = this._workOrder.id;
        this._createForm();
    }

    private _createForm(): void {
        this._fetchSections();
        this._fetchSubSections(this.selectedSection);
        
        this.formGroup = new FormGroup({
          type: new FormControl('recommendation', Validators.required),
          followUpWO: new FormControl(false),
          attention: new FormControl(false),
          section: new FormControl(this.selectedSection, Validators.required),
          subsection: new FormControl(''),
          title: new FormControl(null, Validators.required),
          comments: new FormControl(null, Validators.required),
          recommendation: new FormControl(null)
        });
    }

    public async save(){
        if(this.formGroup.valid){
            this.inspectionResponse.answer = this.formGroup.get('type').value === 'recommendation' ? 'IR' : 'MI';

            this.inspectionResponse.inspectionSection = this.formGroup.get('section').value;

            if (this.inspectionResponse.inspectionSection === 'Additional Items'){


                const sectionsSortIds = this._workOrder.inspectionResponses
                .filter(resp => resp.inspectionSection !== 'Additional Items').map(resp => resp.sectionSortId);

                const maxSectionSortId = Math.max.apply(Math, sectionsSortIds);
                
                this.inspectionResponse.sectionSortId = maxSectionSortId + 1;
                this.inspectionResponse.subsection = null;
                this.inspectionResponse.subSectionSortId = 1;
            }
            else{

                const sectionResponses =  this._workOrder.inspectionResponses.filter(resp => resp.inspectionSection === this.inspectionResponse.inspectionSection);

                if(sectionResponses && sectionResponses.length > 0){
                    this.inspectionResponse.sectionSortId = sectionResponses[0].sectionSortId;
                }

                if(this.formGroup.get('subsection').value === ''){
                    this.inspectionResponse.subsection = null;
                    this.inspectionResponse.subSectionSortId = 1;
                }
                else{
                    this.inspectionResponse.subsection = this.formGroup.get('subsection').value;

                    const subsectionResponses =  sectionResponses.filter(resp => resp.subsection === this.inspectionResponse.subsection);

                    if(subsectionResponses && subsectionResponses.length > 0){
                        this.inspectionResponse.subSectionSortId = subsectionResponses[0].subSectionSortId;
                    }
                }
            }

            this.inspectionResponse.id = null;
            this.inspectionResponse.attention = this.formGroup.get('attention').value;
            this.inspectionResponse.followUpWO = this.formGroup.get('followUpWO').value;
            this.inspectionResponse.question = this.formGroup.get('title').value;
            this.inspectionResponse.comments = this.formGroup.get('comments').value;
            this.inspectionResponse.recommendation = this.formGroup.get('recommendation').value;
            this.inspectionResponse.inspectionId = Number(this._workOrder.id);
            this.inspectionResponse.itemType = 2;
            this.inspectionResponse.isChanged = 'Y';
            this.inspectionResponse.displayComments = true;
            this.inspectionResponse.displayFollowUpWorkOrder = true;
            this.inspectionResponse.displayImmediateAttentionRequired = true;
            this.inspectionResponse.createdBy = this.settingsService.getUser().Email;
            this.inspectionResponse.createdDate = dayjs().format("YYYY-MM-DDTHH:mm:ss");
            this.inspectionResponse.questionId = 'ADHOC_' + Date.now();

            this._workOrder.inspectionResponses.push(this.inspectionResponse)

            await db.updateInspectionResponses(this.woID, this._workOrder.inspectionResponses)

            this.navigateBackToDetails()
        }
    }

    public navigateBackToDetails(){
        this.router.navigate(['/inspection', this.woID])
    }

    public _onSectionChange(): void {
        this._fetchSubSections(this.formGroup.get('section').value);
    }
    
    public _onTypeChange(event: MatRadioChange): void {
        if (event.value === 'comments') {
            this.formGroup.get('attention').setValue(false);
            this.formGroup.get('followUpWO').setValue(false);
            this.formGroup.get('recommendation').setValue(null);
        }
    }

    private async _fetchSections() {
        this.sections = await db.getInspectionSections(
          this._workOrder.id
        );
        if (this.sections.indexOf('Additional Items') == -1)
          this.sections.push('Additional Items');
      }
    
    private async _fetchSubSections(section: string) {
        this.subSections = await db.getSubSections(
            this._workOrder.id,
            section
        );

        if(this.subSections.length === 0){
            this.formGroup.get('subsection').disable();
        }
        else if (this.subSections.length === 1) {
            this.formGroup.get('subsection').setValue(this.subSections[0]);
            this.formGroup.get('subsection').disable();
        }
        else {
            this.formGroup.get('subsection').enable();
        }
    }
}