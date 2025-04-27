import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  formTitle: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  questions: any[];

  @IsString()
  lastModified: string;
}
