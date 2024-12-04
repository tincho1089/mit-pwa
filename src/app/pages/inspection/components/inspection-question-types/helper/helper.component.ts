import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output
} from '@angular/core';
import { BaseInspection } from '../../../classes/base-inspection';
import {
  EquipDetails,
  InspectionQuestionImage,
  InspectionResponse,
} from 'src/app/core/sync/entities';
import { AbstractControl, FormGroup } from '@angular/forms';
import { db } from 'src/databases/db';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';
import { SettingsService } from 'src/app/core/services/app-settings.service';
import { MatDialog } from '@angular/material/dialog';
import { PromptInfoComponent } from 'src/app/core/components/promptInfo/promptInfo.component';
import { EventService } from 'src/app/core/services/event.service';
import { ENV } from 'src/environments/environment';
import { DeviceInfoService } from 'src/app/core/services/device-info.service';
import { MIUtilities } from 'src/app/shared/utility';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Subject, debounceTime } from 'rxjs';
import { CanvasEditPhotoComponent } from '../photo/canvas-edit/canvas-edit-photo.component';

@Component({
  selector: 'helper',
  templateUrl: './helper.component.html',
  styleUrls: ['./helper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelperComponent extends BaseInspection implements AfterViewInit, OnDestroy {
  @Input() override response: InspectionResponse;
  @Input() override form: FormGroup;
  @Input() override section: string;
  @Input() override equipDetails: EquipDetails[];
  @Input() showHelper: boolean = false;
  @Output()
  setHelperValidation = new EventEmitter<boolean>();
  isNA_proxy: boolean = false;
  showPhotos = true;
  expanded: boolean = false;
  isCommentsChanged: boolean = false;
  localComment: boolean = false;
  isShowReferenceImage: boolean;
  referenceImage: string;
  INSTRUCTIONS_ENUM = QUESTIONTYPES.INSTRUCTIONS;
  LINK_ENUM = QUESTIONTYPES.LINK;
  os: string = null;
  localCommentRequired = false;
  protected userInputSubject = new Subject<any>();

  constructor(
    private ref: ChangeDetectorRef,
    public settingsService: SettingsService,
    public dialogRef: MatDialog,
    private eventService: EventService,
    private deviceInfoService: DeviceInfoService,
    private zone: NgZone
    ) {
    super();
  }

  async ngAfterViewInit(): Promise<void> {
    this.os = this.deviceInfoService.getOS();
    if (this.response.attention || this.response.followUpWO)
      this.localCommentRequired = true;
    setTimeout(() => {
      const control = this.form.get([this.section, this.response.questionId]);
      this.setHelperValidation.emit(this.validateHelpers(control).hasError);
    }, 0);
    
    // handle consecutive user inputs when changing comments/recommendations
    // this will prevent the user from spamming updates to the database, preventing an OOM
    this.userInputSubject.pipe(debounceTime(1000)) 
      .subscribe(async () => {
        this.handleUpdatesOnChange();
      });


    this.expanded =
      !!this.response.showComment ||
      !!this.response.showRecommendation ||
      !!this.response.showPhoto;
    await this.showReferenceImage();
    this.subscribeHelperState();
    this.isNA_proxy = this.response.isNA;
    this.ref.detectChanges();
    this.ref.markForCheck();
  }

  override ngOnDestroy() {
    this.response = null;
    this.form = null;
    this.section = null;
    this.referenceImage = null;
    this.eventService = null;
    this.equipDetails = null;
    this.helperTrigger?.unsubscribe();
    this.ref.detach();
  }
  
  subscribeHelperState = () => {
    this.helperTrigger.subscribe((isShowHelper: boolean) => {
      
      // seeing several triggers with isShowHelper being null
      if (isShowHelper != null) 
        this.togglePanel(isShowHelper)
    })
  }

  private validateHelpers(control: AbstractControl) {
    if (control.status === "VALID" || control.status === "DISABLED") {
        if (this.response && (this.response.followUpWO || this.response.attention) && MIUtilities.isNullOrUndefined(this.response.comments))
          return { hasError: true };
      return { hasError: false };
    } 
    return { hasError: true };
  }

  togglePanel(isOpen: boolean): void {
    if(!this.isCommentsChanged){
      this.showHelper = isOpen;
    }
    //figure out what to show in the accordion
    if (
      !this.response.showComment &&
      !this.response.showRecommendation &&
      !this.response.showPhoto
    ) {
      this.localComment = true;
    }

    if(!this.isCommentsChanged){
      this.expanded = isOpen;
    }

    this.ref.detectChanges();
    this.isCommentsChanged = false;
  }

  onChange(commentsFlag = false) {
    this.isCommentsChanged = commentsFlag;
    this.userInputSubject.next({});
  }

  async handleUpdatesOnChange()
  {
    const control = this.form.get([this.section, this.response.questionId]);
    control?.updateValueAndValidity();
    this.setHelperValidation.emit(this.validateHelpers(control).hasError);
    this.localCommentRequired = (this.response.attention || this.response.followUpWO);
    // save response on comment, recommendation, and immediate attention changes on the response
    // only saves the latest response/comment 1 second after the user stops typing
    console.log('saving comment, recommendation, or immediate attention changes')
    await db.updateResponseComments(this.response);
  }

  private async showReferenceImage(): Promise<void> {
    const questionImage: InspectionQuestionImage = await db.getQuestionImage(
      this.response.questionId
    );
    this.isShowReferenceImage = questionImage != null ? true : false;
    if (this.isShowReferenceImage) {
      this.referenceImage = 'data:image/png;base64,' + questionImage.imageData;
    }
    this.ref.detectChanges();
  }

  isAccordionEnabled(): boolean {
    const disabledQuestions = [
      QUESTIONTYPES.INSTRUCTIONS,
      QUESTIONTYPES.LINK
    ]
    const questionType = this.response.itemType;
    if (disabledQuestions.includes(questionType))
      return false;
    return true;
  }

  async onNAChange(checkChange: MatCheckboxChange) {
    let checkbox =checkChange.source; 
    const checked = !this.response.isNA; // most reliable option
    let fg: AbstractControl = this.form.get([this.section, this.response.questionId]);
    if (checked) {
      const emptyInput: boolean = !fg.dirty || fg.value == null || fg.value == '';
      if(emptyInput) {
        await this.setNAAndUpdateForm(fg);
      }
      else {
        let dialog = this.dialogRef
        .open(PromptInfoComponent, {
          width: '350px',
          data: {
            title: 'helper.notApply',
            content: 'helper.loseChanges',
            showYesButton: true,
            showNoButton: true
          },
          panelClass: 'custom-dialog'
        });
        dialog.afterClosed()
        .subscribe(async (removeAnswer) => {
          if (removeAnswer) {
            // if set NA and confirmed
            await this.setNAAndUpdateForm(fg);
          } else {
            // if set NA, but declined confirm box
            checkbox.checked = this.response.isNA;
          }
        });
      } 
    } else {

      const responseImages = await db.getImagesByResponseId(this.response.id);

      if (responseImages && responseImages.length > 0) {
        // delete images marked for delete on the server
        let markedImages = JSON.parse(localStorage.getItem("delImgIds")) ?? [];
        if(markedImages && markedImages.length > 0){

          if(markedImages.some(markedImg => markedImg.inspectionId == this.response?.inspectionId)){
            markedImages = markedImages.filter(markedImg => !responseImages.some(img => img.serverId == markedImg.imageServerId));

            localStorage.setItem("delImgIds", JSON.stringify(markedImages));
          }

        }
      }

      //if unset NA
      this.purgeNAFromResponse();
      fg.enable();
      this.response.isNA = false;
      this.isNA_proxy = this.response.isNA;
      await db.updateAnswer(this.response);
      this.ref.detectChanges();
      this.showComponent();
      if (!this.response.comments)
        this.togglePanel(false);
    }
  }

  purgeNAFromResponse() {
    const controlForm = this.form.get(
      [this.section, this.response.questionId]
    );
    if (controlForm.value == 'NA' )
      controlForm.setValue('');

    if (this.response.answer == 'NA')
      this.response.answer = '';

  }

  evalConditionalExp() {
    if (this.response.inspectionSection == 'General') {
      this.eventService.publishEvent("validateConditialExpressionGeneral", this.response);
    } else {
      this.eventService.publishEvent("validateConditialExpression", this.response);
    }
  }
  
  async copyQuestion() {
    this.eventService.publishEvent("copy-question:done", { status: "cancel", res: this.response });
  }

  async removeCopiedQuestion() {
    await db.removeInspectionResponse(this.response);
    this.eventService.publishEvent('remove-copied-question:done', {
      status: 'remove',
      inspection: this.response
    });
  }

  openWO(){
      const params: string =  ":?createworkorder=yes";
      let app = null;
      this.os = this.deviceInfoService.getOS();
        switch (this.os) {
          case "iOS":
          case "MacOS":
              app = ENV.cmmsScheme + ENV.cmmsBundle
              window.open(app + params, "_system");
              break;
          case "Android":
            app = "chevronusa.inc.fwe.mobilecmms";
            window.open('intent://'+app + params+'/', "_system");
            break;
          default:
          this.dialogRef.open(PromptInfoComponent, {
            width: '350px',
            data: {
              title: 'helper.openWO',
              content: 'helper.openWOBrowserNotSupported',
              showOkButton: true
            },
            panelClass: 'custom-dialog'
          });
            return;
        }
  }

  validateCompletedSectionClass() {
    return this.form.get([this.section, this.response.questionId])?.valid || this.response.isNA ? 'complete' : 'incomplete'
  }

  showComponent(): void {
    this.eventService.publishEvent("showComponent",  this.showControl);
  }

  public async onClick() {
    await this.zone.run(async () => {
      const photoDialog = this.dialogRef.open(CanvasEditPhotoComponent, {
        maxWidth: '100vw',
        maxHeight: '100vh',
        height: '90%',
        width: '90%',
        data: {
          showPhotoEditorTitle: false,
          showDrawButton: false,
          showTextButton: false,
          showSaveButton: false,
          showCloseButton: true,
          scaleToImage: false,
          photo: this.referenceImage,
          response: this.response
        },
        panelClass: 'full-screen-modal',
      });
    });
  }

  private async setNAAndUpdateForm(fg: AbstractControl): Promise<void> {
    this.response.isNA = true;
    this.response.followUpWO = false;
    this.response.attention = false;
    this.response.isChanged = 'Y';
    this.response.answer = 'NA';
    const responseImages = await db.getImagesByResponseId(this.response.id);

    if (responseImages && responseImages.length > 0) {
      // mark for delete images in the server
      let images = JSON.parse(localStorage.getItem("delImgIds")) ?? [];

      responseImages.forEach(image => {
          const isLocalImageId : boolean = typeof image.serverId === 'string' && image.serverId.indexOf('NS_') > -1;
          if(isLocalImageId == false){
            images.push({
              imageServerId: image.serverId,
              inspectionId: image.inspectionId
            });
          }
        }
      );

      localStorage.setItem("delImgIds", JSON.stringify(images));
    }

    await db.updateAnswer(this.response);
    this.isNA_proxy = this.response.isNA;
    fg.disable();
    this.evalConditionalExp(); // if dependent qs, they need to be updated
    this.ref.markForCheck();
    this.togglePanel(true);
  }
}
