import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { db } from 'src/databases/db';
import { WorkOrderList } from '../../sync/entities';
import { FormControl } from '@angular/forms';
import { PromptInfoComponent } from '../promptInfo/promptInfo.component';
import { SyncService } from '../../services/sync/sync.service';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-delete-inspection',
  templateUrl: './delete-inspection.component.html',
  styleUrls: ['./delete-inspection.component.scss']
})
export class DeleteInspectionComponent implements OnInit {

  workorders: Array<WorkOrderList> = [];
  deleteWO: any = {};
  deleteMultipleWO: any;
  inspectionList = new FormControl('');
  constructor(
    public dialogRef: MatDialogRef<DeleteInspectionComponent>,
    public dialog: MatDialog, 
    private syncService:SyncService,
    private translate: TranslateService
  ) { }

  async ngOnInit() {
    this.getWorkorders();
  }

  async getWorkorders() {
    this.workorders = await db.fetchAllWorkOrder();
  }

  async onDelete(selectWO:any) {
    let t = await lastValueFrom(this.translate.get(['filters.deleteInspection','filters.deleteInspectionWarn2']))
    let confirmDialogRef = this.dialog.open(PromptInfoComponent, {
      width: '350px',
      data: { title: t['filters.deleteInspection'], 
      content: t['filters.deleteInspectionWarn2'], 
      showYesButton: true, showNoButton: true },
      panelClass: 'custom-dialog'
    });

    confirmDialogRef.afterClosed().subscribe((res) => {
      if(res)
      {
        this.deleteMultipleWO = null;
        this.deleteMultipleWO = this.workorders.filter( wo => selectWO.includes(wo.code));
        db.deleteWorkorders(this.deleteMultipleWO);
        this.syncService.workOrderListUpdated.next(true);
        this.closeDialog();
      }
    });

  }

  closeDialog(){
    this.dialogRef.close();
  }
}
