import { IsString, IsNotEmpty, IsArray, IsOptional , IsBoolean} from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  required?: boolean;


  @IsArray()
  questions: any[];

  @IsString()
  lastModified: string;
}
