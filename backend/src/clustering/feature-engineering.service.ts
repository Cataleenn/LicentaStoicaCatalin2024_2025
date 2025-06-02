// Feature Engineering Service - backend/src/clustering/feature-engineering.service.ts
import { Injectable } from '@nestjs/common';

export interface RawAssemblyData {
  completionTime: number;           // seconds
  correctnessPercentage: number;    // 0-100
  rotations: number;               // count
  wrongPlacementsCount: number;    // count
  piecesRemovedCount: number;      // count
  piecesSwappedCount: number;      // count
  totalMoves: number;              // count
  timeSpent: number;               // seconds (same as completionTime)
  completed: boolean;              // true/false
  componentsPlaced: Array<{        // placement order data
    componentId: string;
    slotId: string;
    order: number;
  }>;
  detailedStats?: any;             // additional stats from assembly component
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
  // Primary performance indices (0-1 scale, higher = better)
  speedIndex: number;             // How fast compared to expected time
  precisionIndex: number;         // Accuracy of moves (correct/total)
  efficiencyIndex: number;        // Speed + accuracy combined
  
  // Cognitive style indices (0-1 scale)
  confidenceIndex: number;        // Quick to start, fewer hesitations
  systematicIndex: number;        // Methodical approach, few rotations
  persistenceIndex: number;       // Completion rate, error recovery
  adaptabilityIndex: number;      // Learning during task, improvement
  
  // Problem-solving strategy indices (0-1 scale)
  explorationIndex: number;       // Willingness to try different approaches
  planningIndex: number;          // Evidence of upfront thinking
  recoveryIndex: number;          // How well they handle mistakes
  
  // Derived psychological traits (0-1 scale)
  impulsivityIndex: number;       // Quick actions vs deliberation
  frustrationTolerance: number;   // Persistence under difficulty
  technicalAptitude: number;      // Overall technical performance
}

@Injectable()
export class FeatureEngineeringService {
  
