import { Component } from '@angular/core';
import { InspectionDetailsService } from 'src/app/pages/inspection/services/inspection-details.service';
import { MatStepper } from '@angular/material/stepper';
import { SectionModel } from 'src/app/core/models/local/section.model';
import { SECTIONS } from 'src/app/core/enums/sections.enum';
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { EquipDetails } from '../../sync/entities';
import { Clipboard } from '@angular/cdk/clipboard';
import { PromptInfoComponent } from '../promptInfo/promptInfo.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'insp-detail-nav',
  templateUrl: './insp-detail-nav.component.html',
  styleUrls: ['./insp-detail-nav.component.scss']
})
export class InspDetailNavComponent {
  public activePage: string = '';
  public isShow: boolean = false;
  public isShowSections: boolean = false;
  public isShowEquipProp: boolean = false;
  public isRendered: boolean = false;
  public sections: Array<SectionModel>;
  public equipProps: EquipDetails[] = [];

  constructor(
    private inspectionDetailsService: InspectionDetailsService, 
    private sharedService: SharedService,
    private router: Router,
    private clipboard: Clipboard,
    public dialog: MatDialog,
    public translate: TranslateService
  ) { }

  ngOnInit() {
    this.subscribeActivePage();
  }

  subscribeActivePage() {
    this.inspectionDetailsService.activePage.subscribe( (page:string) => {
      if (page) { // if tab switch trigger occurs on insp detail
        this.isRendered = true;

        if (page == 'detail') {  // nav to detail page
          this.getFilteredSections();
          this.getEquipProperties();
          this.isShow = true;
        } 
        else { // nav to one of the 3 other pages
          this.isShow = false;
          this.isShowSections = false;
          this.isShowEquipProp = false;
        }
          
      } else { // if ngondestroy is triggered on the base inspectiondetail comp
        this.isRendered = false;
        this.isShowSections = false;
        this.isShowEquipProp = false;
        this.isShow = false;
      }
      
    })
  }
  getFilteredSections() {
    this.sections = this.inspectionDetailsService.filterSection(
      SECTIONS.General,
      true
    )?.filter( (section) => section.isShow );
  }

  getEquipProperties() {
    this.equipProps = this.inspectionDetailsService.visionsSettings;
  }

  getStepper(): MatStepper {
    return this.inspectionDetailsService.detailStepper;
  }

  addInspectionItem() {
    const woId = this.inspectionDetailsService.workorder.id;
    this.router.navigate([`/inspection/${woId}/add`]);
    this.sharedService.scrollToTop();
  }

  previousSection() {
    const index = this.getStepper().selectedIndex - 1;
    this.getStepper().selectedIndex = index;
  }
  nextSection() {
    const index = this.getStepper().selectedIndex + 1;
    this.getStepper().selectedIndex = index;
  }

  openSectionByIndex(i: number) {
    this.toggleSectionNav();
    this.getStepper().selectedIndex = i;
  }

  isValidStep(changeI: number): boolean {
    // determines disabled attributes for the nav
    const steps = this.getStepper()?.steps;
    const newI = this.getStepper()?.selectedIndex + changeI;
    if ( newI > -1 && newI < steps.length ) 
      return true
    return false;
  }

  toggleSectionNav() {
    this.isShowSections = !this.isShowSections;
    this.isShowEquipProp = false; //hide if equip prop was open already

    if (this.isShowSections)
      this.getFilteredSections();
    else {
      setTimeout( () =>{ //for animation
        this.sections = null;
      },500);
    }
  }

  toggleEquipProperties() {
    this.isShowEquipProp = !this.isShowEquipProp;
    this.isShowSections = false; //hide if sections was open already
    if (this.isShowEquipProp)
      this.getEquipProperties();
    else {
      //do nothing
    }
  }

  copyEquipProp(equipPropText: string)
  {
    console.log(equipPropText);
    this.isShowEquipProp = false; //close peek equipment properties after copying
    const copyText = this.clipboard.copy(equipPropText); //copy to device's clipboard
    let copiedText = "";
    this.translate.get(['details.copyEquipPropMessage']).subscribe(values => {
      copiedText = values['details.copyEquipPropMessage'];
    });
    this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: { title: 'details.copyEquipProp', content: copiedText.replace('{{copiedText}}', equipPropText), showOkButton: true },
      panelClass: 'custom-dialog'
  });
  }


}
