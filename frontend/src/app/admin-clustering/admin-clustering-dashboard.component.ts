// Updated Admin Clustering Dashboard - frontend/src/app/admin-clustering/admin-clustering-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
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

interface ClusterDetail {
  id: number;
  name: string;
  size: number;
  percentage: number;
  description: string;
  detailedProfile: string;
  characteristics: string[];
  performanceMetrics: {
    technicalAptitude: number;
    speedIndex: number;
    precisionIndex: number;
    confidenceIndex: number;
    systematicIndex: number;
    persistenceIndex: number;
  };
}

interface ClusteringSummary {
  totalClusters: number;
  totalParticipants: number;
  qualityScore: number;
  clusters: ClusterDetail[];
  insights: string[];
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
    MatExpansionModule,
    MatIconModule,
    FormsModule,
    NavbarComponent
  ],
  template: `
    <app-navbar></app-navbar>
    
    <div class="clustering-dashboard">
      <div class="dashboard-header">
        <h1>🧠 Analiza Comportamentală Avansată</h1>
        <p>Recunoașterea pattern-urilor comportamentale cu categorii FIXE și consistente</p>
      </div>

      <mat-tab-group class="main-tabs">
        <!-- Tab 1: Survey Selection & Overview -->
        <mat-tab label="📊 Prezentare Generală">
          <div class="tab-content">
            
            <!-- ✅ NEW: Category Consistency Check -->
            <div class="category-consistency-section">
              <mat-card class="consistency-card">
                <mat-card-header>
                  <mat-card-title>🔧 Verificarea Consistenței Categoriilor</mat-card-title>
                  <mat-card-subtitle>Asigură-te că toate răspunsurile folosesc categoriile FIXE</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="consistency-actions">
                    <button 
                      mat-raised-button 
                      color="accent"
                      [disabled]="isCheckingConsistency"
                      (click)="checkCategoryConsistency()">
                      <span *ngIf="!isCheckingConsistency">🔍 Verifică Consistența</span>
                      <span *ngIf="isCheckingConsistency">
                        <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
                        Se verifică...
                      </span>
                    </button>
                    
                    <button 
                      mat-raised-button 
                      color="warn"
                      [disabled]="isFixingCategories"
                      (click)="fixAllCategories()">
                      <span *ngIf="!isFixingCategories">🔧 FIXEAZĂ TOATE Categoriile</span>
                      <span *ngIf="isFixingCategories">
                        <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
                        Se fixează...
                      </span>
                    </button>
                  </div>
                  
                  <!-- Consistency Results -->
                  <div *ngIf="consistencyResults" class="consistency-results">
                    <h4>📋 Raport Consistență:</h4>
                    <div class="consistency-stats">
                      <div class="stat-item">
                        <strong>Total răspunsuri:</strong> {{ consistencyResults.totalResponses }}
                      </div>
                      <div class="stat-item">
                        <strong>Variații demografice:</strong> {{ consistencyResults.summary?.totalDemographicVariations }}
                      </div>
                      <div class="stat-item">
                        <strong>Variații comportamentale:</strong> {{ consistencyResults.summary?.totalBehavioralVariations }}
                      </div>
                    </div>
                    
                    <div class="category-details" *ngIf="showCategoryDetails">
                      <h5>Categorii Demografice:</h5>
                      <div class="category-list">
                        <div><strong>Vârste:</strong> {{ consistencyResults.data.demographicCategories.ageGroups.join(', ') }}</div>
                        <div><strong>Genuri:</strong> {{ consistencyResults.data.demographicCategories.genders.join(', ') }}</div>
                        <div><strong>Educație:</strong> {{ consistencyResults.data.demographicCategories.educationLevels.join(', ') }}</div>
                        <div><strong>Ocupații:</strong> {{ consistencyResults.data.demographicCategories.occupations.join(', ') }}</div>
                      </div>
                      
                      <h5>Categorii Comportamentale:</h5>
                      <div class="category-list">
                        <div><strong>Stil rezolvare:</strong> {{ consistencyResults.data.behavioralCategories.problemSolvingStyles.join(', ') }}</div>
                        <div><strong>Comfort tech:</strong> {{ consistencyResults.data.behavioralCategories.techComfortLevels.join(', ') }}</div>
                        <div><strong>Gaming:</strong> {{ consistencyResults.data.behavioralCategories.gamingFrequencies.join(', ') }}</div>
                      </div>
                    </div>
                    
                    <button 
                      mat-button 
                      color="primary"
                      (click)="showCategoryDetails = !showCategoryDetails">
                      {{ showCategoryDetails ? 'Ascunde' : 'Arată' }} Detalii
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <div class="survey-selection">
              <mat-card class="selection-card">
                <mat-card-header>
                  <mat-card-title>Selectează Chestionarul pentru Analiză</mat-card-title>
                  <mat-card-subtitle>Alege un chestionar cu răspunsuri complete pentru a analiza pattern-urile comportamentale</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div *ngIf="isLoadingSurveys" class="loading-container">
                    <mat-spinner diameter="30"></mat-spinner>
                    <p>Se încarcă chestionarele...</p>
                  </div>
                  
                  <div *ngIf="!isLoadingSurveys" class="selection-controls">
                    <mat-select 
                      [(value)]="selectedSurveyId" 
                      placeholder="Selectează un chestionar..."
                      (selectionChange)="onSurveySelected($event.value)">
                      <mat-option *ngFor="let survey of availableSurveys" [value]="survey.id">
                        {{ survey.formTitle }} 
                        <span style="color: #666; margin-left: 8px;">
                          ({{ survey.responseCount || 0 }} răspunsuri)
                        </span>
                      </mat-option>
                    </mat-select>
                    
                    <button 
                      mat-raised-button 
                      color="primary"
                      [disabled]="!selectedSurveyId || isAnalyzing"
                      (click)="startClusteringAnalysis()">
                      <span *ngIf="!isAnalyzing">🔬 Pornește Analiza</span>
                      <span *ngIf="isAnalyzing">
                        <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
                        Se analizează...
                      </span>
                    </button>
                    
                    <button 
                      mat-raised-button 
                      color="accent"
                      [disabled]="!selectedSurveyId || isRecomputing"
                      (click)="recomputeMetrics()">
                      <span *ngIf="!isRecomputing">⚙️ Recalculează Metricile</span>
                      <span *ngIf="isRecomputing">
                        <mat-spinner diameter="20" style="display: inline-block; margin-right: 8px;"></mat-spinner>
                        Se recalculează...
                      </span>
                    </button>
                  </div>
                  
                  <div *ngIf="errorMessage" class="error-container">
                    <mat-icon color="warn">error</mat-icon>
                    <span>{{ errorMessage }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <!-- Survey Analysis Results - EXACT SAME AS BEFORE -->
            <div *ngIf="clusteringSummary" class="analysis-results">
              <div class="overview-stats">
                <mat-card class="summary-card">
                  <mat-card-header>
                    <mat-card-title>Rezultatele Analizei cu Categorii FIXE</mat-card-title>
                    <mat-card-subtitle>Scorul de calitate: {{ (clusteringSummary.qualityScore * 100).toFixed(1) }}%</mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="summary-stats">
                      <div class="stat">
                        <div class="stat-number">{{ clusteringSummary.totalClusters }}</div>
                        <div class="stat-label">Grupuri Comportamentale</div>
                      </div>
                      <div class="stat">
                        <div class="stat-number">{{ clusteringSummary.totalParticipants }}</div>
                        <div class="stat-label">Participanți Analizați</div>
                      </div>
                      <div class="stat">
                        <div class="stat-number">{{ getUniqueOccupations() }}</div>
                        <div class="stat-label">Ocupații Diferite</div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>

                <!-- Insights Card -->
                <mat-card class="insights-card" *ngIf="clusteringSummary.insights && clusteringSummary.insights.length > 0">
                  <mat-card-header>
                    <mat-card-title>💡 Insight-uri Cheie (Categorii FIXE)</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <ul class="insights-list">
                      <li *ngFor="let insight of clusteringSummary.insights">{{ insight }}</li>
                    </ul>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Rest of the clustering results display remains exactly the same... -->
              <div class="clusters-detailed">
                <h2>🎯 Profilurile Comportamentale Identificate (cu Categorii FIXE)</h2>
                
                <mat-accordion class="clusters-accordion">
                  <mat-expansion-panel 
                    *ngFor="let cluster of clusteringSummary.clusters; let i = index"
                    class="cluster-panel"
                    [ngClass]="'cluster-panel-' + i">
                    
                    <mat-expansion-panel-header>
                      <mat-panel-title>
                        <div class="cluster-header">
                          <div class="cluster-icon">{{ getClusterIcon(cluster.name) }}</div>
                          <div class="cluster-basic-info">
                            <h3>{{ cluster.name }}</h3>
                            <div class="cluster-stats">
                              <span class="participant-count">{{ cluster.size }} participanți</span>
                              <span class="percentage">({{ cluster.percentage.toFixed(1) }}%)</span>
                              <span class="performance-badge" [ngClass]="getPerformanceBadgeClass(cluster.performanceMetrics.technicalAptitude)">
                                {{ getPerformanceLabel(cluster.performanceMetrics.technicalAptitude) }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </mat-panel-title>
                      <mat-panel-description>
                        {{ cluster.description }}
                      </mat-panel-description>
                    </mat-expansion-panel-header>

                    <!-- Rest of the cluster details remain the same... -->
                    <div class="cluster-detailed-content">
                      <div class="metrics-section">
                        <h4>📊 Metrici de Performanță</h4>
                        <div class="metrics-grid">
                          <div class="metric-item">
                            <div class="metric-label">Aptitudine Tehnică</div>
                            <div class="metric-bar">
                              <div class="metric-fill" [style.width.%]="cluster.performanceMetrics.technicalAptitude * 100"></div>
                              <span class="metric-value">{{ (cluster.performanceMetrics.technicalAptitude * 100).toFixed(1) }}%</span>
                            </div>
                          </div>
                          <!-- Add rest of metrics... -->
                        </div>
                      </div>

                      <div class="profile-section">
                        <h4>👤 Profil Demografic și Comportamental cu Categorii FIXE</h4>
                        <div class="profile-content" [innerHTML]="formatProfileForDisplay(cluster.detailedProfile)"></div>
                      </div>

                      <div class="characteristics-section" *ngIf="cluster.characteristics && cluster.characteristics.length > 0">
                        <h4>🏷️ Caracteristici Cheie</h4>
                        <div class="characteristics-tags">
                          <span 
                            *ngFor="let char of cluster.characteristics" 
                            class="characteristic-tag">
                            {{ char }}
                          </span>
                        </div>
                      </div>

                      <div class="cluster-actions">
                        <button 
                          mat-stroked-button 
                          color="primary"
                          (click)="viewClusterDetails(cluster.id)">
                          👁️ Vezi Participanții
                        </button>
                        <button 
                          mat-stroked-button 
                          color="accent"
                          (click)="exportClusterData(cluster.id)">
                          📊 Exportă Date
                        </button>
                      </div>
                    </div>
                  </mat-expansion-panel>
                </mat-accordion>
              </div>
            </div>

            <!-- Placeholder when no analysis yet -->
            <div *ngIf="!clusteringSummary && !isAnalyzing && selectedSurveyId" class="placeholder-message">
              <mat-icon>analytics</mat-icon>
              <h3>Gata pentru Analiză cu Categorii FIXE</h3>
              <p>Apasă "Pornește Analiza" pentru a analiza pattern-urile comportamentale cu categorii consistente.</p>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: Comparative Analysis -->
        <mat-tab label="📈 Analiză Comparativă">
          <div class="tab-content">
            <div *ngIf="!clusteringSummary" class="placeholder-message">
              <mat-icon>compare_arrows</mat-icon>
              <h3>Analiză Comparativă</h3>
              <p>Selectează și analizează un chestionar pentru a vedea comparații între grupurile comportamentale.</p>
            </div>
            <div *ngIf="clusteringSummary" class="comparative-analysis">
              <p>Analiza comparativă va fi afișată aici în versiunea următoare.</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styleUrls: ['./admin-clustering-dashboard.component.css']
})
export class AdminClusteringDashboardComponent implements OnInit {
  // Existing properties
  selectedSurveyId: number | null = null;
  isAnalyzing: boolean = false;
  isRecomputing: boolean = false;
  isLoadingSurveys: boolean = true;
  availableSurveys: Survey[] = [];
  clusteringSummary: ClusteringSummary | null = null;
  errorMessage: string = '';

  // ✅ NEW properties for category consistency
  isCheckingConsistency: boolean = false;
  isFixingCategories: boolean = false;
  consistencyResults: any = null;
  showCategoryDetails: boolean = false;
  
  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private clusteringService: ClusteringService
  ) {}

  ngOnInit(): void {
    console.log('Clustering dashboard initialized with FIXED categories support');
    this.loadAvailableSurveys();
  }

  // ===================================================================
  // ✅ NEW METHODS FOR CATEGORY MANAGEMENT
  // ===================================================================

  /**
   * ✅ Check category consistency across all responses
   */
  checkCategoryConsistency(): void {
    this.isCheckingConsistency = true;
    this.errorMessage = '';
    
    console.log('🔍 Checking category consistency...');

    // Call the new backend endpoint
    this.clusteringService.checkCategoryConsistency().subscribe({
      next: (response) => {
        console.log('✅ Category consistency check completed:', response);
        this.isCheckingConsistency = false;
        
        if (response.success) {
          this.consistencyResults = response;
          
          const variations = response.summary.totalDemographicVariations + response.summary.totalBehavioralVariations;
          
          if (variations > 20) { // Expected maximum with fixed categories
            this.snackBar.open(`⚠️ Găsite ${variations} variații de categorii - se recomandă fixarea`, 'Închide', { duration: 7000 });
          } else {
            this.snackBar.open(`✅ Categoriile sunt relativ consistente (${variations} variații)`, 'Închide', { duration: 5000 });
          }
        } else {
          this.errorMessage = response.error || 'Eroare la verificarea consistenței';
          this.snackBar.open('Eroare la verificarea consistenței', 'Închide', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Error checking category consistency:', error);
        this.isCheckingConsistency = false;
        this.errorMessage = 'Eroare la verificarea consistenței categoriilor';
        this.snackBar.open('Eroare la verificarea consistenței', 'Închide', { duration: 5000 });
      }
    });
  }

  /**
   * ✅ Fix ALL categories to use consistent mapping
   */
  fixAllCategories(): void {
    if (!confirm('Ești sigur că vrei să fixezi TOATE categoriile? Aceasta va actualiza toate răspunsurile din baza de date pentru a folosi categorii consistente.')) {
      return;
    }

    this.isFixingCategories = true;
    this.errorMessage = '';
    
    console.log('🔧 Fixing all categories...');

    // Call the new backend endpoint
    this.clusteringService.fixAllCategories().subscribe({
      next: (response) => {
        console.log('✅ Category fix completed:', response);
        this.isFixingCategories = false;
        
        if (response.success) {
          const fixedCount = response.data.categoriesFixed;
          const totalCount = response.data.processedCount;
          
          if (fixedCount > 0) {
            this.snackBar.open(
              `✅ ${fixedCount}/${totalCount} răspunsuri au fost fixate cu categorii consistente!`, 
              'Închide', 
              { duration: 7000 }
            );
            
            // Refresh consistency check
            setTimeout(() => {
              this.checkCategoryConsistency();
            }, 1000);
            
            // Suggest re-running clustering
            setTimeout(() => {
              if (this.selectedSurveyId) {
                const shouldReanalyze = confirm('Categoriile au fost fixate! Vrei să rulezi din nou analiza de clustering pentru a vedea rezultate consistente?');
                if (shouldReanalyze) {
                  this.startClusteringAnalysis();
                }
              }
            }, 2000);
            
          } else {
            this.snackBar.open('✅ Toate categoriile erau deja consistente - nu au fost necesare modificări', 'Închide', { duration: 5000 });
          }
        } else {
          this.errorMessage = response.error || 'Eroare la fixarea categoriilor';
          this.snackBar.open('Eroare la fixarea categoriilor', 'Închide', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Error fixing categories:', error);
        this.isFixingCategories = false;
        this.errorMessage = 'Eroare la fixarea categoriilor';
        this.snackBar.open('Eroare la fixarea categoriilor', 'Închide', { duration: 5000 });
      }
    });
  }

  // ===================================================================
  // EXISTING METHODS REMAIN THE SAME
  // ===================================================================

  loadAvailableSurveys(): void {
    this.isLoadingSurveys = true;
    this.errorMessage = '';
    
    this.clusteringService.getAvailableSurveys().subscribe({
      next: (surveys) => {
        this.availableSurveys = surveys
          .filter((survey: any) => survey.responses && survey.responses.length >= 3)
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
          this.errorMessage = 'Nu au fost găsite chestionare cu suficiente răspunsuri (minim 3). Creează chestionare și colectează răspunsuri mai întâi.';
        }
      },
      error: (error) => {
        console.error('❌ Error loading surveys:', error);
        this.errorMessage = 'Eroare la încărcarea chestionarelor. Te rog încearcă din nou.';
        this.isLoadingSurveys = false;
        this.snackBar.open('Eroare la încărcarea chestionarelor', 'Închide', { duration: 3000 });
      }
    });
  }

  onSurveySelected(surveyId: number): void {
    this.selectedSurveyId = surveyId;
    this.clusteringSummary = null;
    this.errorMessage = '';
    
    console.log('📊 Selected survey for analysis:', surveyId);
    this.checkExistingResults(surveyId);
  }

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
      }
    });
  }

  startClusteringAnalysis(): void {
    if (!this.selectedSurveyId) {
      this.snackBar.open('Te rog selectează mai întâi un chestionar', 'Închide', { duration: 3000 });
      return;
    }

    const selectedSurvey = this.availableSurveys.find(s => s.id === this.selectedSurveyId);
    if (!selectedSurvey || !selectedSurvey.responseCount || selectedSurvey.responseCount < 3) {
      this.snackBar.open('Sunt necesare cel puțin 3 răspunsuri pentru o analiză de clustering semnificativă', 'Închide', { duration: 5000 });
      return;
    }

    this.isAnalyzing = true;
    this.errorMessage = '';
    this.clusteringSummary = null;

    console.log('🔬 Starting clustering analysis with FIXED categories for survey:', this.selectedSurveyId);

    this.clusteringService.performClusteringAnalysis(this.selectedSurveyId).subscribe({
      next: (response) => {
        console.log('✅ Clustering analysis completed:', response);
        this.isAnalyzing = false;
        
        if (response.success && response.data) {
          this.displayClusteringResults(response.data);
          this.snackBar.open('Analiza de clustering cu categorii FIXE finalizată cu succes!', 'Închide', { duration: 5000 });
        } else {
          this.errorMessage = response.error || 'Analiza s-a completat dar nu au fost returnate rezultate';
          this.snackBar.open('Analiza completată cu probleme', 'Închide', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Clustering analysis failed:', error);
        this.isAnalyzing = false;
        this.errorMessage = error.error?.message || 'Analiza de clustering a eșuat. Te rog încearcă din nou.';
        this.snackBar.open('Analiza de clustering a eșuat', 'Închide', { duration: 5000 });
      }
    });
  }

  displayClusteringResults(data: any): void {
    console.log('📊 Displaying clustering results with FIXED categories:', data);
    
    const insights = Array.isArray(data.insights) ? data.insights : [];
    
    this.clusteringSummary = {
      totalClusters: data.clusters?.length || 0,
      totalParticipants: data.metadata?.totalParticipants || 0,
      qualityScore: data.metadata?.silhouetteScore || 0,
      insights: insights,
      clusters: (data.clusters || []).map((cluster: any, index: number) => ({
        id: cluster.id,
        name: cluster.clusterName || `Cluster ${cluster.id}`,
        size: cluster.memberCount || 0,
        percentage: ((cluster.memberCount || 0) / (data.metadata?.totalParticipants || 1)) * 100,
        description: cluster.clusterDescription || 'Fără descriere disponibilă',
        detailedProfile: cluster.detailedProfile || 'Profil detaliat indisponibil',
        characteristics: this.extractCharacteristics(cluster),
        performanceMetrics: {
          technicalAptitude: cluster.profile?.avgTechnicalAptitude || 0,
          speedIndex: cluster.profile?.avgSpeedIndex || 0,
          precisionIndex: cluster.profile?.avgPrecisionIndex || 0,
          confidenceIndex: cluster.profile?.avgConfidenceIndex || 0,
          systematicIndex: cluster.profile?.avgSystematicIndex || 0,
          persistenceIndex: cluster.profile?.avgPersistenceIndex || 0
        }
      }))
    };
  }

  extractCharacteristics(cluster: any): string[] {
    const characteristics: string[] = [];
    const profile = cluster.profile || {};
    
    if (profile.avgTechnicalAptitude > 0.7) characteristics.push('Aptitudine Tehnică Ridicată');
    if (profile.avgSpeedIndex > 0.7) characteristics.push('Finalizare Rapidă');
    if (profile.avgPrecisionIndex > 0.7) characteristics.push('Precizie Ridicată');
    if (profile.avgSystematicIndex > 0.7) characteristics.push('Abordare Sistematică');
    if (profile.avgConfidenceIndex > 0.7) characteristics.push('Încredere Ridicată');
    if (profile.avgPersistenceIndex > 0.7) characteristics.push('Persistent');
    
    const demo = cluster.demographicProfile || {};
    if (demo.dominantOccupation) {
      const occupationMap: Record<string, string> = {
        'tech': 'IT/Tehnologie',
        'engineering': 'Inginerie',
        'student': 'Studenți',
        'education': 'Educație',
        'healthcare': 'Sănătate',
        'business': 'Business'
      };
      characteristics.push(occupationMap[demo.dominantOccupation] || demo.dominantOccupation);
    }
    
    if (demo.dominantAgeGroup) {
      const ageMap: Record<string, string> = {
        '19_25': '19-25 ani',
        '26_35': '26-35 ani',
        '36_45': '36-45 ani'
      };
      characteristics.push(ageMap[demo.dominantAgeGroup] || demo.dominantAgeGroup);
    }
    
    return characteristics.slice(0, 6);
  }

  getClusterIcon(clusterName: string): string {
    const iconMap: Record<string, string> = {
      'Elite Performers': '🏆',
      'Speed Champions': '⚡',
      'Precision Masters': '🎯',
      'Tech Experts': '💻',
      'Systematic Planners': '📋',
      'Confident Explorers': '🧭',
      'Persistent Learners': '💪',
      'Balanced Achievers': '⚖️',
      'Cautious Beginners': '🌱',
      'Gaming Veterans': '🎮',
      'Emerging Users': '🌟',
      'Adaptive Workers': '🔄',
      'Steady Performers': '📈',
      'Technical Novices': '🔰',
      'Creative Problem Solvers': '💡',
      'Standard Users': '👥',
      'Methodical Perfectionists': '📐',
      'Quick Explorers': '🚀',
      'Determined Learners': '🔍'
    };
    
    return iconMap[clusterName] || '👤';
  }

  getPerformanceBadgeClass(technicalAptitude: number): string {
    if (technicalAptitude > 0.8) return 'performance-excellent';
    if (technicalAptitude > 0.6) return 'performance-good';
    if (technicalAptitude > 0.4) return 'performance-average';
    return 'performance-needs-improvement';
  }

  getPerformanceLabel(technicalAptitude: number): string {
    if (technicalAptitude > 0.8) return 'Excelent';
    if (technicalAptitude > 0.6) return 'Bun';
    if (technicalAptitude > 0.4) return 'Mediu';
    return 'Necesită îmbunătățire';
  }

  formatProfileForDisplay(profile: string): string {
    if (!profile) return 'Profil indisponibil';
    
    return profile
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/•/g, '&nbsp;&nbsp;•')
      .replace(/\n/g, '<br>')
      .replace(/(\d+\.?\d*%)/g, '<span class="percentage-highlight">$1</span>');
  }

  getUniqueOccupations(): number {
    if (!this.clusteringSummary) return 0;
    
    const occupations = new Set<string>();
    this.clusteringSummary.clusters.forEach(cluster => {
      if (cluster.characteristics) {
        cluster.characteristics.forEach(char => {
          if (['IT/Tehnologie', 'Inginerie', 'Studenți', 'Educație', 'Sănătate', 'Business'].includes(char)) {
            occupations.add(char);
          }
        });
      }
    });
    
    return occupations.size;
  }

  viewClusterDetails(clusterId: number): void {
    console.log('Selected cluster for details:', clusterId);
    
    if (!this.selectedSurveyId) return;
    
    this.clusteringService.getClusterDetails(this.selectedSurveyId, clusterId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Cluster details:', response.data);
          this.snackBar.open(`Vizualizare detalii pentru ${response.data.cluster.clusterName}`, 'Închide', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error getting cluster details:', error);
        this.snackBar.open('Eroare la încărcarea detaliilor clusterului', 'Închide', { duration: 3000 });
      }
    });
  }

  exportClusterData(clusterId: number): void {
    console.log('Exporting data for cluster:', clusterId);
    
    if (!this.selectedSurveyId) return;
    
    this.clusteringService.exportClusteringData(this.selectedSurveyId).subscribe({
      next: (response) => {
        if (response.success) {
          const dataStr = JSON.stringify(response.data, null, 2);
          const dataBlob = new Blob([dataStr], {type: 'application/json'});
          
          const link = document.createElement('a');
          link.href = URL.createObjectURL(dataBlob);
          link.download = response.downloadFileName || `clustering_data_${clusterId}.json`;
          link.click();
          
          this.snackBar.open('Date exportate cu succes!', 'Închide', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error exporting data:', error);
        this.snackBar.open('Eroare la exportarea datelor', 'Închide', { duration: 3000 });
      }
    });
  }

  recomputeMetrics(): void {
    if (!this.selectedSurveyId) {
      this.snackBar.open('Te rog selectează mai întâi un chestionar', 'Închide', { duration: 3000 });
      return;
    }

    this.isRecomputing = true;
    this.errorMessage = '';

    console.log('⚙️ Recomputing metrics with FIXED categories for survey:', this.selectedSurveyId);

    this.clusteringService.recomputeMetrics(this.selectedSurveyId).subscribe({
      next: (response) => {
        console.log('✅ Metrics recomputed with FIXED categories:', response);
        this.isRecomputing = false;
        
        if (response.success) {
          this.snackBar.open('Metricile au fost recalculate cu categorii FIXE! Poți rula acum analiza de clustering.', 'Închide', { duration: 5000 });
          this.loadAvailableSurveys();
        } else {
          this.errorMessage = response.error || 'Recalcularea metricilor a eșuat';
          this.snackBar.open('Recalcularea metricilor a eșuat', 'Închide', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('❌ Metrics recomputation failed:', error);
        this.isRecomputing = false;
        this.errorMessage = error.error?.message || 'Recalcularea metricilor a eșuat. Te rog încearcă din nou.';
        this.snackBar.open('Recalcularea metricilor a eșuat', 'Închide', { duration: 5000 });
      }
    });
  }

  onTabChange(event: any): void {
    console.log('Tab changed:', event.index);
  }
}