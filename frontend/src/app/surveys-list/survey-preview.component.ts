import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-survey-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './survey-preview.component.html',
  styleUrls: ['./survey-preview.component.css']
})
export class SurveyPreviewComponent {
  constructor(
    public dialogRef: MatDialogRef<SurveyPreviewComponent>,
    @Inject(MAT_DIALOG_DATA) public survey: any
  ) {}

  close(): void {
    this.dialogRef.close();
  }

  openSurvey(): void {
    window.open(`/survey/${this.survey.id}`, '_blank');
    this.close();
  }

  getQuestionTypeLabel(type: string): string {
    const typeMap: { [key: string]: string } = {
      'single_choice': 'Alegere unică',
      'multiple_choice': 'Alegere multiplă',
      'open_ended': 'Text liber',
      'text': 'Text liber',
      'long_text': 'Text lung'
    };
    return typeMap[type] || type;
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getQuestionTypeColor(type: string): 'primary' | 'accent' | 'warn' {
    switch (type) {
      case 'single_choice':
        return 'primary';
      case 'multiple_choice':
        return 'accent';
      case 'open_ended':
      case 'text':
        return 'warn';
      default:
        return 'primary';
    }
  }

  hasOptions(question: any): boolean {
    return (question.questionType === 'single_choice' || 
            question.questionType === 'multiple_choice') && 
           question.options && 
           question.options.length > 0;
  }

  isTextQuestion(question: any): boolean {
    return question.questionType === 'open_ended' || 
           question.questionType === 'text' || 
           question.questionType === 'long_text';
  }
}