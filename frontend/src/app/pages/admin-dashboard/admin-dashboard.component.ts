import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { NavbarComponent } from '../../navbar/navbar.component';
import { SurveysListComponent } from '../../surveys-list/surveys-list.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    NavbarComponent,
    SurveysListComponent
  ],
  template: `
    <app-navbar></app-navbar>
    
    <div class="dashboard-container">
      <div class="welcome-section">
        <h1>🎯 Admin Dashboard</h1>
        <p>Bun venit în panoul de administrare al sistemului de chestionare!</p>
      </div>

      <div class="quick-actions">
        <mat-card class="action-card">
          <mat-card-header>
            <mat-card-title>⚡ Acțiuni Rapide</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-buttons">
              <button mat-raised-button color="primary" (click)="showSurveys = !showSurveys">
                📊 {{ showSurveys ? 'Ascunde' : 'Vezi' }} Chestionarele
              </button>
              <button mat-raised-button color="accent" routerLink="/creare-chestionar">
                ➕ Crează Chestionar Nou
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Surveys List Component -->
      <div *ngIf="showSurveys" class="surveys-section">
        <app-surveys-list></app-surveys-list>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding-top: 80px; /* Account for fixed navbar */
      min-height: 100vh;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      padding-left: 24px;
      padding-right: 24px;
      padding-bottom: 24px;
    }

    .welcome-section {
      text-align: center;
      margin-bottom: 2rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .welcome-section h1 {
      color: #1a2a6c;
      margin: 0 0 1rem 0;
      font-size: 2.2rem;
    }

    .welcome-section p {
      color: #666;
      font-size: 1.1rem;
      margin: 0;
    }

    .quick-actions {
      margin-bottom: 2rem;
    }

    .action-card {
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .action-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .action-buttons button {
      min-width: 200px;
      padding: 12px 24px;
      font-size: 1rem;
      font-weight: 600;
    }

    .surveys-section {
      background: rgba(255, 255, 255, 0.95);
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding-left: 16px;
        padding-right: 16px;
      }

      .welcome-section h1 {
        font-size: 1.8rem;
      }

      .action-buttons {
        flex-direction: column;
        align-items: center;
      }

      .action-buttons button {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class AdminDashboardComponent {
  showSurveys = false;
}