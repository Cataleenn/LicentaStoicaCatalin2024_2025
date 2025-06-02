// Updated Clustering Service with Improved Naming - backend/src/clustering/clustering.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from '../survey/response.entity';
import { FeatureEngineeringService } from './feature-engineering.service';

export interface ClusterCenter {
  id: number;
  centroid: number[];
  memberCount: number;
  profile: {
    avgSpeedIndex: number;
    avgPrecisionIndex: number;
    avgConfidenceIndex: number;
    avgSystematicIndex: number;
    avgPersistenceIndex: number;
    avgTechnicalAptitude: number;
  };
  demographicProfile: {
    dominantAgeGroup: string;
    dominantGender: string;
    dominantEducation: string;
    dominantOccupation: string;
    dominantStemLevel: string;
    genderDistribution: Record<string, number>;
    educationDistribution: Record<string, number>;
    ageDistribution: Record<string, number>;  
    occupationDistribution: Record<string, number>;
    stemDistribution: Record<string, number>;
  };
  behavioralProfile: {
    dominantProblemSolvingStyle: string;
    dominantTechComfort: string;
    dominantErrorHandling: string;
    dominantAssemblyExperience: string;
    dominantGamingFrequency: string;
    problemSolvingDistribution: Record<string, number>;
    techComfortDistribution: Record<string, number>;
    errorHandlingDistribution: Record<string, number>;
     assemblyExperienceDistribution: Record<string, number>; // ✅ ADĂUGAT
    gamingDistribution: Record<string, number>;  
  };
  clusterName: string;
  clusterDescription: string;
  detailedProfile: string; // Profil complet pentru afișare
}

export interface ClusterAssignment {
  participantId: string;
  clusterId: number;
  confidence: number;
  distanceToCenter: number;
  nearestClusters: number[];
}

export interface ClusteringResult {
  clusters: ClusterCenter[];
  assignments: ClusterAssignment[];
  metadata: {
    totalParticipants: number;
    optimalClusterCount: number;
    silhouetteScore: number;
    inertia: number;
    convergenceIterations: number;
  };
  insights: string[];
}

@Injectable()
export class ClusteringService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepo: Repository<Response>,
    private readonly featureEngineering: FeatureEngineeringService,
  ) {}

  /**
   * Perform K-means clustering on survey responses
   */
  async performClustering(surveyId?: number, forcedK?: number): Promise<ClusteringResult> {
    console.log('🔬 Starting clustering analysis...');
    
    // Get responses with computed metrics
    const responses = await this.getResponsesForClustering(surveyId);
    
    if (responses.length < 3) {
      throw new Error('Need at least 3 responses for meaningful clustering');
    }

    // Filter responses to only include those with computed metrics
    const responsesWithMetrics = responses.filter(r => r.computedMetrics);

    if (responsesWithMetrics.length < 3) {
      throw new Error('Need at least 3 responses with computed metrics for meaningful clustering');
    }

    // Extract feature vectors
    const featureVectors = responsesWithMetrics.map(response => 
      FeatureEngineeringService.metricsToFeatureVector(response.computedMetrics!)
    );

    // Determine optimal number of clusters
    const optimalK = forcedK || await this.determineOptimalK(featureVectors);
    console.log(`📊 Using ${optimalK} clusters for ${responsesWithMetrics.length} responses`);

    // Perform K-means clustering
    const clusteringResults = await this.kMeansClustering(featureVectors, optimalK);
    
    // Create cluster profiles
    const clusters = await this.createClusterProfiles(
      clusteringResults.assignments,
      responsesWithMetrics,
      clusteringResults.centroids
    );

    // Assign UNIQUE cluster names and descriptions with improved algorithm
    const namedClusters = this.assignUniqueClusterNames(clusters);

    // Update database with cluster assignments
    await this.updateClusterAssignments(responsesWithMetrics, clusteringResults.assignments);

    // Calculate clustering quality metrics
    const silhouetteScore = this.calculateSilhouetteScore(featureVectors, clusteringResults.assignments);
    
    // Generate insights
    const insights = this.generateClusteringInsights(namedClusters, responsesWithMetrics.length);

    return {
      clusters: namedClusters,
      assignments: responsesWithMetrics.map((response, index) => ({
        participantId: response.id.toString(),
        clusterId: clusteringResults.assignments[index],
        confidence: this.calculateAssignmentConfidence(featureVectors[index], clusteringResults.centroids, clusteringResults.assignments[index]),
        distanceToCenter: this.euclideanDistance(featureVectors[index], clusteringResults.centroids[clusteringResults.assignments[index]]),
        nearestClusters: this.findNearestClusters(featureVectors[index], clusteringResults.centroids, clusteringResults.assignments[index])
      })),
      metadata: {
        totalParticipants: responsesWithMetrics.length,
        optimalClusterCount: optimalK,
        silhouetteScore: silhouetteScore,
        inertia: clusteringResults.inertia,
        convergenceIterations: clusteringResults.iterations
      },
      insights
    };
  }

  /**
   * Create detailed profiles for each cluster with complete demographic and behavioral info
   */
  private async createClusterProfiles(
    assignments: number[],
    responses: Response[],
    centroids: number[][]
  ): Promise<ClusterCenter[]> {
    const clusters: ClusterCenter[] = [];
    const k = centroids.length;
    
    for (let clusterId = 0; clusterId < k; clusterId++) {
      const clusterResponses = responses.filter((_, index) => assignments[index] === clusterId);
      
      if (clusterResponses.length === 0) continue;
      
      // Calculate average behavioral metrics
      const avgMetrics = this.calculateAverageMetrics(clusterResponses);
      
      // Calculate DETAILED demographic distribution
      const demographicProfile = this.calculateDetailedDemographicProfile(clusterResponses);
      
      // Calculate DETAILED behavioral distribution
      const behavioralProfile = this.calculateDetailedBehavioralProfile(clusterResponses);
      
      clusters.push({
        id: clusterId,
        centroid: centroids[clusterId],
        memberCount: clusterResponses.length,
        profile: avgMetrics,
        demographicProfile,
        behavioralProfile,
        clusterName: '', // Will be filled by assignUniqueClusterNames
        clusterDescription: '',
        detailedProfile: '' // Will be filled by assignUniqueClusterNames
      });
    }
    
    return clusters;
  }

  /**
   * Calculate DETAILED demographic profile with all distributions
   */
  /**
 * Calculate DETAILED demographic profile with all distributions
 */
