import { IMAGE_CONFIG } from '@angular/common';
import { Component, HostListener, Input } from '@angular/core';
import { InspectionResponse, InspectionResponseImage } from 'src/app/core/sync/entities';
import { MatDialog } from '@angular/material/dialog';
import { CanvasEditPhotoComponent } from '../photo/canvas-edit/canvas-edit-photo.component';

@Component({
  selector: 'photoview',
  templateUrl: './photo-view.component.html',
  styleUrls: ['./photo-view.component.scss'],
  providers: [
    {
      provide: IMAGE_CONFIG,
      useValue: {
        placeholderResolution: 20
      }
    },
  ]
})

export class PhotoViewComponent {
  @Input() response: InspectionResponse;
  @Input() responseImages: InspectionResponseImage[]; // getting the responses from the summary

  constructor(
    private dialogRef: MatDialog,
  )
  {}

  @HostListener('unloaded')
  ngOnDestroy() {
    this.response = null;
    this.responseImages = null;
  }

  viewImage(image: any) {
    this.openImage(image.photo, image);
  }

  async openImage(photo: string, existingPhotoObj: any = null) {
        const photoDialog = this.dialogRef.open(CanvasEditPhotoComponent, {
          maxWidth: '100vw',
          maxHeight: '100vh',
          panelClass: 'full-screen-modal',
          data: {
            showPhotoEditorTitle: false,
            showDrawButton: false,
            showTextButton: false,
            showSaveButton: false,
            showCloseButton: true,
            scaleToImage: true,
            photo: photo,
            response: this.response
          }
        });
  }
}
