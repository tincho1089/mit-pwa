import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ErrorDialogComponent } from '../components/error-dialog/error-dialog.component';
import { ApplicationInsightsService } from './applicationInsights.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorDialogService {

  constructor(
    private dialog: MatDialog,
    private appInsights: ApplicationInsightsService
    ) { }

  //errorMessage is a brief, user friendly description of the error
  //fullError is the actual error message provided by the code
  openDialog(errorMessage: string, fullError: string): void {

    this.appInsights.logException( new Error(fullError));

    this.dialog.open(ErrorDialogComponent, {
      data: [errorMessage, fullError],
      width: '75%',
      panelClass: 'custom-dialog'
    });
  }
}