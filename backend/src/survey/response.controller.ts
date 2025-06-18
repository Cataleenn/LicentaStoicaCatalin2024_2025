// Updated Response Controller - backend/src/survey/response.controller.ts
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

  @Post()
  async submitResponse(@Body() dto: CreateResponseDto) {
    console.log('\n🔥 === RESPONSE SUBMISSION WITH FIXED CATEGORIES ===');
    console.log('📦 FULL DTO:', JSON.stringify(dto, null, 2));

    try {
      // Use enhanced response service with FIXED categories
      console.log('🔬 Using Enhanced Response Service with FIXED categories...');
      const savedResponse = await this.enhancedResponseService.saveEnhancedResponse(dto);
      console.log('\n✅ === RESPONSE SAVED WITH FIXED CATEGORIES ===');
      console.log('🆔 Response ID:', savedResponse.id);
      console.log('📊 FIXED Demographic Profile:', JSON.stringify(savedResponse.demographicProfile, null, 2));
      console.log('🧠 FIXED Behavioral Profile:', JSON.stringify(savedResponse.behavioralProfile, null, 2));
      return {
        success: true,
        message: 'Response submitted with FIXED categories successfully',
        responseId: savedResponse.id,
        debug: {
          fixedCategories: true,
          demographicProfile: savedResponse.demographicProfile,
          behavioralProfile: savedResponse.behavioralProfile,
          hasComputedMetrics: !!savedResponse.computedMetrics
        }
      };
    } catch (enhancedError) {
      console.error('❌ Enhanced Response Service FAILED:', enhancedError);
      
      // Fallback to basic response service
      console.log('\n⚠️ Falling back to basic response service...');
      try {
        const basicResponse = await this.responseService.saveResponse(dto);
        
        return {
          success: true,
          message: 'Response submitted with basic processing (enhanced failed)',
          responseId: basicResponse.id,
          warning: 'Enhanced behavioral analysis failed, used basic processing',
          debug: {
            enhancedServiceError: enhancedError.message,
            basicServiceUsed: true,
            demographicProfile: basicResponse.demographicProfile,
            behavioralProfile: basicResponse.behavioralProfile
          }
        };
      } catch (fallbackError) {
        console.error('❌ Even basic response processing failed:', fallbackError);
        return {
          success: false,
          error: fallbackError.message,
          message: 'Failed to save response with both enhanced and basic services'
        };
      }
    }
  }

  /**
   * ✅ NEW ENDPOINT: Recompute ALL responses with FIXED categories
   */
  @Post('fix-all-categories')
  @UseGuards(AdminGuard)
  async fixAllCategoriesWithConsistentMapping() {
    console.log('🔧 Starting COMPLETE category fix for ALL responses...');
    
    try {
      const result = await this.enhancedResponseService.recomputeAllResponsesWithFixedCategories();
      
      return {
        success: result.success,
        message: result.message,
        data: {
          processedCount: result.processedCount,
          categoriesFixed: result.categoriesFixed,
          fixPercentage: result.processedCount > 0 ? 
            ((result.categoriesFixed / result.processedCount) * 100).toFixed(1) + '%' : '0%'
        },
        recommendation: result.categoriesFixed > 0 ? 
          'Categories have been fixed! You should now run clustering analysis again to get consistent results.' :
          'All categories were already consistent. No changes needed.'
      };
    } catch (error) {
      console.error('❌ Error during complete category fix:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to fix categories for all responses'
      };
    }
  }

  /**
   * Recompute metrics for existing responses in a survey
   */
  @Post('recompute-metrics/:surveyId')
  @UseGuards(AdminGuard)
  async recomputeMetrics(@Param('surveyId') surveyId: number) {
    console.log(`⚙️ Starting metrics recomputation for survey ${surveyId} with FIXED categories`);
    
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
        createdAt: response.createdAt,
        surveyId: response.survey?.id,
        isComplete: response.isComplete,
        rawAnswers: response.answers,
        demographicProfile: response.demographicProfile,
        behavioralProfile: response.behavioralProfile,
        hasComputedMetrics: !!response.computedMetrics,
        hasAssembly: !!response.assembly,
        analysis: {
          answersCount: response.answers ? Object.keys(response.answers).length : 0,
          answersKeys: response.answers ? Object.keys(response.answers) : [],
          firstThreeAnswers: response.answers ? 
            Object.entries(response.answers).slice(0, 3).map(([key, value]) => ({
              key, 
              value, 
              type: typeof value,
              processed: typeof value === 'string' ? value.toLowerCase().trim() : String(value)
            })) : []
        }
      }));

      return {
        success: true,
        responsesFound: responses.length,
        debugInfo,
        message: `Last ${count} responses analyzed - check console for details`
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
   * ✅ NEW: Check category consistency across all responses
   */
  @Get('debug/category-consistency')
  @UseGuards(AdminGuard)
  async checkCategoryConsistency() {
    console.log('🔍 Checking category consistency across all responses...');
    
    try {
      const service = this.responseService as any;
      const responses = await service.responseRepo.find({
        where: { isComplete: true },
        select: ['id', 'demographicProfile', 'behavioralProfile']
      });

      const demographicCategories = {
        ageGroups: new Set<string>(),
        genders: new Set<string>(),
        educationLevels: new Set<string>(),
        occupations: new Set<string>(),
        stemLevels: new Set<string>()
      };

      const behavioralCategories = {
        problemSolvingStyles: new Set<string>(),
        techComfortLevels: new Set<string>(),
        assemblyExperience: new Set<string>(),
        errorHandlingStyles: new Set<string>(),
        gamingFrequencies: new Set<string>()
      };

      responses.forEach(response => {
        if (response.demographicProfile) {
          const demo = response.demographicProfile;
          if (demo.ageGroup) demographicCategories.ageGroups.add(demo.ageGroup);
          if (demo.gender) demographicCategories.genders.add(demo.gender);
          if (demo.educationLevel) demographicCategories.educationLevels.add(demo.educationLevel);
          if (demo.occupation) demographicCategories.occupations.add(demo.occupation);
          if (demo.stemFamiliarity) demographicCategories.stemLevels.add(demo.stemFamiliarity);
        }

        if (response.behavioralProfile) {
          const behav = response.behavioralProfile;
          if (behav.problemSolvingStyle) behavioralCategories.problemSolvingStyles.add(behav.problemSolvingStyle);
          if (behav.techComfort) behavioralCategories.techComfortLevels.add(behav.techComfort);
          if (behav.assemblyExperience) behavioralCategories.assemblyExperience.add(behav.assemblyExperience);
          if (behav.errorHandlingStyle) behavioralCategories.errorHandlingStyles.add(behav.errorHandlingStyle);
          if (behav.gamingFrequency) behavioralCategories.gamingFrequencies.add(behav.gamingFrequency);
        }
      });

      const consistencyReport = {
        totalResponses: responses.length,
        demographicCategories: {
          ageGroups: Array.from(demographicCategories.ageGroups).sort(),
          genders: Array.from(demographicCategories.genders).sort(),
          educationLevels: Array.from(demographicCategories.educationLevels).sort(),
          occupations: Array.from(demographicCategories.occupations).sort(),
          stemLevels: Array.from(demographicCategories.stemLevels).sort()
        },
        behavioralCategories: {
          problemSolvingStyles: Array.from(behavioralCategories.problemSolvingStyles).sort(),
          techComfortLevels: Array.from(behavioralCategories.techComfortLevels).sort(),
          assemblyExperience: Array.from(behavioralCategories.assemblyExperience).sort(),
          errorHandlingStyles: Array.from(behavioralCategories.errorHandlingStyles).sort(),
          gamingFrequencies: Array.from(behavioralCategories.gamingFrequencies).sort()
        }
      };

      return {
        success: true,
        data: consistencyReport,
        summary: {
          totalDemographicVariations: Object.values(consistencyReport.demographicCategories)
            .reduce((sum, categories) => sum + categories.length, 0),
          totalBehavioralVariations: Object.values(consistencyReport.behavioralCategories)
            .reduce((sum, categories) => sum + categories.length, 0)
        },
        recommendation: 'If you see unexpected categories or variations, use the fix-all-categories endpoint to standardize them.'
      };
    } catch (error) {
      console.error('❌ Error checking category consistency:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}