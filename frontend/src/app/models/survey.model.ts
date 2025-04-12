export interface Survey {
  formTitle: string;  // Titlul chestionarului
  description?: string;  // Descrierea chestionarului
  questions: string[];  // Array de întrebări (fiecare întrebare este un string)
}
