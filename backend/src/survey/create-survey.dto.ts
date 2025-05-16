import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateSurveyDto {
  @IsString()
  @IsNotEmpty()
  formTitle: string;

  @IsOptional()
  @IsString()
  adminDescription?: string;

  @IsOptional()
  @IsString()
  userInstructions?: string;


  @IsArray()
  questions: any[];

  @IsString()
  lastModified: string;
}
