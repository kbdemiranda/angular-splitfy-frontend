import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './features/dashboard/dashboard-component';
import { LoginComponent } from './features/auth/login/login-component';
import { ComingSoonComponent } from './features/common/coming-soon/coming-soon-component';
import { PlatformsComponent } from './features/platforms/platforms-component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'users',
    component: ComingSoonComponent,
    canActivate: [AuthGuard],
    data: { title: 'Usuários' },
  },
  {
    path: 'platforms',
    component: PlatformsComponent,
    canActivate: [AuthGuard],
    data: { title: 'Plataformas' },
  },
  {
    path: 'settings',
    component: ComingSoonComponent,
    canActivate: [AuthGuard],
    data: { title: 'Configurações' },
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
