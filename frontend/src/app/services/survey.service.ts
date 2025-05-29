import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private apiUrl = 'http://localhost:3000/api/survey';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Create survey
  createSurvey(surveyData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, surveyData, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Get survey by ID (public endpoint)
  getSurveyById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Get all surveys (admin only)
  getAllSurveys(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Get survey statistics (admin only)
  getSurveyStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`, { 
      headers: this.getAuthHeaders() 
    });
  }

  // Submit responses
  submitResponses(surveyId: number, responses: any): Observable<any> {
    return this.http.post(`http://localhost:3000/api/responses`, responses);
  }
}