export interface Survey {
  formTitle: string;  // Titlul chestionarului
  description?: string;  // Descrierea chestionarului
  questions: any[];  // Lista de întrebări (poți adăuga tipuri mai detaliate pentru întrebări)
  respondent: any;  // Informațiile respondentului
  progress: any;  // Progresul chestionarului
  lastModified: string;  // Data ultimei modificări
}
