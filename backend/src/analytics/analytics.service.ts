// Analytics Service Update - frontend/src/app/services/analytics.service.ts  
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:3000/api/analytics';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Get overview analytics for a survey
  getSurveyOverview(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/overview`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get demographic breakdown
  getDemographicBreakdown(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/demographics`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get behavioral patterns
  getBehavioralPatterns(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/behavioral-patterns`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get performance correlations
  getPerformanceCorrelations(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/correlations`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get top performers
  getTopPerformers(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/top-performers`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get performance distribution
  getPerformanceDistribution(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/performance-distribution`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get analytics insights
  getAnalyticsInsights(surveyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/survey/${surveyId}/insights`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all surveys summary
  getAllSurveysSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/all-surveys/summary`, {
      headers: this.getAuthHeaders()
    });
  }
}