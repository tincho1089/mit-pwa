import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

const routes: Routes = [
  { //page users see when first opening the app, unprotected by msal
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full',
  },
  {
    path: 'welcome',
    loadChildren: () => import('./pages/welcome/welcome.module').then(module => module.WelcomeModule),
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(module => module.HomeModule),
    canActivate: [MsalGuard],
  },
  {
    path: 'debug',
    loadChildren: () => import('./pages/debug/debug.module').then(module => module.DebugModule),
  },
  {
    path: 'inspection',
    loadChildren: () => import('./pages/inspection/inspection.module').then(module => module.InspectionModule),
    canActivate: [MsalGuard],
  },
  {
    path: 'cleanup',
    loadChildren: () => import('./pages/cleanup/cleanup.module').then(module => module.CleanupModule),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }