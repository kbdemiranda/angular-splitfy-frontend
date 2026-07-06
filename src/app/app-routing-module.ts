import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './features/dashboard/dashboard-component';
import { LoginComponent } from './features/auth/login/login-component';
import { RegisterComponent } from './features/auth/register/register-component';
import { SettingsComponent } from './features/settings/settings-component';
import { PlatformsComponent } from './features/platforms/platforms-component';
import { PlatformParticipantsComponent } from './features/platforms/platform-participants-component';
import { SubscribersComponent } from './features/subscribers/subscribers-component';
import { SubscriberSubscriptionsComponent } from './features/subscribers/subscriber-subscriptions-component';
import { BillingChargesComponent } from './features/billing-charges/billing-charges-component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'subscriber/:id/subscriptions',
    component: SubscriberSubscriptionsComponent,
    canActivate: [AuthGuard],
    data: { title: 'Editar assinaturas' },
  },
  {
    path: 'subscriber',
    component: SubscribersComponent,
    canActivate: [AuthGuard],
    data: { title: 'Assinantes' },
  },
  {
    path: 'platforms/:id/participants',
    component: PlatformParticipantsComponent,
    canActivate: [AuthGuard],
    data: { title: 'Participantes da plataforma' },
  },
  {
    path: 'platforms',
    component: PlatformsComponent,
    canActivate: [AuthGuard],
    data: { title: 'Plataformas' },
  },
  {
    path: 'billing-charges',
    component: BillingChargesComponent,
    canActivate: [AuthGuard],
    data: { title: 'Cobranças' },
  },
  {
    path: 'payment-confirmations',
    pathMatch: 'full',
    redirectTo: 'billing-charges',
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
