import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private apiUrl = 'http://localhost:3000/api/survey';  // URL-ul API-ului backend

  constructor(private http: HttpClient) {}

  // Metoda de creare a chestionarului
  createSurvey(surveyData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, surveyData);
  }

  // Metoda pentru a obține un chestionar după ID
  getSurveyById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Metoda pentru a trimite răspunsurile la backend
 submitResponses(surveyId: number, responses: any): Observable<any> {
  return this.http.post(`http://localhost:3000/api/responses`, responses);
}

}