private calculateDetailedDemographicProfile(responses: Response[]): any {
  const demographics = responses
    .map(r => r.demographicProfile)
    .filter((d): d is NonNullable<typeof d> => d !== null && d !== undefined);
  
  const ageDistribution = this.calculateDistribution(demographics.map(d => d.ageGroup));
  const genderDistribution = this.calculateDistribution(demographics.map(d => d.gender));
  const educationDistribution = this.calculateDistribution(demographics.map(d => d.educationLevel));
  const occupationDistribution = this.calculateDistribution(demographics.map(d => d.occupation));
  const stemDistribution = this.calculateDistribution(demographics.map(d => d.stemFamiliarity));
  
  return {
    dominantAgeGroup: this.findMostCommon(demographics.map(d => d.ageGroup)),
    dominantGender: this.findMostCommon(demographics.map(d => d.gender)),
    dominantEducation: this.findMostCommon(demographics.map(d => d.educationLevel)),
    dominantOccupation: this.findMostCommon(demographics.map(d => d.occupation)),
    dominantStemLevel: this.findMostCommon(demographics.map(d => d.stemFamiliarity)),
    ageDistribution,        // ✅ ADĂUGAT: distribuția de vârstă
    genderDistribution,
    educationDistribution,
    occupationDistribution,
    stemDistribution
  };
}

/**
 * Calculate DETAILED behavioral profile with all distributions
 */
