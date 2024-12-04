import { NgModule } from "@angular/core";
import { SyncService } from "./sync/sync.service";
import { LoadingIndicatorService } from "./loading-indicator.service";
import { ErrorDialogService } from "./error.service";
import { SharedService } from "./shared.service";
import { APIModule } from "./api/api.module";

@NgModule({
    declarations: [],
    imports: [APIModule],
    providers: [
        SyncService,
        LoadingIndicatorService,
        ErrorDialogService,
        SharedService
    ],
    exports: []
  })
  export class ServiceModule { }