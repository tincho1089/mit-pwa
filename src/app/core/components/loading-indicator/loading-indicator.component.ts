import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { LoadingIndicatorService } from 'src/app/core/services/loading-indicator.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-loading-indicator',
  templateUrl: './loading-indicator.component.html',
  styleUrls: ['./loading-indicator.component.scss']
})
export class LoadingIndicatorComponent implements OnInit {
  //#region 'Variables'
  public isLoading: boolean=false
  //#endregion 'Variables'

  //#region 'Angular Life Cycle'
  constructor(
    public loadingIndicatorService: LoadingIndicatorService,
    private changeDectection: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.loadingIndicatorService.status$.subscribe((isLoading) => {
      this.isLoading = isLoading;
      this.changeDectection.detectChanges();
    })
  }

  
  //#endregion 'Angular Life Cycle'
}