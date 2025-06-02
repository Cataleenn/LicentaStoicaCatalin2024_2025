// Response Controller with Enhanced Debug - backend/src/survey/response.controller.ts
import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ResponseService } from './response.service';
import { EnhancedResponseService } from './enhanced-response.service';
import { CreateResponseDto } from './create-response.dto';
import { AdminGuard } from '../admin/admin.guard';

@Controller('responses')
export class ResponseController {
  constructor(
    private readonly responseService: ResponseService,
    private readonly enhancedResponseService: EnhancedResponseService
  ) {}

  /**
   * Submit a new response with ENHANCED DEBUG
   */
  @Post()
  async submitResponse(@Body() dto: CreateResponseDto) {
    console.log('\n🔥 === RESPONSE SUBMISSION DEBUG ===');
    console.log('📦 FULL DTO:', JSON.stringify(dto, null, 2));
    console.log('📝 DTO Type:', typeof dto);
    console.log('📋 DTO Keys:', Object.keys(dto));
    
    if (dto.answers) {
      console.log('\n📊 ANSWERS DETAILED ANALYSIS:');
      console.log('📝 Answers Type:', typeof dto.answers);
      console.log('📋 Answers Keys:', Object.keys(dto.answers));
      console.log('🔢 Answers Count:', Object.keys(dto.answers).length);
      
      // Analizează fiecare răspuns în detaliu
      Object.entries(dto.answers).forEach(([key, value], index) => {
        console.log(`\n🔍 Answer ${index + 1} - Key: "${key}"`);
        console.log(`   Raw Value: ${JSON.stringify(value)}`);
        console.log(`   Value Type: ${typeof value}`);
        console.log(`   Is Array: ${Array.isArray(value)}`);
        console.log(`   Is Empty: ${!value || value === '' || (Array.isArray(value) && value.length === 0)}`);
        console.log(`   String Length: ${typeof value === 'string' ? value.length : 'N/A'}`);
        
        if (Array.isArray(value)) {
          console.log(`   Array Length: ${value.length}`);
          if (value.length > 0) {
            console.log(`   First Element: ${JSON.stringify(value[0])}`);
            console.log(`   First Element Type: ${typeof value[0]}`);
          }
        }
      });
    }

    console.log('\n🏗️ Starting response processing...');

    try {
      // Use enhanced response service for full behavioral analysis
      console.log('🔬 Attempting Enhanced Response Service...');
      const savedResponse = await this.enhancedResponseService.saveEnhancedResponse(dto);
      
      console.log('\n✅ === RESPONSE SAVED SUCCESSFULLY ===');
      console.log('🆔 Response ID:', savedResponse.id);
      console.log('📊 Final Demographic Profile:', JSON.stringify(savedResponse.demographicProfile, null, 2));
      console.log('🧠 Final Behavioral Profile:', JSON.stringify(savedResponse.behavioralProfile, null, 2));
      console.log('📈 Has Computed Metrics:', !!savedResponse.computedMetrics);
      
      if (savedResponse.computedMetrics) {
        console.log('📈 Sample Metrics:', {
          speedIndex: savedResponse.computedMetrics.speedIndex,
          precisionIndex: savedResponse.computedMetrics.precisionIndex,
          technicalAptitude: savedResponse.computedMetrics.technicalAptitude
        });
      }

      return {
        success: true,
        message: 'Response submitted and analyzed successfully',
        responseId: savedResponse.id,
        debug: {
          originalAnswersCount: Object.keys(dto.answers || {}).length,
          savedDemographicProfile: savedResponse.demographicProfile,
          savedBehavioralProfile: savedResponse.behavioralProfile,
          hasComputedMetrics: !!savedResponse.computedMetrics
        },
        behavioralMetrics: savedResponse.computedMetrics ? {
          technicalAptitude: savedResponse.computedMetrics.technicalAptitude,
          speedIndex: savedResponse.computedMetrics.speedIndex,
          precisionIndex: savedResponse.computedMetrics.precisionIndex
        } : null
      };
    } catch (enhancedError) {
      console.error('❌ Enhanced Response Service FAILED:', enhancedError);
      console.log('📝 Enhanced Error Details:', {
        message: enhancedError.message,
        stack: enhancedError.stack?.split('\n').slice(0, 5)
      });
      
      // Fallback to basic response service
      console.log('\n⚠️ Falling back to basic response service...');
      try {
        const basicResponse = await this.responseService.saveResponse(dto);
        
        console.log('✅ Basic response saved with ID:', basicResponse.id);
        console.log('📊 Basic Demographic Profile:', JSON.stringify(basicResponse.demographicProfile, null, 2));
        console.log('🧠 Basic Behavioral Profile:', JSON.stringify(basicResponse.behavioralProfile, null, 2));
        
        return {
          success: true,
          message: 'Response submitted with basic processing (enhanced failed)',
          responseId: basicResponse.id,
          warning: 'Enhanced behavioral analysis failed, used basic processing',
          debug: {
            enhancedServiceError: enhancedError.message,
            basicServiceUsed: true,
            savedDemographicProfile: basicResponse.demographicProfile,
            savedBehavioralProfile: basicResponse.behavioralProfile
          }
        };
      } catch (fallbackError) {
        console.error('❌ Even basic response processing failed:', fallbackError);
        return {
          success: false,
          error: fallbackError.message,
          message: 'Failed to save response with both enhanced and basic services',
          debug: {
            enhancedServiceError: enhancedError.message,
            basicServiceError: fallbackError.message,
            originalAnswers: dto.answers
          }
        };
      }
    }
  }

