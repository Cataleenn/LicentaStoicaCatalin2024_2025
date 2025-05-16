import { Component, OnInit } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // pentru *ngIf

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  username: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
  this.authService.getUserProfile().subscribe({
    next: (user) => {
      console.log('✅ USER:', user);
      this.username = user.name || user.email;
    },
    error: (err) => {
      console.error('❌ Eroare profil:', err);
      this.username = null;
    }
  });
}


  logout() {
    this.authService.logout();
  }
}
