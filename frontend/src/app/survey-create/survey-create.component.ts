import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
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
  isSubmitting = false;

  constructor(
    private fb: FormBuilder, 
    private surveyService: SurveyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.surveyForm = this.fb.group({
      formTitle: ['', [Validators.required, Validators.minLength(3)]],
      adminDescription: [''],
      required: [false],
      userInstructions: [''],
      questions: this.fb.array([this.createQuestion()])
    });
  }

  get questions(): FormArray {
    return this.surveyForm.get('questions') as FormArray;
  }

  createQuestion(): FormGroup {
    return this.fb.group({
      questionText: ['', [Validators.required, Validators.minLength(5)]],
      questionType: ['single_choice', Validators.required],
      required: [false],
      options: this.fb.array([this.createOption()]),
      response: this.fb.control([])
    });
  }

  private createOption(): FormGroup {
    return this.fb.group({
      text: ['', [Validators.required, Validators.minLength(1)]],
      value: ['']
    });
  }

  addQuestion(): void {
    this.questions.push(this.createQuestion());
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = document.querySelector('.question-block:last-child');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  addOption(questionIndex: number): void {
    const options = this.getOptions(questionIndex);
    options.push(this.createOption());
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    const options = this.getOptions(questionIndex);
    if (options.length > 1) {
      options.removeAt(optionIndex);
    }
  }

  removeQuestion(index: number): void {
    if (this.questions.length > 1) {
      // Animație de fade-out înainte de ștergere
      const questionElement = document.querySelector(`.question-block:nth-child(${index + 1})`);
      if (questionElement) {
        questionElement.classList.add('fade-out');
        setTimeout(() => {
          this.questions.removeAt(index);
        }, 300);
      } else {
        this.questions.removeAt(index);
      }
    }
  }
  
  questionAllowsOptions(question: AbstractControl): boolean {
    const questionGroup = question as FormGroup;
    const type = questionGroup.get('questionType')?.value;
    return type === 'single_choice' || type === 'multiple_choice';
  }

  getOptions(questionIndex: number): FormArray {
    const questionsArray = this.surveyForm.get('questions') as FormArray;
    const question = questionsArray.controls[questionIndex] as FormGroup;
    return question.get('options') as FormArray;
  }

  private validateForm(): boolean {
    let isValid = true;
    
    // Validare titlu
    const titleControl = this.surveyForm.get('formTitle');
    titleControl?.markAsTouched();
    if (titleControl?.invalid) {
      isValid = false;
    }

    // Validare întrebări
    this.questions.controls.forEach((questionControl, index) => {
      const question = questionControl as FormGroup;
      const questionText = question.get('questionText');
      const questionType = question.get('questionType')?.value;
      const options = question.get('options') as FormArray;

      // Validare text întrebare
      questionText?.markAsTouched();
      if (questionText?.invalid) {
        isValid = false;
      }

      // Validare opțiuni pentru întrebări de tip alegere
      const needsOptions = questionType === 'single_choice' || questionType === 'multiple_choice';
      const hasValidOptions = options.controls.some(optionControl => {
        const option = optionControl as FormGroup;
        const textValue = option.get('text')?.value;
        return textValue && textValue.trim().length > 0;
      });

      if (needsOptions && !hasValidOptions) {
        question.setErrors({ ...question.errors, noOptions: true });
        isValid = false;
      } else if (question.errors?.['noOptions']) {
        // Curăță eroarea dacă a fost reparată
        const { noOptions, ...otherErrors } = question.errors;
        const hasOtherErrors = Object.keys(otherErrors).length > 0;
        question.setErrors(hasOtherErrors ? otherErrors : null);
      }

      // Validare opțiuni individuale
      if (needsOptions) {
        options.controls.forEach(optionControl => {
          const option = optionControl as FormGroup;
          const textControl = option.get('text');
          textControl?.markAsTouched();
          if (textControl?.invalid) {
            isValid = false;
          }
        });
      }
    });

    return isValid;
  }

  private showValidationErrors(): void {
    const titleControl = this.surveyForm.get('formTitle');
    if (titleControl?.invalid) {
      this.showToast('Titlul chestionarului este obligatoriu', 'error');
      return;
    }

    const hasInvalidQuestions = this.questions.controls.some(questionControl => {
      const question = questionControl as FormGroup;
      return question.get('questionText')?.invalid || question.errors?.['noOptions'];
    });

    if (hasInvalidQuestions) {
      this.showToast('Verificați întrebările - toate trebuie să aibă text și opțiuni (unde este cazul)', 'error');
      return;
    }

    this.showToast('Vă rugăm să corectați erorile din formular', 'error');
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    // Implementare simplă cu alert - poate fi înlocuită cu o bibliotecă de toast
    if (type === 'error') {
      alert(`❌ ${message}`);
    } else {
      alert(`✅ ${message}`);
    }
  }

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (!this.validateForm()) {
      this.showValidationErrors();
      return;
    }

    this.isSubmitting = true;
    
   
    const surveyData = this.prepareSurveyData();
    
    this.surveyService.createSurvey(surveyData).subscribe({
    next: (response) => {
      console.log('✅ Survey created successfully:', response);
      this.showToast('Chestionarul a fost creat cu succes!', 'success');
      
      
      setTimeout(() => {
        this.router.navigate(['/admin-dashboard']);
      }, 1500); 
      
      this.isSubmitting = false;
    }
  });
  }

  private prepareSurveyData(): any {
    const formValue = this.surveyForm.value;
    
    
    const cleanedQuestions = formValue.questions.map((question: any) => {
      const cleanedQuestion = { ...question };
      
      if (question.questionType === 'single_choice' || question.questionType === 'multiple_choice') {
        // Filtrează opțiunile goale și setează valorile
        cleanedQuestion.options = question.options
          .filter((option: any) => option.text && option.text.trim())
          .map((option: any) => ({
            text: option.text.trim(),
            value: option.value || option.text.trim()
          }));
      } else {
        // Pentru întrebări text liber, nu sunt necesare opțiuni
        cleanedQuestion.options = [];
      }
      
      delete cleanedQuestion.response; // Nu trimitem response-ul la server
      return cleanedQuestion;
    });

    return {
      formTitle: formValue.formTitle.trim(),
      adminDescription: formValue.adminDescription?.trim() || '',
      userInstructions: formValue.userInstructions?.trim() || '',
      required: formValue.required || false,
      questions: cleanedQuestions,
      lastModified: new Date().toISOString()
    };
  }

  private resetForm(): void {
    // Resetează formularul principal
    this.surveyForm.patchValue({
      formTitle: '',
      adminDescription: '',
      userInstructions: '',
      required: false
    });
    
    // Curăță și recreează array-ul de întrebări cu o singură întrebare goală
    const questionsArray = this.surveyForm.get('questions') as FormArray;
    questionsArray.clear();
    questionsArray.push(this.createQuestion());
    
    // Resetează starea formularului
    this.surveyForm.markAsUntouched();
    this.surveyForm.markAsPristine();
    
    // Scroll la început
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Metodă pentru salvare ca draft
  saveDraft(): void {
    const draftData = this.surveyForm.value;
    localStorage.setItem('surveyDraft', JSON.stringify({
      ...draftData,
      savedAt: new Date().toISOString()
    }));
    this.showToast('Draft salvat local!', 'success');
  }

  // Metodă pentru încărcare draft
  loadDraft(): void {
    const draftData = localStorage.getItem('surveyDraft');
    if (draftData) {
      const draft = JSON.parse(draftData);
      
      // Confirmă încărcarea
      if (confirm('Aveți un draft salvat. Doriți să îl încărcați? (Datele curente vor fi suprascrise)')) {
        this.loadDraftData(draft);
        this.showToast('Draft încărcat cu succes!', 'success');
      }
    } else {
      this.showToast('Nu există draft-uri salvate', 'error');
    }
  }

  private loadDraftData(draftData: any): void {
    // Recreează formularul cu datele din draft
    const questionsArray: FormGroup[] = [];
    
    if (draftData.questions && Array.isArray(draftData.questions)) {
      draftData.questions.forEach((question: any) => {
        const questionGroup = this.createQuestion();
        
        // Setează valorile pentru întrebare
        questionGroup.patchValue({
          questionText: question.questionText || '',
          questionType: question.questionType || 'single_choice',
          required: question.required || false
        });

        // Adaugă opțiunile
        const optionsArray = questionGroup.get('options') as FormArray;
        optionsArray.clear(); // Curăță opțiunile existente
        
        if (question.options && Array.isArray(question.options) && question.options.length > 0) {
          question.options.forEach((option: any) => {
            optionsArray.push(this.fb.group({
              text: [option.text || '', [Validators.required, Validators.minLength(1)]],
              value: [option.value || '']
            }));
          });
        } else {
          // Adaugă cel puțin o opțiune goală pentru întrebări cu opțiuni
          const questionType = question.questionType || 'single_choice';
          if (questionType === 'single_choice' || questionType === 'multiple_choice') {
            optionsArray.push(this.createOption());
          }
        }

        questionsArray.push(questionGroup);
      });
    }

    // Dacă nu există întrebări, adaugă o întrebare goală
    if (questionsArray.length === 0) {
      questionsArray.push(this.createQuestion());
    }

    // Actualizează formularul
    this.surveyForm.patchValue({
      formTitle: draftData.formTitle || '',
      adminDescription: draftData.adminDescription || '',
      userInstructions: draftData.userInstructions || '',
      required: draftData.required || false
    });

    // Înlocuiește array-ul de întrebări
    const currentQuestions = this.surveyForm.get('questions') as FormArray;
    currentQuestions.clear();
    questionsArray.forEach(question => {
      currentQuestions.push(question);
    });
  }

  // Metodă pentru mutarea întrebărilor în sus/jos
  moveQuestionUp(index: number): void {
    if (index > 0) {
      const question = this.questions.at(index);
      this.questions.removeAt(index);
      this.questions.insert(index - 1, question);
    }
  }

  moveQuestionDown(index: number): void {
    if (index < this.questions.length - 1) {
      const question = this.questions.at(index);
      this.questions.removeAt(index);
      this.questions.insert(index + 1, question);
    }
  }

  // Getter pentru statistici
  get surveyStats() {
    const questions = this.questions.controls.map(control => (control as FormGroup).value);
    const requiredCount = questions.filter((q: any) => q.required).length;
    const optionalCount = questions.length - requiredCount;
    const totalOptions = questions.reduce((total: number, q: any) => {
      return total + (q.options ? q.options.length : 0);
    }, 0);

    return {
      totalQuestions: questions.length,
      requiredQuestions: requiredCount,
      optionalQuestions: optionalCount,
      totalOptions: totalOptions
    };
  }
}