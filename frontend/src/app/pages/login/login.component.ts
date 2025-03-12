import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule], // ✅ Importă FormsModule și CommonModule
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

onSubmit(event: Event) {
  event.preventDefault();
  this.authService.login(this.email, this.password).subscribe({
    next: (response) => {
      if (response?.access_token) {
        this.authService.setToken(response.access_token);
        this.router.navigate(['/admin-dashboard']); // ✅ Redirecționează corect
      }
    },
    error: (error) => {
      console.error('❌ Eroare login:', error);
    }
  });
}
  
  
  
}
