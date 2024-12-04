import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { PromptInfoComponent } from "src/app/core/components/promptInfo/promptInfo.component";
import { MatDialog } from "@angular/material/dialog";
import { db } from 'src/databases/db';

@Component({
    selector: 'app-cleanup',
    templateUrl: './cleanup.component.html',
    styleUrls: ['./cleanup.component.scss'],
})
export class CleanupComponent implements OnInit {
    countSubmitted: number = 0;
    countUnassigned: number = 0;

    constructor(public dialog: MatDialog, public ref: ChangeDetectorRef){}

    async ngOnInit(){
        this.getCounts()
    }

    private async getCounts(){
        this.countSubmitted = await db.countWorkOrderByStatus(99);
        this.countUnassigned = await db.countWorkOrderByStatus(100);
    }

    public triggerDelete(statusId: number){
        let title: string;
        let content: string;

        if(statusId == 99){
            title = 'filters.deleteSubmitted';
            content = 'filters.confirmDeleteSubmitted';
        }
        else if(statusId == 100){
            title = 'filters.deleteUnassigned'
            content = 'filters.confirmDeleteUnassigned'
        }
        
        
        const handleDialogAnswer = (async (answer: any) => {
            if (answer) {
                await this.executeDelete(statusId);
                await this.getCounts();
                this.ref.detectChanges();
                this.dialog.open(PromptInfoComponent, {
                    width: '350px',
                    data: { title: 'Removed', content: 'Inspections were successfully removed from your device', showOkButton: true },
                    panelClass: 'custom-dialog'
                });
            }
        });
    
        this.dialog.open(PromptInfoComponent, {
            width: '350px',
            data: { title, content, showYesButton: true, showNoButton: true },
            panelClass: 'custom-dialog'
        }).afterClosed().subscribe(handleDialogAnswer);
    }

    private async executeDelete(statusId: number){ //fetch all wos with a given statusId, then delete them
        let wos = await db.getWorkOrdersByStatus([statusId]);
        db.deleteWorkorders(wos);
    }

}