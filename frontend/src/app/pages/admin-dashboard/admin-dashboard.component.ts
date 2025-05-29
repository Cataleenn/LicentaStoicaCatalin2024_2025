import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SurveysListComponent } from '../../surveys-list/surveys-list.component';
import { UserManagementComponent } from '../user-management/user-management.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    NavbarComponent,
    SurveysListComponent,
    UserManagementComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  showSurveys = false;
  showStatistics = false;
  showAdminManagement = false;

  toggleSurveys(): void {
    this.showSurveys = !this.showSurveys;
    if (this.showSurveys) {
      this.showStatistics = false;
      this.showAdminManagement = false;
    }
  }

  toggleStatistics(): void {
    this.showStatistics = !this.showStatistics;
    if (this.showStatistics) {
      this.showSurveys = false;
      this.showAdminManagement = false;
    }
  }

  toggleAdminManagement(): void {
    this.showAdminManagement = !this.showAdminManagement;
    if (this.showAdminManagement) {
      this.showSurveys = false;
      this.showStatistics = false;
    }
  }
}