import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { CleanupComponent } from './components/cleanup.component';
import { CleanupRoutingModule } from './cleanup.routing.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [CleanupComponent],
  imports: [CommonModule, CleanupRoutingModule, SharedModule, TranslateModule.forChild()],
})
export class CleanupModule {}