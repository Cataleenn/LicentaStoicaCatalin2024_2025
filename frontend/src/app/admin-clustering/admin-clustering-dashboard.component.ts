// Complete Optimized Admin Clustering Dashboard Component
// frontend/src/app/admin-clustering/admin-clustering-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../navbar/navbar.component';
import { ClusteringService } from '../services/clustering.service';
import { FisherTestService } from '../services/fisher-test.service';
import { FisherTestComponent } from '../fisher-test/fisher-test.component';

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

interface OptimizationProgress {
  currentIteration: number;
  totalIterations: number;
  currentAction: string;
  bestQualityScore: number;
  timeElapsed: number;
}

interface OptimizationResult {
  iterations: Array<{
    iteration: number;
    action: string;
    qualityScore: number;
    clusterCount: number;
    duration: number;
  }>;
  totalDuration: number;
  qualityImprovement: number;
  finalQualityScore: number;
  initialQualityScore: number;
  optimizationSummary: string;
}

interface OptimizationOptions {
  forcedK?: number;
  maxIterations?: number;
  qualityThreshold?: number;
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
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    MatExpansionModule,
    MatIconModule,
    MatChipsModule,
    FormsModule,
    NavbarComponent,
    FisherTestComponent
  ],
  templateUrl: './admin-clustering-dashboard.component.html',
  styleUrls: ['./admin-clustering-dashboard.component.css']
})
export class AdminClusteringDashboardComponent implements OnInit {
  // ===================================================================
  // PROPERTIES
  // ===================================================================
  
  // Core properties
  selectedSurveyId: number | null = null;
  isAnalyzing: boolean = false;
  isLoadingSurveys: boolean = true;
  availableSurveys: Survey[] = [];
  clusteringSummary: ClusteringSummary | null = null;
  errorMessage: string = '';
  
  // ✅ NEW: Optimization properties
  optimizationProgress: OptimizationProgress | null = null;
  optimizationResult: OptimizationResult | null = null;
  showOptimizationDetails: boolean = false;
  analysisStartTime: number = 0;
  
