// Updated Clustering Service - DIRECT OPTIMAL RESULTS - backend/src/clustering/clustering.service.ts
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
    assemblyExperienceDistribution: Record<string, number>;
    gamingDistribution: Record<string, number>;  
  };
  clusterName: string;
  clusterDescription: string;
  detailedProfile: string;
}

export interface ClusteringResult {
  clusters: ClusterCenter[];
  assignments: any[];
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
   * ✅ SIMPLIFIED: Perform K-means clustering with AUTOMATIC optimal K determination
   * Returns DIRECTLY the best possible clustering result without showing optimization steps
   */
  async performClustering(surveyId?: number, forcedK?: number): Promise<ClusteringResult> {
    console.log('🔬 Starting AUTOMATIC OPTIMAL clustering analysis...');
    
    // Get responses with computed metrics
    const responses = await this.getResponsesForClustering(surveyId);
    
    if (responses.length < 3) {
      throw new Error('Need at least 3 responses for meaningful clustering');
    }

    const responsesWithMetrics = responses.filter(r => r.computedMetrics);

    if (responsesWithMetrics.length < 3) {
      throw new Error('Need at least 3 responses with computed metrics for meaningful clustering');
    }

    // Extract feature vectors
    const featureVectors = responsesWithMetrics.map(response => 
      FeatureEngineeringService.metricsToFeatureVector(response.computedMetrics!)
    );

    // ✅ AUTOMATIC OPTIMIZATION: Try different K values and automatically select the best one
    const optimalResult = await this.findOptimalClusteringAutomatically(featureVectors, forcedK);
    console.log(`📊 AUTOMATICALLY selected optimal K=${optimalResult.optimalK} with quality score: ${optimalResult.bestQuality.toFixed(3)}`);

    // Create cluster profiles using the optimal clustering
    const clusters = await this.createClusterProfiles(
      optimalResult.bestAssignments,
      responsesWithMetrics,
      optimalResult.bestCentroids
    );

    // Assign unique cluster names and descriptions
    const namedClusters = this.assignUniqueClusterNames(clusters);

    // Update database with cluster assignments
    await this.updateClusterAssignments(responsesWithMetrics, optimalResult.bestAssignments);

    // Generate insights
    const insights = this.generateClusteringInsights(namedClusters, responsesWithMetrics.length);

    return {
      clusters: namedClusters,
      assignments: responsesWithMetrics.map((response, index) => ({
        participantId: response.id.toString(),
        clusterId: optimalResult.bestAssignments[index],
        confidence: this.calculateAssignmentConfidence(featureVectors[index], optimalResult.bestCentroids, optimalResult.bestAssignments[index]),
        distanceToCenter: this.euclideanDistance(featureVectors[index], optimalResult.bestCentroids[optimalResult.bestAssignments[index]]),
        nearestClusters: this.findNearestClusters(featureVectors[index], optimalResult.bestCentroids, optimalResult.bestAssignments[index])
      })),
      metadata: {
        totalParticipants: responsesWithMetrics.length,
        optimalClusterCount: optimalResult.optimalK,
        silhouetteScore: optimalResult.bestQuality,
        inertia: optimalResult.bestInertia,
        convergenceIterations: optimalResult.iterations
      },
      insights
    };
  }

  /**
   * ✅ NEW: Automatically find the optimal clustering by testing multiple K values
   * Returns the clustering configuration with the highest quality score
   */
  private async findOptimalClusteringAutomatically(
    featureVectors: number[][], 
    forcedK?: number
  ): Promise<{
    optimalK: number;
    bestQuality: number;
    bestAssignments: number[];
    bestCentroids: number[][];
    bestInertia: number;
    iterations: number;
  }> {
    
    if (forcedK) {
      console.log(`🎯 Using forced K=${forcedK}`);
      const result = await this.kMeansClustering(featureVectors, forcedK);
      const quality = this.calculateSilhouetteScore(featureVectors, result.assignments);
      
      return {
        optimalK: forcedK,
        bestQuality: quality,
        bestAssignments: result.assignments,
        bestCentroids: result.centroids,
        bestInertia: result.inertia,
        iterations: result.iterations
      };
    }

    // Define K range to test
    const minK = 2;
    const maxK = Math.min(6, Math.floor(featureVectors.length / 2)); // Max 6 clusters, min 2 points per cluster
    
    console.log(`🔍 Testing K values from ${minK} to ${maxK} to find optimal clustering...`);

    let bestK = minK;
    let bestQuality = -1;
    let bestResult: any = null;

    // Test each K value and find the one with highest silhouette score
    for (let k = minK; k <= maxK; k++) {
      try {
        console.log(`🧮 Testing K=${k}...`);
        
        // Run clustering multiple times and take the best result
        let bestKResult: any = null;
        let bestKQuality = -1;
        
        for (let run = 0; run < 3; run++) { // 3 runs per K to account for randomness
          const result = await this.kMeansClustering(featureVectors, k);
          const quality = this.calculateSilhouetteScore(featureVectors, result.assignments);
          
          if (quality > bestKQuality) {
            bestKQuality = quality;
            bestKResult = result;
          }
        }
        
        console.log(`   K=${k}: Quality = ${bestKQuality.toFixed(3)}`);
        
        // Check if this is the best K so far
        if (bestKQuality > bestQuality) {
          bestQuality = bestKQuality;
          bestK = k;
          bestResult = bestKResult;
          bestResult.silhouetteScore = bestKQuality;
        }
        
      } catch (error) {
        console.error(`   ❌ K=${k} failed:`, error.message);
        continue;
      }
    }

    if (!bestResult) {
      throw new Error('Failed to find any valid clustering configuration');
    }

    console.log(`✅ OPTIMAL K=${bestK} selected with quality score: ${bestQuality.toFixed(3)}`);

    return {
      optimalK: bestK,
      bestQuality: bestQuality,
      bestAssignments: bestResult.assignments,
      bestCentroids: bestResult.centroids,
      bestInertia: bestResult.inertia,
      iterations: bestResult.iterations
    };
  }

