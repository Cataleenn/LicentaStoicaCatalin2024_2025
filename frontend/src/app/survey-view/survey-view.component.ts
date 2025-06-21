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
  
  currentStep = 1;
   scrollProgress: number = 0;
  questionProgress: number = 0;
  totalQuestions: number = 0;
  currentQuestionIndex: number = 0;
  Math = Math;


  constructor(
    private route: ActivatedRoute,
    private surveyService: SurveyService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.surveyId = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Survey ID:', this.surveyId);


    this.surveyForm = this.fb.group({
      questions: this.fb.array([])
    });


    this.isLoading = true;
    this.surveyService.getSurveyById(this.surveyId).subscribe(
      (data) => {
        console.log('Survey data received:', data);
        this.surveyData = data;
      
        if (data && data.questions && Array.isArray(data.questions)) {
          this.setQuestions(data.questions);
          this.totalQuestions = data.questions.length;
          this.setupScrollListener();
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
    this.currentStep = 1;


     console.log('Step:', this.currentStep);
console.log('Assembly completed:', this.assemblyCompleted);
console.log('Questions:', this.questions.value);


  }

  setupScrollListener(): void {
    setTimeout(() => {
      window.addEventListener('scroll', () => this.updateProgress());
      this.updateProgress();
    }, 500);
  }
   updateProgress(): void {
    if (this.currentStep !== 3 || this.totalQuestions === 0) {
      return;
    }

    const questionContainers = document.querySelectorAll('.question-container');
    if (questionContainers.length === 0) {
      return;
    }

    const windowHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    
    this.scrollProgress = Math.min(100, Math.max(0, (scrollTop / documentHeight) * 100));

    let currentQuestion = 0;
    questionContainers.forEach((container, index) => {
      const rect = container.getBoundingClientRect();
      const isVisible = rect.top < windowHeight * 0.7 && rect.bottom > windowHeight * 0.3;
      
      if (isVisible) {
        currentQuestion = index + 1;
      }
    });

    this.currentQuestionIndex = currentQuestion;
    this.questionProgress = (currentQuestion / this.totalQuestions) * 100;
  }

  scrollToQuestion(questionIndex: number): void {
    const questionElement = document.querySelector(`#question-${questionIndex}`);
    if (questionElement) {
      questionElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', () => this.updateProgress());
  }

  onAssemblyComplete(event: {
  rotations: number;
  componentsPlaced: { componentId: string; slotId: string }[];
  }) {
    this.assemblyCompleted = true;
    this.assemblyData = event;
    this.currentStep=3;
  }


  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

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

  setQuestions(questions: any[]): void {
    console.log('Setting questions:', questions);
    try {
      const questionFGs = questions.map((question) => {
        const mappedType = this.mapQuestionType(question.questionType);

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
          required: [question.required || false],
          response: ['']  
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
    if (!selectedValues.includes(value)) {
      selectedValues.push(value);
    }
  } else {
    const index = selectedValues.indexOf(value);
    if (index !== -1) {
      selectedValues.splice(index, 1);
    }
  }

  question.get('response')?.setValue(selectedValues);
}

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

  getSurveyTitle(): string {
    return this.surveyData?.formTitle || this.surveyData?.title || 'Untitled Survey';
  }

  getSurveyAdminDescription(): string {
    return this.surveyData?.adminDescription || '';
  }

  getSurveyUserInstructions(): string {
    return this.surveyData?.userInstructions || '';
  }
goToAssembly() {
  const stepEl = document.getElementById('step-instructions');
  if (stepEl) {
    stepEl.classList.remove('fade-in');
    stepEl.classList.add('fade-out');

    setTimeout(() => {
      this.currentStep = 2;
    }, 400); 
  } else {
    this.currentStep = 2;
  }
}
  
onSubmit(): void {
  console.log('Form submitted:', this.surveyForm.value);

  let hasMissingRequired = false;

for (let i = 0; i < this.questions.length; i++) {
  const question = this.questions.at(i);
  const isRequired = question.get('required')?.value;
  const response = question.get('response')?.value;

  const isEmpty =
    response === null ||
    response === undefined ||
    (typeof response === 'string' && response.trim() === '') ||
    (Array.isArray(response) && response.length === 0);

  if (isRequired && isEmpty) {
    question.get('response')?.setErrors({ required: true }); 
    hasMissingRequired = true;
  } else {
    question.get('response')?.setErrors(null); 
  }
}

if (hasMissingRequired) {
  alert('Te rugăm să completezi toate întrebările obligatorii.');
  return;
}

  const surveyData = this.surveyForm.value;
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
}


}