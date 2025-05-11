// src/survey/response.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from './response.entity';
import { Survey } from './survey.entity'; // import corect
import { CreateResponseDto } from './create-response.dto';

@Injectable()
export class ResponseService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepo: Repository<Response>,

    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
  ) {}

  async saveResponse(
    formId: number,
    userId: number,
    answers: Record<string, any>,
    isComplete: boolean,
  ): Promise<Response> {
    const survey = await this.surveyRepo.findOne({ where: { id: formId } });
    if (!survey) throw new NotFoundException(`Survey with id ${formId} not found`);

    const response = this.responseRepo.create({
      userId,
      answers,
      isComplete,
      survey,
    });

    return await  this.responseRepo.save(response);
  }
}
