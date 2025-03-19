import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // Schimbă cu URL-ul backend-ului tău
  private jwtHelper = new JwtHelperService();
  constructor(private http: HttpClient, private router: Router) {}

  // ✅ Login: Trimite cererea la backend și primește un token JWT
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }

  // ✅ Salvează token-ul în LocalStorage
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // ✅ Obține token-ul salvat
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // ✅ Verifică dacă utilizatorul este autentificat
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
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
    localStorage.removeItem('token'); // ✅ Șterge token-ul JWT
    window.location.href = '/login'; // ✅ Redirecționează la pagina de login
  }
}
