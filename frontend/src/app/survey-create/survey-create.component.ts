import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { SurveyService } from '../services/survey.service';  // Importă serviciul corect
import { CommonModule } from '@angular/common';  // Importă CommonModule pentru ngIf și ngFor
import { FormsModule, ReactiveFormsModule } from '@angular/forms';  // Importă FormsModule și ReactiveFormsModule


@Component({
  selector: 'app-survey-create',
  templateUrl: './survey-create.component.html',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],  // ✅ Importă modulele necesare
  styleUrls: ['./survey-create.component.css']
})
export class SurveyCreateComponent implements OnInit {
  surveyForm!: FormGroup;
  questions: any[] = [];  // Array de întrebări pentru chestionar

  constructor(private fb: FormBuilder, private surveyService: SurveyService) {}

  ngOnInit(): void {
    this.surveyForm = this.fb.group({
      formTitle: ['', Validators.required],  // Form title este obligatoriu
      description: ['']
    });
  }

  // Adăugăm o întrebare nouă
  addQuestion() {
    this.questions.push({
      questionText: '',
      questionType: 'open_ended',  // Sau orice tip dorești
      options: []  // Opțiuni pentru întrebările de tipul "single_choice" și "multiple_choice"
    });
  }

  // Adăugăm o opțiune pentru o întrebare
  addOption(questionIndex: number) {
    const newOption = {
      text: ''  // Opțiune goală
    };
    this.questions[questionIndex].options.push(newOption);
  }

  // Ștergem o întrebare
  removeQuestion(index: number) {
    this.questions.splice(index, 1);
  }

  // Ștergem o opțiune
  removeOption(questionIndex: number, optionIndex: number) {
    this.questions[questionIndex].options.splice(optionIndex, 1);
  }

  // Funcția de trimitere a formularului
  onSubmit() {
    if (this.surveyForm.valid) {
      const surveyData = this.surveyForm.value;

      // Crearea unui obiect JSON pentru chestionar
      const jsonSurvey = {
        formTitle: surveyData.formTitle,
        description: surveyData.description,
        questions: this.questions.map((question: any, index: number) => ({
          questionId: index + 1,
          text: question.questionText,
          type: question.questionType,
          options: question.options,  // Opțiuni pentru întrebările "single_choice" și "multiple_choice"
          required: true  // De exemplu, poți adăuga un câmp pentru validare
        }))
      };

      // Trimite JSON-ul către backend
      this.surveyService.createSurvey(jsonSurvey).subscribe(
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
