import { Component, Inject, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fabric } from 'fabric';

declare const fabric: any;
@Component({
  template: ` <div mat-dialog-content>
      <canvas
        style="border-style: solid;"
        id="signature-pad"
        class="signature-pad"
      ></canvas>
    </div>
    <div mat-dialog-actions>
      <a class="button btn btn-primary text-white photo-btn" (click)="cancel()"
        ><mat-icon class="hover">close</mat-icon> <span>cancel</span></a
      >
      <a class="button btn btn-primary text-white photo-btn" (click)="clear()">
        <span>clear</span></a
      >
      <a class="button btn btn-primary text-white photo-btn" (click)="save()"
        ><mat-icon class="hover">save</mat-icon> <span>save</span></a
      >
    </div>`,
})
export class SignatureDialogComponent implements AfterViewInit {
  canvas: any;

  constructor(
    public dialogRef: MatDialogRef<SignatureDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngAfterViewInit() {
    this.canvas = new fabric.Canvas('signature-pad', {
      isDrawingMode: true,
    });
    this.canvas.freeDrawingBrush.width = 5;
    this.resizeCanvas();
  }

  save() {
    this.dialogRef.close(this.canvas.toDataURL());
  }

  clear() {
    this.canvas.clear();
  }

  cancel() {
    this.dialogRef.close();
  }

  resizeCanvas() {
    const iw = 600;
    const ih = 400;
    const maxW = iw > window.outerWidth - 32 ? window.outerWidth - 32 : iw;
    const maxH = ih > window.outerHeight - 250 ? window.outerHeight - 250 : ih;
    const scale = Math.min(maxW / iw, maxH / ih);
    const iwScaled = iw * scale;
    const ihScaled = ih * scale;

    this.canvas.setDimensions({
      width: iwScaled,
      height: ihScaled,
    });
  }
}
