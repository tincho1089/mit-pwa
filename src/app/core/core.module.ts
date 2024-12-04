import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpBackend, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { ErrorDialogComponent} from './components/error-dialog/error-dialog.component';
import { PromptInfoComponent } from './components/promptInfo/promptInfo.component';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { DeleteInspectionComponent } from './components/delete-inspection/delete-inspection.component';
import { InspDetailNavComponent } from './components/insp-detail-nav/insp-detail-nav.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({ declarations: [
        HeaderComponent,
        FooterComponent,
        LoadingIndicatorComponent,
        ErrorDialogComponent,
        PromptInfoComponent,
        DeleteInspectionComponent,
        InspDetailNavComponent
    ],
    exports: [
        HeaderComponent,
        FooterComponent,
        LoadingIndicatorComponent,
        ErrorDialogComponent,
        PromptInfoComponent
    ], imports: [CommonModule, RouterModule, SharedModule, MatProgressSpinnerModule,
        ReactiveFormsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpBackend]
            }
        })], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule?: CoreModule) {
    if (parentModule) {
      throw new Error(
        'CoreModule is already loaded. Import it in the AppModule only'
      );
    }
  }
}

export function createTranslateLoader(handler: HttpBackend) {
  const http = new HttpClient(handler);
  return new TranslateHttpLoader(http, '../../assets/i18n/', '.json');
}