
import { Injectable } from '@nestjs/common';

export interface RawAssemblyData {
  completionTime: number;           
  correctnessPercentage: number;    
  rotations: number;              
  wrongPlacementsCount: number;    
  piecesRemovedCount: number;      
  piecesSwappedCount: number;      
  totalMoves: number;              
  timeSpent: number;               
  completed: boolean;              
  componentsPlaced: Array<{        
    componentId: string;
    slotId: string;
    order: number;
  }>;
  detailedStats?: any;           
}

export interface BehavioralProfile {
  problemSolvingStyle: string;     // systematic, exploratory, balanced, collaborative
  techComfort: string;            // tech_expert, tech_comfortable, tech_moderate, tech_basic, tech_uncomfortable
  assemblyExperience: string;     // assembly_expert, assembly_some, assembly_rare, assembly_none
  errorHandlingStyle: string;     // quick_retry, analytical, restart, seek_help, frustrated
  gamingFrequency: string;        // gaming_heavy, gaming_daily, gaming_weekly, gaming_occasional, gaming_never
}

export interface DemographicProfile {
  ageGroup: string;               // under_16, 16_18, 19_25, 26_35, 36_45, 46_55, over_55
  gender: string;                 // M, F, N/A
  educationLevel: string;         // elementary, highschool_*, bachelor, master, phd, etc.
  occupation: string;             // tech, education, student, retired, etc.
  stemFamiliarity: string;        // stem_expert, stem_familiar, stem_moderate, stem_basic, stem_none
}

export interface ComputedBehavioralMetrics {
  
  speedIndex: number;             // How fast compared to expected time
  precisionIndex: number;         // Accuracy of moves (correct/total)
  efficiencyIndex: number;        // Speed + accuracy combined
  

  confidenceIndex: number;        // Quick to start, fewer hesitations
  systematicIndex: number;        // Methodical approach, few rotations
  persistenceIndex: number;       // Completion rate, error recovery
  adaptabilityIndex: number;      // Learning during task, improvement
  

  explorationIndex: number;       // Willingness to try different approaches
  planningIndex: number;          // Evidence of upfront thinking
  recoveryIndex: number;          // How well they handle mistakes
  
 
  impulsivityIndex: number;       // Quick actions vs deliberation
  frustrationTolerance: number;   // Persistence under difficulty
  technicalAptitude: number;      // Overall technical performance
}

@Injectable()
export class FeatureEngineeringService {
  
  
  computeBehavioralMetrics(
    assemblyData: RawAssemblyData,
    behavioralProfile: BehavioralProfile,
    demographicProfile: DemographicProfile
  ): ComputedBehavioralMetrics {
    
   
    const normalized = this.normalizeAssemblyData(assemblyData);
    
   
    const speedIndex = this.calculateSpeedIndex(assemblyData);
    const precisionIndex = this.calculatePrecisionIndex(assemblyData);
    const efficiencyIndex = (speedIndex + precisionIndex) / 2;
    
    
    const confidenceIndex = this.calculateConfidenceIndex(assemblyData, behavioralProfile);
    const systematicIndex = this.calculateSystematicIndex(assemblyData, behavioralProfile);
    const persistenceIndex = this.calculatePersistenceIndex(assemblyData, behavioralProfile);
    const adaptabilityIndex = this.calculateAdaptabilityIndex(assemblyData);
    
    
    const explorationIndex = this.calculateExplorationIndex(assemblyData, behavioralProfile);
    const planningIndex = this.calculatePlanningIndex(assemblyData, behavioralProfile);
    const recoveryIndex = this.calculateRecoveryIndex(assemblyData, behavioralProfile);
    
   
    const impulsivityIndex = this.calculateImpulsivityIndex(assemblyData, behavioralProfile);
    const frustrationTolerance = this.calculateFrustrationTolerance(assemblyData, behavioralProfile);
    const technicalAptitude = this.calculateTechnicalAptitude(assemblyData, behavioralProfile, demographicProfile);
    
    return {
      speedIndex,
      precisionIndex,
      efficiencyIndex,
      confidenceIndex,
      systematicIndex,
      persistenceIndex,
      adaptabilityIndex,
      explorationIndex,
      planningIndex,
      recoveryIndex,
      impulsivityIndex,
      frustrationTolerance,
      technicalAptitude
    };
  }
  
  
  private normalizeAssemblyData(data: RawAssemblyData): any {
    
    const maxExpectedTime = 300;        
    const maxExpectedMoves = 50;        
    const maxExpectedRotations = 10;    
    const maxExpectedErrors = 20;       
    
    return {
      normalizedTime: Math.min(data.completionTime / maxExpectedTime, 1),
      normalizedAccuracy: data.correctnessPercentage / 100,
      normalizedMoves: Math.min(data.totalMoves / maxExpectedMoves, 1),
      normalizedRotations: Math.min(data.rotations / maxExpectedRotations, 1),
      normalizedErrors: Math.min(data.wrongPlacementsCount / maxExpectedErrors, 1)
    };
  }
  
  
  private calculateSpeedIndex(data: RawAssemblyData): number {
    if (!data.completed) return 0;
    
    const maxTime = 300; 
    const timeScore = Math.max(0, (maxTime - data.completionTime) / maxTime);
    
    
    if (data.completionTime < 30) return Math.min(1, timeScore * 1.2); 
    if (data.completionTime > 60) return timeScore * 0.8; 
    
    return timeScore;
  }
  
  
  private calculatePrecisionIndex(data: RawAssemblyData): number {
    if (data.totalMoves === 0) return 0;
    
    const accuracyScore = data.correctnessPercentage / 100;
    const efficiencyScore = data.totalMoves > 0 ? 
      Math.max(0, 1 - (data.wrongPlacementsCount / data.totalMoves)) : 0;
    
  
    return (accuracyScore * 0.7) + (efficiencyScore * 0.3);
  }
  
 
  private calculateConfidenceIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5; 
    
   
    if (behavioral.techComfort === 'tech_expert') score += 0.3;
    else if (behavioral.techComfort === 'tech_comfortable') score += 0.2;
    else if (behavioral.techComfort === 'tech_basic') score -= 0.1;
    else if (behavioral.techComfort === 'tech_uncomfortable') score -= 0.2;
    