  // Category consistency properties
  isCheckingConsistency: boolean = false;
  isFixingCategories: boolean = false;
  consistencyResults: any = null;
  showConsistencyDetails: boolean = false;

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private clusteringService: ClusteringService,
    private fisherTestService: FisherTestService
  ) {}

  ngOnInit(): void {
    console.log('🚀 Optimized Clustering Dashboard initialized');
    this.loadAvailableSurveys();
  }

  // ===================================================================
  // SURVEY MANAGEMENT
  // ===================================================================

  /**
   * Load all surveys that can be analyzed
   */
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

  /**
   * When a survey is selected
   */
  onSurveySelected(surveyId: number): void {
    this.selectedSurveyId = surveyId;
    this.clusteringSummary = null;
    this.optimizationResult = null;
    this.errorMessage = '';
    this.showOptimizationDetails = false;
    
    console.log('📊 Selected survey for analysis:', surveyId);
    this.checkExistingResults(surveyId);
  }

  /**
   * Check if survey already has clustering results
   */
  checkExistingResults(surveyId: number): void {
    this.clusteringService.getClusteringResults(surveyId).subscribe({
      next: (results) => {
        if (results.success && results.data) {
          console.log('✅ Found existing clustering results');
          this.displayOptimizedClusteringResults(results.data);
        }
      },
      error: (error) => {
        console.log('ℹ️ No existing clustering results found');
      }
    });
  }

  // ===================================================================
  // ✅ OPTIMIZED CLUSTERING ANALYSIS
  // ===================================================================

  /**
   * Start optimized clustering analysis
   */
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

    // Reset state
    this.isAnalyzing = true;
    this.errorMessage = '';
    this.clusteringSummary = null;
    this.optimizationResult = null;
    this.showOptimizationDetails = false;
    this.analysisStartTime = Date.now();

    // Initialize optimization progress
    this.optimizationProgress = {
      currentIteration: 1,
      totalIterations: 3,
      currentAction: 'Analizez datele existente...',
      bestQualityScore: 0,
      timeElapsed: 0
    };

    console.log('🚀 Starting OPTIMIZED clustering analysis for survey:', this.selectedSurveyId);

    // Start progress tracking
    const progressInterval = setInterval(() => {
      if (this.optimizationProgress) {
        this.optimizationProgress.timeElapsed = Date.now() - this.analysisStartTime;
      }
    }, 500);

    // Use optimized clustering analysis
    this.clusteringService.performOptimizedClusteringAnalysis(
      this.selectedSurveyId,
      {
        maxIterations: 3,
        qualityThreshold: 0.5
      }
    ).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        console.log('✅ Optimized clustering analysis completed:', response);
        this.isAnalyzing = false;
        this.optimizationProgress = null;
        
        if (response.success && response.data) {
          // Store optimization results
          this.optimizationResult = response.data.optimization;
          
          // Display clustering results
          this.displayOptimizedClusteringResults(response.data);
          
          // Show success message with optimization info
          const improvement = this.optimizationResult.qualityImprovement;
          let message = 'Analiza de clustering optimizată finalizată cu succes!';
          
          if (improvement > 20) {
            message += ` Îmbunătățire semnificativă: +${improvement.toFixed(1)}%`;
          } else if (improvement > 5) {
            message += ` Îmbunătățire moderată: +${improvement.toFixed(1)}%`;
          } else if (improvement > 0) {
            message += ` Îmbunătățire: +${improvement.toFixed(1)}%`;
          } else {
            message += ' Calitatea era deja optimă.';
          }
          
          this.snackBar.open(message, 'Vezi Detalii', { 
            duration: 8000 
          }).onAction().subscribe(() => {
            this.showOptimizationDetails = true;
          });
        } else {
          
        }
      },
      error: (error) => {
        clearInterval(progressInterval);
        console.error('❌ Optimized clustering analysis failed:', error);
        this.isAnalyzing = false;
        this.optimizationProgress = null;
        this.errorMessage = error.error?.message || 'Analiza de clustering optimizată a eșuat. Te rog încearcă din nou.';
        this.snackBar.open('Analiza de clustering a eșuat', 'Închide', { duration: 5000 });
      }
    });
  }

  /**
   * Display optimized clustering results
   */
  displayOptimizedClusteringResults(data: any): void {
    console.log('📊 Displaying optimized clustering results:', data);
    
    // Ensure insights is always an array
    const insights = Array.isArray(data.insights) ? data.insights : [];
    
    // Add optimization insights if available
    if (data.optimization) {
      const optInsight = `Analiza optimizată în ${data.optimization.iterations.length} iterații cu îmbunătățire de ${data.optimization.qualityImprovement.toFixed(1)}%`;
      insights.unshift(optInsight);
    }
    
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

  // ===================================================================
  // ✅ OPTIMIZATION HELPER METHODS
  // ===================================================================

  /**
   * Get optimization status text
   */
  getOptimizationStatusText(): string {
    if (!this.optimizationProgress) return '';
    
    const statusMap: Record<string, string> = {
      'existing_data': 'Analizez datele existente...',
      'recomputed_metrics': 'Recalculez metricile pentru mai multă precizie...',
      'k_optimization': 'Optimizez numărul de clustere...',
      'finalizing': 'Finalizez analiza...'
    };
    
    return this.optimizationProgress.currentAction || 'Se procesează...';
  }

  /**
   * Get optimization progress percentage
   */
  getOptimizationProgress(): number {
    if (!this.optimizationProgress) return 0;
    return (this.optimizationProgress.currentIteration / this.optimizationProgress.totalIterations) * 100;
  }

  /**
   * Get optimization quality badge
   */
  getOptimizationQualityBadge(): string {
    if (!this.optimizationResult) return '';
    
    const finalScore = this.optimizationResult.finalQualityScore;
    if (finalScore > 0.7) return 'Calitate EXCELENTĂ';
    if (finalScore > 0.5) return 'Calitate BUNĂ';
    if (finalScore > 0.3) return 'Calitate ACCEPTABILĂ';
    return 'Calitate SCĂZUTĂ';
  }

  /**
   * Get optimization quality badge class
   */
  getOptimizationQualityBadgeClass(): string {
    if (!this.optimizationResult) return '';
    
    const finalScore = this.optimizationResult.finalQualityScore;
    if (finalScore > 0.7) return 'quality-excellent';
    if (finalScore > 0.5) return 'quality-good';
    if (finalScore > 0.3) return 'quality-acceptable';
    return 'quality-poor';
  }

  /**
   * Format optimization duration
   */
  formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  /**
   * Get iteration action label
   */
  getIterationActionLabel(action: string): string {
    const actionMap: Record<string, string> = {
      'existing_data': 'Date existente',
      'existing_data_failed': 'Date existente (eșuat)',
      'recomputed_metrics': 'Metrici recalculate',
      'recompute_failed': 'Recalculare (eșuat)',
      'k_optimization_best_k_2': 'Optimizare K=2',
      'k_optimization_best_k_3': 'Optimizare K=3',
      'k_optimization_best_k_4': 'Optimizare K=4',
      'k_optimization_best_k_5': 'Optimizare K=5',
      'k_optimization_best_k_6': 'Optimizare K=6',
      'k_optimization_failed': 'Optimizare K (eșuat)'
    };
    
    return actionMap[action] || action;
  }

  // ===================================================================
  // ✅ CATEGORY CONSISTENCY MANAGEMENT
  // ===================================================================

  /**
   * Check category consistency across all responses
   */
  checkCategoryConsistency(): void {
    this.isCheckingConsistency = true;
    this.consistencyResults = null;
    this.showConsistencyDetails = false;

    console.log('🔍 Checking category consistency...');

    this.clusteringService.checkCategoryConsistency().subscribe({
      next: (response) => {
        this.isCheckingConsistency = false;
        if (response.success) {
          this.consistencyResults = response;
          console.log('✅ Consistency check completed:', response);
          this.snackBar.open('Verificarea consistenței completată', 'Vezi Rezultate', {
            duration: 5000
          }).onAction().subscribe(() => {
            this.showConsistencyDetails = true;
          });
        } else {
          this.snackBar.open('Eroare la verificarea consistenței', 'Închide', { duration: 3000 });
        }
      },
      error: (error) => {
        this.isCheckingConsistency = false;
        console.error('❌ Error checking consistency:', error);
        this.snackBar.open('Eroare la verificarea consistenței', 'Închide', { duration: 3000 });
      }
    });
  }

  /**
   * Fix all categories to use consistent mapping
   */
  fixAllCategories(): void {
    this.isFixingCategories = true;

    console.log('🔧 Fixing all categories with consistent mapping...');

    this.clusteringService.fixAllCategories().subscribe({
      next: (response) => {
        this.isFixingCategories = false;
        if (response.success) {
          console.log('✅ Categories fixed:', response);
          
          const message = response.data.categoriesFixed > 0 
            ? `${response.data.categoriesFixed} categorii au fost corectate!`
            : 'Toate categoriile erau deja consistente.';
            
          this.snackBar.open(message, 'OK', { duration: 5000 });
          
          // Refresh the consistency check
          this.checkCategoryConsistency();
        } else {
          this.snackBar.open('Eroare la corectarea categoriilor', 'Închide', { duration: 3000 });
        }
      },
      error: (error) => {
        this.isFixingCategories = false;
        console.error('❌ Error fixing categories:', error);
        this.snackBar.open('Eroare la corectarea categoriilor', 'Închide', { duration: 3000 });
      }
    });
  }

  // ===================================================================
  // CLUSTER ANALYSIS HELPERS
  // ===================================================================

  /**
   * Extract key characteristics from cluster profile
   */
  extractCharacteristics(cluster: any): string[] {
    const characteristics: string[] = [];
    const profile = cluster.profile || {};
    
    // Performance characteristics
    if (profile.avgTechnicalAptitude > 0.7) characteristics.push('Aptitudine Tehnică Ridicată');
    if (profile.avgSpeedIndex > 0.7) characteristics.push('Finalizare Rapidă');
    if (profile.avgPrecisionIndex > 0.7) characteristics.push('Precizie Ridicată');
    if (profile.avgSystematicIndex > 0.7) characteristics.push('Abordare Sistematică');
    if (profile.avgConfidenceIndex > 0.7) characteristics.push('Încredere Ridicată');
    if (profile.avgPersistenceIndex > 0.7) characteristics.push('Persistent');
    
    // Add demographic characteristics
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
    
    return characteristics.slice(0, 6); // Limit to 6 characteristics
  }

  /**
   * Get cluster icon based on name
   */
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

  /**
   * Get performance badge class
   */
  getPerformanceBadgeClass(technicalAptitude: number): string {
    if (technicalAptitude > 0.8) return 'performance-excellent';
    if (technicalAptitude > 0.6) return 'performance-good';
    if (technicalAptitude > 0.4) return 'performance-average';
    return 'performance-needs-improvement';
  }

  /**
   * Get performance label
   */
  getPerformanceLabel(technicalAptitude: number): string {
    if (technicalAptitude > 0.8) return 'Excelent';
    if (technicalAptitude > 0.6) return 'Bun';
    if (technicalAptitude > 0.4) return 'Mediu';
    return 'Necesită îmbunătățire';
  }

  /**
   * Format profile for HTML display
   */
  formatProfileForDisplay(profile: string): string {
    if (!profile) return 'Profil indisponibil';
    
    return profile
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold formatting
      .replace(/•/g, '&nbsp;&nbsp;•')  // Indent bullet points
      .replace(/\n/g, '<br>')  // Line breaks
      .replace(/(\d+\.?\d*%)/g, '<span class="percentage-highlight">$1</span>');  // Highlight percentages
  }

  /**
   * Get number of unique occupations
   */
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

  // ===================================================================
  // CLUSTER ACTIONS
  // ===================================================================

  /**
   * View cluster details
   */
  viewClusterDetails(clusterId: number): void {
    console.log('Selected cluster for details:', clusterId);
    
    if (!this.selectedSurveyId) return;
    
    this.clusteringService.getClusterDetails(this.selectedSurveyId, clusterId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Cluster details:', response.data);
          this.snackBar.open(`Vizualizare detalii pentru ${response.data.cluster.clusterName}`, 'Închide', { duration: 3000 });
          // Here you could open a detailed dialog or navigate to detail view
        }
      },
      error: (error) => {
        console.error('Error getting cluster details:', error);
        this.snackBar.open('Eroare la încărcarea detaliilor clusterului', 'Închide', { duration: 3000 });
      }
    });
  }

  /**
   * Export cluster data
   */
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

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  /**
   * Tab change handler
   */
  onTabChange(event: any): void {
    console.log('Tab changed:', event.index);
  }

  /**
   * Toggle optimization details
   */
  toggleOptimizationDetails(): void {
    this.showOptimizationDetails = !this.showOptimizationDetails;
  }

  /**
   * Toggle consistency details
   */
  toggleConsistencyDetails(): void {
    this.showConsistencyDetails = !this.showConsistencyDetails;
  }
}