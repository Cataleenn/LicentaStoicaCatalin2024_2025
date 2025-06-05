import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, catchError } from 'rxjs';
import { of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private apiUrl = `${environment.apiUrl}/survey`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Create survey
  createSurvey(surveyData: any): Observable<any> {
    console.log('🔹 Creez chestionar:', surveyData);
    return this.http.post<any>(`${this.apiUrl}`, surveyData, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(response => console.log('✅ Chestionar creat cu succes:', response)),
      catchError(error => {
        console.error('❌ Eroare la crearea chestionarului:', error);
        throw error;
      })
    );
  }

  // Get survey by ID (public endpoint)
  getSurveyById(id: number): Observable<any> {
    console.log('🔹 Obțin chestionar cu ID:', id);
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log('✅ Chestionar obținut:', response)),
      catchError(error => {
        console.error('❌ Eroare la obținerea chestionarului:', error);
        throw error;
      })
    );
  }

  // Get all surveys (admin only)
  getAllSurveys(): Observable<any[]> {
    console.log('🔹 Încerc să obțin toate chestionarele...');
    
    return this.http.get<any[]>(`${this.apiUrl}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(response => {
        console.log('✅ Răspuns de la server pentru getAllSurveys:', response);
        console.log('✅ Numărul de chestionare primite:', response?.length || 0);
      }),
      catchError(error => {
        console.error('❌ Eroare detaliată la getAllSurveys:', error);
        return of([]);
      })
    );
  }

  // Get survey statistics (admin only)
  getSurveyStats(): Observable<any> {
    console.log('🔹 Încerc să obțin statisticile...');
    return this.http.get<any>(`${this.apiUrl}/stats`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(response => console.log('✅ Statistici primite:', response)),
      catchError(error => {
        console.error('❌ Eroare la obținerea statisticilor:', error);
        return of({ totalSurveys: 0, totalResponses: 0, recentSurveys: [] });
      })
    );
  }

  // Get survey responses (admin only)
  getSurveyResponses(surveyId: number): Observable<any> {
    console.log('🔹 Obțin răspunsurile pentru chestionarul:', surveyId);
    return this.http.get<any>(`${this.apiUrl}/${surveyId}/responses`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(response => console.log('✅ Răspunsuri primite:', response)),
      catchError(error => {
        console.error('❌ Eroare la obținerea răspunsurilor:', error);
        throw error;
      })
    );
  }

  // Delete survey and all responses (admin only)
  deleteSurvey(surveyId: number): Observable<any> {
    console.log('🔹 Șterg chestionarul:', surveyId);
    return this.http.delete<any>(`${this.apiUrl}/${surveyId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(response => console.log('✅ Chestionar șters:', response)),
      catchError(error => {
        console.error('❌ Eroare la ștergerea chestionarului:', error);
        throw error;
      })
    );
  }

  // Submit responses
  submitResponses(surveyId: number, responses: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/responses`, responses);
  }
}