import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AppComponent } from './app/app.component';
import { AdminDashboardComponent } from './app/pages/admin-dashboard/admin-dashboard.component';
import { CreareChestionarComponent } from './app/pages/creare-chestionar/creare-chestionar.component';
import { LoginComponent } from './app/pages/login/login.component';
import { authInterceptor } from './app/services/auth-interceptor.service';
import { AuthGuard } from './app/guards/auth.guard';
import { JwtHelperService } from '@auth0/angular-jwt';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'creare-chestionar', component: CreareChestionarComponent } 
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      FormsModule,
      MatToolbarModule,
      MatButtonModule
    ),
    JwtHelperService
  ]
}).catch(err => console.error(err));
