// Fixed Clustering Controller - backend/src/clustering/clustering.controller.ts
import { Controller, Get, Post, Param, UseGuards, Query, Body } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { ClusteringService } from './clustering.service';
import { EnhancedResponseService } from '../survey/enhanced-response.service';

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
    private readonly clusteringService: ClusteringService,
    private readonly enhancedResponseService: EnhancedResponseService
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
   * Helper methods
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
    
    return insights;
  }

  private generateAssignmentExplanation(assignment: any, cluster: any): string {
    const confidence = assignment.confidence;
    
    let explanation = `This participant was assigned to "${cluster.clusterName}" `;
    
    if (confidence > 0.8) {
      explanation += 'with high confidence. ';
    } else if (confidence > 0.6) {
      explanation += 'with moderate confidence. ';
    } else {
      explanation += 'with lower confidence - they may exhibit mixed characteristics. ';
    }
    
    return explanation;
  }

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
    
    return insights;
  }

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
        importance: variance
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

  private calculateConsistencyScore(comparisons: SurveyComparison[]): string {
    const clusterCounts = comparisons.map(c => c.clusterCount || 0);
    const mean = this.calculateAverage(clusterCounts);
    const variance = this.calculateAverage(clusterCounts.map(c => Math.pow(c - mean, 2)));
    const consistency = Math.max(0, 1 - (variance / mean));
    
    return (consistency * 100).toFixed(1) + '%';
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
  }
  @Post('survey/:id/analyze-optimized')
  async performOptimizedClusteringAnalysis(
    @Param('id') surveyId: number,
    @Body() options?: { 
      forcedK?: number;
      maxIterations?: number;
      qualityThreshold?: number;
    }
  ) {
    console.log(`🚀 Starting OPTIMIZED clustering analysis for survey ${surveyId}`);
    
    const startTime = Date.now();
    const maxIterations = options?.maxIterations || 3;
    const qualityThreshold = options?.qualityThreshold || 0.5;
    
    try {
      let bestResult: any = null;
      let bestQualityScore = -1;
      const optimizationLog: Array<{
        iteration: number;
        action: string;
        qualityScore: number;
        clusterCount: number;
        duration: number;
      }> = [];

      // ========================
      // ITERATION 1: Analiza cu datele existente
      // ========================
      console.log('🔄 Iteration 1: Analyzing with existing data...');
      const iter1Start = Date.now();
      
      try {
        const result1 = await this.clusteringService.performClustering(surveyId, options?.forcedK);
        const quality1 = result1.metadata.silhouetteScore;
        
        optimizationLog.push({
          iteration: 1,
          action: 'existing_data',
          qualityScore: quality1,
          clusterCount: result1.clusters.length,
          duration: Date.now() - iter1Start
        });

        if (quality1 > bestQualityScore) {
          bestResult = result1;
          bestQualityScore = quality1;
        }

        console.log(`✅ Iteration 1 completed: Quality = ${quality1.toFixed(3)}`);
      } catch (error) {
        console.log(`⚠️ Iteration 1 failed: ${error.message}`);
        optimizationLog.push({
          iteration: 1,
          action: 'existing_data_failed',
          qualityScore: 0,
          clusterCount: 0,
          duration: Date.now() - iter1Start
        });
      }

      // ========================
      // ITERATION 2: Recompute metrics + clustering
      // ========================
      if (maxIterations >= 2) {
        console.log('🔄 Iteration 2: Recomputing metrics and re-clustering...');
        const iter2Start = Date.now();
        
        try {
          // Recompute metrics with FIXED categories
          console.log('🔧 Step 2a: Recomputing metrics with FIXED categories...');
          const metricsResult = await this.enhancedResponseService.recomputeMetricsForSurvey(surveyId);
          
          if (metricsResult.success) {
            console.log(`✅ Metrics recomputed for ${metricsResult.processedCount} responses`);
            
            // Re-run clustering with improved data
            console.log('🔧 Step 2b: Re-running clustering with improved data...');
            const result2 = await this.clusteringService.performClustering(surveyId, options?.forcedK);
            const quality2 = result2.metadata.silhouetteScore;
            
            optimizationLog.push({
              iteration: 2,
              action: 'recomputed_metrics',
              qualityScore: quality2,
              clusterCount: result2.clusters.length,
              duration: Date.now() - iter2Start
            });

            if (quality2 > bestQualityScore) {
              bestResult = result2;
              bestQualityScore = quality2;
            }

            console.log(`✅ Iteration 2 completed: Quality = ${quality2.toFixed(3)} (improvement: ${(quality2 - (optimizationLog[0]?.qualityScore || 0)).toFixed(3)})`);
          }
        } catch (error) {
          console.log(`⚠️ Iteration 2 failed: ${error.message}`);
          optimizationLog.push({
            iteration: 2,
            action: 'recompute_failed',
            qualityScore: bestQualityScore,
            clusterCount: bestResult?.clusters?.length || 0,
            duration: Date.now() - iter2Start
          });
        }
      }

      // ========================
      // ITERATION 3: Try different K values if quality is still low
      // ========================
      if (maxIterations >= 3 && bestQualityScore < qualityThreshold && !options?.forcedK) {
        console.log('🔄 Iteration 3: Trying different cluster counts for better quality...');
        const iter3Start = Date.now();
        
        try {
          const kValues = [2, 3, 4, 5, 6]; // Different K values to try
          let bestK = bestResult?.clusters?.length || 3;
          
          for (const k of kValues) {
            if (k === bestK) continue; // Skip already tested K
            
            console.log(`🔧 Testing with K=${k}...`);
            const resultK = await this.clusteringService.performClustering(surveyId, k);
            const qualityK = resultK.metadata.silhouetteScore;
            
            console.log(`  K=${k} → Quality = ${qualityK.toFixed(3)}`);
            
            if (qualityK > bestQualityScore) {
              bestResult = resultK;
              bestQualityScore = qualityK;
              bestK = k;
            }
          }
          
          optimizationLog.push({
            iteration: 3,
            action: `k_optimization_best_k_${bestK}`,
            qualityScore: bestQualityScore,
            clusterCount: bestResult.clusters.length,
            duration: Date.now() - iter3Start
          });

          console.log(`✅ Iteration 3 completed: Best K = ${bestK}, Quality = ${bestQualityScore.toFixed(3)}`);
        } catch (error) {
          console.log(`⚠️ Iteration 3 failed: ${error.message}`);
          optimizationLog.push({
            iteration: 3,
            action: 'k_optimization_failed',
            qualityScore: bestQualityScore,
            clusterCount: bestResult?.clusters?.length || 0,
            duration: Date.now() - iter3Start
          });
        }
      }

      // ========================
      // FINALIZATION
      // ========================
      const totalDuration = Date.now() - startTime;
      
      if (!bestResult) {
        throw new Error('All optimization iterations failed');
      }

      // Calculate improvement
      const initialQuality = optimizationLog[0]?.qualityScore || 0;
      const finalQuality = bestQualityScore;
      const improvement = ((finalQuality - initialQuality) / Math.max(initialQuality, 0.001)) * 100;

      console.log(`🎯 OPTIMIZATION COMPLETED:`);
      console.log(`   Initial Quality: ${initialQuality.toFixed(3)}`);
      console.log(`   Final Quality: ${finalQuality.toFixed(3)}`);
      console.log(`   Improvement: ${improvement.toFixed(1)}%`);
      console.log(`   Total Duration: ${totalDuration}ms`);
      console.log(`   Iterations: ${optimizationLog.length}`);

      return {
        success: true,
        data: {
          ...bestResult,
          optimization: {
            iterations: optimizationLog,
            totalDuration,
            qualityImprovement: improvement,
            finalQualityScore: finalQuality,
            initialQualityScore: initialQuality,
            optimizationSummary: this.generateOptimizationSummary(optimizationLog, improvement)
          }
        },
        message: `Optimized clustering completed with ${improvement.toFixed(1)}% quality improvement`,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error performing optimized clustering analysis:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to perform optimized clustering analysis'
      };
    }
  }

  /**
   * Generate optimization summary for user
   */
  private generateOptimizationSummary(
    optimizationLog: any[], 
    improvement: number
  ): string {
    const iterationCount = optimizationLog.length;
    const finalQuality = optimizationLog[optimizationLog.length - 1]?.qualityScore || 0;
    
    let summary = `Analiza optimizată completă în ${iterationCount} iterații. `;
    
    if (improvement > 20) {
      summary += `Îmbunătățire SEMNIFICATIVĂ a calității cu ${improvement.toFixed(1)}%. `;
    } else if (improvement > 5) {
      summary += `Îmbunătățire moderată a calității cu ${improvement.toFixed(1)}%. `;
    } else if (improvement > 0) {
      summary += `Îmbunătățire mică a calității cu ${improvement.toFixed(1)}%. `;
    } else {
      summary += `Calitatea inițială era deja optimă. `;
    }
    
    if (finalQuality > 0.7) {
      summary += `Rezultat final: calitate EXCELENTĂ (${(finalQuality * 100).toFixed(1)}%).`;
    } else if (finalQuality > 0.5) {
      summary += `Rezultat final: calitate BUNĂ (${(finalQuality * 100).toFixed(1)}%).`;
    } else if (finalQuality > 0.3) {
      summary += `Rezultat final: calitate ACCEPTABILĂ (${(finalQuality * 100).toFixed(1)}%).`;
    } else {
      summary += `Rezultat final: calitate SCĂZUTĂ (${(finalQuality * 100).toFixed(1)}%) - datele pot fi prea omogene pentru clustering.`;
    }
    
    return summary;
  }
}