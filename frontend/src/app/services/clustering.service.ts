// Updated Clustering Service (FĂRĂ consistență categorii) - frontend/src/app/services/clustering.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OptimizationOptions {
  forcedK?: number;
  maxIterations?: number;  // Default: 3
  qualityThreshold?: number;  // Default: 0.5
}

export interface OptimizationResult {
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

@Injectable({
  providedIn: 'root'
})
export class ClusteringService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // ===================================================================
  // CORE CLUSTERING METHODS
  // ===================================================================

  /**
   * Get all available surveys for clustering analysis
   */
  getAvailableSurveys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/survey`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Perform clustering analysis on a survey
   */
  performClusteringAnalysis(surveyId: number, options?: { forcedK?: number }): Observable<any> {
    const url = `${this.apiUrl}/clustering/survey/${surveyId}/analyze`;
    return this.http.post<any>(url, options || {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get existing clustering results for a survey
   */
  getClusteringResults(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/results`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get detailed information about a specific cluster
   */
  getClusterDetails(surveyId: number, clusterId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/cluster/${clusterId}/details`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get cluster assignment for a specific participant
   */
  getParticipantClusterAssignment(surveyId: number, participantId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/participant/${participantId}/assignment`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Export clustering data for external analysis
   */
  exportClusteringData(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/export/${surveyId}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Recompute metrics for existing responses
   */
  recomputeMetrics(surveyId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/responses/recompute-metrics/${surveyId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // ===================================================================
  // ADVANCED ANALYTICS METHODS
  // ===================================================================

  /**
   * Perform cross-survey clustering analysis
   */
  performCrossSurveyAnalysis(options?: { forcedK?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/all-surveys/analyze`, options || {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Compare clustering results across different surveys
   */
  getClusteringComparison(surveyIds: number[]): Observable<any> {
    const surveyIdsParam = surveyIds.join(',');
    return this.http.get<any>(`${this.apiUrl}/clustering/comparison?surveyIds=${surveyIdsParam}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get enhanced analytics for a survey
   */
  getEnhancedAnalytics(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/responses/analytics/survey/${surveyId}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get survey overview analytics
   */
  getSurveyOverview(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/overview`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get demographic breakdown for a survey
   */
  getDemographicBreakdown(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/demographics`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get behavioral patterns for a survey
   */
  getBehavioralPatterns(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/behavioral-patterns`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get performance correlations for a survey
   */
  getPerformanceCorrelations(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/correlations`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get top performers for a survey
   */
  getTopPerformers(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/top-performers`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get performance distribution for a survey
   */
  getPerformanceDistribution(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/performance-distribution`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get clustering insights for a survey
   */
  getClusteringInsights(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/insights`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get summary of all surveys
   */
  getAllSurveysSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/all-surveys/summary`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===================================================================
  // QUALITY & VALIDATION METHODS
  // ===================================================================

  /**
   * Test the clustering functionality with sample data
   */
  testClustering(sampleData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/test`, sampleData, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get clustering quality metrics
   */
  getClusteringQuality(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/quality`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Predict cluster for a new participant
   */
  predictParticipantCluster(surveyId: number, participantData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/survey/${surveyId}/predict`, participantData, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get feature importance for clustering
   */
  getFeatureImportance(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/feature-importance`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get clustering stability metrics
   */
  getClusteringStability(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/stability`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Validate clustering configuration
   */
  validateClusteringConfig(config: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/validate-config`, config, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get recommended number of clusters
   */
  getRecommendedClusterCount(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/recommended-k`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===================================================================
  // REPORTING & EXPORT METHODS
  // ===================================================================

  /**
   * Generate clustering report
   */
  generateClusteringReport(surveyId: number, format: 'pdf' | 'excel' | 'json' = 'json'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/report?format=${format}`, {
      headers: this.getAuthHeaders(),
      responseType: format === 'json' ? 'json' : 'blob' as 'json'
    });
  }

  /**
   * Get clustering trends over time
   */
  getClusteringTrends(surveyIds: number[], timeRange?: { start: Date; end: Date }): Observable<any> {
    let url = `${this.apiUrl}/clustering/trends?surveyIds=${surveyIds.join(',')}`;
    
    if (timeRange) {
      url += `&start=${timeRange.start.toISOString()}&end=${timeRange.end.toISOString()}`;
    }
    
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Compare two clustering results
   */
  compareClusteringResults(surveyId1: number, surveyId2: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/compare/${surveyId1}/${surveyId2}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get cluster evolution over multiple runs
   */
  getClusterEvolution(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/evolution`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===================================================================
  // CONFIGURATION METHODS
  // ===================================================================

  /**
   * Save clustering configuration
   */
  saveClusteringConfig(surveyId: number, config: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/survey/${surveyId}/config`, config, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Load saved clustering configuration
   */
  loadClusteringConfig(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/config`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get clustering health check
   */
  getClusteringHealthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/health`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===================================================================
  // FISHER TEST & QUESTION IMPACT METHODS
  // ===================================================================

  /**
   * Get question impact analysis for clustering
   */
  getQuestionImpact(surveyId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/clustering/survey/${surveyId}/question-impact`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Get detailed explanations for significant questions
   */
  getClusterQuestionExplanations(surveyId: number, clusterId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/clustering/survey/${surveyId}/cluster/${clusterId}/explanations`,
      { headers: this.getAuthHeaders() }
    );
  }

   performOptimizedClusteringAnalysis(
    surveyId: number, 
    options?: OptimizationOptions
  ): Observable<{
    success: boolean;
    data: {
      clusters: any[];
      metadata: any;
      insights: string[];
      optimization: OptimizationResult;
    };
    message: string;
    timestamp: Date;
  }> {
    const url = `${this.apiUrl}/clustering/survey/${surveyId}/analyze-optimized`;
    const requestOptions = {
      forcedK: options?.forcedK,
      maxIterations: options?.maxIterations || 3,
      qualityThreshold: options?.qualityThreshold || 0.5
    };

    return this.http.post<any>(url, requestOptions, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * ✅ ENHANCED: Smart clustering analysis - tries optimized first, fallback to standard
   */
  performSmartClusteringAnalysis(
    surveyId: number, 
    options?: OptimizationOptions
  ): Observable<any> {
    console.log('🧠 Starting smart clustering analysis...');
    
    // Always use optimized analysis for best results
    return this.performOptimizedClusteringAnalysis(surveyId, options);
  }

   /**
   * Check category consistency across all responses
   */
  checkCategoryConsistency(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/responses/debug/category-consistency`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Fix ALL categories to use consistent mapping
   */
  fixAllCategories(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/responses/fix-all-categories`, {}, {
      headers: this.getAuthHeaders()
    });
  }
  
}