    if (behavioral.assemblyExperience === 'assembly_expert') score += 0.2;
    else if (behavioral.assemblyExperience === 'assembly_none') score -= 0.1;
    
    
    const quickStart = data.completionTime < 40; 
    const fewRotations = data.rotations <= 2;     
    
    if (quickStart) score += 0.2;
    if (fewRotations) score += 0.1;
    if (data.wrongPlacementsCount <= 2) score += 0.1; 
    
    return Math.max(0, Math.min(1, score));
  }
  
  
  private calculateSystematicIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    
    if (behavioral.problemSolvingStyle === 'systematic') score += 0.4;
    else if (behavioral.problemSolvingStyle === 'balanced') score += 0.2;
    else if (behavioral.problemSolvingStyle === 'exploratory') score -= 0.1;
    
   
    const fewRotations = data.rotations <= 2;        
    const lowErrorRate = data.wrongPlacementsCount <= 3; 
    const efficient = data.totalMoves <= 15;       
    
    if (fewRotations) score += 0.2;
    if (lowErrorRate) score += 0.2;
    if (efficient) score += 0.1;
    
    
    if (data.piecesSwappedCount > 3) score -= 0.2; 
    
    return Math.max(0, Math.min(1, score));
  }
  
 
  private calculatePersistenceIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = data.completed ? 0.7 : 0.1; 
    
    
    if (behavioral.errorHandlingStyle === 'analytical') score += 0.2;
    else if (behavioral.errorHandlingStyle === 'quick_retry') score += 0.1;
    else if (behavioral.errorHandlingStyle === 'frustrated') score -= 0.2;
    
    
    if (data.wrongPlacementsCount > 0 && data.completed) {
      
      score += 0.1;
    }
    
    if (data.piecesRemovedCount > 0) {
      
      score += 0.1;
    }
    
    
    if (data.completionTime > 40 && data.completed) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  
  private calculateAdaptabilityIndex(data: RawAssemblyData): number {
    let score = 0.5;
    
    
    if (data.componentsPlaced && data.componentsPlaced.length > 0) {
      
      const firstHalfErrors = data.componentsPlaced
        .slice(0, Math.floor(data.componentsPlaced.length / 2))
        .length; 
      
    
      if (data.wrongPlacementsCount < data.totalMoves * 0.3) {
        score += 0.2;
      }
    }
    
    
    if (data.completionTime < 30 && data.correctnessPercentage > 85) {
      score += 0.3;
    }
    
   
    if (data.wrongPlacementsCount > 0 && data.wrongPlacementsCount <= 5 && data.completed) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
 
  private calculateExplorationIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    
    if (behavioral.problemSolvingStyle === 'exploratory') score += 0.3;
    else if (behavioral.problemSolvingStyle === 'systematic') score -= 0.1;
    
    
    if (data.rotations >= 3) score += 0.2; 
    if (data.piecesSwappedCount > 0) score += 0.1; 
    if (data.piecesRemovedCount > 2) score += 0.1; 
    
    
    if (behavioral.gamingFrequency === 'gaming_heavy' || behavioral.gamingFrequency === 'gaming_daily') {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
 
  private calculatePlanningIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
  
    if (behavioral.problemSolvingStyle === 'systematic') score += 0.3;
    else if (behavioral.problemSolvingStyle === 'exploratory') score -= 0.2;
    
   
    if (data.rotations <= 1 && data.correctnessPercentage > 80) {
   
      score += 0.3;
    }
    
    if (data.wrongPlacementsCount <= 2) {
     
      score += 0.2;
    }
    
    if (data.totalMoves <= 12) {
      
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
 
  private calculateRecoveryIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    if (data.wrongPlacementsCount === 0) return 0.8; 
    
    let score = 0.3; 
    
   
    if (behavioral.errorHandlingStyle === 'analytical') score += 0.3;
    else if (behavioral.errorHandlingStyle === 'quick_retry') score += 0.2;
    else if (behavioral.errorHandlingStyle === 'frustrated') score -= 0.3;
    
   
    if (data.completed && data.wrongPlacementsCount > 0) {
    
      score += 0.4;
    }
    
    if (data.piecesRemovedCount > 0) {
     
      score += 0.2;
    }
    
    
    if (data.completionTime < 40 && data.wrongPlacementsCount > 0 && data.completed) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  
  private calculateImpulsivityIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    
    if (behavioral.problemSolvingStyle === 'exploratory') score += 0.2;
    else if (behavioral.problemSolvingStyle === 'systematic') score -= 0.2;
    
    if (behavioral.errorHandlingStyle === 'quick_retry') score += 0.2;
    else if (behavioral.errorHandlingStyle === 'analytical') score -= 0.2;
    
 
    if (data.completionTime < 30) score += 0.3; 
    if (data.wrongPlacementsCount > 5) score += 0.2; 
    if (data.rotations === 0) score += 0.1; 
    
    return Math.max(0, Math.min(1, score));
  }
  
 
  private calculateFrustrationTolerance(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    
    if (behavioral.errorHandlingStyle === 'frustrated') score -= 0.4;
    else if (behavioral.errorHandlingStyle === 'analytical') score += 0.3;
    else if (behavioral.errorHandlingStyle === 'seek_help') score += 0.1;
    
    
    if (data.completed) score += 0.3; 
    
    if (data.wrongPlacementsCount > 3 && data.completed) {
     
      score += 0.3;
    }
    
    if (data.completionTime > 240 && data.completed) {
     
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  
  private calculateTechnicalAptitude(
    data: RawAssemblyData, 
    behavioral: BehavioralProfile, 
    demographic: DemographicProfile
  ): number {
    let score = (data.correctnessPercentage / 100) * 0.4; 
    

    if (demographic.occupation === 'tech' || demographic.occupation === 'engineering') {
      
      score = score * 0.9; 
    } else if (demographic.occupation === 'student' || demographic.ageGroup === '16_18') {
      
      score = score * 1.1; 
    }
    
  
    if (demographic.stemFamiliarity === 'stem_expert') score += 0.2;
    else if (demographic.stemFamiliarity === 'stem_familiar') score += 0.1;
    else if (demographic.stemFamiliarity === 'stem_none') score -= 0.1;
    
   
    if (behavioral.techComfort === 'tech_expert') score += 0.2;
    else if (behavioral.techComfort === 'tech_comfortable') score += 0.1;
    else if (behavioral.techComfort === 'tech_uncomfortable') score -= 0.2;
    
  
    if (behavioral.assemblyExperience === 'assembly_expert') score += 0.1;
    else if (behavioral.assemblyExperience === 'assembly_none') score -= 0.1;
    
 
    if (data.completionTime < 30 && data.correctnessPercentage > 90) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
 
  static metricsToFeatureVector(metrics: ComputedBehavioralMetrics): number[] {
    return [
      metrics.speedIndex,
      metrics.precisionIndex,
      metrics.efficiencyIndex,
      metrics.confidenceIndex,
      metrics.systematicIndex,
      metrics.persistenceIndex,
      metrics.adaptabilityIndex,
      metrics.explorationIndex,
      metrics.planningIndex,
      metrics.recoveryIndex,
      metrics.impulsivityIndex,
      metrics.frustrationTolerance,
      metrics.technicalAptitude
    ];
  }
  
  
  static getFeatureNames(): string[] {
    return [
      'Speed Index',
      'Precision Index', 
      'Efficiency Index',
      'Confidence Index',
      'Systematic Index',
      'Persistence Index',
      'Adaptability Index',
      'Exploration Index',
      'Planning Index',
      'Recovery Index',
      'Impulsivity Index',
      'Frustration Tolerance',
      'Technical Aptitude'
    ];
  }
}