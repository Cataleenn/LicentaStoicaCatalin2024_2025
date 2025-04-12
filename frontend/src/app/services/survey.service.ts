import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Survey } from '../models/survey.model';  // Importă modelul corect

@Injectable({
  providedIn: 'root'
})
export class SurveyService {
  private apiUrl = `${environment.apiUrl}/survey`;  // URL-ul backend-ului

  constructor(private http: HttpClient) {}

  createSurvey(surveyData: Survey): Observable<Survey> {
    return this.http.post<Survey>(this.apiUrl, surveyData);  // Trimite cererea POST
  }
}