private calculateDetailedBehavioralProfile(responses: Response[]): any {
  const behavioral = responses
    .map(r => r.behavioralProfile)
    .filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined);
  
  const problemSolvingDistribution = this.calculateDistribution(behavioral.map(b => b.problemSolvingStyle));
  const techComfortDistribution = this.calculateDistribution(behavioral.map(b => b.techComfort));
  const errorHandlingDistribution = this.calculateDistribution(behavioral.map(b => b.errorHandlingStyle));
  const assemblyExpDistribution = this.calculateDistribution(behavioral.map(b => b.assemblyExperience));
  const gamingDistribution = this.calculateDistribution(behavioral.map(b => b.gamingFrequency));
  
  return {
    dominantProblemSolvingStyle: this.findMostCommon(behavioral.map(b => b.problemSolvingStyle)),
    dominantTechComfort: this.findMostCommon(behavioral.map(b => b.techComfort)),
    dominantErrorHandling: this.findMostCommon(behavioral.map(b => b.errorHandlingStyle)),
    dominantAssemblyExperience: this.findMostCommon(behavioral.map(b => b.assemblyExperience)),
    dominantGamingFrequency: this.findMostCommon(behavioral.map(b => b.gamingFrequency)),
    problemSolvingDistribution,
    techComfortDistribution,
    errorHandlingDistribution,
    assemblyExperienceDistribution: assemblyExpDistribution, // ✅ CORECTARE: numele corect
    gamingDistribution
  };
}

  /**
   * IMPROVED algorithm to assign UNIQUE cluster names - each category only once
   */
  private assignUniqueClusterNames(clusters: ClusterCenter[]): ClusterCenter[] {
    // Sort clusters by technical aptitude to assign better names first
    const sortedClusters = [...clusters].sort((a, b) => 
      b.profile.avgTechnicalAptitude - a.profile.avgTechnicalAptitude
    );

    const usedNames = new Set<string>();
    const namedClusters: ClusterCenter[] = [];

    // Predefined cluster archetypes - each unique
    const clusterArchetypes = [
      {
        name: 'Elite Performers',
        condition: (c: ClusterCenter) => 
          c.profile.avgTechnicalAptitude > 0.75 && 
          c.profile.avgSpeedIndex > 0.7 && 
          c.profile.avgPrecisionIndex > 0.7,
        description: 'Exceptional users with high performance across all metrics'
      },
      {
        name: 'Speed Champions',
        condition: (c: ClusterCenter) => 
          c.profile.avgSpeedIndex > 0.8 && 
          c.profile.avgConfidenceIndex > 0.7 &&
          c.profile.avgPrecisionIndex < 0.7,
        description: 'Fast, confident users who prioritize speed over precision'
      },
      {
        name: 'Precision Masters',
        condition: (c: ClusterCenter) => 
          c.profile.avgPrecisionIndex > 0.8 && 
          c.profile.avgSystematicIndex > 0.7,
        description: 'Methodical users who excel in accuracy and systematic approaches'
      },
      {
        name: 'Tech Experts',
        condition: (c: ClusterCenter) => 
          c.profile.avgTechnicalAptitude > 0.7 &&
          c.demographicProfile.dominantOccupation === 'tech',
        description: 'Technology professionals with strong technical background'
      },
      {
        name: 'Systematic Planners',
        condition: (c: ClusterCenter) => 
          c.profile.avgSystematicIndex > 0.75 && 
          c.behavioralProfile.dominantProblemSolvingStyle === 'systematic',
        description: 'Organized users who plan before acting and follow methodical approaches'
      },
      {
        name: 'Confident Explorers',
        condition: (c: ClusterCenter) => 
          c.profile.avgConfidenceIndex > 0.7 && 
          c.behavioralProfile.dominantProblemSolvingStyle === 'exploratory',
        description: 'Self-assured users who learn through experimentation'
      },
      {
        name: 'Persistent Learners',
        condition: (c: ClusterCenter) => 
          c.profile.avgPersistenceIndex > 0.75 && 
          c.profile.avgConfidenceIndex < 0.6,
        description: 'Determined users who overcome challenges through persistence'
      },
      {
        name: 'Balanced Achievers',
        condition: (c: ClusterCenter) => 
          c.profile.avgTechnicalAptitude > 0.5 && 
          c.profile.avgTechnicalAptitude < 0.75 &&
          Math.abs(c.profile.avgSpeedIndex - c.profile.avgPrecisionIndex) < 0.2,
        description: 'Well-rounded users with balanced performance across metrics'
      },
      {
        name: 'Cautious Beginners',
        condition: (c: ClusterCenter) => 
          c.profile.avgConfidenceIndex < 0.5 && 
          c.profile.avgTechnicalAptitude < 0.6,
        description: 'Careful users who approach tasks with caution and need guidance'
      },
      {
        name: 'Gaming Veterans',
        condition: (c: ClusterCenter) => 
          c.behavioralProfile.dominantGamingFrequency === 'gaming_heavy' ||
          c.behavioralProfile.dominantGamingFrequency === 'gaming_daily',
        description: 'Experienced gamers who bring gaming skills to technical tasks'
      }
    ];

    // Assign names ensuring each archetype is used only once
    for (const cluster of sortedClusters) {
      let assigned = false;
      
      for (const archetype of clusterArchetypes) {
        if (!usedNames.has(archetype.name) && archetype.condition(cluster)) {
          cluster.clusterName = archetype.name;
          cluster.clusterDescription = archetype.description;
          cluster.detailedProfile = this.generateDetailedProfile(cluster);
          usedNames.add(archetype.name);
          assigned = true;
          break;
        }
      }
      
      // Fallback for remaining clusters
      if (!assigned) {
        const fallbackNames = [
          'Emerging Users', 'Adaptive Workers', 'Steady Performers', 
          'Technical Novices', 'Creative Problem Solvers', 'Standard Users'
        ];
        
        for (const fallbackName of fallbackNames) {
          if (!usedNames.has(fallbackName)) {
            cluster.clusterName = fallbackName;
            cluster.clusterDescription = 'Mixed characteristics users with unique patterns';
            cluster.detailedProfile = this.generateDetailedProfile(cluster);
            usedNames.add(fallbackName);
            break;
          }
        }
      }
      
      namedClusters.push(cluster);
    }

    // Sort back by original cluster ID
    return namedClusters.sort((a, b) => a.id - b.id);
  }

  /**
   * Generate DETAILED profile description for display
   */
  private generateDetailedProfile(cluster: ClusterCenter): string {
  const demo = cluster.demographicProfile;
  const behavioral = cluster.behavioralProfile;
  const profile = cluster.profile;
  
  let detailedProfile = `**Profil demografic dominant:**\n`;
  
  // ✅ CORECTARE: Folosește distribuția corectă pentru fiecare câmp
  detailedProfile += `• Vârstă: ${this.formatDemographic(demo.dominantAgeGroup)} (${this.getPercentage(demo.ageDistribution, demo.dominantAgeGroup, cluster.memberCount)}%)\n`;
  detailedProfile += `• Gen: ${this.formatDemographic(demo.dominantGender)} (${this.getPercentage(demo.genderDistribution, demo.dominantGender, cluster.memberCount)}%)\n`;
  detailedProfile += `• Educație: ${this.formatDemographic(demo.dominantEducation)} (${this.getPercentage(demo.educationDistribution, demo.dominantEducation, cluster.memberCount)}%)\n`;
  detailedProfile += `• Ocupație: ${this.formatDemographic(demo.dominantOccupation)} (${this.getPercentage(demo.occupationDistribution, demo.dominantOccupation, cluster.memberCount)}%)\n`;
  detailedProfile += `• Nivel STEM: ${this.formatDemographic(demo.dominantStemLevel)} (${this.getPercentage(demo.stemDistribution, demo.dominantStemLevel, cluster.memberCount)}%)\n\n`;
  
  detailedProfile += `**Profil comportamental dominant:**\n`;
  detailedProfile += `• Stil rezolvare probleme: ${this.formatBehavioral(behavioral.dominantProblemSolvingStyle)} (${this.getPercentage(behavioral.problemSolvingDistribution, behavioral.dominantProblemSolvingStyle, cluster.memberCount)}%)\n`;
  detailedProfile += `• Confort tehnologic: ${this.formatBehavioral(behavioral.dominantTechComfort)} (${this.getPercentage(behavioral.techComfortDistribution, behavioral.dominantTechComfort, cluster.memberCount)}%)\n`;
  detailedProfile += `• Gestionare erori: ${this.formatBehavioral(behavioral.dominantErrorHandling)} (${this.getPercentage(behavioral.errorHandlingDistribution, behavioral.dominantErrorHandling, cluster.memberCount)}%)\n`;
  detailedProfile += `• Experiență asamblare: ${this.formatBehavioral(behavioral.dominantAssemblyExperience)} (${this.getPercentage(behavioral.assemblyExperienceDistribution, behavioral.dominantAssemblyExperience, cluster.memberCount)}%)\n`;
  detailedProfile += `• Frecvență gaming: ${this.formatBehavioral(behavioral.dominantGamingFrequency)} (${this.getPercentage(behavioral.gamingDistribution, behavioral.dominantGamingFrequency, cluster.memberCount)}%)\n\n`;
  
  detailedProfile += `**Metrici de performanță:**\n`;
  detailedProfile += `• Aptitudine tehnică: ${(profile.avgTechnicalAptitude * 100).toFixed(1)}%\n`;
  detailedProfile += `• Index viteză: ${(profile.avgSpeedIndex * 100).toFixed(1)}%\n`;
  detailedProfile += `• Index precizie: ${(profile.avgPrecisionIndex * 100).toFixed(1)}%\n`;
  detailedProfile += `• Index încredere: ${(profile.avgConfidenceIndex * 100).toFixed(1)}%\n`;
  detailedProfile += `• Index sistematic: ${(profile.avgSystematicIndex * 100).toFixed(1)}%\n`;
  detailedProfile += `• Index persistență: ${(profile.avgPersistenceIndex * 100).toFixed(1)}%`;
  
  return detailedProfile;
}


  /**
   * Helper method to calculate percentage for distributions
   */
  private getPercentage(distribution: Record<string, number>, key: string, total: number): number {
    const count = distribution[key] || 0;
    return Math.round((count / total) * 100);
  }

  /**
   * Format demographic values for display
   */
  private formatDemographic(value: string): string {
    const demographicMap: Record<string, string> = {
      // Age groups
      'under_16': 'Sub 16 ani',
      '16_18': '16-18 ani',
      '19_25': '19-25 ani',
      '26_35': '26-35 ani',
      '36_45': '36-45 ani',
      '46_55': '46-55 ani',
      'over_55': 'Peste 55 ani',
      
      // Gender
      'M': 'Masculin',
      'F': 'Feminin',
      'N/A': 'Nespecificat',
      
      // Education
      'elementary': 'Școala generală',
      'highschool_completed': 'Liceu finalizat',
      'highschool_tech': 'Liceu profil real',
      'highschool_general': 'Liceu profil uman',
      'bachelor': 'Licență',
      'master': 'Master',
      'phd': 'Doctorat',
      
      // Occupation
      'tech': 'IT/Tehnologie',
      'engineering': 'Inginerie',
      'education': 'Educație',
      'student': 'Student',
      'healthcare': 'Sănătate',
      'business': 'Business',
      'retired': 'Pensionar',
      'other': 'Altele',
      
      // STEM
      'stem_expert': 'Expert STEM',
      'stem_familiar': 'Familiar cu STEM',
      'stem_moderate': 'Moderat familiar',
      'stem_basic': 'Cunoștințe de bază',
      'stem_none': 'Fără cunoștințe STEM'
    };
    
    return demographicMap[value] || value;
  }

  /**
   * Format behavioral values for display
   */
  private formatBehavioral(value: string): string {
    const behavioralMap: Record<string, string> = {
      // Problem solving
      'systematic': 'Sistematic',
      'exploratory': 'Exploratoriu',
      'balanced': 'Echilibrat',
      'collaborative': 'Colaborativ',
      
      // Tech comfort
      'tech_expert': 'Expert tehnologic',
      'tech_comfortable': 'Confortabil cu tehnologia',
      'tech_moderate': 'Moderat cu tehnologia',
      'tech_basic': 'Cunoștințe de bază',
      'tech_uncomfortable': 'Neconfortabil cu tehnologia',
      
      // Error handling
      'quick_retry': 'Încearcă rapid din nou',
      'analytical': 'Analizează metodic',
      'restart': 'Reîncepe de la început',
      'seek_help': 'Caută ajutor',
      'frustrated': 'Se frustrează',
      
      // Assembly experience
      'assembly_expert': 'Expert în asamblare',
      'assembly_some': 'Ceva experiență',
      'assembly_rare': 'Experiență rară',
      'assembly_none': 'Fără experiență',
      
      // Gaming frequency
      'gaming_heavy': 'Gaming intens (zilnic, multe ore)',
      'gaming_daily': 'Gaming zilnic moderat',
      'gaming_weekly': 'Gaming săptămânal',
      'gaming_occasional': 'Gaming ocazional',
      'gaming_never': 'Niciodată gaming'
    };
    
    return behavioralMap[value] || value;
  }

  // Keep all other existing methods unchanged...
  private async getResponsesForClustering(surveyId?: number): Promise<Response[]> {
    const queryBuilder = this.responseRepo.createQueryBuilder('response')
      .leftJoinAndSelect('response.survey', 'survey')
      .where('response.isComplete = :isComplete', { isComplete: true })
      .andWhere('response.computedMetrics IS NOT NULL');
    
    if (surveyId) {
      queryBuilder.andWhere('survey.id = :surveyId', { surveyId });
    }
    
    return await queryBuilder.getMany();
  }

  private async determineOptimalK(featureVectors: number[][]): Promise<number> {
    const maxK = Math.min(6, Math.floor(featureVectors.length / 3)); // Max 6 clusters, min 3 points per cluster
    const minK = Math.min(3, featureVectors.length);
    
    if (minK >= maxK) return minK;
    
    const inertias: number[] = [];
    
    for (let k = minK; k <= maxK; k++) {
      const result = await this.kMeansClustering(featureVectors, k);
      inertias.push(result.inertia);
    }

    // Find elbow point
    let optimalK = minK;
    let maxImprovement = 0;
    
    for (let i = 1; i < inertias.length - 1; i++) {
      const improvement = inertias[i-1] - inertias[i];
      const nextImprovement = inertias[i] - inertias[i+1];
      const elbowScore = improvement - nextImprovement;
      
      if (elbowScore > maxImprovement) {
        maxImprovement = elbowScore;
        optimalK = minK + i;
      }
    }

    return optimalK;
  }

  private async kMeansClustering(data: number[][], k: number): Promise<{
    centroids: number[][];
    assignments: number[];
    inertia: number;
    iterations: number;
  }> {
    const maxIterations = 100;
    const tolerance = 1e-6;
    
    let centroids = this.initializeCentroids(data, k);
    let assignments = new Array(data.length).fill(0);
    let prevInertia = Infinity;
    let iterations = 0;

    for (iterations = 0; iterations < maxIterations; iterations++) {
      const newAssignments = data.map(point => this.findNearestCentroid(point, centroids));
      const newCentroids = this.updateCentroids(data, newAssignments, k);
      const inertia = this.calculateInertia(data, newAssignments, newCentroids);
      
      if (Math.abs(prevInertia - inertia) < tolerance) {
        console.log(`✅ K-means converged after ${iterations + 1} iterations`);
        break;
      }
      
      centroids = newCentroids;
      assignments = newAssignments;
      prevInertia = inertia;
    }

    const finalInertia = this.calculateInertia(data, assignments, centroids);
    
    return {
      centroids,
      assignments,
      inertia: finalInertia,
      iterations: iterations + 1
    };
  }

  private initializeCentroids(data: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    
    const firstIndex = Math.floor(Math.random() * data.length);
    centroids.push([...data[firstIndex]]);
    
    for (let i = 1; i < k; i++) {
      const distances = data.map(point => {
        const minDist = Math.min(...centroids.map(centroid => 
          this.euclideanDistance(point, centroid)
        ));
        return minDist * minDist;
      });
      
      const totalDistance = distances.reduce((sum, dist) => sum + dist, 0);
      const threshold = Math.random() * totalDistance;
      
      let cumulativeDistance = 0;
      for (let j = 0; j < data.length; j++) {
        cumulativeDistance += distances[j];
        if (cumulativeDistance >= threshold) {
          centroids.push([...data[j]]);
          break;
        }
      }
    }
    
    return centroids;
  }

  private findNearestCentroid(point: number[], centroids: number[][]): number {
    let minDistance = Infinity;
    let nearestIndex = 0;
    
    centroids.forEach((centroid, index) => {
      const distance = this.euclideanDistance(point, centroid);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });
    
    return nearestIndex;
  }

  private updateCentroids(data: number[][], assignments: number[], k: number): number[][] {
    const centroids: number[][] = [];
    
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, index) => assignments[index] === i);
      
      if (clusterPoints.length === 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        centroids.push([...data[randomIndex]]);
      } else {
        const dimensions = data[0].length;
        const centroid = new Array(dimensions).fill(0);
        
        clusterPoints.forEach(point => {
          point.forEach((value, dim) => {
            centroid[dim] += value;
          });
        });
        
        centroid.forEach((sum, dim) => {
          centroid[dim] = sum / clusterPoints.length;
        });
        
        centroids.push(centroid);
      }
    }
    
    return centroids;
  }

  private calculateInertia(data: number[][], assignments: number[], centroids: number[][]): number {
    let inertia = 0;
    
    data.forEach((point, index) => {
      const centroid = centroids[assignments[index]];
      const distance = this.euclideanDistance(point, centroid);
      inertia += distance * distance;
    });
    
    return inertia;
  }

  private euclideanDistance(point1: number[], point2: number[]): number {
    const sumSquaredDiffs = point1.reduce((sum, value, index) => {
      const diff = value - point2[index];
      return sum + diff * diff;
    }, 0);
    
    return Math.sqrt(sumSquaredDiffs);
  }

  private calculateAverageMetrics(responses: Response[]): any {
    const metrics = responses
      .map(r => r.computedMetrics)
      .filter((m): m is NonNullable<typeof m> => m !== null && m !== undefined);
    
    if (metrics.length === 0) {
      return {
        avgSpeedIndex: 0,
        avgPrecisionIndex: 0,
        avgConfidenceIndex: 0,
        avgSystematicIndex: 0,
        avgPersistenceIndex: 0,
        avgTechnicalAptitude: 0
      };
    }
    
    return {
      avgSpeedIndex: this.average(metrics.map(m => m.speedIndex)),
      avgPrecisionIndex: this.average(metrics.map(m => m.precisionIndex)),
      avgConfidenceIndex: this.average(metrics.map(m => m.confidenceIndex)),
      avgSystematicIndex: this.average(metrics.map(m => m.systematicIndex)),
      avgPersistenceIndex: this.average(metrics.map(m => m.persistenceIndex)),
      avgTechnicalAptitude: this.average(metrics.map(m => m.technicalAptitude))
    };
  }

  private calculateSilhouetteScore(data: number[][], assignments: number[]): number {
    const n = data.length;
    let totalScore = 0;
    
    for (let i = 0; i < n; i++) {
      const point = data[i];
      const cluster = assignments[i];
      
      const sameClusterPoints = data.filter((_, idx) => assignments[idx] === cluster && idx !== i);
      const a = sameClusterPoints.length > 0 ? 
        this.average(sameClusterPoints.map(p => this.euclideanDistance(point, p))) : 0;
      
      const clusters = [...new Set(assignments)];
      let minAvgDistance = Infinity;
      
      clusters.forEach(otherCluster => {
        if (otherCluster !== cluster) {
          const otherClusterPoints = data.filter((_, idx) => assignments[idx] === otherCluster);
          if (otherClusterPoints.length > 0) {
            const avgDistance = this.average(otherClusterPoints.map(p => this.euclideanDistance(point, p)));
            minAvgDistance = Math.min(minAvgDistance, avgDistance);
          }
        }
      });
      
      const b = minAvgDistance;
      const silhouette = a === 0 ? 0 : (b - a) / Math.max(a, b);
      totalScore += silhouette;
    }
    
    return totalScore / n;
  }

  private async updateClusterAssignments(responses: Response[], assignments: number[]): Promise<void> {
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const clusterId = assignments[i];
      
      await this.responseRepo.update(response.id, {
        clusterAssignment: clusterId,
        clusterMetadata: {
          confidence: 0.8,
          distanceToCenter: 0,
          nearestClusters: []
        }
      });
    }
    
    console.log(`✅ Updated cluster assignments for ${responses.length} responses`);
  }

  private calculateAssignmentConfidence(point: number[], centroids: number[][], assignedCluster: number): number {
    const distances = centroids.map(centroid => this.euclideanDistance(point, centroid));
    const assignedDistance = distances[assignedCluster];
    
    const sortedDistances = [...distances].sort((a, b) => a - b);
    const nearestDistance = sortedDistances[0];
    const secondNearestDistance = sortedDistances[1];
    
    const confidence = secondNearestDistance > 0 ? 
      Math.max(0, 1 - (assignedDistance / secondNearestDistance)) : 1;
    
    return Math.min(1, Math.max(0, confidence));
  }

  private findNearestClusters(point: number[], centroids: number[][], excludeCluster: number): number[] {
    const distances = centroids.map((centroid, index) => ({
      index,
      distance: this.euclideanDistance(point, centroid)
    })).filter(item => item.index !== excludeCluster);
    
    distances.sort((a, b) => a.distance - b.distance);
    
    return distances.slice(0, 2).map(item => item.index);
  }

  private generateClusteringInsights(clusters: ClusterCenter[], totalParticipants: number): string[] {
    const insights: string[] = [];
    
    const largestCluster = clusters.reduce((largest, current) => 
      current.memberCount > largest.memberCount ? current : largest
    );
    
    insights.push(`Cel mai mare grup comportamental: "${largestCluster.clusterName}" cu ${largestCluster.memberCount} participanți (${((largestCluster.memberCount / totalParticipants) * 100).toFixed(1)}%)`);
    
    const highPerformers = clusters.filter(c => c.profile.avgTechnicalAptitude > 0.7);
    if (highPerformers.length > 0) {
      insights.push(`${highPerformers.length} grup(uri) prezintă aptitudine tehnică ridicată (>70%)`);
    }
    
    const systematicClusters = clusters.filter(c => c.profile.avgSystematicIndex > 0.7);
    if (systematicClusters.length > 0) {
      insights.push(`${systematicClusters.length} grup(uri) preferă abordări sistematice de rezolvare a problemelor`);
    }
    
    const techClusters = clusters.filter(c => 
      c.demographicProfile.dominantOccupation === 'tech' || 
      c.demographicProfile.dominantOccupation === 'engineering'
    );
    
    if (techClusters.length > 0) {
      insights.push(`${techClusters.length} grup(uri) sunt dominate de profesioniști din domeniul tehnic`);
    }
    
    // Insight despre diversitatea de vârstă
    const ageGroups = [...new Set(clusters.map(c => c.demographicProfile.dominantAgeGroup))];
    if (ageGroups.length > 1) {
      insights.push(`Participanții acoperă ${ageGroups.length} grupe de vârstă diferite`);
    }
    
    return insights;
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
  }

  private findMostCommon(values: string[]): string {
    const counts: Record<string, number> = {};
    values.forEach(value => {
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, '');
  }

  private calculateDistribution(values: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    values.forEach(value => {
      if (value) {
        distribution[value] = (distribution[value] || 0) + 1;
      }
    });
    return distribution;
  }

  async predictClusterForNewParticipant(
    computedMetrics: any,
    surveyId?: number
  ): Promise<{ clusterId: number; confidence: number; clusterName: string }> {
    const existingResponses = await this.getResponsesForClustering(surveyId);
    
    if (existingResponses.length === 0) {
      return { clusterId: -1, confidence: 0, clusterName: 'Insufficient data' };
    }
    
    const clusterGroups: Record<number, number[][]> = {};
    existingResponses
      .filter(response => response.computedMetrics && response.clusterAssignment !== null && response.clusterAssignment !== undefined)
      .forEach(response => {
        const clusterId = response.clusterAssignment!;
        if (!clusterGroups[clusterId]) {
          clusterGroups[clusterId] = [];
        }
        clusterGroups[clusterId].push(FeatureEngineeringService.metricsToFeatureVector(response.computedMetrics!));
      });
    
    if (Object.keys(clusterGroups).length === 0) {
      return { clusterId: -1, confidence: 0, clusterName: 'No existing clusters' };
    }
    
    const centroids = Object.keys(clusterGroups).map(clusterId => {
      const clusterPoints = clusterGroups[parseInt(clusterId)];
      const dimensions = clusterPoints[0].length;
      const centroid = new Array(dimensions).fill(0);
      
      clusterPoints.forEach(point => {
        point.forEach((value, dim) => {
          centroid[dim] += value;
        });
      });
      
      centroid.forEach((sum, dim) => {
        centroid[dim] = sum / clusterPoints.length;
      });
      
      return { clusterId: parseInt(clusterId), centroid };
    });
    
    const newParticipantVector = FeatureEngineeringService.metricsToFeatureVector(computedMetrics);
    
    let nearestCluster = centroids[0];
    let minDistance = this.euclideanDistance(newParticipantVector, nearestCluster.centroid);
    
    centroids.forEach(cluster => {
      const distance = this.euclideanDistance(newParticipantVector, cluster.centroid);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCluster = cluster;
      }
    });
    
    const confidence = this.calculateAssignmentConfidence(
      newParticipantVector,
      centroids.map(c => c.centroid),
      centroids.findIndex(c => c.clusterId === nearestCluster.clusterId)
    );
    
    const clusterName = `Cluster ${nearestCluster.clusterId}`;
    
    return {
      clusterId: nearestCluster.clusterId,
      confidence,
      clusterName
    };
  }
}