import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';  
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AppComponent } from './app/app.component';
import { AdminDashboardComponent } from './app/pages/admin-dashboard/admin-dashboard.component';
import { LoginComponent } from './app/pages/login/login.component';
import { authInterceptor } from './app/services/auth-interceptor.service';
import { AuthGuard } from './app/guards/auth.guard';
import { JwtHelperService } from '@auth0/angular-jwt';
import { SurveyCreateComponent } from './app/survey-create/survey-create.component';
import { SurveyViewComponent } from './app/survey-view/survey-view.component';
import { UserManagementComponent } from './app/pages/user-management/user-management.component';
import { AdminClusteringDashboardComponent } from './app/admin-clustering/admin-clustering-dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'admin-dashboard', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'creare-chestionar', component: SurveyCreateComponent, canActivate: [AuthGuard] },
  { path: 'utilizatori', component: UserManagementComponent, canActivate: [AuthGuard] },
  { path: 'clustering-analysis', component: AdminClusteringDashboardComponent, canActivate: [AuthGuard] },
  { path: 'survey/:id', component: SurveyViewComponent },
  { path: '**', redirectTo: '/login' }
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(
      FormsModule, 
      ReactiveFormsModule,  
      MatToolbarModule,
      MatButtonModule
    ),
    JwtHelperService
  ]
}).catch(err => console.error(err));