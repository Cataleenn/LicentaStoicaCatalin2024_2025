import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SurveyService } from '../services/survey.service';
import { FormBuilder, FormGroup, FormArray, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ProductAssemblyComponent } from './product-assembly.component';





@Component({
  selector: 'app-survey-view',
  templateUrl: './survey-view.component.html',
  styleUrls: ['./survey-view.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,ProductAssemblyComponent]
})
export class SurveyViewComponent implements OnInit {
  surveyForm!: FormGroup;
  surveyId!: number;
  surveyData: any;
  errorMessage: string = '';
  isLoading: boolean = true;
  assemblyCompleted = false;
assemblyData: {
  rotations: number;
  componentsPlaced: { componentId: string; slotId: string }[];
} | null = null;


  constructor(
    private route: ActivatedRoute,
    private surveyService: SurveyService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.surveyId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Survey ID:', this.surveyId);

    // Initialize the form
    this.surveyForm = this.fb.group({
      questions: this.fb.array([])
    });

    // Fetch survey data
    this.isLoading = true;
    this.surveyService.getSurveyById(this.surveyId).subscribe(
      (data) => {
        console.log('Survey data received:', data);
        this.surveyData = data;
        
        // Check if questions array exists
        if (data && data.questions && Array.isArray(data.questions)) {
          this.setQuestions(data.questions);
        } else {
          this.errorMessage = 'Invalid survey data format';
          console.error('Invalid survey data format:', data);
        }
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching survey', error);
        this.errorMessage = 'Failed to load survey: ' + (error.message || 'Unknown error');
        this.isLoading = false;
      }
    );
  }
  onAssemblyComplete(event: {
  rotations: number;
  componentsPlaced: { componentId: string; slotId: string }[];
}) {
  this.assemblyCompleted = true;
  this.assemblyData = event;
}


  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  // Map API question type to form question type
  mapQuestionType(apiType: string): string {
    const typeMap: {[key: string]: string} = {
      'open_ended': 'text',
      'long_text': 'long-text',
      'single_choice': 'single-choice',
      'multiple_choice': 'multiple-choice',
      'multiple-choice': 'multiple-choice'
    };
    
    return typeMap[apiType] || apiType;
  }

  // Set questions into the form
  setQuestions(questions: any[]): void {
    console.log('Setting questions:', questions);
    try {
      const questionFGs = questions.map((question) => {
        // Get the mapped question type
        const mappedType = this.mapQuestionType(question.questionType);
        
        // Create options FormArray with FormGroups for each option
        const optionsArray = this.fb.array(
          (question.options || []).map((option: any) => 
            this.fb.group({
              text: [option.text || ''],
              value: [option.value || option.text || '']
            })
          )
        );

        return this.fb.group({
          questionText: [question.questionText || ''],
          questionType: [mappedType],
          options: optionsArray,
          dependsOn: [question.dependsOn || null],
          response: ['']  // This is where the user's answer is stored
        });
      });
      
      const questionFormArray = this.fb.array(questionFGs);
      this.surveyForm.setControl('questions', questionFormArray);
      console.log('Form structure:', this.surveyForm.value);
    } catch (err) {
      console.error('Error setting questions:', err);
      this.errorMessage = 'Error creating form: ' + (err instanceof Error ? err.message : 'Unknown error');
    }
  }
  onCheckboxChange(event: any, question: AbstractControl) {
  const selectedValues: any[] = question.get('response')?.value || [];
  const value = event.target.value;

  if (event.target.checked) {
    // Adaugă dacă nu e deja
    if (!selectedValues.includes(value)) {
      selectedValues.push(value);
    }
  } else {
    // Elimină dacă era bifat
    const index = selectedValues.indexOf(value);
    if (index !== -1) {
      selectedValues.splice(index, 1);
    }
  }

  question.get('response')?.setValue(selectedValues);
}

  // Get options for a question
  getOptions(questionIndex: number): FormArray {
    try {
      const questionsArray = this.surveyForm.get('questions') as FormArray;
      const question = questionsArray.controls[questionIndex] as FormGroup;
      return question.get('options') as FormArray;
    } catch (err) {
      console.error('Error getting options:', err);
      return this.fb.array([]);
    }
  }

  // Get survey title from data
  getSurveyTitle(): string {
    return this.surveyData?.formTitle || this.surveyData?.title || 'Untitled Survey';
  }

  // Get survey description from data
  getSurveyDescription(): string {
    return this.surveyData?.description || '';
  }

  // Submit the survey responses
  
onSubmit(): void {
  console.log('Form submitted:', this.surveyForm.value);

  if (this.surveyForm.valid) {
    const surveyData = this.surveyForm.value;

    // Extragem răspunsurile într-un format cheie => valoare
    const answers: Record<string, any> = {};
    surveyData.questions.forEach((q: any, index: number) => {
      answers[index + 1] = q.response;
    });

    const payload = {
  formId: this.surveyId,
  userId: 1,
  answers: answers,
  isComplete: true,
  assembly: this.assemblyData
};


    this.surveyService.submitResponses(this.surveyId, payload).subscribe({
      next: (res) => {
        console.log('Responses submitted successfully', res);
        alert('Chestionar trimis cu succes!');
      },
      error: (err) => {
        console.error('Error submitting responses', err);
        alert('Eroare la trimiterea răspunsurilor!');
      }
    });
  } else {
    console.warn('Form is invalid');
  }
}

}