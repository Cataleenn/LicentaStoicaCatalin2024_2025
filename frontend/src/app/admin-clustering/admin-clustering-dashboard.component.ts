
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
import { MatChipsModule } from '@angular/material/chips';
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
    MatChipsModule,
    FisherTestComponent,
    NavbarComponent
  ],
  templateUrl: './admin-clustering-dashboard.component.html',
  styleUrls: ['./admin-clustering-dashboard.component.css']
})
export class AdminClusteringDashboardComponent implements OnInit {

  selectedSurveyId: number | null = null;
  isAnalyzing: boolean = false;
  isLoadingSurveys: boolean = true;
  availableSurveys: Survey[] = [];
  clusteringSummary: ClusteringSummary | null = null;
  errorMessage: string = '';
  
  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private clusteringService: ClusteringService
  ) {}

  ngOnInit(): void {
    console.log('🧠 Clustering dashboard initialized');
    this.loadAvailableSurveys();
  }

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
    
    console.log(' Selected survey for analysis:', surveyId);
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

    console.log(' Starting OPTIMAL clustering analysis for survey:', this.selectedSurveyId);
    this.snackBar.open('Se efectuează analiza optimală...', 'Închide', { duration: 2000 });


    this.clusteringService.performClusteringAnalysis(this.selectedSurveyId).subscribe({
      next: (response) => {
        console.log('✅ Optimal clustering analysis completed:', response);
        this.isAnalyzing = false;
        
        if (response.success && response.data) {
          this.displayClusteringResults(response.data);
          
          const qualityScore = (response.data.metadata?.silhouetteScore * 100 || 0).toFixed(1);
          const clusterCount = response.data.clusters?.length || 0;
          
          this.snackBar.open(
            `✅ Analiză completă! ${clusterCount} grupuri identificate cu scorul de calitate ${qualityScore}%`, 
            'Închide', 
            { duration: 6000 }
          );
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
    console.log(' Displaying optimal clustering results:', data);
    

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
      'Standard Users': '👥'
    };
    
    return iconMap[clusterName] || '👤';
  }


  formatProfileForDisplay(profile: string): string {
    if (!profile) return 'Profil indisponibil';
    
    return profile
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  
      .replace(/•/g, '&nbsp;&nbsp;•') 
      .replace(/\n/g, '<br>') 
      .replace(/(\d+\.?\d*%)/g, '<span class="percentage-highlight">$1</span>');  
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

  onTabChange(event: any): void {
    console.log('Tab changed:', event.index);
  }
}