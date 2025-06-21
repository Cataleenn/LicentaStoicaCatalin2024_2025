
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OptimizationOptions {
  forcedK?: number;
  maxIterations?: number;  
  qualityThreshold?: number;  
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
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }


  getAvailableSurveys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/survey`, {
      headers: this.getAuthHeaders()
    });
  }

  
  performClusteringAnalysis(surveyId: number, options?: { forcedK?: number }): Observable<any> {
    const url = `${this.apiUrl}/clustering/survey/${surveyId}/analyze`;
    return this.http.post<any>(url, options || {}, {
      headers: this.getAuthHeaders()
    });
  }

  
  getClusteringResults(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/results`, {
      headers: this.getAuthHeaders()
    });
  }

  
  getClusterDetails(surveyId: number, clusterId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/cluster/${clusterId}/details`, {
      headers: this.getAuthHeaders()
    });
  }

 
  getParticipantClusterAssignment(surveyId: number, participantId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/participant/${participantId}/assignment`, {
      headers: this.getAuthHeaders()
    });
  }

  
  exportClusteringData(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/export/${surveyId}`, {
      headers: this.getAuthHeaders()
    });
  }

 
  recomputeMetrics(surveyId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/responses/recompute-metrics/${surveyId}`, {}, {
      headers: this.getAuthHeaders()
    });
  }

 
  performCrossSurveyAnalysis(options?: { forcedK?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/all-surveys/analyze`, options || {}, {
      headers: this.getAuthHeaders()
    });
  }


  getClusteringComparison(surveyIds: number[]): Observable<any> {
    const surveyIdsParam = surveyIds.join(',');
    return this.http.get<any>(`${this.apiUrl}/clustering/comparison?surveyIds=${surveyIdsParam}`, {
      headers: this.getAuthHeaders()
    });
  }


  getEnhancedAnalytics(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/responses/analytics/survey/${surveyId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getSurveyOverview(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/overview`, {
      headers: this.getAuthHeaders()
    });
  }

 
  getDemographicBreakdown(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/demographics`, {
      headers: this.getAuthHeaders()
    });
  }

 
  getBehavioralPatterns(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/behavioral-patterns`, {
      headers: this.getAuthHeaders()
    });
  }

  getPerformanceCorrelations(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/correlations`, {
      headers: this.getAuthHeaders()
    });
  }

 
  getTopPerformers(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/top-performers`, {
      headers: this.getAuthHeaders()
    });
  }

 
  getPerformanceDistribution(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/performance-distribution`, {
      headers: this.getAuthHeaders()
    });
  }

  getClusteringInsights(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/survey/${surveyId}/insights`, {
      headers: this.getAuthHeaders()
    });
  }

 
  getAllSurveysSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/analytics/all-surveys/summary`, {
      headers: this.getAuthHeaders()
    });
  }

  testClustering(sampleData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/test`, sampleData, {
      headers: this.getAuthHeaders()
    });
  }

  getClusteringQuality(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/quality`, {
      headers: this.getAuthHeaders()
    });
  }

  
  predictParticipantCluster(surveyId: number, participantData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/survey/${surveyId}/predict`, participantData, {
      headers: this.getAuthHeaders()
    });
  }


  getFeatureImportance(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/feature-importance`, {
      headers: this.getAuthHeaders()
    });
  }

 
  getClusteringStability(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/stability`, {
      headers: this.getAuthHeaders()
    });
  }


  validateClusteringConfig(config: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/validate-config`, config, {
      headers: this.getAuthHeaders()
    });
  }

 
  getRecommendedClusterCount(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/recommended-k`, {
      headers: this.getAuthHeaders()
    });
  }

 
  generateClusteringReport(surveyId: number, format: 'pdf' | 'excel' | 'json' = 'json'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/report?format=${format}`, {
      headers: this.getAuthHeaders(),
      responseType: format === 'json' ? 'json' : 'blob' as 'json'
    });
  }

 
  getClusteringTrends(surveyIds: number[], timeRange?: { start: Date; end: Date }): Observable<any> {
    let url = `${this.apiUrl}/clustering/trends?surveyIds=${surveyIds.join(',')}`;
    
    if (timeRange) {
      url += `&start=${timeRange.start.toISOString()}&end=${timeRange.end.toISOString()}`;
    }
    
    return this.http.get<any>(url, {
      headers: this.getAuthHeaders()
    });
  }

 
  compareClusteringResults(surveyId1: number, surveyId2: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/compare/${surveyId1}/${surveyId2}`, {
      headers: this.getAuthHeaders()
    });
  }


  getClusterEvolution(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/evolution`, {
      headers: this.getAuthHeaders()
    });
  }

 
  saveClusteringConfig(surveyId: number, config: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clustering/survey/${surveyId}/config`, config, {
      headers: this.getAuthHeaders()
    });
  }

 
  loadClusteringConfig(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/survey/${surveyId}/config`, {
      headers: this.getAuthHeaders()
    });
  }


  getClusteringHealthCheck(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/clustering/health`, {
      headers: this.getAuthHeaders()
    });
  }


  getQuestionImpact(surveyId: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/clustering/survey/${surveyId}/question-impact`,
      { headers: this.getAuthHeaders() }
    );
  }

 
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

  performSmartClusteringAnalysis(
    surveyId: number, 
    options?: OptimizationOptions
  ): Observable<any> {
    console.log('🧠 Starting smart clustering analysis...');
    
 
    return this.performOptimizedClusteringAnalysis(surveyId, options);
  }

  
  checkCategoryConsistency(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/responses/debug/category-consistency`, {
      headers: this.getAuthHeaders()
    });
  }

 
  fixAllCategories(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/responses/fix-all-categories`, {}, {
      headers: this.getAuthHeaders()
    });
  }
  
}