import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-tml-detail-modal',
  templateUrl: './tml-detail-modal.component.html',
  styleUrls: ['./tml-detail-modal.component.scss']
})
export class TmlDetailModalComponent {

  reading:any;
  tableStructure: any;
  Id: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any,
  public dialogRef: MatDialogRef<TmlDetailModalComponent>) { }

  ngOnInit() {
    this.reading = this.data.data;
    this.tableStructure = this.data.tableStructure;
    this.Id = this.data.Id
  }

}
