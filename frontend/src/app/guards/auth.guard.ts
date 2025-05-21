import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('token');  //  Verifica token-ul JWT
    console.log('🔹 Verificare autentificare:', token);

    if (token) { 
      console.log('✅ Acces permis la Admin Dashboard');
      return true;
    } else {
      console.warn('❌ Acces interzis! Redirecționare la login.');
      this.router.navigate(['/login']); // Redirect la login
      return false;
    }
  }
}
