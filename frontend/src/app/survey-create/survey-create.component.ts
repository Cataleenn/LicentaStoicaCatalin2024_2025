import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { SurveyService } from '../services/survey.service';  // Importă serviciul corect
import { Survey } from '../models/survey.model';  // Importă modelul Survey

// Importă modulele necesare
import { CommonModule } from '@angular/common';  // ✅ Importă CommonModule pentru ngFor
import { FormsModule, ReactiveFormsModule } from '@angular/forms';  // ✅ Importă FormsModule și ReactiveFormsModule

@Component({
  selector: 'app-survey-create',
  standalone: true,  // Definește componenta ca fiind standalone
  imports: [CommonModule, FormsModule, ReactiveFormsModule],  // ✅ Importă CommonModule, FormsModule și ReactiveFormsModule
  templateUrl: './survey-create.component.html',
  styleUrls: ['./survey-create.component.css']
})
export class SurveyCreateComponent implements OnInit {
  surveyForm!: FormGroup;  // Folosește operatorul `!` pentru a spune TypeScript că va fi inițializat

  constructor(private fb: FormBuilder, private surveyService: SurveyService) {}

  ngOnInit(): void {
    // Inițializarea formularului
    this.surveyForm = this.fb.group({
      formTitle: ['', Validators.required],  // Form title este obligatoriu
      description: [''],
      questions: this.fb.array([this.createQuestion()])  // Crearea întrebărilor
    });
  }

  // Getter pentru întrebările din formular
  get questions() {
    return this.surveyForm.get('questions') as FormArray;
  }

  // Funcția de creare a întrebării
  createQuestion(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required]  // Textul întrebării este obligatoriu
    });
  }

  // Funcția de adăugare a unei întrebări suplimentare
  addQuestion() {
    this.questions.push(this.createQuestion());  // Adaugă o întrebare
  }

  // Funcția de trimitere a formularului
  onSubmit() {
    if (this.surveyForm.valid) {
      const surveyData = this.surveyForm.value;

      // Verifică dacă 'formTitle' este completat
      if (!surveyData.formTitle) {
        console.error('Form title is required!');
        return;
      }

      // Trimite cererea la serviciu
      this.surveyService.createSurvey(surveyData).subscribe(
        (response) => {
          console.log('Survey created!', response);
        },
        (error) => {
          console.error('Error creating survey', error);
        }
      );
    }
  }
}
