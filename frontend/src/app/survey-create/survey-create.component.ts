import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { SurveyService } from '../services/survey.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-survey-create',
  templateUrl: './survey-create.component.html',
  styleUrls: ['./survey-create.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class SurveyCreateComponent implements OnInit {
  surveyForm!: FormGroup;

  constructor(private fb: FormBuilder, private surveyService: SurveyService) {}

  ngOnInit(): void {
    this.surveyForm = this.fb.group({
      formTitle: ['', Validators.required],
      adminDescription: [''],
      required: [false],
      userInstructions:[''],
      questions: this.fb.array([this.createQuestion()])
    });
  }

  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  createQuestion(): FormGroup {
    return this.fb.group({
      questionText: ['', Validators.required],
      questionType: ['single_choice', Validators.required],
      required: [false],
      options: this.fb.array([]),
      response: this.fb.control([])
    });
  }

  



  addQuestion() {
    this.questions.push(this.createQuestion());
  }

  addOption(questionIndex: number) {
    const options = this.getOptions(questionIndex);
    options.push(this.fb.group({
      text: [''],
      value: ['']
    }));
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const options = this.getOptions(questionIndex);
    options.removeAt(optionIndex);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }
  
  questionAllowsOptions(question: AbstractControl): boolean {
  const type = question.get('questionType')?.value;
  return type === 'single_choice' || type === 'multiple_choice';
}


  onSubmit() {
    this.questions.controls.forEach((question) => {
  question.get('questionText')?.markAsTouched();
});

  this.surveyForm.get('formTitle')?.markAsTouched();
  let allOptionsValid = true;
  let allQuestionsHaveText = true;

  this.questions.controls.forEach((question, index) => {
    const type = question.get('questionType')?.value;
    const options = question.get('options') as FormArray;

    const needsOptions = type === 'single_choice' || type === 'multiple_choice';
    const hasNoOptions = options.length === 0;

    const questionText = question.get('questionText')?.value;

    //  Verificare opțiuni pentru întrebări de tip alegere
    if (needsOptions && hasNoOptions) {
      allOptionsValid = false;
      question.setErrors({ ...question.errors, noOptions: true });
    } else {
      question.setErrors(null); // curăță eroarea dacă a fost reparată
    }

    // Verificare text întrebare
    if (!questionText || questionText.trim() === '') {
      allQuestionsHaveText = false;
      question.get('questionText')?.setErrors({ required: true });
    } else {
      question.get('questionText')?.setErrors(null);
    }
  });

  if (!allOptionsValid) {
    alert('Toate întrebările de tip alegere trebuie să aibă cel puțin o opțiune.');
    return;
  }

  if (!allQuestionsHaveText) {
    alert('Toate întrebările trebuie să aibă text completat.');
    return;
  }

  //  Daca formularul este valid, trimite
  if (this.surveyForm.valid) {
    const surveyData = this.surveyForm.value;
    this.surveyService.createSurvey(surveyData).subscribe(
      (response) => {
        console.log('Survey created:', response);
        alert('✅ Chestionarul a fost creat cu succes!');

        
        this.surveyForm.reset();
        this.questions.clear();
        this.addQuestion();
      },
      (error) => {
        console.error('Error creating survey:', error);
        alert('❌ Eroare la crearea chestionarului.');
      }
    );
  }
}


  
  getOptions(questionIndex: number): FormArray {
    const questionsArray = this.surveyForm.get('questions') as FormArray;
    const question = questionsArray.controls[questionIndex];
    return question.get('options') as FormArray;
  }
}