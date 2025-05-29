
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
    piecesRemovedCount: number;        // de câte ori au fost scoase piese
    piecesSwappedCount: number;        // de câte ori au fost interschimbate
    wrongPlacementsCount: number;      // câte plasări greșite
    correctnessPercentage: number;     // procentaj de corectitudine
    totalMoves: number;                // numărul total de mișcări
    timeSpent: number;                 // timpul petrecut în secunde
  };
}