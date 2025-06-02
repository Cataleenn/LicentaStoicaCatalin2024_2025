// frontend/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { SurveyCreateComponent } from './survey-create/survey-create.component';
import { SurveyViewComponent } from './survey-view/survey-view.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { AdminClusteringDashboardComponent } from './admin-clustering/admin-clustering-dashboard.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'creare-chestionar', 
    component: SurveyCreateComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'utilizatori', 
    component: UserManagementComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'analiza-clustering',  // 🆕 Ruta pentru clustering
    component: AdminClusteringDashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'survey/:id', 
    component: SurveyViewComponent 
  },
  { path: '**', redirectTo: '/login' }
];