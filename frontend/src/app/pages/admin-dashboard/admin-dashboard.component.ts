import { Component } from '@angular/core';

import { NavbarComponent } from '../../navbar/navbar.component'; // ajustează dacă e în alt folder

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [NavbarComponent], // ⬅️ Importă navbarul aici
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'] // ⬅️ era greșit: "styleUrl" → "styleUrls"
})
export class AdminDashboardComponent {
  
}
