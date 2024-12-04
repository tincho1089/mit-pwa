import { Component, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WorkOrderList } from 'src/app/core/sync/entities';
import { db } from 'src/databases/db';
import { InspectionDetailsService } from '../../services/inspection-details.service';
import { Subscription } from 'rxjs';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { MIUtilities } from 'src/app/shared/utility';
import { ENV } from 'src/environments/environment';
import { SharedService } from 'src/app/core/services/shared.service';

@Component({
  selector: 'app-inspection-detail',
  templateUrl: './inspection-detail.component.html',
  styleUrls: ['./inspection-detail.component.scss'],
})
export class InspectionDetailComponent implements OnInit, OnDestroy {
  workOrder: WorkOrderList;
  subscription = new Subscription();
  _selectedProjectIndex: number;
  _previousSelectedTabIndex: number;
  pages: Array<string> = ['wo/equip','general','detail','summary'];

  get selectedProjectIndex() {
    return this._selectedProjectIndex;
  }
  set selectedProjectIndex(value: number) {
    this._previousSelectedTabIndex = this._selectedProjectIndex;
    this._selectedProjectIndex = value;
  }
  get previousSelectedTabIndex() {
    return this._previousSelectedTabIndex;
  }

  get equipmentTitleLabel(): string {
    const equipmentCode: string = this.inspectionDetailsService.workorder.equipmentCode;
    const equipmentDescription: string = this.inspectionDetailsService.workorder.equipmentDescription;
    return MIUtilities.isNullOrUndefined(equipmentCode) ? equipmentDescription : equipmentCode;
  }

  constructor(
    public viewContainerRef: ViewContainerRef,
    private route: ActivatedRoute,
    public inspectionDetailsService: InspectionDetailsService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private sharedService: SharedService
  ) {
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    if (!this.inspectionDetailsService.workorder)
    {
      this.inspectionDetailsService.workorder = await db.workOrderList
      .where('id')
      .equals(parseInt(id))
      .first();
    }
  }
  
  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.inspectionDetailsService.setActivePage(null);
    this.inspectionDetailsService.workorder = null;
    this.inspectionDetailsService.inspectionImage = null;
    this.inspectionDetailsService.inspectionImages = null;
    this.inspectionDetailsService.sections = null;
    this.inspectionDetailsService.visionsSettings = null;
    this.inspectionDetailsService = null;
  }

  changeProjectTab(event) {
    if (event.index > 1) {
      if (this.inspectionDetailsService?.form?.get("General")) {
        const status = this.inspectionDetailsService.form.get("General").status;
        console.log("GENERAL STATUS>>" + status);
        let validationFailure = "";
        let completeQuestions = "";
        this.translate.get(['tabs.validationFailure', 'tabs.completeQuestions', 'commons.ok']).subscribe(values => {
          validationFailure = values['tabs.validationFailure'];
          completeQuestions = values['tabs.completeQuestions'];
        });
        if (status === "INVALID") {        
          this.dialog.open(PromptInfoComponent, {
            width: '350px',
            data: {
              title: validationFailure,
              content: completeQuestions
            }
          });
          this.setActivePage(this.previousSelectedTabIndex);
          return;
        } 
      }
    }
    this.setActivePage(event.index);
  }
  setActivePage(tabIndex: number) {
    if(this.selectedProjectIndex !== tabIndex) return;
    const page = this.pages[tabIndex];
    this.inspectionDetailsService.setActivePage(page);
    this.selectedProjectIndex = tabIndex;
  }

  showRevisionVersion() : boolean {
    return !MIUtilities.isNullOrUndefined(this.inspectionDetailsService.workorder.revisionVersion);
  }

  async openWeb(){
    let networkStatus = await this.sharedService.checkOfflineAndAlert('wo.offlineOpenWeb');
    if (networkStatus)
    window.open(`${ENV.webUrl}/inspection/details/${this.inspectionDetailsService.workorder.id}`,'_blank');
  }
}
