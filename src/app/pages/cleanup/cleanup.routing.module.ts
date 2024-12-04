import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { CleanupComponent } from './components/cleanup.component';

const routes = [
  {
    path: '',
    component: CleanupComponent,
    canActivate: [MsalGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CleanupRoutingModule {}
