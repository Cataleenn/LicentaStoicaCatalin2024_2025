// src/survey/dto/create-response.dto.ts

import { IsNumber, IsBoolean, IsObject } from 'class-validator';

export class CreateResponseDto {
  @IsNumber()
  formId: number;

  @IsNumber()
  userId: number;

  @IsObject()
  answers: Record<string, any>;

  @IsBoolean()
  isComplete: boolean;
}
