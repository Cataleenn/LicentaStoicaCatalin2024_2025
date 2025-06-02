// Fixed Clustering Controller - backend/src/clustering/clustering.controller.ts
import { Controller, Get, Post, Param, UseGuards, Query, Body } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { ClusteringService } from './clustering.service';

interface SurveyComparison {
  surveyId: number;
  clusterCount?: number;
  totalParticipants?: number;
  silhouetteScore?: number;
  clusters?: Array<{
    id: number;
    name: string;
    size: number;
    avgTechnicalAptitude: number;
  }>;
  error?: string;
}

@Controller('clustering')
@UseGuards(AdminGuard) // Protect all clustering endpoints
export class ClusteringController {
  constructor(
    private readonly clusteringService: ClusteringService
  ) {}

  /**
   * POST /api/clustering/survey/:id/analyze
   * Perform clustering analysis on survey responses
   */
  @Post('survey/:id/analyze')
  async performClusteringAnalysis(
    @Param('id') surveyId: number,
    @Body() options?: { forcedK?: number }
  ) {
    console.log(`🔬 Starting clustering analysis for survey ${surveyId}`);
    
    try {
      const clusteringResult = await this.clusteringService.performClustering(
        surveyId, 
        options?.forcedK
      );
      
      return {
        success: true,
        data: clusteringResult,
        message: `Clustering analysis completed for survey ${surveyId}`,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error performing clustering analysis:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to perform clustering analysis'
      };
    }
  }

  /**
   * GET /api/clustering/survey/:id/results
   * Get existing clustering results for a survey
   */
  @Get('survey/:id/results')
  async getClusteringResults(@Param('id') surveyId: number) {
    console.log(`📊 Getting clustering results for survey ${surveyId}`);
    
    try {
      // This would typically get cached results, but for now we'll re-run analysis
      const clusteringResult = await this.clusteringService.performClustering(surveyId);
      
      return {
        success: true,
        data: {
          clusters: clusteringResult.clusters,
          metadata: clusteringResult.metadata,
          insights: clusteringResult.insights,
          lastAnalyzed: new Date()
        },
        message: 'Clustering results retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Error getting clustering results:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to retrieve clustering results'
      };
    }
  }

