// Updated Admin Clustering Dashboard Component - TypeScript (FĂRĂ consistență categorii)
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
    NavbarComponent,
    FisherTestComponent
  ],
  templateUrl: './admin-clustering-dashboard.component.html',
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
    private dialog: MatDialog,
    private clusteringService: ClusteringService,
    private fisherTestService: FisherTestService
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

  // When a survey is selected
  onSurveySelected(surveyId: number): void {
    this.selectedSurveyId = surveyId;
    this.clusteringSummary = null;
    this.errorMessage = '';
    
    console.log('📊 Selected survey for analysis:', surveyId);
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
      }
    });
  }

  // Start clustering analysis
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

    console.log('🔬 Starting clustering analysis for survey:', this.selectedSurveyId);

    this.clusteringService.performClusteringAnalysis(this.selectedSurveyId).subscribe({
      next: (response) => {
        console.log('✅ Clustering analysis completed:', response);
        this.isAnalyzing = false;
        
        if (response.success && response.data) {
          this.displayClusteringResults(response.data);
          this.snackBar.open('Analiza de clustering finalizată cu succes!', 'Închide', { duration: 5000 });
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

  // Display clustering results with detailed profiles
  displayClusteringResults(data: any): void {
    console.log('📊 Displaying clustering results:', data);
    
    // Ensure insights is always an array
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

  // Extract key characteristics from cluster profile
  extractCharacteristics(cluster: any): string[] {
    const characteristics: string[] = [];
    const profile = cluster.profile || {};
    
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

  // Get cluster icon based on name
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

  // Get performance badge class
  getPerformanceBadgeClass(technicalAptitude: number): string {
    if (technicalAptitude > 0.8) return 'performance-excellent';
    if (technicalAptitude > 0.6) return 'performance-good';
    if (technicalAptitude > 0.4) return 'performance-average';
    return 'performance-needs-improvement';
  }

  // Get performance label
  getPerformanceLabel(technicalAptitude: number): string {
    if (technicalAptitude > 0.8) return 'Excelent';
    if (technicalAptitude > 0.6) return 'Bun';
    if (technicalAptitude > 0.4) return 'Mediu';
    return 'Necesită îmbunătățire';
  }

  // Format profile for HTML display
  formatProfileForDisplay(profile: string): string {
    if (!profile) return 'Profil indisponibil';
    
    return profile
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold formatting
      .replace(/•/g, '&nbsp;&nbsp;•')  // Indent bullet points
      .replace(/\n/g, '<br>')  // Line breaks
      .replace(/(\d+\.?\d*%)/g, '<span class="percentage-highlight">$1</span>');  // Highlight percentages
  }

  // Get number of unique occupations
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

  // View cluster details
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

  // Export cluster data
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

  // Recompute metrics for existing responses
  recomputeMetrics(): void {
    if (!this.selectedSurveyId) {
      this.snackBar.open('Te rog selectează mai întâi un chestionar', 'Închide', { duration: 3000 });
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
          this.snackBar.open('Metricile au fost recalculate cu succes! Poți rula acum analiza de clustering.', 'Închide', { duration: 5000 });
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

  // Tab change handler
  onTabChange(event: any): void {
    console.log('Tab changed:', event.index);
  }
}