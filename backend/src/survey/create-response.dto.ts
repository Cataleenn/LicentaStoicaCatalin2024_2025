
import { IsNumber, IsBoolean, IsObject, IsOptional } from 'class-validator';

export class CreateResponseDto {
  @IsNumber()
  formId: number;

  @IsNumber()
  userId: number;

  @IsObject()
  answers: Record<string, any>;

  @IsBoolean()
  isComplete: boolean;

  @IsOptional()
  @IsObject()
  assembly?: {
    rotations: number;
    componentsPlaced: { componentId: string; slotId: string; order: number }[];
    piecesRemovedCount: number;       
    piecesSwappedCount: number;        
    wrongPlacementsCount: number;     
    correctnessPercentage: number;     
    totalMoves: number;                
    timeSpent: number;                 
  };
}