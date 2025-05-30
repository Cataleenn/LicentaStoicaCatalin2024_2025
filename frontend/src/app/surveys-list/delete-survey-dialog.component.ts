import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface DeleteSurveyData {
  survey: {
    id: number;
    formTitle: string;
    responses?: any[];
  };
}

@Component({
  selector: 'app-delete-survey-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-header">
      <mat-icon color="warn">warning</mat-icon>
      <h2 mat-dialog-title>Confirmare Ștergere</h2>
    </div>

    <mat-dialog-content class="dialog-content">
      <div class="survey-info">
        <h3>{{ data.survey.formTitle }}</h3>
        <p>Ești sigur că vrei să ștergi acest chestionar?</p>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="cancel()">Anulează</button>
      <button mat-raised-button color="warn" (click)="confirm()">Șterge</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 16px 24px;
      background-color: #fff3e0;
    }
    .dialog-content {
      padding: 24px;
    }
    .dialog-actions {
      padding: 16px 24px;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
  `]
})
export class DeleteSurveyDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DeleteSurveyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteSurveyData
  ) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}