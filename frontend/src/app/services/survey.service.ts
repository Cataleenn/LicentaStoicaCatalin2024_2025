import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private apiUrl = 'http://localhost:3000/api/survey';

  constructor(private http: HttpClient) {}

  createSurvey(surveyData: any): Observable<any> {
    return this.http.post(this.apiUrl, surveyData);  // Trimiterea JSON-ului către backend
  }
}