  /**
   * Recompute metrics for existing responses in a survey
   */
  @Post('recompute-metrics/:surveyId')
  @UseGuards(AdminGuard)
  async recomputeMetrics(@Param('surveyId') surveyId: number) {
    console.log(`⚙️ Starting metrics recomputation for survey ${surveyId}`);
    
    try {
      const result = await this.enhancedResponseService.recomputeMetricsForSurvey(surveyId);
      
      return {
        success: result.success,
        message: result.message,
        data: {
          processedCount: result.processedCount,
          surveyId: surveyId
        }
      };
    } catch (error) {
      console.error('❌ Error during metrics recomputation:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to recompute metrics'
      };
    }
  }

  /**
   * Get enhanced analytics for a survey (admin only)
   */
  @Get('analytics/survey/:id')
  @UseGuards(AdminGuard)
  async getSurveyAnalytics(@Param('id') surveyId: number) {
    console.log(`📊 Generating analytics for survey ${surveyId}`);
    
    try {
      const analytics = await this.enhancedResponseService.getEnhancedSurveyAnalytics(surveyId);
      
      return {
        success: true,
        data: analytics,
        message: 'Analytics generated successfully'
      };
    } catch (error) {
      console.error('❌ Error generating analytics:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to generate analytics'
      };
    }
  }

  /**
   * Debug endpoint - get last response details
   */
  @Get('debug/last/:count')
  @UseGuards(AdminGuard)
  async getLastResponsesDebug(@Param('count') count: number = 1) {
    console.log(`🔍 Getting debug info for last ${count} responses`);
    
    try {
      const service = this.responseService as any;
      const responses = await service.responseRepo.find({
        order: { createdAt: 'DESC' },
        take: count,
        relations: ['survey']
      });

      const debugInfo = responses.map(response => ({
        id: response.id,
        userId: response.userId,
        surveyId: response.survey?.id,
        createdAt: response.createdAt,
        isComplete: response.isComplete,
        rawAnswers: response.answers,
        answersAnalysis: {
          totalAnswers: response.answers ? Object.keys(response.answers).length : 0,
          answerKeys: response.answers ? Object.keys(response.answers) : [],
          sampleAnswers: response.answers ? 
            Object.entries(response.answers).slice(0, 3).map(([key, value]) => ({
              key,
              value,
              type: typeof value,
              isArray: Array.isArray(value)
            })) : []
        },
        profiles: {
          demographic: response.demographicProfile,
          behavioral: response.behavioralProfile,
          hasComputedMetrics: !!response.computedMetrics
        },
        assembly: {
          hasAssemblyData: !!response.assembly,
          assemblyKeys: response.assembly ? Object.keys(response.assembly) : []
        }
      }));

      return {
        success: true,
        data: debugInfo,
        summary: {
          responsesFound: responses.length,
          totalWithProfiles: debugInfo.filter(r => r.profiles.demographic || r.profiles.behavioral).length,
          totalWithAnswers: debugInfo.filter(r => r.answersAnalysis.totalAnswers > 0).length
        }
      };
    } catch (error) {
      console.error('❌ Error getting debug info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test mapping endpoint
   */
  @Post('test-mapping')
  @UseGuards(AdminGuard)
  async testMapping(@Body() body: { answers: Record<string, any> }) {
    console.log('\n🧪 === TESTING MAPPING ===');
    console.log('📝 Input:', JSON.stringify(body.answers, null, 2));

    try {
      // Test cu enhanced service
      const service = this.enhancedResponseService as any;
      const demographicProfile = service.extractDemographicProfile(body.answers);
      const behavioralProfile = service.extractBehavioralProfile(body.answers);

      console.log('📊 Mapped demographic:', JSON.stringify(demographicProfile, null, 2));
      console.log('🧠 Mapped behavioral:', JSON.stringify(behavioralProfile, null, 2));

      return {
        success: true,
        input: body.answers,
        results: {
          demographic: demographicProfile,
          behavioral: behavioralProfile
        },
        message: 'Mapping test completed - check console logs'
      };
    } catch (error) {
      console.error('❌ Mapping test failed:', error);
      return {
        success: false,
        error: error.message,
        input: body.answers
      };
    }
  }
}

/* INSTRUCȚIUNI PENTRU DEBUGGING:

1. Trimite un răspuns din frontend și urmărește consolele backend
2. Verifică ultimul răspuns salvat:
   GET /api/responses/debug/last/1

3. Testează maparea direct:
   POST /api/responses/test-mapping
   {
     "answers": {
       "1": "22 de ani",
       "2": "Masculin"
     }
   }

4. Sau folosește simple-debug controller:
   POST /api/simple-debug/check-raw-data cu exact datele din frontend

5. Recompută toate răspunsurile:
   POST /api/responses/recompute-metrics/1
*/