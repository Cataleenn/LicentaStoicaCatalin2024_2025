import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Obține toți administratorii
  async getAllAdmins(): Promise<User[]> {
    const headers = this.getAuthHeaders();
    return firstValueFrom(
      this.http.get<User[]>(`${this.apiUrl}/admins`, { headers })
    );
  }

  // Creează un administrator nou
  async createAdmin(adminData: CreateAdminDto): Promise<User> {
    const headers = this.getAuthHeaders();
    return firstValueFrom(
      this.http.post<User>(`${this.apiUrl}/admin`, adminData, { headers })
    );
  }

  // Șterge un utilizator
  async deleteUser(userId: number): Promise<{ message: string }> {
    const headers = this.getAuthHeaders();
    return firstValueFrom(
      this.http.delete<{ message: string }>(`${this.apiUrl}/${userId}`, { headers })
    );
  }

  // Obține un utilizator după ID
  getUserById(userId: number): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<User>(`${this.apiUrl}/${userId}`, { headers });
  }

  // Actualizează un utilizator
  updateUser(userId: number, userData: Partial<User>): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.put<User>(`${this.apiUrl}/${userId}`, userData, { headers });
  }
}