import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  formTitle: string;

  @IsString()
  description?: string;

  @IsString()
  questions: string;  // Ar trebui să fie un string JSON în backend
}
