// Frontend Fisher Test Service - frontend/src/app/services/fisher-test.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SimpleQuestionResult {
  questionNumber: string;
  questionText: string;
  answerValue: string;
  pValue: number;
  isSignificant: boolean;
  explanation: string;
}

export interface ClusterSignificantQuestions {
  clusterId: number;
  significantQuestions: SimpleQuestionResult[];
  totalQuestionsAnalyzed: number;
}

export interface AllClustersResult {
  surveyId: number;
  clusters: Array<{
    clusterId: number;
    significantQuestions: SimpleQuestionResult[];
  }>;
}

export interface FisherTestSummary {
  totalClusters: number;
  totalSignificantQuestions: number;
  mostSignificantQuestions: Array<{
    clusterId: number;
    questionNumber: string;
    questionText: string;
    answerValue: string;
    pValue: number;
    isSignificant: boolean;
    explanation: string;
  }>;
  questionImportanceRanking: Array<{
    questionNumber: string;
    questionText: string;
    timesSignificant: number;
    avgPValue: number;
    importance: 'high' | 'medium' | 'low';
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class FisherTestService {
  private apiUrl = '${environment.apiUrl}/fisher-test';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  /**
   * Get significant questions for a specific cluster
   */
  getClusterSignificantQuestions(surveyId: number, clusterId: number): Observable<{
    success: boolean;
    data: ClusterSignificantQuestions;
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/cluster/${clusterId}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get significant questions for all clusters in a survey
   */
  getAllClustersSignificantQuestions(surveyId: number): Observable<{
    success: boolean;
    data: AllClustersResult;
    summary: {
      totalClusters: number;
      totalSignificantQuestions: number;
      avgSignificantPerCluster: number;
    };
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/all-clusters`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get Fisher test summary for a survey
   */
  getFisherTestSummary(surveyId: number): Observable<{
    success: boolean;
    data: FisherTestSummary;
    message: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/summary`, {
      headers: this.getAuthHeaders()
    });
  }
}