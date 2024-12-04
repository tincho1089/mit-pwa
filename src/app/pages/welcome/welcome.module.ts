import { NgModule } from '@angular/core';
import { WelcomeComponent } from './components/welcome.component';
import { WelcomeRoutingModule } from './welcome.routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [WelcomeComponent],
  imports: [WelcomeRoutingModule, SharedModule, TranslateModule],
})
export class WelcomeModule {}