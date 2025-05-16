import { Component, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = ''; // Resetare eroare

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        if (response?.access_token) {
          localStorage.setItem('token', response.access_token);
          this.authService.setToken(response.access_token);
          this.router.navigate(['/admin-dashboard']);
        }
      },
      error: (error) => {
        console.error('❌ Eroare login:', error);
        this.errorMessage = 'Email sau parolă incorectă!';
      }
    });
  }
}
