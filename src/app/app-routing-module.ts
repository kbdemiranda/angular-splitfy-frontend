import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './features/dashboard/dashboard-component';
import { LoginComponent } from './features/auth/login/login-component';
import { SettingsComponent } from './features/settings/settings-component';
import { PlatformsComponent } from './features/platforms/platforms-component';
import { SubscribersComponent } from './features/subscribers/subscribers-component';
import { SubscriberSubscriptionsComponent } from './features/subscribers/subscriber-subscriptions-component';
import { PaymentConfirmationsComponent } from './features/payment-confirmations/payment-confirmations-component';

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
    path: 'payment-confirmations',
    component: PaymentConfirmationsComponent,
    canActivate: [AuthGuard],
    data: { title: 'Confirmações de pagamento' },
  },
  {
    path: 'settings',
    component: SettingsComponent,
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
