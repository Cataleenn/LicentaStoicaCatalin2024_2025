// Frontend Clustering Service - frontend/src/app/services/clustering.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

interface Survey {
  id: number;
  formTitle: string;
  createdAt: string;
  responses?: any[];
}

interface ClusteringResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
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

  /**
   * Get all surveys available for clustering analysis
   */
  getAvailableSurveys(): Observable<Survey[]> {
    console.log('🔍 Fetching surveys for clustering analysis...');
    
    return this.http.get<Survey[]>(`${this.apiUrl}/survey`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map((surveys: any[]) => {
        console.log('✅ Raw surveys received:', surveys);
        
        // Filter and map surveys that have responses
        const processedSurveys = surveys
          .filter(survey => survey.responses && survey.responses.length > 0)
          .map(survey => ({
            id: survey.id,
            formTitle: survey.formTitle,
            createdAt: survey.createdAt,
            responses: survey.responses,
            responseCount: survey.responses?.length || 0
          }));
        
        console.log('✅ Processed surveys for clustering:', processedSurveys);
        return processedSurveys;
      }),
      catchError(error => {
        console.error('❌ Error fetching surveys:', error);
        return of([]);
      })
    );
  }

  /**
   * Perform clustering analysis on a survey
   */
  performClusteringAnalysis(surveyId: number): Observable<ClusteringResult> {
    console.log(`🔬 Starting clustering analysis for survey ${surveyId}`);
    
    return this.http.post<ClusteringResult>(`${this.apiUrl}/clustering/survey/${surveyId}/analyze`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Clustering analysis response:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Clustering analysis failed:', error);
        return of({
          success: false,
          error: error.error?.message || error.message || 'Unknown error',
          message: 'Clustering analysis failed'
        });
      })
    );
  }

  /**
   * Get existing clustering results for a survey
   */
  getClusteringResults(surveyId: number): Observable<ClusteringResult> {
    console.log(`📊 Getting clustering results for survey ${surveyId}`);
    
    return this.http.get<ClusteringResult>(`${this.apiUrl}/clustering/survey/${surveyId}/results`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Clustering results:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error getting clustering results:', error);
        return of({
          success: false,
          error: error.error?.message || error.message || 'No results found',
          message: 'No clustering results available'
        });
      })
    );
  }

  /**
   * Get detailed information about a specific cluster
   */
  getClusterDetails(surveyId: number, clusterId: number): Observable<ClusteringResult> {
    console.log(`🔍 Getting details for cluster ${clusterId} in survey ${surveyId}`);
    
    return this.http.get<ClusteringResult>(`${this.apiUrl}/clustering/survey/${surveyId}/cluster/${clusterId}/details`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Cluster details:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error getting cluster details:', error);
        return of({
          success: false,
          error: error.error?.message || error.message || 'Failed to get cluster details',
          message: 'Failed to retrieve cluster details'
        });
      })
    );
  }

  /**
   * Recompute metrics for existing responses in a survey
   */
  recomputeMetrics(surveyId: number): Observable<ClusteringResult> {
    console.log(`⚙️ Recomputing metrics for survey ${surveyId}`);
    
    return this.http.post<ClusteringResult>(`${this.apiUrl}/responses/recompute-metrics/${surveyId}`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Metrics recomputation response:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Metrics recomputation failed:', error);
        return of({
          success: false,
          error: error.error?.message || error.message || 'Recomputation failed',
          message: 'Failed to recompute metrics'
        });
      })
    );
  }

  /**
   * Get participant cluster assignment
   */
  getParticipantAssignment(surveyId: number, participantId: string): Observable<ClusteringResult> {
    console.log(`👤 Getting assignment for participant ${participantId}`);
    
    return this.http.get<ClusteringResult>(`${this.apiUrl}/clustering/survey/${surveyId}/participant/${participantId}/assignment`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Participant assignment:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error getting participant assignment:', error);
        return of({
          success: false,
          error: error.error?.message || error.message || 'Assignment not found',
          message: 'Failed to get participant assignment'
        });
      })
    );
  }

  /**
   * Perform cross-survey clustering analysis
   */
  performCrossSurveyAnalysis(): Observable<ClusteringResult> {
    console.log('🌐 Starting cross-survey clustering analysis');
    
    return this.http.post<ClusteringResult>(`${this.apiUrl}/clustering/all-surveys/analyze`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Cross-survey analysis response:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Cross-survey analysis failed:', error);
        return of({
          success: false,
          error: error.error?.message || error.message || 'Cross-survey analysis failed',
          message: 'Failed to perform cross-survey analysis'
        });
      })
    );
  }

  /**
   * Export clustering data for external analysis
   */
  exportClusteringData(surveyId: number): Observable<ClusteringResult> {
    console.log(`📤 Exporting clustering data for survey ${surveyId}`);
    
    return this.http.get<ClusteringResult>(`${this.apiUrl}/clustering/export/${surveyId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Export data response:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Export failed:', error);
        return of({
          success: false,
          error: error.error?.message || error.message || 'Export failed',
          message: 'Failed to export clustering data'
        });
      })
    );
  }

  /**
   * Compare clustering results across surveys
   */
  getClusteringComparison(surveyIds: number[]): Observable<ClusteringResult> {
    console.log('📊 Getting clustering comparison for surveys:', surveyIds);
    
    const surveyIdsParam = surveyIds.join(',');
    
    return this.http.get<ClusteringResult>(`${this.apiUrl}/clustering/comparison?surveyIds=${surveyIdsParam}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        console.log('✅ Clustering comparison response:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Comparison failed:', error);
        return of({
          success: false,
          error: error.error?.message || error.message || 'Comparison failed',
          message: 'Failed to get clustering comparison'
        });
      })
    );
  }
}