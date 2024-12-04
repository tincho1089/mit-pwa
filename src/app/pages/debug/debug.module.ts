import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { DebugComponent } from './components/debug.component';
import { DebugRoutingModule } from './debug.routing.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [DebugComponent],
  imports: [CommonModule, DebugRoutingModule, SharedModule,  TranslateModule.forChild()],
})
export class DebugModule {}