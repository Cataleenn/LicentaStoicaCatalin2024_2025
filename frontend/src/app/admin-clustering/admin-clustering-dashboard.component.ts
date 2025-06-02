import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { ClusteringService } from '../services/clustering.service';

interface Survey {
  id: number;
  formTitle: string;
  createdAt: string;
  responses?: any[];
  responseCount?: number;
}

interface ClusteringSummary {
  totalClusters: number;
  totalParticipants: number;
  qualityScore: number;
  clusters: Array<{
    id: number;
    name: string;
    size: number;
    description: string;
    characteristics: string[];
  }>;
}

@Component({
  selector: 'app-admin-clustering-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>
    
    <div class="clustering-dashboard">
      <div class="dashboard-header">
        <h1>🧠 Behavioral Clustering Analysis</h1>
        <p>Advanced behavioral pattern recognition și demographic insights</p>
      </div>

      <mat-tab-group class="main-tabs">
        <!-- Tab 1: Survey Selection & Overview -->
        <mat-tab label="📊 Survey Overview">
          <div class="tab-content">
            <div class="survey-selection">
              <mat-card class="selection-card">
                <mat-card-header>
                  <mat-card-title>Select Survey for Analysis</mat-card-title>
                  <mat-card-subtitle>Choose a survey with completed responses to analyze behavioral patterns</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div *ngIf="isLoadingSurveys" class="loading-container">
                    <mat-spinner diameter="30"></mat-spinner>
                    <p>Loading surveys...</p>
                  </div>
                  
                  <div *ngIf="!isLoadingSurveys" class="selection-controls">
                    <mat-select 
                      [(value)]="selectedSurveyId" 
                      placeholder="Select a survey..."
                      (selectionChange)="onSurveySelected($event.value)">
                      <mat-option *ngFor="let survey of availableSurveys" [value]="survey.id">
                        {{ survey.formTitle }} 
                        <span style="color: #666; margin-left: 8px;">
                          ({{ survey.responseCount || 0 }} responses)
                        </span>
                      </mat-option>
                    </mat-select>
                    
                    <button 
                      mat-raised-button 
                      color="primary"
                      [disabled]="!selectedSurveyId || isAnalyzing"
                      (click)="startClusteringAnalysis()">
                      <span *ngIf="!isAnalyzing">🔬 Start Analysis</span>
                      <span *ngIf="isAnalyzing">
                        <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
                        Analyzing...
                      </span>
                    </button>
                    
                    <button 
                      mat-raised-button 
                      color="accent"
                      [disabled]="!selectedSurveyId || isRecomputing"
                      (click)="recomputeMetrics()">
                      <span *ngIf="!isRecomputing">⚙️ Recompute Metrics</span>
                      <span *ngIf="isRecomputing">
                        <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
                        Recomputing...
                      </span>
                    </button>
                  </div>
                  
                  <div *ngIf="errorMessage" style="color: red; margin-top: 1rem;">
                    ⚠️ {{ errorMessage }}
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Survey Analysis Results -->
            <div *ngIf="clusteringSummary" class="overview-grid">
              <mat-card class="summary-card">
                <mat-card-header>
                  <mat-card-title>Analysis Summary</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="summary-stats">
                    <div class="stat">
                      <div class="stat-number">{{ clusteringSummary.totalClusters }}</div>
                      <div class="stat-label">Behavioral Groups</div>
                    </div>
                    <div class="stat">
                      <div class="stat-number">{{ clusteringSummary.totalParticipants }}</div>
                      <div class="stat-label">Participants</div>
                    </div>
                    <div class="stat">
                      <div class="stat-number">{{ (clusteringSummary.qualityScore * 100).toFixed(1) }}%</div>
                      <div class="stat-label">Quality Score</div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="clusters-overview">
                <mat-card-header>
                  <mat-card-title>Identified Behavioral Groups</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="clusters-list">
                    <div 
                      *ngFor="let cluster of clusteringSummary.clusters; let i = index"
                      class="cluster-summary-item"
                      (click)="selectClusterForDetail(cluster.id)">
                      <div class="cluster-info">
                        <h4>{{ cluster.name }}</h4>
                        <div class="cluster-stats">
                          <span>{{ cluster.size }} participants</span>
                          <span class="performance">{{ ((cluster.size / clusteringSummary.totalParticipants) * 100).toFixed(1) }}%</span>
                        </div>
                        <p>{{ cluster.description }}</p>
                        <div>
                          <span 
                            *ngFor="let char of cluster.characteristics" 
                            class="characteristic-tag">
                            {{ char }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Placeholder when no analysis yet -->
            <div *ngIf="!clusteringSummary && !isAnalyzing && selectedSurveyId" class="placeholder-message">
              <p>Click "Start Analysis" to analyze behavioral patterns for the selected survey.</p>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: Interactive Visualization -->
        <mat-tab label="🎨 Interactive Visualization">
          <div class="tab-content">
            <div *ngIf="!clusteringSummary" class="placeholder-message">
              <p>Please select a survey and run analysis first to view interactive visualizations.</p>
            </div>
            <div *ngIf="clusteringSummary">
              <p>Interactive visualization will be displayed here.</p>
              <!-- ClusteringVisualizationComponent va fi adăugat aici -->
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./admin-clustering-dashboard.component.css']
})
export class AdminClusteringDashboardComponent implements OnInit {
  // Properties
  selectedSurveyId: number | null = null;
  isAnalyzing: boolean = false;
  isRecomputing: boolean = false;
  isLoadingSurveys: boolean = true;
  availableSurveys: Survey[] = [];
  clusteringSummary: ClusteringSummary | null = null;
  errorMessage: string = '';
  
  constructor(
    private snackBar: MatSnackBar,
    private clusteringService: ClusteringService
  ) {}

  ngOnInit(): void {
    console.log('Clustering dashboard initialized');
    this.loadAvailableSurveys();
  }

  // Load all surveys that can be analyzed
  loadAvailableSurveys(): void {
    this.isLoadingSurveys = true;
    this.errorMessage = '';
    
    this.clusteringService.getAvailableSurveys().subscribe({
      next: (surveys) => {
        // Filter surveys that have responses
        this.availableSurveys = surveys
          .filter((survey: any) => survey.responses && survey.responses.length > 0)
          .map((survey: any) => ({
            id: survey.id,
            formTitle: survey.formTitle,
            createdAt: survey.createdAt,
            responses: survey.responses,
            responseCount: survey.responses?.length || 0
          }));
        
        console.log('✅ Loaded surveys for clustering:', this.availableSurveys);
        this.isLoadingSurveys = false;
        
        if (this.availableSurveys.length === 0) {
          this.errorMessage = 'No surveys with responses found. Create and collect responses first (minimum 3 responses needed).';
        }
      },
      error: (error) => {
        console.error('❌ Error loading surveys:', error);
        this.errorMessage = 'Failed to load surveys. Please try again.';
        this.isLoadingSurveys = false;
        this.snackBar.open('Error loading surveys', 'Close', { duration: 3000 });
      }
    });
  }

  // When a survey is selected
  onSurveySelected(surveyId: number): void {
    this.selectedSurveyId = surveyId;
    this.clusteringSummary = null; // Clear previous results
    this.errorMessage = '';
    
    console.log('📊 Selected survey for analysis:', surveyId);
    
    // Check if this survey already has clustering results
    this.checkExistingResults(surveyId);
  }

  // Check if survey already has clustering results
  checkExistingResults(surveyId: number): void {
    this.clusteringService.getClusteringResults(surveyId).subscribe({
      next: (results) => {
        if (results.success && results.data) {
          console.log('✅ Found existing clustering results');
          this.displayClusteringResults(results.data);
        }
      },
      error: (error) => {
        console.log('ℹ️ No existing clustering results found');
        // This is normal - just means no analysis has been run yet
      }
    });
  }

  // Start clustering analysis
  startClusteringAnalysis(): void {
    if (!this.selectedSurveyId) {
      this.snackBar.open('Please select a survey first', 'Close', { duration: 3000 });
      return;
    }

    const selectedSurvey = this.availableSurveys.find(s => s.id === this.selectedSurveyId);
    if (!selectedSurvey || !selectedSurvey.responseCount || selectedSurvey.responseCount < 3) {
      this.snackBar.open('Need at least 3 responses for meaningful clustering analysis', 'Close', { duration: 5000 });
      return;
    }

    this.isAnalyzing = true;
    this.errorMessage = '';
    this.clusteringSummary = null;

    console.log('🔬 Starting clustering analysis for survey:', this.selectedSurveyId);

    this.clusteringService.performClusteringAnalysis(this.selectedSurveyId).subscribe({
      next: (response) => {
        console.log('✅ Clustering analysis completed:', response);
        this.isAnalyzing = false;
        
        if (response.success && response.data) {
          this.displayClusteringResults(response.data);
          this.snackBar.open('Clustering analysis completed successfully!', 'Close', { duration: 5000 });
        } else {
          this.errorMessage = response.error || 'Analysis completed but no results returned';
          this.snackBar.open('Analysis completed with issues', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Clustering analysis failed:', error);
        this.isAnalyzing = false;
        this.errorMessage = error.error?.message || 'Clustering analysis failed. Please try again.';
        this.snackBar.open('Clustering analysis failed', 'Close', { duration: 5000 });
      }
    });
  }

  // Display clustering results
  displayClusteringResults(data: any): void {
    console.log('📊 Displaying clustering results:', data);
    
    this.clusteringSummary = {
      totalClusters: data.clusters?.length || 0,
      totalParticipants: data.metadata?.totalParticipants || 0,
      qualityScore: data.metadata?.silhouetteScore || 0,
      clusters: (data.clusters || []).map((cluster: any, index: number) => ({
        id: cluster.id,
        name: cluster.clusterName || `Cluster ${cluster.id}`,
        size: cluster.memberCount || 0,
        description: cluster.clusterDescription || 'No description available',
        characteristics: this.extractCharacteristics(cluster)
      }))
    };
  }

  // Extract key characteristics from cluster profile
  extractCharacteristics(cluster: any): string[] {
    const characteristics: string[] = [];
    const profile = cluster.profile || {};
    
    if (profile.avgTechnicalAptitude > 0.7) characteristics.push('High Tech Aptitude');
    if (profile.avgSpeedIndex > 0.7) characteristics.push('Fast Completion');
    if (profile.avgPrecisionIndex > 0.7) characteristics.push('High Accuracy');
    if (profile.avgSystematicIndex > 0.7) characteristics.push('Systematic Approach');
    if (profile.avgConfidenceIndex > 0.7) characteristics.push('High Confidence');
    if (profile.avgPersistenceIndex > 0.7) characteristics.push('Persistent');
    
    // Add demographic characteristics
    const demo = cluster.demographicProfile || {};
    if (demo.dominantOccupation) characteristics.push(demo.dominantOccupation);
    if (demo.dominantAgeGroup) characteristics.push(demo.dominantAgeGroup);
    
    return characteristics.slice(0, 4); // Limit to 4 characteristics
  }

  // Methods
  onTabChange(event: any): void {
    console.log('Tab changed:', event.index);
  }

  selectClusterForDetail(clusterId: number): void {
    console.log('Selected cluster for details:', clusterId);
    
    if (!this.selectedSurveyId) return;
    
    this.clusteringService.getClusterDetails(this.selectedSurveyId, clusterId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Cluster details:', response.data);
          // Here you could open a detailed dialog or navigate to detail view
          this.snackBar.open(`Viewing details for ${response.data.cluster.clusterName}`, 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error getting cluster details:', error);
        this.snackBar.open('Failed to load cluster details', 'Close', { duration: 3000 });
      }
    });
  }

  onClusterSelected(clusterId: number): void {
    console.log('Cluster selected from visualization:', clusterId);
  }

  onParticipantSelected(participantId: string): void {
    console.log('Participant selected from visualization:', participantId);
  }

  // Recompute metrics for existing responses
  recomputeMetrics(): void {
    if (!this.selectedSurveyId) {
      this.snackBar.open('Please select a survey first', 'Close', { duration: 3000 });
      return;
    }

    this.isRecomputing = true;
    this.errorMessage = '';

    console.log('⚙️ Recomputing metrics for survey:', this.selectedSurveyId);

    this.clusteringService.recomputeMetrics(this.selectedSurveyId).subscribe({
      next: (response) => {
        console.log('✅ Metrics recomputed:', response);
        this.isRecomputing = false;
        
        if (response.success) {
          this.snackBar.open('Metrics recomputed successfully! You can now run clustering analysis.', 'Close', { duration: 5000 });
          // Refresh the survey list to show updated response counts
          this.loadAvailableSurveys();
        } else {
          this.errorMessage = response.error || 'Metrics recomputation failed';
          this.snackBar.open('Metrics recomputation failed', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Metrics recomputation failed:', error);
        this.isRecomputing = false;
        this.errorMessage = error.error?.message || 'Metrics recomputation failed. Please try again.';
        this.snackBar.open('Metrics recomputation failed', 'Close', { duration: 5000 });
      }
    });
  }
}