
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
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
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './fisher-test.component.html',
  styleUrls: ['./fisher-test.component.css']
})
export class FisherTestComponent implements OnInit {
  @Input() surveyId: number | null = null;
  @Input() clusteringSummary: any = null; 
  
  isAnalyzing = false;
  errorMessage = '';
  fisherResults: { data: FisherTestSummary } | null = null;
  allClustersResult: { data: AllClustersResult } | null = null;

  constructor(private fisherTestService: FisherTestService) {}

  ngOnInit(): void {
   
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

    console.log(' Starting Fisher analysis for survey:', this.surveyId);

    this.fisherTestService.getFisherTestSummary(this.surveyId).subscribe({
      next: (summaryResponse) => {
        if (summaryResponse.success) {
          this.fisherResults = summaryResponse;
          
          this.fisherTestService.getAllClustersSignificantQuestions(this.surveyId!).subscribe({
            next: (detailResponse) => {
              if (detailResponse.success) {
                this.allClustersResult = detailResponse;
                console.log(' Fisher analysis completed successfully');
              } else {
                this.errorMessage = detailResponse.message || 'Eroare la obținerea detaliilor Fisher test';
              }
              this.isAnalyzing = false;
            },
            error: (error) => {
              console.error(' Error getting Fisher details:', error);
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
        console.error(' Error running Fisher analysis:', error);
        this.errorMessage = error.error?.message || 'Eroare la rularea Fisher test';
        this.isAnalyzing = false;
      }
    });
  }

 
  getClusterDisplayName(clusterId: number): string {
  
    if (this.clusteringSummary && this.clusteringSummary.clusters) {
      const cluster = this.clusteringSummary.clusters.find((c: any) => c.id === clusterId);
      if (cluster && cluster.name) {
        return `${cluster.name} (${cluster.size} participanți)`;
      }
    }
    
 
    return `Cluster ${clusterId}`;
  }

  getClusterIcon(clusterId: number): string {
    if (this.clusteringSummary && this.clusteringSummary.clusters) {
      const cluster = this.clusteringSummary.clusters.find((c: any) => c.id === clusterId);
      if (cluster && cluster.name) {
        return this.getIconForClusterName(cluster.name);
      }
    }
    
    return '👤';
  }

  private getIconForClusterName(clusterName: string): string {
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
}