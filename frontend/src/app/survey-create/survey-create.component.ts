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
      description: [''],
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
    if (this.surveyForm.valid) {
      const surveyData = this.surveyForm.value;
      this.surveyService.createSurvey(surveyData).subscribe(
        (response) => {
          console.log('Survey created:', response);
        },
        (error) => {
          console.error('Error creating survey:', error);
        }
      );
    }
  }

  // Fixed method to get options for a specific question
  getOptions(questionIndex: number): FormArray {
    const questionsArray = this.surveyForm.get('questions') as FormArray;
    const question = questionsArray.controls[questionIndex];
    return question.get('options') as FormArray;
  }
}