  /**
   * Main method to compute all behavioral metrics from raw data
   */
  computeBehavioralMetrics(
    assemblyData: RawAssemblyData,
    behavioralProfile: BehavioralProfile,
    demographicProfile: DemographicProfile
  ): ComputedBehavioralMetrics {
    
    // Normalize assembly data for calculations
    const normalized = this.normalizeAssemblyData(assemblyData);
    
    // Calculate primary performance indices
    const speedIndex = this.calculateSpeedIndex(assemblyData);
    const precisionIndex = this.calculatePrecisionIndex(assemblyData);
    const efficiencyIndex = (speedIndex + precisionIndex) / 2;
    
    // Calculate cognitive style indices
    const confidenceIndex = this.calculateConfidenceIndex(assemblyData, behavioralProfile);
    const systematicIndex = this.calculateSystematicIndex(assemblyData, behavioralProfile);
    const persistenceIndex = this.calculatePersistenceIndex(assemblyData, behavioralProfile);
    const adaptabilityIndex = this.calculateAdaptabilityIndex(assemblyData);
    
    // Calculate problem-solving strategy indices
    const explorationIndex = this.calculateExplorationIndex(assemblyData, behavioralProfile);
    const planningIndex = this.calculatePlanningIndex(assemblyData, behavioralProfile);
    const recoveryIndex = this.calculateRecoveryIndex(assemblyData, behavioralProfile);
    
    // Calculate derived psychological traits
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
  
  /**
   * Normalize assembly data to 0-1 scale for calculations
   */
  private normalizeAssemblyData(data: RawAssemblyData): any {
    // Expected ranges based on typical performance
    const maxExpectedTime = 300;        // 5 minutes
    const maxExpectedMoves = 50;        // 50 total moves
    const maxExpectedRotations = 10;    // 10 rotations
    const maxExpectedErrors = 20;       // 20 wrong placements
    
    return {
      normalizedTime: Math.min(data.completionTime / maxExpectedTime, 1),
      normalizedAccuracy: data.correctnessPercentage / 100,
      normalizedMoves: Math.min(data.totalMoves / maxExpectedMoves, 1),
      normalizedRotations: Math.min(data.rotations / maxExpectedRotations, 1),
      normalizedErrors: Math.min(data.wrongPlacementsCount / maxExpectedErrors, 1)
    };
  }
  
  /**
   * Speed Index: How fast compared to expected completion time
   */
  private calculateSpeedIndex(data: RawAssemblyData): number {
    if (!data.completed) return 0;
    
    const maxTime = 300; // 5 minutes expected max
    const timeScore = Math.max(0, (maxTime - data.completionTime) / maxTime);
    
    // Bonus for very fast completion, penalty for very slow
    if (data.completionTime < 60) return Math.min(1, timeScore * 1.2); // Bonus for under 1 minute
    if (data.completionTime > 240) return timeScore * 0.8; // Penalty for over 4 minutes
    
    return timeScore;
  }
  
  /**
   * Precision Index: Accuracy of moves made
   */
  private calculatePrecisionIndex(data: RawAssemblyData): number {
    if (data.totalMoves === 0) return 0;
    
    const accuracyScore = data.correctnessPercentage / 100;
    const efficiencyScore = data.totalMoves > 0 ? 
      Math.max(0, 1 - (data.wrongPlacementsCount / data.totalMoves)) : 0;
    
    // Combine final accuracy with move efficiency
    return (accuracyScore * 0.7) + (efficiencyScore * 0.3);
  }
  
  /**
   * Confidence Index: Quick to start, fewer hesitations
   */
  private calculateConfidenceIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5; // Base confidence
    
    // Behavioral indicators
    if (behavioral.techComfort === 'tech_expert') score += 0.3;
    else if (behavioral.techComfort === 'tech_comfortable') score += 0.2;
    else if (behavioral.techComfort === 'tech_basic') score -= 0.1;
    else if (behavioral.techComfort === 'tech_uncomfortable') score -= 0.2;
    
    if (behavioral.assemblyExperience === 'assembly_expert') score += 0.2;
    else if (behavioral.assemblyExperience === 'assembly_none') score -= 0.1;
    
    // Assembly behavior indicators
    const quickStart = data.completionTime < 120; // Completed quickly
    const fewRotations = data.rotations <= 2;     // Didn't need many views
    
    if (quickStart) score += 0.2;
    if (fewRotations) score += 0.1;
    if (data.wrongPlacementsCount <= 2) score += 0.1; // Few mistakes
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Systematic Index: Evidence of methodical, planned approach
   */
  private calculateSystematicIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    // Behavioral indicators of systematic thinking
    if (behavioral.problemSolvingStyle === 'systematic') score += 0.4;
    else if (behavioral.problemSolvingStyle === 'balanced') score += 0.2;
    else if (behavioral.problemSolvingStyle === 'exploratory') score -= 0.1;
    
    // Assembly behavior indicators
    const fewRotations = data.rotations <= 2;        // Didn't need to look around much
    const lowErrorRate = data.wrongPlacementsCount <= 3; // Made few mistakes
    const efficient = data.totalMoves <= 15;        // Didn't make unnecessary moves
    
    if (fewRotations) score += 0.2;
    if (lowErrorRate) score += 0.2;
    if (efficient) score += 0.1;
    
    // Penalty for chaotic behavior
    if (data.piecesSwappedCount > 3) score -= 0.2; // Too much swapping = less systematic
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Persistence Index: Willingness to complete and recover from errors
   */
  private calculatePersistenceIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = data.completed ? 0.7 : 0.1; // Base score for completion
    
    // Behavioral indicators
    if (behavioral.errorHandlingStyle === 'analytical') score += 0.2;
    else if (behavioral.errorHandlingStyle === 'quick_retry') score += 0.1;
    else if (behavioral.errorHandlingStyle === 'frustrated') score -= 0.2;
    
    // Evidence of persistence in assembly data
    if (data.wrongPlacementsCount > 0 && data.completed) {
      // Made mistakes but still completed = good persistence
      score += 0.1;
    }
    
    if (data.piecesRemovedCount > 0) {
      // Willing to backtrack and try again = persistence
      score += 0.1;
    }
    
    // Long time spent but completed = persistence through difficulty
    if (data.completionTime > 180 && data.completed) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Adaptability Index: Learning and improvement during the task
   */
  private calculateAdaptabilityIndex(data: RawAssemblyData): number {
    let score = 0.5;
    
    // Look for evidence of learning/adaptation during assembly
    if (data.componentsPlaced && data.componentsPlaced.length > 0) {
      // Analyze if later moves were better than earlier ones
      const firstHalfErrors = data.componentsPlaced
        .slice(0, Math.floor(data.componentsPlaced.length / 2))
        .length; // This is simplified - would need more detailed error tracking
      
      // If they made fewer errors in second half = learning
      if (data.wrongPlacementsCount < data.totalMoves * 0.3) {
        score += 0.2; // Low overall error rate suggests good adaptation
      }
    }
    
    // Quick completion with high accuracy = good adaptation
    if (data.completionTime < 120 && data.correctnessPercentage > 85) {
      score += 0.3;
    }
    
    // Medium errors but completion = learning through mistakes
    if (data.wrongPlacementsCount > 0 && data.wrongPlacementsCount <= 5 && data.completed) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Exploration Index: Willingness to try different approaches
   */
  private calculateExplorationIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    // Behavioral indicators
    if (behavioral.problemSolvingStyle === 'exploratory') score += 0.3;
    else if (behavioral.problemSolvingStyle === 'systematic') score -= 0.1;
    
    // Assembly behavior indicators of exploration
    if (data.rotations >= 3) score += 0.2; // Looked around more = exploratory
    if (data.piecesSwappedCount > 0) score += 0.1; // Tried different combinations
    if (data.piecesRemovedCount > 2) score += 0.1; // Willing to backtrack and try again
    
    // Gaming experience often correlates with exploration
    if (behavioral.gamingFrequency === 'gaming_heavy' || behavioral.gamingFrequency === 'gaming_daily') {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Planning Index: Evidence of thinking before acting
   */
  private calculatePlanningIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    // Behavioral indicators
    if (behavioral.problemSolvingStyle === 'systematic') score += 0.3;
    else if (behavioral.problemSolvingStyle === 'exploratory') score -= 0.2;
    
    // Assembly indicators of planning
    if (data.rotations <= 1 && data.correctnessPercentage > 80) {
      // High accuracy with minimal looking around = good planning
      score += 0.3;
    }
    
    if (data.wrongPlacementsCount <= 2) {
      // Few mistakes = likely planned moves
      score += 0.2;
    }
    
    if (data.totalMoves <= 12) {
      // Efficient move count = planned approach
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Recovery Index: How well they handle and recover from mistakes
   */
  private calculateRecoveryIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    if (data.wrongPlacementsCount === 0) return 0.8; // No mistakes to recover from
    
    let score = 0.3; // Base score if mistakes were made
    
    // Behavioral indicators
    if (behavioral.errorHandlingStyle === 'analytical') score += 0.3;
    else if (behavioral.errorHandlingStyle === 'quick_retry') score += 0.2;
    else if (behavioral.errorHandlingStyle === 'frustrated') score -= 0.3;
    
    // Evidence of good recovery
    if (data.completed && data.wrongPlacementsCount > 0) {
      // Made mistakes but still completed = good recovery
      score += 0.4;
    }
    
    if (data.piecesRemovedCount > 0) {
      // Willing to backtrack = good error handling
      score += 0.2;
    }
    
    // Quick recovery (fast completion despite errors)
    if (data.completionTime < 180 && data.wrongPlacementsCount > 0 && data.completed) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Impulsivity Index: Quick actions vs deliberate thinking
   */
  private calculateImpulsivityIndex(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    // Behavioral indicators
    if (behavioral.problemSolvingStyle === 'exploratory') score += 0.2;
    else if (behavioral.problemSolvingStyle === 'systematic') score -= 0.2;
    
    if (behavioral.errorHandlingStyle === 'quick_retry') score += 0.2;
    else if (behavioral.errorHandlingStyle === 'analytical') score -= 0.2;
    
    // Assembly behavior indicators
    if (data.completionTime < 90) score += 0.3; // Very fast = potentially impulsive
    if (data.wrongPlacementsCount > 5) score += 0.2; // Many mistakes = impulsive
    if (data.rotations === 0) score += 0.1; // Didn't look around = impulsive
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Frustration Tolerance: How well they handle difficulty
   */
  private calculateFrustrationTolerance(data: RawAssemblyData, behavioral: BehavioralProfile): number {
    let score = 0.5;
    
    // Behavioral indicators
    if (behavioral.errorHandlingStyle === 'frustrated') score -= 0.4;
    else if (behavioral.errorHandlingStyle === 'analytical') score += 0.3;
    else if (behavioral.errorHandlingStyle === 'seek_help') score += 0.1;
    
    // Assembly evidence
    if (data.completed) score += 0.3; // Completion shows tolerance
    
    if (data.wrongPlacementsCount > 3 && data.completed) {
      // Made many mistakes but still finished = high tolerance
      score += 0.3;
    }
    
    if (data.completionTime > 240 && data.completed) {
      // Took long time but persisted = good tolerance
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Technical Aptitude: Overall technical performance considering background
   */
  private calculateTechnicalAptitude(
    data: RawAssemblyData, 
    behavioral: BehavioralProfile, 
    demographic: DemographicProfile
  ): number {
    let score = (data.correctnessPercentage / 100) * 0.4; // Base from accuracy
    
    // Adjust for demographic expectations
    if (demographic.occupation === 'tech' || demographic.occupation === 'engineering') {
      // Higher expectations for tech professionals
      score = score * 0.9; // Slight penalty to normalize for expectations
    } else if (demographic.occupation === 'student' || demographic.ageGroup === '16_18') {
      // More lenient for students
      score = score * 1.1; // Slight bonus
    }
    
    // STEM familiarity factor
    if (demographic.stemFamiliarity === 'stem_expert') score += 0.2;
    else if (demographic.stemFamiliarity === 'stem_familiar') score += 0.1;
    else if (demographic.stemFamiliarity === 'stem_none') score -= 0.1;
    
    // Technical comfort factor
    if (behavioral.techComfort === 'tech_expert') score += 0.2;
    else if (behavioral.techComfort === 'tech_comfortable') score += 0.1;
    else if (behavioral.techComfort === 'tech_uncomfortable') score -= 0.2;
    
    // Assembly experience factor
    if (behavioral.assemblyExperience === 'assembly_expert') score += 0.1;
    else if (behavioral.assemblyExperience === 'assembly_none') score -= 0.1;
    
    // Efficiency bonus
    if (data.completionTime < 120 && data.correctnessPercentage > 90) {
      score += 0.2; // Bonus for high performance
    }
    
    return Math.max(0, Math.min(1, score));
  }
  
  /**
   * Convert computed metrics to feature vector for clustering
   */
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
  
  /**
   * Get feature names for clustering analysis
   */
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