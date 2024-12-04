import {
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { QuestionTypesModel } from '../../../../../core/models/local/question-types.model';
import { BaseInspection } from '../../../classes/base-inspection';
import {
  EquipDetails,
  InspectionResponse,
  InspectionResponseImage,
} from 'src/app/core/sync/entities';
import { MatDialog } from '@angular/material/dialog';
import { PhotoDialogComponent } from './dialog/photo-dialog.component';
import { db } from 'src/databases/db';
import { CanvasEditPhotoComponent } from './canvas-edit/canvas-edit-photo.component';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import Compressor from 'compressorjs';
import { QUESTIONTYPES } from 'src/app/core/enums/question-types.enum';
import { lastValueFrom } from 'rxjs';
import { SharedService } from 'src/app/core/services/shared.service';
import { SettingsService } from 'src/app/core/services/app-settings.service';
import { MIUtilities } from 'src/app/shared/utility';
import { saveAs } from 'file-saver-es';
import { IMAGE_CONFIG } from '@angular/common';
import { InspectionDetailsService } from '../../../services/inspection-details.service';

@Component({
  selector: 'photo',
  templateUrl: 'photo.component.html',
  styleUrls: ['./photo.component.scss'],
  providers: [
    {
      provide: IMAGE_CONFIG,
      useValue: {
        placeholderResolution: 20
      }
    },
  ]
})
export class PhotoComponent
  extends BaseInspection
  implements QuestionTypesModel, OnInit, OnDestroy {
  @Input() override response: InspectionResponse;
  @Input() override section: string;
  @Input() override form: FormGroup;
  @Input() isHelper: boolean = false;
  @Input() override editable: boolean = true;
  @Input() override equipDetails: EquipDetails[];
  @Input() isChildren: boolean = false;
  @Input() showHelper: boolean = false;

  private _control: AbstractControl;
  inspectionResponseImagesList: Array<InspectionResponseImage> = [];
  photo = '';
  file: File | Blob;
  static staticImages: InspectionResponseImage[];

  constructor(
    private dialogRef: MatDialog,
    private ref: ChangeDetectorRef,
    private sharedService: SharedService,
    private settingsService: SettingsService,
    private inspectionDetailsService : InspectionDetailsService,
    private zone: NgZone
  ) {
    super();
  }

  override ngOnInit() {
    super.ngOnInit();
    this.idControl = this.section + '.' + this.response.id;
    this.idControl = this.idControl.replace('..', '.');
    this.sectionArray = [this.section, this.response?.id?.toString()];
    this._createForm();
    this.loadImages(false);
  }
  
  @HostListener('unloaded')
  override ngOnDestroy() {
    this.inspectionResponseImagesList = null;
    this.photo = null;
    this.file = null;
    this._control = null;
    this.response = null;
    this.section = null;
    this.form = null;
    this.equipDetails = null;
    this.ref.detach();
  }

  // Validation red/green
  public static async create(response: InspectionResponse, photos: InspectionResponseImage[]): Promise<FormControl> {
    return new FormControl(response.answer, this._validate(response, photos));
  }

  private static _validate(response: InspectionResponse, photos: InspectionResponseImage[]): ValidatorFn {
    return (): ValidationErrors | null => {
      const imageAttached: boolean = photos?.length > 0;
      return (imageAttached || response?.isNA) ? null : { noImageAttached: true };
    }
  }

    // Update the validator to fetch the latest attached photos from Dexie. 
    // The _validate method is only called during component creation and is also used for the summary.  
  public static updateValidator(formControl: FormControl, response: InspectionResponse, photos: InspectionResponseImage[]): void {
    formControl.setValidators(this._validate(response, photos));
    formControl.updateValueAndValidity();
  }
  // end validations

  // generate thumbnails for all
  async defineThumbnails() {
    await this.sharedService.loadIndicatorSvc.setMsgTranslated('photo.definingThumbnail');
    await this.bulkGetThumbnails(this.inspectionResponseImagesList);
    await db.bulkSaveThumbnails(this.inspectionDetailsService.workorder, this.inspectionResponseImagesList);
    this.sharedService.loadIndicatorSvc.hide();
    this.ref.markForCheck();
  }

  async bulkGetThumbnails(images: InspectionResponseImage[]) {
    try {
      const thumbnailPromises = images.map(async (img) => {
        const imgBlob = await this.base64toBlob(img.photo);
        const thumbBlob = await this.compressImage(imgBlob, 500, 500);
        img.thumbnail = await this.imageBlobToString(thumbBlob);
      });
  
      await Promise.all(thumbnailPromises);
    } catch (error) {
      console.error('Error generating thumbnails in bulk:', error);
    }
  }

  // generate thumbnail for one
  async defineThumbnail(image: InspectionResponseImage, imageUpdated: boolean = false) {
    if (image.photo) {

      if(MIUtilities.isNullOrUndefined(image.thumbnail) || imageUpdated){
        await this.sharedService.loadIndicatorSvc.setMsgTranslated(
          'photo.definingThumbnail'
        );

        await this.getThumbnail(image);

        await db.saveThumbnail(
          this.inspectionDetailsService.workorder,
          this.response.id,
          image.serverId,
          image.thumbnail
        );
        this.sharedService.loadIndicatorSvc.hide();
  
        this.ref.markForCheck();

      }
    }
  }  

  async getThumbnail(img: InspectionResponseImage) {
    let imgBlob = await this.base64toBlob(img.photo);
    let thumbBlob = await this.compressImage(imgBlob,500,500);
    
    img.thumbnail = await this.imageBlobToString(thumbBlob);
  }

  openCamera() {
    let dialog = this.dialogRef.open(PhotoDialogComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      panelClass: 'full-screen-modal',
    });

    dialog.afterClosed().subscribe(async (photo: string) => {
      if (photo) {
        this.photo = photo;
        //this section is converting the base64 data from the WebcamImage (proprietary library) to a Javascript blob we can actually compress
        const base64Data = photo.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        const regex = /^data:([A-Za-z-+/]+);base64,/;
        const match = regex.exec(photo);
        const mimeType = match?.[1] ? match[1] : 'application/octet-stream'; //mime type is the objects file type such as image/png
        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i));
        }
        this.file = new Blob([new Uint8Array(byteArrays)], { type: mimeType });
        //end conversion section

        this.openEditor(this.photo);
      }
    });
  }

  private _createForm() {
    this._control = this.form.get([this.section, this.response.questionId]);
    this.subscription.add(
      this._control.statusChanges.subscribe((status: string) => {
        if (status === 'DISABLED') this._onReset();
      })
    );
  }

  private async _onReset() {
    await db.deleteQuestionImages(
      this.inspectionDetailsService.workorder,
      this.response.questionId
    );
    if (!this.isChildren)
      this._control.setValue(null);
  }

  browseImage(imageInput: any) {
    this.file = imageInput.target.files[0];
    const reader = new FileReader();
    reader.addEventListener('load', async (event: any) => {
      this.photo = event.target.result;
      await this.openEditor(this.photo);
    });
    reader.readAsDataURL(this.file);
  }

  resetFileInput(event: any) {
    event.target.value = null;
  }

  async openEditor(photo: string, existingPhotoObj: any = null, compressImage: boolean = true) {
    try {

      const photoDialog = this.dialogRef.open(CanvasEditPhotoComponent, {
        maxWidth: '100vw',
        maxHeight: '100vh',
        data: {
          showPhotoEditorTitle: true,
          showDrawButton: true,
          showTextButton: true,
          showSaveButton: true,
          showCloseButton: true,
          scaleToImage: true,
          photo: photo,
          response: this.response
        },
        panelClass: 'full-screen-modal'
      });
      
      photoDialog.afterClosed().subscribe(async (photo: any) => {

      if (!photo) return;
      
      this.sharedService.loadIndicatorSvc.show();
      await this.sharedService.loadIndicatorSvc.setMsgTranslated(
        'photo.savingPhoto'
      );

      const hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.width = photo.originalWidth;
      hiddenCanvas.height = photo.originalHeight;
      const hiddenCtx = hiddenCanvas.getContext('2d');

      const canvasImg = new Image();
      canvasImg.src = photo.imageData;

      canvasImg.onload = async () => {
        
        hiddenCtx.drawImage(canvasImg, 0, 0, photo.drawingWidth, photo.drawingHeight, 0, 0, photo.originalWidth, photo.originalHeight);

        const imageBase64 = await fetch(hiddenCanvas.toDataURL());
        const imageBlob = await imageBase64.blob();
      
        let compressedImage = imageBlob;
        if(this.settingsService.get('isCompressImage') && compressImage)
        {
          await this.sharedService.loadIndicatorSvc.setMsgTranslated(
            'photo.compressingPhoto'
          );
          compressedImage = await this.compressImage(imageBlob); //compress image if compress image toggle is 'yes'
        }
        const compressedImageStr = await this.imageBlobToString(compressedImage);
        
        existingPhotoObj ? await this.updatingImage(existingPhotoObj, compressedImageStr)
        : await this.addImage(compressedImageStr);
        
        await this.loadImages(true);
        this.sharedService.loadIndicatorSvc.hide();
        }
 
      });
    }
    catch (error) {
      console.error(error);
      this.sharedService.loadIndicatorSvc.hide();
      this.sharedService.errDialogSvc.openDialog(
        'Error Saving Photo',
        error
      );
    }
  }

  private async compressImage(
    imageBlob: Blob,
    maxHeight: number=null, 
    maxWidth: number=null
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      new Compressor(imageBlob, {
        convertTypes: [
          'image/png',
          'image/webp',
          'image/gif',
          'image/svg+xml',
          'image/jpeg',
          'image/jpg'
        ],
        mimeType: 'image/jpeg', // convert all images to jpeg
        quality: 0.6,
        maxHeight,
        maxWidth,
        drew: () => { },
        success(result) {
          resolve(result); // Resolve the promise with the compressed image
        }
      });
    });
  }

  private async imageBlobToString(img: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        resolve(reader.result as string);
      });
      reader.readAsDataURL(img);
    });
  }


  private async updatingImage(existingPhotoObj: any, updatedCompressedImage: string): Promise<void> {
    existingPhotoObj.photo = updatedCompressedImage;
    await this.updateImage(existingPhotoObj);
  }

  async addImage(photo: string) {
    this.sharedService.loadIndicatorSvc.show();
    await this.sharedService.loadIndicatorSvc.setMsgTranslated(
          'photo.addingPhoto'
        );
    await db.addImage(
      this.inspectionDetailsService.workorder,
      this.response.questionId,
      photo
    );

    this.sharedService.loadIndicatorSvc.hide();
  }

  async updateImage(image: any) {
    this.sharedService.loadIndicatorSvc.show();
    await this.sharedService.loadIndicatorSvc.setMsgTranslated(
      'photo.updatingPhoto'
    );

    // update the file name and server id inside of this function so that it will be uploaded after doing a compare
    const updatedImage = await db.updateImageContent(
      this.inspectionDetailsService.workorder,
      this.response.id,
      image.serverId,
      image.photo,
      true,
      true
    );

    // then delete the old photo in the server so there are no duplicates
    this.markPhotoForDeletionInServer(image.serverId, this.inspectionDetailsService.workorder.id);
    //this.deletePhoto(image.serverId); // delete the photo with the old server id

    if(updatedImage){
      await this.defineThumbnail(updatedImage, true);
    }

    this.sharedService.loadIndicatorSvc.hide();
  }

  markPhotoForDeletionInServer(imageServerId: any, inspectionId: number) {
    const isLocalImageId : boolean = typeof imageServerId === 'string' && imageServerId.indexOf('NS_') > -1;

    if(isLocalImageId == false){
      // mark for deletion in the server
      let images = JSON.parse(localStorage.getItem("delImgIds")) ?? [];
      images.push(
        {
          imageServerId: imageServerId,
          inspectionId: inspectionId
        });
      localStorage.setItem("delImgIds", JSON.stringify(images));
    }
  }

  async editImage(image: any) {
    await this.openEditor(image.photo, image, false);
  }

  async copyImage(image: any) {
    this.sharedService.loadIndicatorSvc.show();
    await this.sharedService.loadIndicatorSvc.setMsgTranslated(
      'photo.copyingPhoto'
    );

    // adds a new photo
    await this.addImage(image.photo);

    await this.loadImages(true);

    this.sharedService.loadIndicatorSvc.hide();
  }

  async updateImageCaption(image: any) {
    try
    {
      this.sharedService.loadIndicatorSvc.show();
      await this.sharedService.loadIndicatorSvc.setMsgTranslated(
        'photo.updatingPhoto'
      );
  
      await db.updateImageCaption(
        this.inspectionDetailsService.workorder,
        this.response.questionId,
        image.serverId,
        image.imageCaption
      );
  
      this.sharedService.loadIndicatorSvc.hide();
    }
    catch (err)
    {
      console.error(err);
    }

  }

  removePhoto(image: any) {
    this.deletePhoto(image.serverId);
  }

  private async deletePhoto(imageServerId: any) {
    this.sharedService.loadIndicatorSvc.show();
    await this.sharedService.loadIndicatorSvc.setMsgTranslated(
      'photo.removingPhoto'
    );

    this.markPhotoForDeletionInServer(imageServerId, this.inspectionDetailsService.workorder.id);

    await db.deleteImage(
      this.inspectionDetailsService.workorder,
      this.response.questionId,
      imageServerId
    );

    this.loadImages(true);

    this.sharedService.loadIndicatorSvc.hide();

  }

  private async _setControl() {
    // if photo question
    if (this.response.itemType == QUESTIONTYPES.PHOTO_ONLY) {
      await this.setCommentPhotoQT();
    }

    this.ref.detectChanges();
    this.ref.markForCheck();
  }

  async setCommentPhotoQT() {
    if (
      this.inspectionResponseImagesList.length > 0 &&
      this.response.answer !== "Photo Uploaded"
    ) {
      this._control.setValue("Photo Uploaded");
      this.response.answer = "Photo Uploaded";
      await db.updateAnswer(this.response);
    }
    else if (this.inspectionResponseImagesList.length == 0) {
      this._control.setValue(null);
      if (this.response.answer != null) {
        this.response.answer = null;
        await db.updateAnswer(this.response);
      }
    }

    this.ref.detectChanges();
    this.ref.markForCheck();
  }

  loadImages(photoUpdated: boolean) {
    db.getImagesByResponseId(this.response.id).then(async (images) => {
      this.inspectionResponseImagesList = images;
      this.inspectionDetailsService.inspectionImages = images;

      if (!this.isChildren) {
        // when a new photo is attached, we need to update the validator of the FormControl to include the new photos
        const formControl = this.form.get([this.section, this.response.questionId]) as FormControl;
        PhotoComponent.updateValidator(formControl, this.response, images);
      }

      if (photoUpdated) { // when the photo was updated
        this._setControl();
        await this.defineThumbnails();
      } else if(images.filter(image => !image.thumbnail).length) { // when we sync and get the images for the first time
        await this.defineThumbnails();
      }
      
      this.ref.markForCheck();
      this.ref.detectChanges();
    });
  }

  base64toBlob(base64Data) : Promise<Blob> {
    // local upload starts with b64
    // remote does not
    if (!base64Data.startsWith('data:image')) { 
      base64Data = `data:image/jpg;base64,${base64Data}`;
    }
    return new Promise((resolve, reject) => {
      fetch(base64Data)
        .then(res => res.blob())
        .then(b => resolve(b))
    })
  }

  async downloadImage(image:any) {
    try {
      let delimiter = ";base64,";
      let photo:string = image.photo;
      if(photo.includes(delimiter))
      {
        photo = photo.split(delimiter)[1];
      }
      const blob = MIUtilities.base64toBlob(photo, 'image/png');
      saveAs(blob, image.inspectionId + "_" + image.serverId)
    }
    catch (error) {
      console.log("Unable to export", image.serverId, "due to error ", error);
    }
  }

}
