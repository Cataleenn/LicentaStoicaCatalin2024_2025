import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SurveyService } from '../services/survey.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SurveyPreviewComponent } from './survey-preview.component';
import { SurveyResponsesComponent } from './survey-responses.component';
import { DeleteSurveyDialogComponent } from './delete-survey-dialog.component';

interface Survey {
  id: number;
  formTitle: string;
  adminDescription?: string;
  userInstructions?: string;
  questions: any[];
  required: boolean;
  createdAt: string;
  createdBy?: {
    id: number;
    name: string;
    email: string;
  };
  responses?: any[];
}

@Component({
  selector: 'app-surveys-list',
  standalone: true,
  imports: [
    CommonModule, 
    MatTableModule, 
    MatButtonModule, 
    MatCardModule, 
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './surveys-list.component.html',
  styleUrls: ['./surveys-list.component.css']
})
export class SurveysListComponent implements OnInit {
  surveys: Survey[] = [];
  stats: any = null;
  isLoading = true;
  errorMessage = '';

  constructor(
    private surveyService: SurveyService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadSurveys();
    this.loadStats();
  }

  loadSurveys(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.surveyService.getAllSurveys().subscribe({
      next: (data) => {
        this.surveys = data;
        this.isLoading = false;
        console.log('✅ Chestionare încărcate:', data);
      },
      error: (error) => {
        console.error('❌ Eroare la încărcarea chestionarelor:', error);
        this.errorMessage = 'Eroare la încărcarea chestionarelor';
        this.isLoading = false;
      }
    });
  }

  loadStats(): void {
    this.surveyService.getSurveyStats().subscribe({
      next: (data) => {
        this.stats = data;
        console.log('✅ Statistici încărcate:', data);
      },
      error: (error) => {
        console.error('❌ Eroare la încărcarea statisticilor:', error);
      }
    });
  }

  refreshSurveys(): void {
    this.loadSurveys();
    this.loadStats();
  }

  previewSurvey(survey: Survey): void {
    const dialogRef = this.dialog.open(SurveyPreviewComponent, {
      data: survey,
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'survey-preview-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog preview închis');
    });
  }

  viewResponses(survey: Survey): void {
    console.log('🔹 Opening responses for survey:', survey.id);
    
    if (!survey.responses || survey.responses.length === 0) {
      this.snackBar.open(
        'Nu există răspunsuri pentru acest chestionar.', 
        'OK', 
        { duration: 3000 }
      );
      return;
    }

    const dialogRef = this.dialog.open(SurveyResponsesComponent, {
      data: survey.id,
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'survey-responses-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog răspunsuri închis');
    });
  }

  deleteSurvey(survey: Survey): void {
    console.log('🔹 Starting delete for survey:', survey.id);
    
    const dialogRef = this.dialog.open(DeleteSurveyDialogComponent, {
      data: { survey },
      maxWidth: '600px',
      width: '90vw',
      disableClose: true,
      panelClass: 'delete-survey-dialog'
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      console.log('🔹 Delete dialog result:', confirmed);
      if (confirmed) {
        this.performSurveyDeletion(survey);
      }
    });
  }

  private performSurveyDeletion(survey: Survey): void {
    console.log('🔹 Performing deletion for survey:', survey.id);
    
    this.surveyService.deleteSurvey(survey.id).subscribe({
      next: (response: any) => {
        console.log('✅ Chestionar șters:', response);
        
        this.snackBar.open(
          response.message || 'Chestionar șters cu succes!', 
          'OK', 
          { 
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
        this.refreshSurveys();
      },
      error: (error: any) => {
        console.error('❌ Eroare la ștergerea chestionarului:', error);
        this.snackBar.open(
          error.error?.message || 'Eroare la ștergerea chestionarului!', 
          'OK', 
          { 
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  trackBySurvey(index: number, survey: Survey): number {
    return survey.id;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getQuestionCount(survey: Survey): number {
    return survey.questions?.length || 0;
  }

  getResponseCount(survey: Survey): number {
    return survey.responses?.length || 0;
  }

  copySurveyLink(surveyId: number): void {
    const link = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(link).then(() => {
      this.snackBar.open(
        'Link copiat în clipboard!', 
        'OK', 
        { duration: 3000 }
      );
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.snackBar.open(
        'Link copiat în clipboard!', 
        'OK', 
        { duration: 3000 }
      );
    });
  }
}