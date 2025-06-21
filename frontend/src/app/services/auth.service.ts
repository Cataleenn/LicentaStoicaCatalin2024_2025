import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../environments/environment';



@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`; 
  private jwtHelper = new JwtHelperService();
  constructor(private http: HttpClient, private router: Router) {}


  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }
  getUserProfile() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<{ name: string; email: string }>(
      `${environment.apiUrl}/auth/me`,
      { headers }
    );
  }


  setToken(token: string): void {
    localStorage.setItem('token', token);
  }


  getToken(): string | null {
    return localStorage.getItem('token');
  }


  isAuthenticated(): boolean {
  const token = this.getToken();
  if (!token) return false;

  const isExpired = this.jwtHelper.isTokenExpired(token);
  if (isExpired) {
    console.warn('❌ Token expirat! Utilizator delogat automat.');
    this.logout();
    return false;
  }

  return true;
}


  logout(): void {
    console.log('🔹 Utilizator delogat! Șterg token-ul din localStorage.');
    localStorage.removeItem('token'); 
    window.location.href = '/login'; 
  }
}
