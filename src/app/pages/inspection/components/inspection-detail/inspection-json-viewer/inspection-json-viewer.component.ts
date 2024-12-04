import { Component, Input, OnDestroy, OnInit } from '@angular/core';


@Component({
  selector: 'inspection-json-viewer',
  templateUrl: './inspection-json-viewer.component.html',
  styleUrls: ['./inspection-json-viewer.component.scss']
})
export class InspectionJsonViewerComponent implements OnInit, OnDestroy {
  @Input() jsonObj: any = null;
  @Input() visible: boolean = true;
  @Input() height: string = 'auto';
  @Input() title: string = 'Inspection Debug Viewer'; 
  @Input() expanded: boolean = false;
  @Input() mode: string = 'auto'; // 'auto' || 'live' || 'interactable'


  public jsonInteractable: any;
  public activeMode = 'live'

  ngOnInit() {
    if (this.mode != 'auto') 
      this.activeMode = this.mode;
    if (this.mode == 'interactable')
      this.reload();
  }

  ngOnDestroy(): void {
    this.jsonObj = null;
  }

  reload() {
    // https://github.com/hivivo/ngx-json-viewer/issues/6#issuecomment-585274151
    // this works, but doesnt refresh automatically
    this.jsonInteractable = { ...this.jsonObj };
  }

  getLiveJson() {
    // https://github.com/hivivo/ngx-json-viewer/issues/6#issuecomment-540788504
    // this works, but doesnt let you interact with nested json
    return JSON.parse(
      JSON.stringify(
        this.jsonObj || ''
      )
    )
  }
  autoModeSwap() {
    // triggered on double click with live reload
    if (this.mode=='auto') {this.activeMode='interactable'}
  }
  swapModes() {
    if (this.activeMode == 'interactable') {
      this.activeMode = 'live';
    } else {
      this.reload();
      this.activeMode = 'interactable';
    }
  }
}
