import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // ⬅️ Adaugă aici
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // ⬅️ Cu "s"
})
export class AppComponent {
  title = 'frontend';
}
