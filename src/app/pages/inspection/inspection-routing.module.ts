import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { InspectionDetailComponent } from './components/inspection-detail/inspection-detail.component';
import { AddInspectionItemComponent } from './components/inspection-detail/add-inspection-item/add-inspection-item.component';

const routes = [
  {
    path: ':id',
    component: InspectionDetailComponent,
    canActivate: [MsalGuard],
  },
  {
    path: ':id/add',
    component: AddInspectionItemComponent,
    canActivate: [MsalGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InspectionRoutingModule {}
