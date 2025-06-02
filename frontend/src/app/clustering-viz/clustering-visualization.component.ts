import { Component, OnInit, ElementRef, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';

// Definim interfețele necesare
export interface ClusterPoint {
  id: string;
  x: number;
  y: number;
  clusterId: number;
  clusterName: string;
  confidence: number;
  demographics: {
    ageGroup: string;
    gender: string;
    education: string;
    occupation: string;
  };
  behavioral: {
    problemSolvingStyle: string;
    techComfort: string;
    errorHandling: string;
  };
  metrics: {
    speedIndex: number;
    precisionIndex: number;
    confidenceIndex: number;
    systematicIndex: number;
    technicalAptitude: number;
  };
  assemblyData: {
    completionTime: number;
    accuracy: number;
    rotations: number;
  };
}

export interface ClusterCenter {
  id: number;
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  description: string;
}

@Component({
  selector: 'app-clustering-visualization',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSelectModule,
    MatSliderModule,
    MatCheckboxModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  template: `
    <div class="viz-container">
      <div class="viz-main">
        <div class="viz-header">
          <h2>Interactive Clustering Analysis</h2>
        </div>

        <!-- SVG Container -->
        <div class="svg-container" #svgContainer>
          <div *ngIf="isLoading" class="loading-overlay">
            <mat-spinner diameter="50"></mat-spinner>
            <p>Analiză în curs...</p>
          </div>
          <div *ngIf="!isLoading">
            <p>Vizualizare date de clustering</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./clustering-visualization.component.css']
})
export class ClusteringVisualizationComponent implements OnInit {
  @Input() surveyId: number | null = null;
  @Output() clusterSelected = new EventEmitter<number>();
  @Output() participantSelected = new EventEmitter<string>();

  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef;

  // Data
  points: ClusterPoint[] = [];
  filteredPoints: ClusterPoint[] = [];
  clusterCenters: ClusterCenter[] = [];
  
  // Visualization state
  selectedPoint: ClusterPoint | null = null;
  selectedCluster: number | null = null;
  isLoading = true;
  qualityScore = 0;

  // Controls
  xAxisMetric = 'speedIndex';
  yAxisMetric = 'precisionIndex';
  selectedAgeGroup = '';
  selectedOccupation = '';
  showClusterCenters = true;
  showConfidenceSize = true;
  showConvexHulls = false;
  animationSpeed = 800;

  constructor() {}

  ngOnInit(): void {
    console.log('Visualization component initialized');
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }

  // Metode minimale pentru funcționalitatea de bază
  applyFilters(): void {
    console.log('Applying filters');
  }

  updateVisualization(): void {
    console.log('Updating visualization');
  }

  updateAnimationSpeed(): void {
    console.log('Animation speed updated');
  }

  selectCluster(clusterId: number): void {
    this.selectedCluster = clusterId;
    this.clusterSelected.emit(clusterId);
  }

  getClusterColor(clusterId: number): string {
    return '#1976d2';
  }

  formatDemographic(value: string): string {
    return value.replace('_', ' ');
  }

  formatBehavioral(value: string): string {
    return value.replace('_', ' ');
  }

  private randomChoice(options: string[]): string {
    return options[Math.floor(Math.random() * options.length)];
  }
}