  /**
   * GET /api/clustering/survey/:id/cluster/:clusterId/details
   * Get detailed information about a specific cluster
   */
  @Get('survey/:id/cluster/:clusterId/details')
  async getClusterDetails(
    @Param('id') surveyId: number,
    @Param('clusterId') clusterId: number
  ) {
    console.log(`🔍 Getting details for cluster ${clusterId} in survey ${surveyId}`);
    
    try {
      const clusteringResult = await this.clusteringService.performClustering(surveyId);
      const cluster = clusteringResult.clusters.find(c => c.id === clusterId);
      
      if (!cluster) {
        return {
          success: false,
          message: `Cluster ${clusterId} not found`
        };
      }

      // Get all participants in this cluster
      const participants = clusteringResult.assignments.filter(a => a.clusterId === clusterId);
      
      return {
        success: true,
        data: {
          cluster: cluster,
          participants: participants,
          participantCount: participants.length,
          averageConfidence: this.calculateAverage(participants.map(p => p.confidence)),
          insights: this.generateClusterSpecificInsights(cluster)
        },
        message: `Details for cluster "${cluster.clusterName}" retrieved successfully`
      };
    } catch (error) {
      console.error('❌ Error getting cluster details:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * GET /api/clustering/survey/:id/participant/:participantId/assignment
   * Get cluster assignment for a specific participant
   */
  @Get('survey/:id/participant/:participantId/assignment')
  async getParticipantClusterAssignment(
    @Param('id') surveyId: number,
    @Param('participantId') participantId: string
  ) {
    console.log(`👤 Getting cluster assignment for participant ${participantId}`);
    
    try {
      const clusteringResult = await this.clusteringService.performClustering(surveyId);
      const assignment = clusteringResult.assignments.find(a => a.participantId === participantId);
      
      if (!assignment) {
        return {
          success: false,
          message: `Assignment for participant ${participantId} not found`
        };
      }

      const cluster = clusteringResult.clusters.find(c => c.id === assignment.clusterId);
      
      return {
        success: true,
        data: {
          assignment: assignment,
          cluster: cluster,
          explanation: this.generateAssignmentExplanation(assignment, cluster)
        },
        message: 'Participant cluster assignment retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Error getting participant assignment:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * POST /api/clustering/all-surveys/analyze
   * Perform cross-survey clustering analysis
   */
  @Post('all-surveys/analyze')
  async performCrossSurveyAnalysis(@Body() options?: { forcedK?: number }) {
    console.log('🌐 Starting cross-survey clustering analysis');
    
    try {
      // Perform clustering across all surveys (no surveyId specified)
      const clusteringResult = await this.clusteringService.performClustering(
        undefined, // No specific survey
        options?.forcedK
      );
      
      return {
        success: true,
        data: {
          ...clusteringResult,
          crossSurveyInsights: this.generateCrossSurveyInsights(clusteringResult)
        },
        message: 'Cross-survey clustering analysis completed successfully',
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error performing cross-survey analysis:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to perform cross-survey clustering analysis'
      };
    }
  }

  /**
   * GET /api/clustering/comparison
   * Compare clustering results across different surveys
   */
  @Get('comparison')
  async getClusteringComparison(@Query('surveyIds') surveyIds: string) {
    console.log('📊 Getting clustering comparison across surveys');
    
    try {
      const surveyIdArray = surveyIds.split(',').map(id => parseInt(id));
      const comparisons: SurveyComparison[] = [];
      
      for (const surveyId of surveyIdArray) {
        try {
          const result = await this.clusteringService.performClustering(surveyId);
          comparisons.push({
            surveyId,
            clusterCount: result.clusters.length,
            totalParticipants: result.metadata.totalParticipants,
            silhouetteScore: result.metadata.silhouetteScore,
            clusters: result.clusters.map(c => ({
              id: c.id,
              name: c.clusterName,
              size: c.memberCount,
              avgTechnicalAptitude: c.profile.avgTechnicalAptitude
            }))
          });
        } catch (error) {
          comparisons.push({
            surveyId,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        data: {
          comparisons,
          summary: this.generateComparisonSummary(comparisons)
        },
        message: 'Clustering comparison completed successfully'
      };
    } catch (error) {
      console.error('❌ Error getting clustering comparison:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * GET /api/clustering/export/:surveyId
   * Export clustering data for external analysis
   */
  @Get('export/:surveyId')
  async exportClusteringData(@Param('surveyId') surveyId: number) {
    console.log(`📤 Exporting clustering data for survey ${surveyId}`);
    
    try {
      const clusteringResult = await this.clusteringService.performClustering(surveyId);
      
      // Prepare data for export
      const exportData = {
        metadata: {
          surveyId,
          exportDate: new Date(),
          totalParticipants: clusteringResult.metadata.totalParticipants,
          clusterCount: clusteringResult.clusters.length,
          qualityMetrics: {
            silhouetteScore: clusteringResult.metadata.silhouetteScore,
            inertia: clusteringResult.metadata.inertia
          }
        },
        clusters: clusteringResult.clusters.map(cluster => ({
          id: cluster.id,
          name: cluster.clusterName,
          description: cluster.clusterDescription,
          size: cluster.memberCount,
          percentage: ((cluster.memberCount / clusteringResult.metadata.totalParticipants) * 100).toFixed(1),
          profile: cluster.profile,
          demographics: cluster.demographicProfile,
          behavioral: cluster.behavioralProfile
        })),
        participants: clusteringResult.assignments.map(assignment => ({
          participantId: assignment.participantId,
          clusterId: assignment.clusterId,
          clusterName: clusteringResult.clusters.find(c => c.id === assignment.clusterId)?.clusterName,
          confidence: assignment.confidence,
          distanceToCenter: assignment.distanceToCenter
        })),
        insights: clusteringResult.insights,
        featureImportance: this.calculateFeatureImportance(clusteringResult.clusters)
      };
      
      return {
        success: true,
        data: exportData,
        message: 'Clustering data exported successfully',
        downloadFileName: `clustering_analysis_survey_${surveyId}_${new Date().toISOString().split('T')[0]}.json`
      };
    } catch (error) {
      console.error('❌ Error exporting clustering data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper method to generate cluster-specific insights
   */
  private generateClusterSpecificInsights(cluster: any): string[] {
    const insights: string[] = [];
    const profile = cluster.profile;
    
    // Performance insights
    if (profile.avgTechnicalAptitude > 0.8) {
      insights.push('This cluster shows exceptional technical aptitude');
    } else if (profile.avgTechnicalAptitude < 0.4) {
      insights.push('This cluster may benefit from additional technical support');
    }
    
    // Behavioral insights
    if (profile.avgSystematicIndex > 0.7) {
      insights.push('Members prefer systematic, methodical approaches');
    } else if (profile.avgSystematicIndex < 0.4) {
      insights.push('Members tend to use exploratory, trial-and-error approaches');
    }
    
    // Speed vs accuracy trade-off
    const speedAccuracyRatio = profile.avgSpeedIndex / (profile.avgPrecisionIndex || 0.1);
    if (speedAccuracyRatio > 1.5) {
      insights.push('Speed-focused group - prioritizes completion time over precision');
    } else if (speedAccuracyRatio < 0.7) {
      insights.push('Accuracy-focused group - prioritizes precision over speed');
    }
    
    // Confidence insights
    if (profile.avgConfidenceIndex > 0.7) {
      insights.push('High-confidence users who start quickly and decisively');
    } else if (profile.avgConfidenceIndex < 0.4) {
      insights.push('Lower-confidence users who may need encouragement and guidance');
    }
    
    return insights;
  }

  /**
   * Generate explanation for why a participant was assigned to a cluster
   */
  private generateAssignmentExplanation(assignment: any, cluster: any): string {
    const confidence = assignment.confidence;
    const distance = assignment.distanceToCenter;
    
    let explanation = `This participant was assigned to "${cluster.clusterName}" `;
    
    if (confidence > 0.8) {
      explanation += 'with high confidence. ';
    } else if (confidence > 0.6) {
      explanation += 'with moderate confidence. ';
    } else {
      explanation += 'with lower confidence - they may exhibit mixed characteristics. ';
    }
    
    if (distance < 0.3) {
      explanation += 'Their behavioral pattern closely matches the cluster center.';
    } else if (distance < 0.6) {
      explanation += 'Their behavioral pattern moderately matches the cluster center.';
    } else {
      explanation += 'Their behavioral pattern shows some variation from the typical cluster member.';
    }
    
    return explanation;
  }

  /**
   * Generate insights for cross-survey analysis
   */
  private generateCrossSurveyInsights(clusteringResult: any): string[] {
    const insights: string[] = [];
    
    // Cluster consistency insights
    const clusterCount = clusteringResult.clusters.length;
    insights.push(`Cross-survey analysis identified ${clusterCount} distinct behavioral patterns`);
    
    // Quality insights
    const silhouette = clusteringResult.metadata.silhouetteScore;
    if (silhouette > 0.5) {
      insights.push('High clustering quality - behavioral groups are well-separated');
    } else if (silhouette > 0.3) {
      insights.push('Moderate clustering quality - some behavioral overlap between groups');
    } else {
      insights.push('Lower clustering quality - participants show diverse, overlapping behaviors');
    }
    
    // Demographic insights
    const techClusters = clusteringResult.clusters.filter(c => 
      c.demographicProfile.occupationDistribution?.tech > c.memberCount * 0.3
    );
    
    if (techClusters.length > 0) {
      insights.push(`${techClusters.length} cluster(s) are dominated by technical professionals`);
    }
    
    return insights;
  }

  /**
   * Generate comparison summary across surveys
   */
  private generateComparisonSummary(comparisons: SurveyComparison[]): any {
    const validComparisons = comparisons.filter(c => !c.error);
    
    if (validComparisons.length === 0) {
      return { message: 'No valid clustering results to compare' };
    }
    
    const avgParticipants = this.calculateAverage(validComparisons.map(c => c.totalParticipants || 0));
    const avgClusterCount = this.calculateAverage(validComparisons.map(c => c.clusterCount || 0));
    const avgSilhouette = this.calculateAverage(validComparisons.map(c => c.silhouetteScore || 0).filter(s => s > 0));
    
    return {
      totalSurveys: validComparisons.length,
      avgParticipantsPerSurvey: Math.round(avgParticipants),
      avgClustersPerSurvey: Math.round(avgClusterCount),
      avgClusteringQuality: avgSilhouette ? avgSilhouette.toFixed(3) : 'N/A',
      consistencyScore: this.calculateConsistencyScore(validComparisons)
    };
  }

  /**
   * Calculate feature importance for clustering
   */
  private calculateFeatureImportance(clusters: any[]): any {
    const featureNames = [
      'Speed Index', 'Precision Index', 'Efficiency Index',
      'Confidence Index', 'Systematic Index', 'Persistence Index',
      'Adaptability Index', 'Exploration Index', 'Planning Index',
      'Recovery Index', 'Impulsivity Index', 'Frustration Tolerance',
      'Technical Aptitude'
    ];
    
    // Calculate variance for each feature across clusters
    const featureVariances = featureNames.map((name, index) => {
      const values = clusters.map(cluster => cluster.centroid[index] || 0);
      const mean = this.calculateAverage(values);
      const variance = this.calculateAverage(values.map(v => Math.pow(v - mean, 2)));
      
      return {
        feature: name,
        variance: variance,
        importance: variance // Simplified importance measure
      };
    });
    
    // Sort by importance
    featureVariances.sort((a, b) => b.importance - a.importance);
    
    return featureVariances.map((item, index) => ({
      rank: index + 1,
      feature: item.feature,
      importance: item.importance.toFixed(4),
      relativeImportance: ((item.importance / featureVariances[0].importance) * 100).toFixed(1) + '%'
    }));
  }

  /**
   * Calculate consistency score across surveys
   */
  private calculateConsistencyScore(comparisons: SurveyComparison[]): string {
    // Simple consistency measure based on cluster count variance
    const clusterCounts = comparisons.map(c => c.clusterCount || 0);
    const mean = this.calculateAverage(clusterCounts);
    const variance = this.calculateAverage(clusterCounts.map(c => Math.pow(c - mean, 2)));
    const consistency = Math.max(0, 1 - (variance / mean));
    
    return (consistency * 100).toFixed(1) + '%';
  }

  /**
   * Helper method to calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
  }

  
}