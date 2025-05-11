// src/survey/response.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { ResponseService } from './response.service';
import { CreateResponseDto } from './create-response.dto';

@Controller('responses')
export class ResponseController {
  constructor(private readonly responseService: ResponseService) {}

  @Post()
  async submit(@Body() dto: CreateResponseDto) {
    const { formId, userId, answers, isComplete } = dto;
    return this.responseService.saveResponse(dto); // DTO = CreateResponseDto

  }
}