  /**
   * All other existing methods remain the same...
   * (keeping the existing implementation for cluster profile creation, naming, etc.)
   */

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

  // ... (keep all existing helper methods: initializeCentroids, findNearestCentroid, etc.)
  // ... (keep all existing methods for cluster profile creation, naming, etc.)
  
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
      
      const avgMetrics = this.calculateAverageMetrics(clusterResponses);
      const demographicProfile = this.calculateDetailedDemographicProfile(clusterResponses);
      const behavioralProfile = this.calculateDetailedBehavioralProfile(clusterResponses);
      
      clusters.push({
        id: clusterId,
        centroid: centroids[clusterId],
        memberCount: clusterResponses.length,
        profile: avgMetrics,
        demographicProfile,
        behavioralProfile,
        clusterName: '',
        clusterDescription: '',
        detailedProfile: ''
      });
    }
    
    return clusters;
  }

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
      ageDistribution,
      genderDistribution,
      educationDistribution,
      occupationDistribution,
      stemDistribution
    };
  }

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
      assemblyExperienceDistribution: assemblyExpDistribution,
      gamingDistribution
    };
  }

  private assignUniqueClusterNames(clusters: ClusterCenter[]): ClusterCenter[] {
    const sortedClusters = [...clusters].sort((a, b) => 
      b.profile.avgTechnicalAptitude - a.profile.avgTechnicalAptitude
    );

    const usedNames = new Set<string>();
    const namedClusters: ClusterCenter[] = [];

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

    return namedClusters.sort((a, b) => a.id - b.id);
  }

  private generateDetailedProfile(cluster: ClusterCenter): string {
    const demo = cluster.demographicProfile;
    const behavioral = cluster.behavioralProfile;
    const profile = cluster.profile;
    
    let detailedProfile = `**Profil demografic dominant:**\n`;
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

  // Helper methods (keeping existing implementations)
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
    
    const ageGroups = [...new Set(clusters.map(c => c.demographicProfile.dominantAgeGroup))];
    if (ageGroups.length > 1) {
      insights.push(`Participanții acoperă ${ageGroups.length} grupe de vârstă diferite`);
    }
    
    return insights;
  }

  // Utility methods
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

  private getPercentage(distribution: Record<string, number>, key: string, total: number): number {
    const count = distribution[key] || 0;
    return Math.round((count / total) * 100);
  }

  private formatDemographic(value: string): string {
    const demographicMap: Record<string, string> = {
      'under_16': 'Sub 16 ani',
      '16_18': '16-18 ani',
      '19_25': '19-25 ani',
      '26_35': '26-35 ani',
      '36_45': '36-45 ani',
      '46_55': '46-55 ani',
      'over_55': 'Peste 55 ani',
      'M': 'Masculin',
      'F': 'Feminin',
      'N/A': 'Nespecificat',
      'elementary': 'Școala generală',
      'highschool_completed': 'Liceu finalizat',
      'highschool_tech': 'Liceu profil real',
      'highschool_general': 'Liceu profil uman',
      'bachelor': 'Licență',
      'master': 'Master',
      'phd': 'Doctorat',
      'tech': 'IT/Tehnologie',
      'engineering': 'Inginerie',
      'education': 'Educație',
      'student': 'Student',
      'healthcare': 'Sănătate',
      'business': 'Business',
      'retired': 'Pensionar',
      'other': 'Altele',
      'stem_expert': 'Expert STEM',
      'stem_familiar': 'Familiar cu STEM',
      'stem_moderate': 'Moderat familiar',
      'stem_basic': 'Cunoștințe de bază',
      'stem_none': 'Fără cunoștințe STEM'
    };
    
    return demographicMap[value] || value;
  }

  private formatBehavioral(value: string): string {
    const behavioralMap: Record<string, string> = {
      'systematic': 'Sistematic',
      'exploratory': 'Exploratoriu',
      'balanced': 'Echilibrat',
      'collaborative': 'Colaborativ',
      'tech_expert': 'Expert tehnologic',
      'tech_comfortable': 'Confortabil cu tehnologia',
      'tech_moderate': 'Moderat cu tehnologia',
      'tech_basic': 'Cunoștințe de bază',
      'tech_uncomfortable': 'Neconfortabil cu tehnologia',
      'quick_retry': 'Încearcă rapid din nou',
      'analytical': 'Analizează metodic',
      'restart': 'Reîncepe de la început',
      'seek_help': 'Caută ajutor',
      'frustrated': 'Se frustrează',
      'assembly_expert': 'Expert în asamblare',
      'assembly_some': 'Ceva experiență',
      'assembly_rare': 'Experiență rară',
      'assembly_none': 'Fără experiență',
      'gaming_heavy': 'Gaming intens (zilnic, multe ore)',
      'gaming_daily': 'Gaming zilnic moderat',
      'gaming_weekly': 'Gaming săptămânal',
      'gaming_occasional': 'Gaming ocazional',
      'gaming_never': 'Niciodată gaming'
    };
    
    return behavioralMap[value] || value;
  }
}