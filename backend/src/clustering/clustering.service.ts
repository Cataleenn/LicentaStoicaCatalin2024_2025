// Fixed Clustering Service - backend/src/clustering/clustering.service.ts
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
    genderDistribution: Record<string, number>;
    educationDistribution: Record<string, number>;
    occupationDistribution: Record<string, number>;
  };
  behavioralProfile: {
    dominantProblemSolvingStyle: string;
    dominantTechComfort: string;
    dominantErrorHandling: string;
  };
  clusterName: string;
  clusterDescription: string;
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

    // Extract feature vectors (filter out responses without computed metrics)
    const featureVectors = responsesWithMetrics.map(response => 
      FeatureEngineeringService.metricsToFeatureVector(response.computedMetrics!)
    );

    // Determine optimal number of clusters
    const optimalK = forcedK || await this.determineOptimalK(featureVectors);
    console.log(`📊 Using ${optimalK} clusters for ${responsesWithMetrics.length} responses`);

    // Perform K-means clustering
    const clusteringResults = await this.kMeansClustering(featureVectors, optimalK);
    
    // Create cluster profiles (use only responses with metrics)
    const clusters = await this.createClusterProfiles(
      clusteringResults.assignments,
      responsesWithMetrics,
      clusteringResults.centroids
    );

    // Assign cluster names and descriptions
    const namedClusters = clusters.map(cluster => ({
      ...cluster,
      ...this.generateClusterNameAndDescription(cluster)
    }));

    // Update database with cluster assignments (only for responses with metrics)
    await this.updateClusterAssignments(responsesWithMetrics, clusteringResults.assignments);

    // Calculate clustering quality metrics
    const silhouetteScore = this.calculateSilhouetteScore(featureVectors, clusteringResults.assignments);
    
    // Generate insights (use responses with metrics)
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
   * Get responses suitable for clustering
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

  /**
   * Determine optimal number of clusters using elbow method
   */
  private async determineOptimalK(featureVectors: number[][]): Promise<number> {
    const maxK = Math.min(8, Math.floor(featureVectors.length / 5)); // Max 8 clusters, min 5 points per cluster
    const minK = 3;
    
    const inertias: number[] = [];
    
    for (let k = minK; k <= maxK; k++) {
      const result = await this.kMeansClustering(featureVectors, k);
      inertias.push(result.inertia);
    }

    // Find elbow point (simplified method)
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

  /**
   * K-means clustering implementation
   */
  private async kMeansClustering(data: number[][], k: number): Promise<{
    centroids: number[][];
    assignments: number[];
    inertia: number;
    iterations: number;
  }> {
    const maxIterations = 100;
    const tolerance = 1e-6;
    
    // Initialize centroids randomly
    let centroids = this.initializeCentroids(data, k);
    let assignments = new Array(data.length).fill(0);
    let prevInertia = Infinity;
    let iterations = 0;

    for (iterations = 0; iterations < maxIterations; iterations++) {
      // Assign points to nearest centroid
      const newAssignments = data.map(point => this.findNearestCentroid(point, centroids));
      
      // Update centroids
      const newCentroids = this.updateCentroids(data, newAssignments, k);
      
      // Calculate inertia (within-cluster sum of squares)
      const inertia = this.calculateInertia(data, newAssignments, newCentroids);
      
      // Check for convergence
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

  /**
   * Initialize centroids using K-means++ method
   */
  private initializeCentroids(data: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    
    // Choose first centroid randomly
    const firstIndex = Math.floor(Math.random() * data.length);
    centroids.push([...data[firstIndex]]);
    
    // Choose remaining centroids with probability proportional to distance
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

  /**
   * Find nearest centroid for a point
   */
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

  /**
   * Update centroids based on current assignments
   */
  private updateCentroids(data: number[][], assignments: number[], k: number): number[][] {
    const centroids: number[][] = [];
    
    for (let i = 0; i < k; i++) {
      const clusterPoints = data.filter((_, index) => assignments[index] === i);
      
      if (clusterPoints.length === 0) {
        // If cluster is empty, reinitialize randomly
        const randomIndex = Math.floor(Math.random() * data.length);
        centroids.push([...data[randomIndex]]);
      } else {
        // Calculate mean of cluster points
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

  /**
   * Calculate within-cluster sum of squares (inertia)
   */
  private calculateInertia(data: number[][], assignments: number[], centroids: number[][]): number {
    let inertia = 0;
    
    data.forEach((point, index) => {
      const centroid = centroids[assignments[index]];
      const distance = this.euclideanDistance(point, centroid);
      inertia += distance * distance;
    });
    
    return inertia;
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private euclideanDistance(point1: number[], point2: number[]): number {
    const sumSquaredDiffs = point1.reduce((sum, value, index) => {
      const diff = value - point2[index];
      return sum + diff * diff;
    }, 0);
    
    return Math.sqrt(sumSquaredDiffs);
  }

  /**
   * Create detailed profiles for each cluster
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
      
      // Calculate demographic distribution
      const demographicProfile = this.calculateDemographicProfile(clusterResponses);
      
      // Calculate behavioral distribution
      const behavioralProfile = this.calculateBehavioralProfile(clusterResponses);
      
      clusters.push({
        id: clusterId,
        centroid: centroids[clusterId],
        memberCount: clusterResponses.length,
        profile: avgMetrics,
        demographicProfile,
        behavioralProfile,
        clusterName: '', // Will be filled by generateClusterNameAndDescription
        clusterDescription: ''
      });
    }
    
    return clusters;
  }

  /**
   * Calculate average behavioral metrics for a cluster
   */
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

  /**
   * Calculate demographic profile for a cluster
   */
  private calculateDemographicProfile(responses: Response[]): any {
    const demographics = responses
      .map(r => r.demographicProfile)
      .filter((d): d is NonNullable<typeof d> => d !== null && d !== undefined);
    
    return {
      dominantAgeGroup: this.findMostCommon(demographics.map(d => d.ageGroup)),
      genderDistribution: this.calculateDistribution(demographics.map(d => d.gender)),
      educationDistribution: this.calculateDistribution(demographics.map(d => d.educationLevel)),
      occupationDistribution: this.calculateDistribution(demographics.map(d => d.occupation))
    };
  }

  /**
   * Calculate behavioral profile for a cluster
   */
  private calculateBehavioralProfile(responses: Response[]): any {
    const behavioral = responses
      .map(r => r.behavioralProfile)
      .filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined);
    
    return {
      dominantProblemSolvingStyle: this.findMostCommon(behavioral.map(b => b.problemSolvingStyle)),
      dominantTechComfort: this.findMostCommon(behavioral.map(b => b.techComfort)),
      dominantErrorHandling: this.findMostCommon(behavioral.map(b => b.errorHandlingStyle))
    };
  }

  /**
   * Generate cluster name and description based on profile
   */
  private generateClusterNameAndDescription(cluster: ClusterCenter): { clusterName: string; clusterDescription: string } {
    const profile = cluster.profile;
    const behavioral = cluster.behavioralProfile;
    const demographic = cluster.demographicProfile;
    
    // Determine primary characteristics
    const isHighSpeed = profile.avgSpeedIndex > 0.7;
    const isHighPrecision = profile.avgPrecisionIndex > 0.7;
    const isHighConfidence = profile.avgConfidenceIndex > 0.7;
    const isSystematic = profile.avgSystematicIndex > 0.7;
    const isHighPersistence = profile.avgPersistenceIndex > 0.7;
    const isHighTech = profile.avgTechnicalAptitude > 0.7;
    
    // Generate name based on characteristics
    let name = '';
    let description = '';
    
    if (isHighSpeed && isHighPrecision && isHighConfidence) {
      name = 'Elite Performers';
      description = 'Fast, accurate, and confident users who excel across all metrics. Often have strong technical backgrounds.';
    } else if (isSystematic && isHighPrecision && !isHighSpeed) {
      name = 'Methodical Perfectionists';
      description = 'Careful, systematic users who prioritize accuracy over speed. They plan their approach and make few mistakes.';
    } else if (isHighSpeed && isHighConfidence && !isHighPrecision) {
      name = 'Quick Explorers';
      description = 'Fast, confident users who learn through trial and error. They prefer action over planning.';
    } else if (isHighPersistence && !isHighConfidence) {
      name = 'Determined Learners';
      description = 'Users who may struggle initially but persist through challenges. They show good recovery from mistakes.';
    } else if (profile.avgConfidenceIndex < 0.4 && profile.avgSystematicIndex < 0.4) {
      name = 'Cautious Beginners';
      description = 'Users who approach the task carefully and may need more guidance. They show hesitation but eventual completion.';
    } else {
      name = 'Balanced Achievers';
      description = 'Well-rounded users with moderate performance across most metrics. They represent a typical approach.';
    }
    
    // Add demographic context
    const dominantAge = demographic.dominantAgeGroup;
    const dominantOccupation = demographic.occupationDistribution;
    const topOccupation = Object.keys(dominantOccupation).reduce((a, b) => 
      dominantOccupation[a] > dominantOccupation[b] ? a : b
    );
    
    if (topOccupation && dominantOccupation[topOccupation] > cluster.memberCount * 0.4) {
      description += ` Predominantly ${topOccupation} professionals.`;
    }
    
    if (dominantAge) {
      description += ` Most common age group: ${dominantAge}.`;
    }
    
    return { clusterName: name, clusterDescription: description };
  }

  /**
   * Calculate Silhouette Score for clustering quality
   */
  private calculateSilhouetteScore(data: number[][], assignments: number[]): number {
    const n = data.length;
    let totalScore = 0;
    
    for (let i = 0; i < n; i++) {
      const point = data[i];
      const cluster = assignments[i];
      
      // Calculate average distance to points in same cluster (a)
      const sameClusterPoints = data.filter((_, idx) => assignments[idx] === cluster && idx !== i);
      const a = sameClusterPoints.length > 0 ? 
        this.average(sameClusterPoints.map(p => this.euclideanDistance(point, p))) : 0;
      
      // Calculate average distance to points in nearest cluster (b)
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
      
      // Calculate silhouette score for this point
      const silhouette = a === 0 ? 0 : (b - a) / Math.max(a, b);
      totalScore += silhouette;
    }
    
    return totalScore / n;
  }

  /**
   * Update database with cluster assignments
   */
  private async updateClusterAssignments(responses: Response[], assignments: number[]): Promise<void> {
    for (let i = 0; i < responses.length; i++) {
      const response = responses[i];
      const clusterId = assignments[i];
      
      await this.responseRepo.update(response.id, {
        clusterAssignment: clusterId,
        clusterMetadata: {
          confidence: 0.8, // Will be calculated properly in next iteration
          distanceToCenter: 0,
          nearestClusters: []
        }
      });
    }
    
    console.log(`✅ Updated cluster assignments for ${responses.length} responses`);
  }

  /**
   * Calculate assignment confidence
   */
  private calculateAssignmentConfidence(point: number[], centroids: number[][], assignedCluster: number): number {
    const distances = centroids.map(centroid => this.euclideanDistance(point, centroid));
    const assignedDistance = distances[assignedCluster];
    
    // Sort distances to find second nearest
    const sortedDistances = [...distances].sort((a, b) => a - b);
    const nearestDistance = sortedDistances[0];
    const secondNearestDistance = sortedDistances[1];
    
    // Confidence based on relative distance to second nearest cluster
    const confidence = secondNearestDistance > 0 ? 
      Math.max(0, 1 - (assignedDistance / secondNearestDistance)) : 1;
    
    return Math.min(1, Math.max(0, confidence));
  }

  /**
   * Find nearest clusters to a point
   */
  private findNearestClusters(point: number[], centroids: number[][], excludeCluster: number): number[] {
    const distances = centroids.map((centroid, index) => ({
      index,
      distance: this.euclideanDistance(point, centroid)
    })).filter(item => item.index !== excludeCluster);
    
    distances.sort((a, b) => a.distance - b.distance);
    
    return distances.slice(0, 2).map(item => item.index);
  }

  /**
   * Generate insights from clustering results
   */
  private generateClusteringInsights(clusters: ClusterCenter[], totalParticipants: number): string[] {
    const insights: string[] = [];
    
    // Cluster size insights
    const largestCluster = clusters.reduce((largest, current) => 
      current.memberCount > largest.memberCount ? current : largest
    );
    
    insights.push(`Largest behavioral group: "${largestCluster.clusterName}" with ${largestCluster.memberCount} participants (${((largestCluster.memberCount / totalParticipants) * 100).toFixed(1)}%)`);
    
    // Performance insights
    const highPerformers = clusters.filter(c => c.profile.avgTechnicalAptitude > 0.7);
    if (highPerformers.length > 0) {
      insights.push(`${highPerformers.length} cluster(s) show high technical aptitude (>70%)`);
    }
    
    // Behavioral insights
    const systematicClusters = clusters.filter(c => c.profile.avgSystematicIndex > 0.7);
    const exploratoryCount = clusters.length - systematicClusters.length;
    
    if (systematicClusters.length > exploratoryCount) {
      insights.push('Most participants show systematic problem-solving approaches');
    } else {
      insights.push('Participants show diverse problem-solving strategies');
    }
    
    // Demographic insights
    const techClusters = clusters.filter(c => {
      const techOccupations = ['tech', 'engineering'];
      const occupations = c.demographicProfile.occupationDistribution;
      const techCount = techOccupations.reduce((sum, occ) => sum + (occupations[occ] || 0), 0);
      return techCount > c.memberCount * 0.4;
    });
    
    if (techClusters.length > 0) {
      insights.push(`${techClusters.length} cluster(s) are dominated by technical professionals`);
    }
    
    return insights;
  }

  /**
   * Helper functions
   */
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

  /**
   * Predict cluster for new participant
   */
  async predictClusterForNewParticipant(
    computedMetrics: any,
    surveyId?: number
  ): Promise<{ clusterId: number; confidence: number; clusterName: string }> {
    // Get latest clustering results for the survey
    const existingResponses = await this.getResponsesForClustering(surveyId);
    
    if (existingResponses.length === 0) {
      return { clusterId: -1, confidence: 0, clusterName: 'Insufficient data' };
    }
    
    // Get cluster centroids from existing responses (filter out null metrics)
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
    
    // Calculate centroids
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
    
    // Find nearest cluster for new participant
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
    
    // Calculate confidence
    const confidence = this.calculateAssignmentConfidence(
      newParticipantVector,
      centroids.map(c => c.centroid),
      centroids.findIndex(c => c.clusterId === nearestCluster.clusterId)
    );
    
    // Get cluster name (would need to be stored/computed)
    const clusterName = `Cluster ${nearestCluster.clusterId}`;
    
    return {
      clusterId: nearestCluster.clusterId,
      confidence,
      clusterName
    };
  }
}