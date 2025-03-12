import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth'; // Schimbă cu URL-ul backend-ului tău

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

  // ✅ Șterge token-ul la logout
  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }

  // ✅ Verifică dacă utilizatorul este autentificat
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}
