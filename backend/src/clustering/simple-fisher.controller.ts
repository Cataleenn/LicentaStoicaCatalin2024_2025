
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { SimpleFisherService, SimpleQuestionResult, ClusterQuestionAnalysis, AllClustersAnalysis } from './simple-fisher.service';

@Controller('fisher-test')
@UseGuards(AdminGuard)
export class SimpleFisherController {
  constructor(
    private readonly fisherService: SimpleFisherService
  ) {}

  @Get('survey/:id/cluster/:clusterId')
  async getClusterSignificantQuestions(
    @Param('id') surveyId: number,
    @Param('clusterId') clusterId: number
  ): Promise<{
    success: boolean;
    data?: ClusterQuestionAnalysis;
    error?: string;
    message: string;
  }> {
    console.log(`🔬 Fisher test for cluster ${clusterId} in survey ${surveyId}`);
    
    try {
      const result = await this.fisherService.getSignificantQuestionsForCluster(surveyId, clusterId);
      
      return {
        success: true,
        data: result,
        message: `Found ${result.significantQuestions.length} significant questions for cluster ${clusterId}`
      };
    } catch (error) {
      console.error('❌ Error in Fisher test:', error);
      return {
        success: false,
        error: error.message,
        message: 'Fisher test failed'
      };
    }
  }


  @Get('survey/:id/all-clusters')
  async getAllClustersSignificantQuestions(@Param('id') surveyId: number): Promise<{
    success: boolean;
    data?: AllClustersAnalysis;
    summary?: {
      totalClusters: number;
      totalSignificantQuestions: number;
      avgSignificantPerCluster: number;
    };
    error?: string;
    message: string;
  }> {
    console.log(`🔬 Fisher test for all clusters in survey ${surveyId}`);
    
    try {
      const result = await this.fisherService.getAllClustersSignificantQuestions(surveyId);
      
      const totalSignificantQuestions = result.clusters.reduce(
        (sum, cluster) => sum + cluster.significantQuestions.length, 
        0
      );
      
      return {
        success: true,
        data: result,
        summary: {
          totalClusters: result.clusters.length,
          totalSignificantQuestions,
          avgSignificantPerCluster: totalSignificantQuestions / result.clusters.length
        },
        message: `Fisher analysis completed for ${result.clusters.length} clusters`
      };
    } catch (error) {
      console.error('❌ Error in Fisher test for all clusters:', error);
      return {
        success: false,
        error: error.message,
        message: 'Fisher test failed for all clusters'
      };
    }
  }


  @Get('survey/:id/summary')
  async getFisherTestSummary(@Param('id') surveyId: number): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    message: string;
  }> {
    console.log(`📊 Fisher test summary for survey ${surveyId}`);
    
    try {
      const allClustersResult = await this.fisherService.getAllClustersSignificantQuestions(surveyId);
      
      const allQuestions: Array<{
        clusterId: number;
        questionNumber: string;
        questionText: string;
        answerValue: string;
        pValue: number;
        isSignificant: boolean;
        explanation: string;
      }> = [];
      
      allClustersResult.clusters.forEach(cluster => {
        cluster.significantQuestions.forEach(q => {
          allQuestions.push({
            clusterId: cluster.clusterId,
            ...q
          });
        });
      });
      
     
      allQuestions.sort((a, b) => a.pValue - b.pValue);
      
    
      const topQuestions = allQuestions.slice(0, 10);
      
   
      const summary = {
        totalClusters: allClustersResult.clusters.length,
        totalSignificantQuestions: allQuestions.length,
        mostSignificantQuestions: topQuestions,
        questionImportanceRanking: this.calculateQuestionImportance(allQuestions)
      };
      
      return {
        success: true,
        data: summary,
        message: `Fisher test summary generated for survey ${surveyId}`
      };
    } catch (error) {
      console.error('❌ Error generating Fisher test summary:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate Fisher test summary'
      };
    }
  }


  private calculateQuestionImportance(allQuestions: any[]): Array<{
    questionNumber: string;
    questionText: string;
    timesSignificant: number;
    avgPValue: number;
    importance: 'high' | 'medium' | 'low';
  }> {
    const questionStats: Record<string, {
      questionText: string;
      pValues: number[];
      count: number;
    }> = {};
    
 
    allQuestions.forEach(q => {
      if (!questionStats[q.questionNumber]) {
        questionStats[q.questionNumber] = {
          questionText: q.questionText,
          pValues: [],
          count: 0
        };
      }
      questionStats[q.questionNumber].pValues.push(q.pValue);
      questionStats[q.questionNumber].count++;
    });
    

    const questionImportance = Object.entries(questionStats).map(([questionNumber, stats]) => {
      const avgPValue = stats.pValues.reduce((sum, p) => sum + p, 0) / stats.pValues.length;
      
      let importance: 'high' | 'medium' | 'low' = 'low';
      if (stats.count >= 3 && avgPValue < 0.01) {
        importance = 'high';
      } else if (stats.count >= 2 && avgPValue < 0.05) {
        importance = 'medium';
      }
      
      return {
        questionNumber,
        questionText: stats.questionText,
        timesSignificant: stats.count,
        avgPValue,
        importance
      };
    });
    
  
    questionImportance.sort((a, b) => {
    
      if (a.timesSignificant !== b.timesSignificant) {
        return b.timesSignificant - a.timesSignificant;
      }
      return a.avgPValue - b.avgPValue;
    });
    
    return questionImportance.slice(0, 5); 
  }
}