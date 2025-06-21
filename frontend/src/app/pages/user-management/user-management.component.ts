import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="user-management-container">
      <h2>🔧 Gestionare Utilizatori</h2>
      
      <!-- Formular pentru adăugare admin nou -->
      <div class="add-admin-section">
        <h3>➕ Adaugă Admin Nou</h3>
        <form [formGroup]="adminForm" (ngSubmit)="onCreateAdmin()">
          <div class="form-row">
            <div class="input-group">
              <label for="name">Nume Complet</label>
              <input 
                id="name" 
                formControlName="name" 
                type="text" 
                placeholder="Introduceti numele complet"
                [ngClass]="{ 'input-error': adminForm.get('name')?.invalid && adminForm.get('name')?.touched }"
              />
              <div class="error-message" *ngIf="adminForm.get('name')?.invalid && adminForm.get('name')?.touched">
                Numele este obligatoriu
              </div>
            </div>
            
            <div class="input-group">
              <label for="email">Email</label>
              <input 
                id="email" 
                formControlName="email" 
                type="email" 
                placeholder="admin@example.com"
                [ngClass]="{ 'input-error': adminForm.get('email')?.invalid && adminForm.get('email')?.touched }"
              />
              <div class="error-message" *ngIf="adminForm.get('email')?.invalid && adminForm.get('email')?.touched">
                <span *ngIf="adminForm.get('email')?.errors?.['required']">Email-ul este obligatoriu</span>
                <span *ngIf="adminForm.get('email')?.errors?.['email']">Format email invalid</span>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="input-group">
              <label for="password">Parolă</label>
              <input 
                id="password" 
                formControlName="password" 
                type="password" 
                placeholder="Minim 6 caractere"
                [ngClass]="{ 'input-error': adminForm.get('password')?.invalid && adminForm.get('password')?.touched }"
              />
              <div class="error-message" *ngIf="adminForm.get('password')?.invalid && adminForm.get('password')?.touched">
                <span *ngIf="adminForm.get('password')?.errors?.['required']">Parola este obligatorie</span>
                <span *ngIf="adminForm.get('password')?.errors?.['minlength']">Parola trebuie să aibă minim 6 caractere</span>
              </div>
            </div>
            
            <div class="input-group">
              <label for="confirmPassword">Confirmă Parola</label>
              <input 
                id="confirmPassword" 
                formControlName="confirmPassword" 
                type="password" 
                placeholder="Reintroduceti parola"
                [ngClass]="{ 'input-error': adminForm.get('confirmPassword')?.invalid && adminForm.get('confirmPassword')?.touched }"
              />
              <div class="error-message" *ngIf="adminForm.get('confirmPassword')?.invalid && adminForm.get('confirmPassword')?.touched">
                <span *ngIf="adminForm.get('confirmPassword')?.errors?.['required']">Confirmarea parolei este obligatorie</span>
                <span *ngIf="adminForm.get('confirmPassword')?.errors?.['passwordMismatch']">Parolele nu se potrivesc</span>
              </div>
            </div>
          </div>
          
          <button type="submit" [disabled]="adminForm.invalid || isCreating" class="create-admin-btn">
            <span *ngIf="!isCreating">✅ Creează Admin</span>
            <span *ngIf="isCreating">⏳ Se creează...</span>
          </button>
        </form>
      </div>

      <!-- Lista administratorilor existenți -->
      <div class="admins-list-section">
        <h3>👥 Administratori Existenți</h3>
        
        <div *ngIf="isLoading" class="loading-message">
          🔄 Se încarcă lista administratorilor...
        </div>
        
        <div *ngIf="!isLoading && admins.length === 0" class="no-admins-message">
          📭 Nu există administratori în sistem.
        </div>
        
        <div *ngIf="!isLoading && admins.length > 0" class="admins-grid">
          <div *ngFor="let admin of admins" class="admin-card">
            <div class="admin-info">
              <h4>{{ admin.name }}</h4>
              <p class="admin-email">📧 {{ admin.email }}</p>
              <p class="admin-role">🛡️ {{ admin.role }}</p>
            </div>
            <div class="admin-actions">
              <button 
                (click)="onDeleteAdmin(admin)" 
                class="delete-btn"
                [disabled]="isDeletingId === admin.id"
              >
                <span *ngIf="isDeletingId !== admin.id">🗑️ Șterge</span>
                <span *ngIf="isDeletingId === admin.id">⏳ Se șterge...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mesaje de succes/eroare -->
      <div *ngIf="successMessage" class="success-message">
        ✅ {{ successMessage }}
      </div>
      
      <div *ngIf="errorMessage" class="error-message-global">
        ❌ {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .user-management-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #1a2a6c;
      margin-bottom: 2rem;
      text-align: center;
      font-size: 28px;
    }

    h3 {
      color: #1565c0;
      margin-bottom: 1.5rem;
      font-size: 20px;
      border-bottom: 2px solid #e3f2fd;
      padding-bottom: 0.5rem;
    }

    .add-admin-section {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 3rem;
      border: 1px solid #e0e7ff;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .input-group {
      display: flex;
      flex-direction: column;
    }

    label {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #374151;
    }

    input {
      padding: 0.75rem;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s ease;
    }

    input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .input-error {
      border-color: #ef4444 !important;
      background-color: #fef2f2;
    }

    .error-message {
      color: #ef4444;
      font-size: 14px;
      margin-top: 0.25rem;
    }

    .create-admin-btn {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 1rem;
    }

    .create-admin-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #2563eb, #1e40af);
      transform: translateY(-1px);
    }

    .create-admin-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }

    .admins-list-section {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 2rem;
    }

    .loading-message,
    .no-admins-message {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
      font-size: 18px;
    }

    .admins-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .admin-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .admin-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .admin-info h4 {
      margin: 0 0 0.5rem 0;
      color: #1f2937;
      font-size: 18px;
    }

    .admin-info p {
      margin: 0.25rem 0;
      color: #6b7280;
      font-size: 14px;
    }

    .admin-email {
      color: #3b82f6 !important;
      font-weight: 500;
    }

    .admin-role {
      color: #059669 !important;
      font-weight: 600;
      text-transform: uppercase;
    }

    .admin-actions {
      margin-top: 1rem;
      text-align: right;
    }

    .delete-btn {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .delete-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
    }

    .delete-btn:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .success-message {
      background: #d1fae5;
      color: #065f46;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      border: 1px solid #a7f3d0;
    }

    .error-message-global {
      background: #fee2e2;
      color: #991b1b;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      border: 1px solid #fca5a5;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .admins-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  adminForm: FormGroup;
  admins: User[] = [];
  isLoading = false;
  isCreating = false;
  isDeletingId: number | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.adminForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadAdmins();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  async loadAdmins(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      this.admins = await this.userService.getAllAdmins();
    } catch (error: any) {
      this.errorMessage = 'Eroare la încărcarea administratorilor: ' + (error.message || 'Eroare necunoscută');
    } finally {
      this.isLoading = false;
    }
  }

  async onCreateAdmin(): Promise<void> {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }

    this.isCreating = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formData = this.adminForm.value;
      await this.userService.createAdmin({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      this.successMessage = `Admin "${formData.name}" a fost creat cu succes!`;
      this.adminForm.reset();
      this.loadAdmins(); 

      setTimeout(() => {
        this.successMessage = '';
      }, 5000);

    } catch (error: any) {
      this.errorMessage = 'Eroare la crearea adminului: ' + (error.message || 'Eroare necunoscută');
    } finally {
      this.isCreating = false;
    }
  }

  async onDeleteAdmin(admin: User): Promise<void> {
    if (!confirm(`Ești sigur că vrei să ștergi adminul "${admin.name}"?`)) {
      return;
    }

    this.isDeletingId = admin.id;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.userService.deleteUser(admin.id);
      this.successMessage = `Admin "${admin.name}" a fost șters cu succes!`;
      this.loadAdmins(); 

 
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);

    } catch (error: any) {
      this.errorMessage = 'Eroare la ștergerea adminului: ' + (error.message || 'Eroare necunoscută');
    } finally {
      this.isDeletingId = null;
    }
  }
}