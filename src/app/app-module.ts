import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LoginComponent } from './features/auth/login/login-component';
import { DashboardComponent } from './features/dashboard/dashboard-component';
import { NavbarComponent, LUCIDE_ICONS } from './layout/navbar/navbar-component';
import { ComingSoonComponent } from './features/common/coming-soon/coming-soon-component';
import { PlatformsComponent } from './features/platforms/platforms-component';
import { SubscribersComponent } from './features/subscribers/subscribers-component';
import { SubscriberSubscriptionsComponent } from './features/subscribers/subscriber-subscriptions-component';
import { SettingsComponent } from './features/settings/settings-component';
import { ApiBaseUrlInterceptor } from './core/interceptors/api-base-url.interceptor';
import { MockBackendInterceptor } from './core/interceptors/mock-backend.interceptor';
import { AuthTokenInterceptor } from './core/interceptors/auth-token.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    DashboardComponent,
    NavbarComponent,
    ComingSoonComponent,
    PlatformsComponent,
    SubscribersComponent,
    SubscriberSubscriptionsComponent,
    SettingsComponent,
  ],
  imports: [BrowserModule, ReactiveFormsModule, AppRoutingModule, LUCIDE_ICONS],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: ApiBaseUrlInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthTokenInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [App],
})
export class AppModule {}
