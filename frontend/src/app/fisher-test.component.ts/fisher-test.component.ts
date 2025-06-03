// Fisher Test Component Example - frontend/src/app/fisher-test/fisher-test.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { FisherTestService, FisherTestSummary, AllClustersResult } from '../services/fisher-test.service';

@Component({
  selector: 'app-fisher-test',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatChipsModule
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>🔬 Analiză Fisher's Exact Test</mat-card-title>
        <mat-card-subtitle>Identifică întrebările care definesc fiecare cluster</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="fisher-controls">
          <button 
            mat-raised-button 
            color="primary"
            [disabled]="!surveyId || isAnalyzing"
            (click)="runFisherAnalysis()">
            <span *ngIf="!isAnalyzing">🧮 Rulează Testul Fisher</span>
            <span *ngIf="isAnalyzing">
              <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
              Se analizează...
            </span>
          </button>
        </div>

        <!-- Error Message -->
        <div *ngIf="errorMessage" class="error-message">
          <mat-icon color="warn">error</mat-icon>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Fisher Test Results -->
        <div *ngIf="fisherResults" class="fisher-results">
          <!-- Summary -->
          <div class="summary-section">
            <h3>📊 Rezumat General</h3>
            <div class="summary-stats">
              <div class="stat">
                <span class="stat-number">{{ fisherResults.data.totalClusters }}</span>
                <span class="stat-label">Clustere Analizate</span>
              </div>
              <div class="stat">
                <span class="stat-number">{{ fisherResults.data.totalSignificantQuestions }}</span>
                <span class="stat-label">Întrebări Semnificative</span>
              </div>
            </div>
          </div>

          <!-- Most Important Questions Overall -->
          <div class="important-questions-section">
            <h3>🎯 Întrebările Cele Mai Importante</h3>
            <div class="question-importance-list">
              <mat-card 
                *ngFor="let question of fisherResults.data.questionImportanceRanking.slice(0, 3)"
                class="importance-card"
                [ngClass]="'importance-' + question.importance">
                <mat-card-content>
                  <div class="question-header">
                    <h4>{{ question.questionText }}</h4>
                    <mat-chip 
                      [color]="question.importance === 'high' ? 'accent' : question.importance === 'medium' ? 'primary' : 'warn'"
                      selected>
                      {{ question.importance === 'high' ? 'Impact Mare' : question.importance === 'medium' ? 'Impact Mediu' : 'Impact Mic' }}
                    </mat-chip>
                  </div>
                  <div class="question-stats">
                    <span>Semnificativ în {{ question.timesSignificant }} clustere</span>
                    <span>P-value mediu: {{ question.avgPValue.toFixed(4) }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>

          <!-- Detailed Results by Cluster -->
          <div class="cluster-details-section">
            <h3>🔍 Detalii pe Clustere</h3>
            <mat-accordion>
              <mat-expansion-panel 
                *ngFor="let cluster of allClustersResult.data.clusters; let i = index"
                class="cluster-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    Cluster {{ cluster.clusterId }}
                    <mat-chip color="primary" selected class="question-count-chip">
                      {{ cluster.significantQuestions.length }} întrebări semnificative
                    </mat-chip>
                  </mat-panel-title>
                </mat-expansion-panel-header>
                
                <div class="cluster-content">
                  <div *ngIf="cluster.significantQuestions.length === 0" class="no-significant">
                    Nu au fost găsite întrebări semnificative pentru acest cluster.
                  </div>
                  
                  <div *ngFor="let question of cluster.significantQuestions" class="question-result">
                    <div class="question-info">
                      <h5>{{ question.questionText }}</h5>
                      <div class="answer-info">
                        <strong>Răspuns caracteristic:</strong> "{{ question.answerValue }}"
                      </div>
                      <div class="statistical-info">
                        <mat-chip 
                          [color]="question.isSignificant ? 'accent' : 'primary'"
                          selected>
                          p = {{ question.pValue.toFixed(4) }}
                          {{ question.isSignificant ? ' (SEMNIFICATIV)' : ' (potențial relevant)' }}
                        </mat-chip>
                      </div>
                      <div class="explanation">
                        {{ question.explanation }}
                      </div>
                    </div>
                  </div>
                </div>
              </mat-expansion-panel>
            </mat-accordion>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .fisher-controls {
      margin-bottom: 2rem;
      text-align: center;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 1rem 0;
      padding: 1rem;
      background-color: #ffebee;
      border-radius: 8px;
      color: #c62828;
    }

    .fisher-results {
      margin-top: 2rem;
    }

    .summary-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
      border-radius: 12px;
      text-align: center;
    }

    .summary-stats {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin-top: 1rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #1976d2;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .important-questions-section {
      margin-bottom: 2rem;
    }

    .question-importance-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1rem;
    }

    .importance-card {
      transition: transform 0.2s ease;
    }

    .importance-card:hover {
      transform: translateY(-2px);
    }

    .importance-high {
      border-left: 6px solid #4caf50;
    }

    .importance-medium {
      border-left: 6px solid #2196f3;
    }

    .importance-low {
      border-left: 6px solid #ff9800;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .question-header h4 {
      margin: 0;
      color: #1a2a6c;
    }

    .question-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      color: #666;
    }

    .cluster-details-section {
      margin-bottom: 2rem;
    }

    .cluster-panel {
      margin-bottom: 1rem;
    }

    .question-count-chip {
      margin-left: 1rem;
    }

    .cluster-content {
      padding: 1rem;
    }

    .no-significant {
      text-align: center;
      color: #666;
      font-style: italic;
      padding: 2rem;
    }

    .question-result {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #fafafa;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .question-info h5 {
      margin: 0 0 0.5rem 0;
      color: #1a2a6c;
    }

    .answer-info {
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .statistical-info {
      margin-bottom: 0.5rem;
    }

    .explanation {
      font-size: 0.9rem;
      color: #555;
      line-height: 1.4;
      font-style: italic;
    }

    @media (max-width: 768px) {
      .summary-stats {
        flex-direction: column;
        gap: 1rem;
      }

      .question-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .question-stats {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `]
})
export class FisherTestComponent implements OnInit {
  @Input() surveyId: number | null = null;
  
  isAnalyzing = false;
  errorMessage = '';
  fisherResults: { data: FisherTestSummary } | null = null;
  allClustersResult: { data: AllClustersResult } | null = null;

  constructor(private fisherTestService: FisherTestService) {}

  ngOnInit(): void {
    // Auto-run analysis if surveyId is provided
    if (this.surveyId) {
      this.runFisherAnalysis();
    }
  }

  runFisherAnalysis(): void {
    if (!this.surveyId) {
      this.errorMessage = 'Nu a fost selectat un chestionar';
      return;
    }

    this.isAnalyzing = true;
    this.errorMessage = '';
    this.fisherResults = null;
    this.allClustersResult = null;

    console.log('🔬 Starting Fisher analysis for survey:', this.surveyId);

    // Get summary first
    this.fisherTestService.getFisherTestSummary(this.surveyId).subscribe({
      next: (summaryResponse) => {
        if (summaryResponse.success) {
          this.fisherResults = summaryResponse;
          
          // Then get detailed results
          this.fisherTestService.getAllClustersSignificantQuestions(this.surveyId!).subscribe({
            next: (detailResponse) => {
              if (detailResponse.success) {
                this.allClustersResult = detailResponse;
                console.log('✅ Fisher analysis completed successfully');
              } else {
                this.errorMessage = detailResponse.message || 'Eroare la obținerea detaliilor Fisher test';
              }
              this.isAnalyzing = false;
            },
            error: (error) => {
              console.error('❌ Error getting Fisher details:', error);
              this.errorMessage = 'Eroare la obținerea detaliilor Fisher test';
              this.isAnalyzing = false;
            }
          });
        } else {
          this.errorMessage = summaryResponse.message || 'Eroare la rularea Fisher test';
          this.isAnalyzing = false;
        }
      },
      error: (error) => {
        console.error('❌ Error running Fisher analysis:', error);
        this.errorMessage = error.error?.message || 'Eroare la rularea Fisher test';
        this.isAnalyzing = false;
      }
    });
  }
}