import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { DebugComponent } from './components/debug.component';

const routes = [
  {
    path: '',
    component: DebugComponent,
    canActivate: [MsalGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DebugRoutingModule {}
