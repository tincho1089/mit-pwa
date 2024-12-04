import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import { MatDialog } from '@angular/material/dialog';
import { db } from 'src/databases/db';
import { SignatureDialogComponent } from './signature-dialog.component';
import { AbstractControl } from '@angular/forms';
import { InspectionResponseImage } from 'src/app/core/sync/entities';
import { lastValueFrom } from 'rxjs';
import { InspectionDetailsService } from '../../../services/inspection-details.service';

@Component({
  selector: 'signature',
  templateUrl: 'signature.component.html',
  styleUrls: ['./signature.component.scss'],
})
export class SignatureComponent
  extends BaseInspection
  implements QuestionTypesModel {
  @Input()
  showHelper: boolean = false;
  inspectionResponseImagesList: Array<InspectionResponseImage> = [];
  private _control: AbstractControl;

  constructor(private dialogRef: MatDialog,
              private inspectionDetailsService: InspectionDetailsService, 
              private ref: ChangeDetectorRef) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this._createForm();
  }

  async addSignature() {
    let dialog = this.dialogRef.open(SignatureDialogComponent, {
      disableClose: true,
    });

    const source$ =  dialog.afterClosed();
    const signature = await lastValueFrom(source$);
    if (signature) {
      await db
        .addImage(this.inspectionDetailsService.workorder, this.response.questionId, signature)
        .then(() => this.loadImages());
    }
  }
  
  private _createForm() {
    this._control = this.form.get([this.section, this.response.questionId]);
    this.subscription.add(
      this._control.statusChanges.subscribe((status: string) => {
        if (status === "DISABLED") this._onReset();
      })
    );
    this.loadImages();
  }

  private async _setControl() {
    if (
      this.inspectionResponseImagesList.length > 0 &&
      this.response.answer !== "Photo Uploaded"
    ) {
      this._control.setValue("Photo Uploaded");
      this.response.answer = "Photo Uploaded";
      await db.updateAnswer(this.response);
    }
    else if(this.inspectionResponseImagesList.length == 0)
    {
      this._control.setValue(null);
      if(this.response.answer != null)
      {
        this.response.answer = null;
        await db.updateAnswer(this.response);
      }
    }

    this.ref.detectChanges();
    this.ref.markForCheck();
  }

  private async _onReset() {
    await db.deleteQuestionImages(this.inspectionDetailsService.workorder, this.response.questionId);
    this.inspectionResponseImagesList = [];
    this._control.setValue(null, { onlySelf: true, emitEvent: false });
  }

  async removeSignature(image: any) {
    db.deleteImage(
      this.inspectionDetailsService.workorder,
      this.response.questionId,
      image.serverId
    ).then(() => 
    {
      this.loadImages();
    });
  }

  loadImages() {
    db.getImagesByResponseId(this.response.id).then((images) => {
          this.inspectionResponseImagesList = images;
          this.inspectionDetailsService.inspectionImages = images;
          this._setControl();
      });
  }
}
