import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InspectionResponse } from 'src/app/core/sync/entities';
import { InspectionDetailsService } from 'src/app/pages/inspection/services/inspection-details.service';
import { db } from 'src/databases/db';
import { SharedService } from 'src/app/core/services/shared.service';
export interface EditPhotoData {
  showPhotoEditorTitle: boolean;
  showDrawButton: boolean;
  showTextButton: boolean;
  showSaveButton: boolean;
  showCloseButton: boolean;
  scaleToImage: boolean;
  photo: string;
  response: InspectionResponse
}
declare const fabric: any;

export enum BRUSHCOLORS {
  RED = '#c2281d',
  ORANGE = '#de722f',
  YELLOW = '#edbf4c',
  GREEN = '#5db37e',
  LIGHT_BLUE = '#459cde',
  BLUE = '#4250ad',
  BLACK = '#000000',
}
export const TEXTCOLORS = BRUSHCOLORS; // Using same bursh colors.
@Component({
  selector: 'app-canvas',
  templateUrl: './canvas-edit-photo.component.html',
  styleUrls: ['./canvas-edit-photo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasEditPhotoComponent implements AfterViewInit, OnDestroy{
  canvas: any;
  isDrawingMode: boolean;
  isEraserMode: boolean;
  isTextMode: boolean;
  origImage: any;
  range: number = 10;
  defaultViewPort:any;
  zoomLevel: number = 1;


  zoomState: any = {
    max: 20,
    min: 0.01,
    current: 0
  }


  constructor(private inspectionDetailService: InspectionDetailsService,
              private sharedService: SharedService,
              private dialogRef: MatDialogRef<CanvasEditPhotoComponent>,
              @Inject(MAT_DIALOG_DATA) public data: EditPhotoData,
              private ref: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    this.canvas = new fabric.Canvas('canvas', {
      isDrawingMode: false,
      isTextmode: false,
      data: {
        showPhotoEditorTitle: true,
        showDrawButton: true,
        showTextButton: true,
        showSaveButton: true,
        showCloseButton: true,
        scaleToImage: true
      },
    });

    fabric.Image.fromURL(this.data.photo, (image: any) => {
      // Calculate canvas size according to the image we uploaded
      this.origImage = image;
      this.scaleCanvas(image);

      this.defaultViewPort = this.canvas.viewportTransform;
      this.canvas.allowTouchScrolling = true;
      this.initCanvasPanning();

      // Adding a fabric.js filter, this is helping us to resize the image without losing quality
      image.filters.push(
        new fabric.Image.filters.Resize({
          resizeType: 'sliceHack',
        })
      );

      this.zoomLevel = this.sharedService.getZoomLevel(); //get scaling of image if taken from webcam

      image.set({
        selectable: false,
        erasable: false,
        centeredScaling: true,
        cropX: (this.origImage.width - (this.origImage.width / this.zoomLevel)) / 2,
        cropY: (this.origImage.height - (this.origImage.height / this.zoomLevel)) / 2,
        width: (this.origImage.width / this.zoomLevel),
        height: (this.origImage.height / this.zoomLevel),
        scaleX: this.zoomLevel,
        scaleY: this.zoomLevel
      });
      image.applyFilters();

      const render = this.canvas.renderAll.bind(this.canvas);
      render();

      this.canvas.add(image);
    },{
      objectCaching :false
    });

    this.ref.detectChanges();
    this.ref.markForCheck();
  }

  ngOnDestroy(): void {
    this.data = null;
    this.canvas = null;
    this.origImage = null;
    this.range = null;
    this.defaultViewPort = null;
  }

  private scaleCanvas(image) {
    const scalingFactor = 0.75;

    // Can either scale canvas bounds to image (when smaller than max), or scale image to canvas bounds (full screen)
    let maxW;
    let maxH;
    const iw = image.width * scalingFactor;
    const ih = image.height * scalingFactor;
    if(this.data.scaleToImage) {
      maxW = iw > window.innerWidth * scalingFactor  ? window.innerWidth * scalingFactor : iw;
      maxH = ih > window.innerHeight * scalingFactor ? window.innerHeight * scalingFactor : ih;
    } else {
      maxW = window.innerWidth * scalingFactor;
      maxH = window.innerHeight * scalingFactor;
    }

    let scaledWidth;
    let scaledHeight;
    const aspr = iw/ih;
    if (maxW > maxH || maxW/aspr > maxH) { // Determine if will exceed bounds before/after
      scaledWidth = maxH * aspr;
      scaledHeight = maxH;
    } else {
      scaledWidth = maxW;
      scaledHeight = maxW/aspr ;
    }
    const scale = Math.min(scaledWidth / iw, scaledHeight / ih) * scalingFactor;

    this.canvas.setWidth(scaledWidth);
    this.canvas.setHeight(scaledHeight);

    this.canvas.setZoom(scale);
    this.zoomState.current = scale;
  }

  canvasZoom(point, direction:number) {
    let newZoom = this.zoomState.current += direction;
    if (this.zoomState.min <= newZoom <= this.zoomState.max) {
      this.canvas.zoomToPoint(point,Math.pow(2,newZoom));
      this.zoomState.current = newZoom;
    }
  }

  initCanvasPanning() {
    let pausePanning = true;
    let zoomStartScale = 0;
    let lastX = 0;
    let lastY = 0;

    this.canvas.on({
      'mouse:wheel': (opt) => {
          let delta = opt.e.deltaY;
          let zoom = this.canvas.getZoom();
          zoom *= 0.999 ** delta;
          if (zoom > this.zoomState.max) zoom = this.zoomState.max;
          if (zoom < this.zoomState.min) zoom = this.zoomState.min;
          this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
          this.zoomState.current = zoom;
          opt.e.preventDefault();
          opt.e.stopPropagation();
        },
      'touch:gesture': (opt) => {
          if (opt.e.touches && opt.e.touches.length == 2 && (!this.canvas.isDrawingMode && !this.isDrawingMode && !this.isTextMode)) { //two finger pinch gesture being used
            pausePanning = true;
            if (opt.self.state == "start") {
                zoomStartScale = this.canvas.getZoom();
            }
            var delta = zoomStartScale * opt.self.scale;
            this.canvas.zoomToPoint({x: opt.self.x, y: opt.self.y}, delta);
            pausePanning = false;
          }
        },
      'touch:drag': (opt) => {
          if (pausePanning == false && undefined != opt.e.layerX && undefined != opt.e.layerY && (!this.canvas.isDrawingMode && !this.isDrawingMode  && !this.isTextMode)) {
              let currentX = opt.e.layerX;
              let currentY = opt.e.layerY;
              let xChange = currentX - lastX;
              let yChange = currentY - lastY;

              if( (Math.abs(currentX - lastX) <= 50) && (Math.abs(currentY - lastY) <= 50)) {
                  this.canvas.relativePan({x: xChange, y: yChange});
              }

              lastX = opt.e.layerX;
              lastY = opt.e.layerY;
          }
          else if ((!this.canvas.isDrawingMode && !this.isDrawingMode  && !this.isTextMode)) {
            let currentX = opt.self.x;
            let currentY = opt.self.y;
            let xChange = currentX - lastX;
            let yChange = currentY - lastY;

            if( (Math.abs(currentX - lastX) <= 50) && (Math.abs(currentY - lastY) <= 50)) {
                this.canvas.relativePan({x: xChange, y: yChange});
            }

            lastX = opt.self.x;
            lastY = opt.self.y;
        }
      }
    });
  }

  addDrawing() {
    this.stopTexting();
    if(this.isDrawingMode)
    {
      this.stopDrawing();
      return;
    }
    this.isDrawingMode = true;
    this.canvas.isDrawingMode = true;
    // initialize brush
    this.changeBrushWidth();
    this.changeBrushColor('red');
  }

  clearDrawing() {
    this.isEraserMode = true;
    this.canvas.freeDrawingBrush = new fabric.EraserBrush(this.canvas);
    this.canvas.freeDrawingBrush.width = this.range;
    this.canvas.isDrawingMode = true;
  }

  undoDrawing() {
    let lastDrawingIndex = (this.canvas.getObjects().length - 1);
    if(lastDrawingIndex == 0) //no drawings
    {
      return;
    }
    else{
      let lastDrawingItem = this.canvas.item(lastDrawingIndex);
      console.log(lastDrawingItem);
      while(lastDrawingIndex > 0)
      {
        if(lastDrawingItem.get('type') == "path")
          {
            this.canvas.remove(lastDrawingItem);
            break;
          }
          else{
            lastDrawingIndex--;
            lastDrawingItem = this.canvas.item(lastDrawingIndex);
          }
      }
    }

  }

  undoText() {
    let lastDrawingIndex = (this.canvas.getObjects().length - 1);
    if(lastDrawingIndex == 0) //no drawings and only one text box
    {
      return;
    }
    else{
      let lastDrawingItem = this.canvas.item(lastDrawingIndex);
      console.log(lastDrawingItem);
      while(lastDrawingIndex > 0)
      {
        if(lastDrawingItem.get('type') == "textbox")
          {
            this.canvas.remove(lastDrawingItem);
            break;
          }
          else{
            lastDrawingIndex--;
            lastDrawingItem = this.canvas.item(lastDrawingIndex);
          }
      }
    }

  }

  closeEraser() {
    this.isEraserMode = false;
    this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
    this.canvas.freeDrawingBrush.width = this.range;
    this.canvas.isDrawingMode = true;
  }

  stopDrawing() {
    this.isDrawingMode = false;
    this.canvas.isDrawingMode = false;
    this.canvas.forEachObject(function(object) {
      object.selectable = false; //make everything unmovable to prepare for possible zooming/panning
    });
  }

  stopTexting() {
    this.isTextMode = false;
    this.canvas.discardActiveObject().renderAll(); //unselect any text box
    this.canvas.forEachObject(function(object) {
      object.selectable = false; //make everything unmovable to prepare for possible zooming/panning
    });
  }

  addInitialText() {
    this.stopDrawing(); //stop any drawing
    if(this.isTextMode)
      {
        this.stopTexting();
        return;
      }
    this.isTextMode = true;
    const textEditable = new fabric.Textbox('Text...', {
      left: this.canvas.vptCoords.tl.x, //top left of current canvas view
      top: this.canvas.vptCoords.tl.y, //top left of current canvas view
      width: (this.canvas.vptCoords.tr.x - this.canvas.vptCoords.tl.x) / 2, //dependent on how zoomed in
      fontSize: (this.canvas.vptCoords.bl.y - this.canvas.vptCoords.tl.y) / 5, //dependent on how zoomed in
      editable: true,
    });
    this.canvas.setActiveObject(textEditable); //select textbox
    textEditable.setControlVisible('mt', false); //prevent user being able to distort in y direction
    textEditable.setControlVisible('mb', false); //prevent user being able to distort in y direction
    this.canvas.add(textEditable);
  }

  addAdditionalText() {
    this.isTextMode = true;
    const textEditable = new fabric.Textbox('Text...', {
      left: this.canvas.vptCoords.tl.x, //top left of current canvas view
      top: this.canvas.vptCoords.tl.y, //top left of current canvas view
      width: (this.canvas.vptCoords.tr.x - this.canvas.vptCoords.tl.x) / 2, //dependent on how zoomed in
      fontSize: (this.canvas.vptCoords.bl.y - this.canvas.vptCoords.tl.y) / 5, //dependent on how zoomed in
      editable: true,
    });
    this.canvas.setActiveObject(textEditable); //select textbox
    textEditable.setControlVisible('mt', false); //prevent user being able to distort in y direction
    textEditable.setControlVisible('mb', false); //prevent user being able to distort in y direction
    this.canvas.add(textEditable);
  }

  changeBrushColor(color: string) {
    switch (color) {
      case 'red':
        this.canvas.freeDrawingBrush.color = BRUSHCOLORS.RED;
        break;
      case 'orange':
        this.canvas.freeDrawingBrush.color = BRUSHCOLORS.ORANGE;
        break;
      case 'yellow':
        this.canvas.freeDrawingBrush.color = BRUSHCOLORS.YELLOW;
        break;
      case 'green':
        this.canvas.freeDrawingBrush.color = BRUSHCOLORS.GREEN;
        break;
      case 'light_blue':
        this.canvas.freeDrawingBrush.color = BRUSHCOLORS.LIGHT_BLUE;
        break;
      case 'blue':
        this.canvas.freeDrawingBrush.color = BRUSHCOLORS.BLUE;
        break;
      case 'black':
        this.canvas.freeDrawingBrush.color = BRUSHCOLORS.BLACK;
        break;
    }
  }
  changeTextColor(color: string) {
    switch (color) {
      case 'red':
        this.canvas.getActiveObject().set('fill',TEXTCOLORS.RED)
        this.canvas.renderAll()
        break;
      case 'orange':
        this.canvas.getActiveObject().set('fill',TEXTCOLORS.ORANGE)
        this.canvas.renderAll()
        break;
      case 'yellow':
        this.canvas.getActiveObject().set('fill',TEXTCOLORS.YELLOW)
        this.canvas.renderAll()
        break;
      case 'green':
        this.canvas.getActiveObject().set('fill',TEXTCOLORS.GREEN)
        this.canvas.renderAll()
        break;
      case 'light_blue':
        this.canvas.getActiveObject().set('fill',TEXTCOLORS.LIGHT_BLUE)
        this.canvas.renderAll()
        break;
      case 'blue':
        this.canvas.getActiveObject().set('fill',TEXTCOLORS.BLUE)
        this.canvas.renderAll()
        break;
      case 'black':
        this.canvas.getActiveObject().set('fill',TEXTCOLORS.BLACK)
        this.canvas.renderAll()
        break;
    }
  }

  changeBrushWidth() {
    this.canvas.freeDrawingBrush.width = this.range;
  }

  resetCanvas() {

    this.canvas.setWidth(this.origImage.width * this.zoomLevel);
    this.canvas.setHeight(this.origImage.height * this.zoomLevel);
    this.canvas.viewportTransform = this.defaultViewPort;
    this.scaleCanvas(this.origImage);
    // this.sharedService.setZoomLevel(1); //save back to zoom level 1 for future zooms
  }

  save() {
    this.stopDrawing();
    // this.canvas.setWidth(this.origImage.width * this.zoomLevel);
    // this.canvas.setHeight(this.origImage.height * this.zoomLevel);
    // this.canvas.viewportTransform = this.defaultViewPort;
    // this.canvas.setZoom(1);
    this.resetCanvas();
    this.sharedService.setZoomLevel(1); //save back to zoom level 1 for future zooms

    this.dialogRef.close({
      imageData: this.canvas.toDataURL(),
      drawingWidth: this.canvas.width,
      drawingHeight: this.canvas.height,
      originalWidth: this.origImage.width * this.zoomLevel,
      originalHeight: this.origImage.height * this.zoomLevel
    });

  }

  async getResponse() {
    db.getResponseById(
      this.inspectionDetailService.workorder,
      this.data.response.questionId
    ).then((response) => {
      this.data.response = response;
      this.ref.detectChanges();
      this.ref.markForCheck();
    });
    this.ref.detectChanges();
    this.ref.markForCheck();
  }

  // range slider - show number value
  formatLabel(value: number): string {
    if (value >= 1000) {
      return Math.round(value / 1000) + '';
    }

    return `${value}`;
  }

  close() {
    this.dialogRef.close()
  }
}
