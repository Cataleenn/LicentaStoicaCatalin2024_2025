import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SurveyService } from '../services/survey.service';

@Component({
  selector: 'app-survey-responses',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-header">
      <h2 mat-dialog-title>📊 Răspunsuri Chestionar</h2>
      <button mat-icon-button (click)="close()" class="close-button">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="dialog-content">
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Se încarcă răspunsurile...</p>
      </div>

      <div *ngIf="errorMessage" class="error-container">
        <mat-icon color="warn">error</mat-icon>
        <p>{{ errorMessage }}</p>
      </div>

      <div *ngIf="!isLoading && !errorMessage && surveyData" class="responses-container">
        <div class="survey-header">
          <h3>{{ surveyData.survey.formTitle }}</h3>
          <p><strong>Total răspunsuri:</strong> {{ surveyData.totalResponses }}</p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="close()">Închide</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 24px;
      border-bottom: 1px solid #e0e0e0;
    }
    .dialog-content {
      max-height: 70vh;
      overflow-y: auto;
      padding: 24px;
      min-width: 500px;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      text-align: center;
    }
  `]
})
export class SurveyResponsesComponent implements OnInit {
  surveyData: any = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<SurveyResponsesComponent>,
    @Inject(MAT_DIALOG_DATA) public surveyId: number,
    private surveyService: SurveyService
  ) {}

  ngOnInit(): void {
    this.loadResponses();
  }

  loadResponses(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.surveyService.getSurveyResponses(this.surveyId).subscribe({
      next: (data: any) => {
        this.surveyData = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Eroare la încărcarea răspunsurilor';
        this.isLoading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}