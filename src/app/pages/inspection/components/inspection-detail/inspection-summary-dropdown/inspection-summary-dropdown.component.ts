import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-inspection-summary-dropdown',
  templateUrl: './inspection-summary-dropdown.component.html',
  styleUrls: ['./inspection-summary-dropdown.component.scss']
})
export class InspectionSummaryDropdownComponent {
  selectedOption: string = '';

  constructor(
    public dialogRef: MatDialogRef<InspectionSummaryDropdownComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { options: string[] }
  ) { }

  selectOption(option: string): void {
    this.selectedOption = option;
  }

  confirmSelection(): void {
    if (this.selectedOption) {
      this.dialogRef.close(this.selectedOption);
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
