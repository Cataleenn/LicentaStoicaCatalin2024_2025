import { Component } from '@angular/core';

import { NavbarComponent } from '../../navbar/navbar.component'; 

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NavbarComponent], 
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'] 
})
export class AdminDashboardComponent {
  
}
