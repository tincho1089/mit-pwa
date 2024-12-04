import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { Observable, Subject } from 'rxjs';
import { DeviceInfoService } from 'src/app/core/services/device-info.service';
import { SharedService } from 'src/app/core/services/shared.service';


@Component({
  templateUrl: './photo-dialog.component.html',
  styleUrls: ['./photo-dialog.component.scss']
})
export class PhotoDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('nativeInput') nativeInput: ElementRef<HTMLElement>;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  public facingMode: string = 'environment';
  public mediaDevices: MediaDeviceInfo[];
  public errors: WebcamInitError[] = [];
  public useNativeCapture: boolean = false;
  
  public width: number;
  public height: number;
  public zoomLevel: number = 1;

  // latest snapshot
  public webcamImage: WebcamImage = null;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<
    boolean | string
  >();

  constructor(
    public dialogRef: MatDialogRef<PhotoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private device: DeviceInfoService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.sharedService.setZoomLevel(1);
    this.determineCaptureStrategy();
    if (!this.useNativeCapture) {
      this.initWebCapture();
    }
    
  }

  ngAfterViewInit() {
    if (this.useNativeCapture) {
      this.nativeInput.nativeElement.click();
    }
    
  }

  ngOnDestroy(): void {
    this.mediaDevices = null;
    this.errors = null;
    this.webcamImage = null;
  }

  initWebCapture() {
    WebcamUtil.getAvailableVideoInputs().then(
      (mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
        this.mediaDevices = mediaDevices;
      }
    );
  }

  determineCaptureStrategy() {
    let os = this.device.getOS().toLowerCase();
    if (['ios','android'].includes(os)) {
      this.useNativeCapture = true;
    } else {
      this.useNativeCapture = false;
    }
  }

  close() {
    if(this.webcamImage){
      this.dialogRef.close(this.webcamImage.imageAsDataUrl);
    } else {
      this.dialogRef.close();
    }
  }

  async ingestNativePhoto(photo) {
    const rawFile = photo.target.files[0];
    let fr = new FileReader();
    fr.onloadend = ((event) => {
      this.dialogRef.close(String(event.target.result));
    });

    fr.onerror = (error) => {
      console.error('[PhotoCapture] Native capture failed. Falling back to web.');
      console.error(error);
      this.useNativeCapture = false;
      this.initWebCapture();
    }

    fr.readAsDataURL(rawFile);

  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    this.webcamImage = webcamImage;
    this.close();
  }

  public cameraWasSwitched(deviceId: string): void {
    this.deviceId = deviceId;

    let cam = this.mediaDevices.find(x => x.deviceId == deviceId)
    console.log(`[PhotoCapture] Camera Switched: ${cam?.label}`);
    console.log(this.mediaDevices);
  }

  public zoomIn() {
    this.zoomLevel = this.zoomLevel + 0.2;
    this.sharedService.setZoomLevel(this.zoomLevel);
  }

  public zoomOut() {
    this.zoomLevel = this.zoomLevel - 0.2;
    this.sharedService.setZoomLevel(this.zoomLevel);
  }

  public get videoOptions(): MediaTrackConstraints {
    // set ideal camera direction (probs not selfie cam)
    const result: MediaTrackConstraints = {};
    if (this.facingMode && this.facingMode !== '') {
      result.facingMode = { ideal: this.facingMode };
    }

    result.width = 9999;
    result.height = 9999;

    return result;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
    if (
      error.mediaStreamError &&
      error.mediaStreamError.name === 'NotAllowedError'
    ) {
      console.warn('Camera access was not allowed by user!');
    }
  }
}
