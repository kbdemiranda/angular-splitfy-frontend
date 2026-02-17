import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './features/dashboard/dashboard-component';
import { LoginComponent } from './features/auth/login/login-component';
import { ComingSoonComponent } from './features/common/coming-soon/coming-soon-component';
import { PlatformsComponent } from './features/platforms/platforms-component';
import { SubscribersComponent } from './features/subscribers/subscribers-component';
import { SubscriberSubscriptionsComponent } from './features/subscribers/subscriber-subscriptions-component';

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
    path: 'users/:id/subscriptions',
    component: SubscriberSubscriptionsComponent,
    canActivate: [AuthGuard],
    data: { title: 'Editar assinaturas' },
  },
  {
    path: 'users',
    component: SubscribersComponent,
    canActivate: [AuthGuard],
    data: { title: 'Assinantes' },
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
