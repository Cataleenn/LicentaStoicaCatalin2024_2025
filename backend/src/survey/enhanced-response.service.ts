// COMPLETE FIXED Enhanced Response Service - backend/src/survey/enhanced-response.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Response } from './response.entity';
import { Survey } from './survey.entity';
import { CreateResponseDto } from './create-response.dto';
import { 
  FeatureEngineeringService, 
  RawAssemblyData, 
  BehavioralProfile, 
  DemographicProfile, 
  ComputedBehavioralMetrics 
} from '../clustering/feature-engineering.service';

export interface AnalyticsInsights {
  performanceInsights: string[];
  behavioralInsights: string[];
  demographicInsights: string[];
  correlationInsights: string[];
}

@Injectable()
export class EnhancedResponseService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepo: Repository<Response>,
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>,
    private readonly featureEngineering: FeatureEngineeringService,
  ) {}

  /**
   * Enhanced method to save response with full behavioral analysis
   */
  async saveEnhancedResponse(dto: CreateResponseDto): Promise<Response> {
    console.log('🔬 Starting FIXED enhanced response processing...');
    console.log('📝 Raw answers received:', JSON.stringify(dto.answers, null, 2));
    
    // Find the survey
    const survey = await this.surveyRepo.findOne({ where: { id: dto.formId } });
    if (!survey) throw new NotFoundException(`Survey with id ${dto.formId} not found`);

    // Extract profiles from survey answers with FIXED mapping
    const demographicProfile = this.extractDemographicProfile(dto.answers);
    const behavioralProfile = this.extractBehavioralProfile(dto.answers);
    
    console.log('📊 FIXED extracted demographic profile:', JSON.stringify(demographicProfile, null, 2));
    console.log('🧠 FIXED extracted behavioral profile:', JSON.stringify(behavioralProfile, null, 2));
    
    // Extract assembly data
    const assemblyData = this.extractAssemblyData(dto.assembly);
    
    // Compute comprehensive behavioral metrics
    const computedMetrics = this.featureEngineering.computeBehavioralMetrics(
      assemblyData,
      behavioralProfile,
      demographicProfile
    );

    // Create response entity with correct typing
    const responseData = {
      userId: dto.userId,
      answers: dto.answers,
      isComplete: dto.isComplete,
      assembly: dto.assembly,
      survey: survey,
      demographicProfile,
      behavioralProfile,
      computedMetrics,
      submittedAt: new Date()
    };

    const response = this.responseRepo.create(responseData);
    const savedResponse = await this.responseRepo.save(response);
    
    console.log('✅ Response saved with ID:', savedResponse.id);
    console.log('📊 FIXED Final demographic profile in DB:', JSON.stringify(savedResponse.demographicProfile, null, 2));
    console.log('🧠 FIXED Final behavioral profile in DB:', JSON.stringify(savedResponse.behavioralProfile, null, 2));

    return savedResponse;
  }

  /**
   * COMPLETELY FIXED Extract demographic profile - DIRECT MAPPING ONLY
   */
  private extractDemographicProfile(answers: Record<string, any>): DemographicProfile {
    console.log('🔍 Starting FIXED demographic extraction from answers:', JSON.stringify(answers, null, 2));
    
    const getAnswerValue = (questionKey: string): string => {
      console.log(`📝 Getting answer for key "${questionKey}"`);
      
      const rawAnswer = answers[questionKey];
      console.log(`Raw answer for "${questionKey}":`, rawAnswer, typeof rawAnswer);
      
      if (!rawAnswer) {
        console.log(`❌ No answer found for key "${questionKey}"`);
        return '';
      }
      
      let result = '';
      if (typeof rawAnswer === 'string') {
        result = rawAnswer.toLowerCase().trim();
      } else if (Array.isArray(rawAnswer) && rawAnswer.length > 0) {
        result = String(rawAnswer[0]).toLowerCase().trim();
      } else {
        result = String(rawAnswer).toLowerCase().trim();
      }
      
      console.log(`✅ Processed answer for "${questionKey}": "${result}"`);
      return result;
    };

    // ✅ MAPARE DIRECTĂ PENTRU STRUCTURA TA DE CHESTIONAR:
    // Întrebările 1-5 sunt demografice în structura ta
    const ageAnswer = getAnswerValue('1');        // Întrebarea 1: Vârstă
    const genderAnswer = getAnswerValue('2');     // Întrebarea 2: Gen  
    const educationAnswer = getAnswerValue('3');  // Întrebarea 3: Educație
    const occupationAnswer = getAnswerValue('4'); // Întrebarea 4: Ocupație
    const stemAnswer = getAnswerValue('5');      // Întrebarea 5: STEM

    console.log('📝 FIXED mapping - extracted values:', {
      age: ageAnswer,
      gender: genderAnswer,
      education: educationAnswer,
      occupation: occupationAnswer,
      stem: stemAnswer
    });

    const profile: DemographicProfile = {
      ageGroup: this.mapAgeGroupFixed(ageAnswer),
      gender: this.mapGenderFixed(genderAnswer),
      educationLevel: this.mapEducationFixed(educationAnswer),
      occupation: this.mapOccupationFixed(occupationAnswer),
      stemFamiliarity: this.mapStemFamiliarityFixed(stemAnswer)
    };

    console.log('✅ FIXED mapped demographic profile:', JSON.stringify(profile, null, 2));
    return profile;
  }

  /**
   * COMPLETELY FIXED Extract behavioral profile - DIRECT MAPPING ONLY
   */
  private extractBehavioralProfile(answers: Record<string, any>): BehavioralProfile {
    console.log('🔍 Starting FIXED behavioral extraction from answers:', JSON.stringify(answers, null, 2));
    
    const getAnswerValue = (questionKey: string): string => {
      const rawAnswer = answers[questionKey];
      if (!rawAnswer) return '';
      
      if (typeof rawAnswer === 'string') {
        return rawAnswer.toLowerCase().trim();
      }
      if (Array.isArray(rawAnswer) && rawAnswer.length > 0) {
        return String(rawAnswer[0]).toLowerCase().trim();
      }
      return String(rawAnswer).toLowerCase().trim();
    };

    // ✅ MAPARE DIRECTĂ PENTRU STRUCTURA TA DE CHESTIONAR:
    // Întrebările 6-10 sunt comportamentale în structura ta
    const problemSolvingAnswer = getAnswerValue('6');   // Întrebarea 6: Stil rezolvare probleme
    const techComfortAnswer = getAnswerValue('7');     // Întrebarea 7: Comfort tehnologic
    const assemblyExpAnswer = getAnswerValue('8');     // Întrebarea 8: Experiență asamblare
    const errorHandlingAnswer = getAnswerValue('9');   // Întrebarea 9: Gestionarea erorilor
    const gamingAnswer = getAnswerValue('10');          // Întrebarea 10: Gaming

    console.log('📝 FIXED behavioral mapping - extracted values:', {
      problemSolving: problemSolvingAnswer,
      techComfort: techComfortAnswer,
      assemblyExp: assemblyExpAnswer,
      errorHandling: errorHandlingAnswer,
      gaming: gamingAnswer
    });

    const profile: BehavioralProfile = {
      problemSolvingStyle: this.mapProblemSolvingStyleFixed(problemSolvingAnswer),
      techComfort: this.mapTechComfortFixed(techComfortAnswer),
      assemblyExperience: this.mapAssemblyExperienceFixed(assemblyExpAnswer),
      errorHandlingStyle: this.mapErrorHandlingFixed(errorHandlingAnswer),
      gamingFrequency: this.mapGamingFrequencyFixed(gamingAnswer)
    };

    console.log('✅ FIXED mapped behavioral profile:', JSON.stringify(profile, null, 2));
    return profile;
  }

  // ===================================================================
  // METODE DE MAPARE COMPLET FIXATE - FĂRĂ ALGORITMI "INTELIGENȚI"
  // ===================================================================

  private mapAgeGroupFixed(value: string): string {
    console.log('🔍 FIXED mapping age group from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty age value, using default: 19_25');
      return '19_25';
    }
    
    // Mapare directă și exactă pe text complet
    if (value.includes('sub 16')) {
      console.log('✅ FIXED age mapping result: under_16');
      return 'under_16';
    }
    if (value.includes('16-18')) {
      console.log('✅ FIXED age mapping result: 16_18');
      return '16_18';
    }
    if (value.includes('19-25')) {
      console.log('✅ FIXED age mapping result: 19_25');
      return '19_25';
    }
    if (value.includes('26-35')) {
      console.log('✅ FIXED age mapping result: 26_35');
      return '26_35';
    }
    if (value.includes('36-45')) {
      console.log('✅ FIXED age mapping result: 36_45');
      return '36_45';
    }
    if (value.includes('46-55')) {
      console.log('✅ FIXED age mapping result: 46_55');
      return '46_55';
    }
    if (value.includes('peste 55') || value.includes('over 55')) {
      console.log('✅ FIXED age mapping result: over_55');
      return 'over_55';
    }
    
    console.log('⚠️ No age match found, using default: 19_25');
    return '19_25';
  }

  private mapGenderFixed(value: string): string {
    console.log('🔍 FIXED mapping gender from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty gender value, using default: N/A');
      return 'N/A';
    }

    if (value.includes('masculin')) {
      console.log('✅ FIXED gender mapping result: M');
      return 'M';
    }
    if (value.includes('feminin')) {
      console.log('✅ FIXED gender mapping result: F');
      return 'F';
    }
    if (value.includes('prefer să nu specific')) {
      console.log('✅ FIXED gender mapping result: N/A');
      return 'N/A';
    }
    
    console.log('⚠️ No gender match found, using default: N/A');
    return 'N/A';
  }

  private mapEducationFixed(value: string): string {
    console.log('🔍 FIXED mapping education from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty education value, using default: bachelor');
      return 'bachelor';
    }

    if (value.includes('școala generală')) {
      console.log('✅ FIXED education mapping result: elementary');
      return 'elementary';
    }
    if (value.includes('liceu - profil real')) {
      console.log('✅ FIXED education mapping result: highschool_tech');
      return 'highschool_tech';
    }
    if (value.includes('liceu - profil uman')) {
      console.log('✅ FIXED education mapping result: highschool_general');
      return 'highschool_general';
    }
    if (value.includes('studii universitare de licență')) {
      console.log('✅ FIXED education mapping result: bachelor');
      return 'bachelor';
    }
    if (value.includes('studii universitare de master')) {
      console.log('✅ FIXED education mapping result: master');
      return 'master';
    }
    if (value.includes('studii de doctorat') || value.includes('phd')) {
      console.log('✅ FIXED education mapping result: phd');
      return 'phd';
    }
    
    console.log('⚠️ No education match found, using default: bachelor');
    return 'bachelor';
  }

  private mapOccupationFixed(value: string): string {
    console.log('🔍 FIXED mapping occupation from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty occupation value, using default: other');
      return 'other';
    }

    if (value.includes('it/tehnologie')) {
      console.log('✅ FIXED occupation mapping result: tech');
      return 'tech';
    }
    if (value.includes('inginerie')) {
      console.log('✅ FIXED occupation mapping result: engineering');
      return 'engineering';
    }
    if (value.includes('educație')) {
      console.log('✅ FIXED occupation mapping result: education');
      return 'education';
    }
    if (value.includes('student')) {
      console.log('✅ FIXED occupation mapping result: student');
      return 'student';
    }
    if (value.includes('sănătate')) {
      console.log('✅ FIXED occupation mapping result: healthcare');
      return 'healthcare';
    }
    if (value.includes('business/management')) {
      console.log('✅ FIXED occupation mapping result: business');
      return 'business';
    }
    if (value.includes('pensionar')) {
      console.log('✅ FIXED occupation mapping result: retired');
      return 'retired';
    }
    if (value.includes('altceva')) {
      console.log('✅ FIXED occupation mapping result: other');
      return 'other';
    }
    
    console.log('⚠️ No occupation match found, using default: other');
    return 'other';
  }

  private mapStemFamiliarityFixed(value: string): string {
    console.log('🔍 FIXED mapping STEM from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty STEM value, using default: stem_moderate');
      return 'stem_moderate';
    }

    if (value.includes('expert stem')) {
      console.log('✅ FIXED STEM mapping result: stem_expert');
      return 'stem_expert';
    }
    if (value.includes('familiar cu stem')) {
      console.log('✅ FIXED STEM mapping result: stem_familiar');
      return 'stem_familiar';
    }
    if (value.includes('moderat familiar')) {
      console.log('✅ FIXED STEM mapping result: stem_moderate');
      return 'stem_moderate';
    }
    if (value.includes('cunoștințe de bază')) {
      console.log('✅ FIXED STEM mapping result: stem_basic');
      return 'stem_basic';
    }
    if (value.includes('fără cunoștințe stem')) {
      console.log('✅ FIXED STEM mapping result: stem_none');
      return 'stem_none';
    }
    
    console.log('⚠️ No STEM match found, using default: stem_moderate');
    return 'stem_moderate';
  }

  private mapProblemSolvingStyleFixed(value: string): string {
    console.log('🔍 FIXED mapping problem solving from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty problem solving value, using default: balanced');
      return 'balanced';
    }

    if (value.includes('sistematic')) {
      console.log('✅ FIXED problem solving mapping result: systematic');
      return 'systematic';
    }
    if (value.includes('exploratoriu')) {
      console.log('✅ FIXED problem solving mapping result: exploratory');
      return 'exploratory';
    }
    if (value.includes('echilibrat')) {
      console.log('✅ FIXED problem solving mapping result: balanced');
      return 'balanced';
    }
    if (value.includes('colaborativ')) {
      console.log('✅ FIXED problem solving mapping result: collaborative');
      return 'collaborative';
    }
    
    console.log('⚠️ No problem solving match found, using default: balanced');
    return 'balanced';
  }

  private mapTechComfortFixed(value: string): string {
    console.log('🔍 FIXED mapping tech comfort from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty tech comfort value, using default: tech_moderate');
      return 'tech_moderate';
    }

    if (value.includes('expert în tehnologie')) {
      console.log('✅ FIXED tech comfort mapping result: tech_expert');
      return 'tech_expert';
    }
    if (value.includes('confortabil cu tehnologia')) {
      console.log('✅ FIXED tech comfort mapping result: tech_comfortable');
      return 'tech_comfortable';
    }
    if (value.includes('moderat cu tehnologia')) {
      console.log('✅ FIXED tech comfort mapping result: tech_moderate');
      return 'tech_moderate';
    }
    if (value.includes('de bază cu tehnologia')) {
      console.log('✅ FIXED tech comfort mapping result: tech_basic');
      return 'tech_basic';
    }
    if (value.includes('neconfortabil cu tehnologia')) {
      console.log('✅ FIXED tech comfort mapping result: tech_uncomfortable');
      return 'tech_uncomfortable';
    }
    
    console.log('⚠️ No tech comfort match found, using default: tech_moderate');
    return 'tech_moderate';
  }

  private mapAssemblyExperienceFixed(value: string): string {
    console.log('🔍 FIXED mapping assembly experience from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty assembly experience value, using default: assembly_rare');
      return 'assembly_rare';
    }

    if (value.includes('expert în asamblare')) {
      console.log('✅ FIXED assembly experience mapping result: assembly_expert');
      return 'assembly_expert';
    }
    if (value.includes('ceva experiență')) {
      console.log('✅ FIXED assembly experience mapping result: assembly_some');
      return 'assembly_some';
    }
    if (value.includes('experiență rară')) {
      console.log('✅ FIXED assembly experience mapping result: assembly_rare');
      return 'assembly_rare';
    }
    if (value.includes('fără experiență')) {
      console.log('✅ FIXED assembly experience mapping result: assembly_none');
      return 'assembly_none';
    }
    
    console.log('⚠️ No assembly experience match found, using default: assembly_rare');
    return 'assembly_rare';
  }

  private mapErrorHandlingFixed(value: string): string {
    console.log('🔍 FIXED mapping error handling from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty error handling value, using default: analytical');
      return 'analytical';
    }

    if (value.includes('încerc din nou rapid')) {
      console.log('✅ FIXED error handling mapping result: quick_retry');
      return 'quick_retry';
    }
    if (value.includes('mă opresc să analizez')) {
      console.log('✅ FIXED error handling mapping result: analytical');
      return 'analytical';
    }
    if (value.includes('încep totul de la început')) {
      console.log('✅ FIXED error handling mapping result: restart');
      return 'restart';
    }
    if (value.includes('caut ajutor')) {
      console.log('✅ FIXED error handling mapping result: seek_help');
      return 'seek_help';
    }
    if (value.includes('mă frustrez')) {
      console.log('✅ FIXED error handling mapping result: frustrated');
      return 'frustrated';
    }
    
    console.log('⚠️ No error handling match found, using default: analytical');
    return 'analytical';
  }

  private mapGamingFrequencyFixed(value: string): string {
    console.log('🔍 FIXED mapping gaming from:', `"${value}"`);
    
    if (!value) {
      console.log('⚠️ Empty gaming frequency value, using default: gaming_occasional');
      return 'gaming_occasional';
    }

    if (value.includes('zilnic, multe ore')) {
      console.log('✅ FIXED gaming frequency mapping result: gaming_heavy');
      return 'gaming_heavy';
    }
    if (value.includes('zilnic, moderat')) {
      console.log('✅ FIXED gaming frequency mapping result: gaming_daily');
      return 'gaming_daily';
    }
    if (value.includes('săptămânal')) {
      console.log('✅ FIXED gaming frequency mapping result: gaming_weekly');
      return 'gaming_weekly';
    }
    if (value.includes('ocazional')) {
      console.log('✅ FIXED gaming frequency mapping result: gaming_occasional');
      return 'gaming_occasional';
    }
    if (value.includes('niciodată')) {
      console.log('✅ FIXED gaming frequency mapping result: gaming_never');
      return 'gaming_never';
    }
    
    console.log('⚠️ No gaming frequency match found, using default: gaming_occasional');
    return 'gaming_occasional';
  }

  /**
   * Extract and normalize assembly data
   */
  private extractAssemblyData(assembly: any): RawAssemblyData {
    if (!assembly) {
      return {
        completionTime: 300,
        correctnessPercentage: 0,
        rotations: 0,
        wrongPlacementsCount: 0,
        piecesRemovedCount: 0,
        piecesSwappedCount: 0,
        totalMoves: 0,
        timeSpent: 300,
        completed: false,
        componentsPlaced: []
      };
    }

    return {
      completionTime: assembly.timeSpent || 300,
      correctnessPercentage: assembly.correctnessPercentage || 0,
      rotations: assembly.rotations || 0,
      wrongPlacementsCount: assembly.wrongPlacementsCount || 0,
      piecesRemovedCount: assembly.piecesRemovedCount || 0,
      piecesSwappedCount: assembly.piecesSwappedCount || 0,
      totalMoves: assembly.totalMoves || 0,
      timeSpent: assembly.timeSpent || 300,
      completed: assembly.correctnessPercentage >= 100,
      componentsPlaced: assembly.componentsPlaced || [],
      detailedStats: assembly.detailedStats
    };
  }

  /**
   * ✅ NEW: Recompute ALL responses with FIXED categories
   */
  async recomputeAllResponsesWithFixedCategories(): Promise<{ success: boolean; message: string; processedCount: number; categoriesFixed: number }> {
    console.log('🔧 COMPLETE recomputation of ALL responses with FIXED categories...');
    
    try {
      const responses = await this.responseRepo.find({
        where: { isComplete: true },
        relations: ['survey']
      });

      console.log(`Found ${responses.length} total responses to process`);

      let processedCount = 0;
      let categoriesFixed = 0;
      
      for (const response of responses) {
        try {
          console.log(`\n🔄 Processing response ${response.id}...`);
          
          // Store original profiles for comparison
          const originalDemo = JSON.stringify(response.demographicProfile);
          const originalBehav = JSON.stringify(response.behavioralProfile);
          
          // Re-extract profiles with FIXED mapping
          const demographicProfile = this.extractDemographicProfile(response.answers);
          const behavioralProfile = this.extractBehavioralProfile(response.answers);
          const assemblyData = this.extractAssemblyData(response.assembly);

          // Recompute metrics
          const computedMetrics = this.featureEngineering.computeBehavioralMetrics(
            assemblyData,
            behavioralProfile,
            demographicProfile
          );

          // Update the response
          await this.responseRepo.update(response.id, {
            demographicProfile,
            behavioralProfile,
            computedMetrics
          });

          processedCount++;
          
          // Check if categories were actually changed
          const newDemo = JSON.stringify(demographicProfile);
          const newBehav = JSON.stringify(behavioralProfile);
          
          if (originalDemo !== newDemo || originalBehav !== newBehav) {
            categoriesFixed++;
            console.log(`✅ FIXED categories for response ${response.id}`);
            console.log(`   Old demo: ${originalDemo}`);
            console.log(`   New demo: ${newDemo}`);
            console.log(`   Old behav: ${originalBehav}`);
            console.log(`   New behav: ${newBehav}`);
          } else {
            console.log(`✓ Categories already consistent for response ${response.id}`);
          }
          
        } catch (error) {
          console.error(`❌ Error processing response ${response.id}:`, error);
        }
      }

      return {
        success: true,
        message: `Successfully recomputed ALL responses with FIXED categories. Fixed ${categoriesFixed}/${processedCount} responses.`,
        processedCount,
        categoriesFixed
      };
    } catch (error) {
      console.error('❌ Error during complete recomputation:', error);
      return {
        success: false,
        message: `Error during recomputation: ${error.message}`,
        processedCount: 0,
        categoriesFixed: 0
      };
    }
  }

  /**
   * Method to recompute metrics for existing responses
   */
  async recomputeMetricsForSurvey(surveyId: number): Promise<{ success: boolean; message: string; processedCount: number }> {
    console.log(`🔄 Recomputing metrics for survey ${surveyId} with FIXED mapping...`);
    
    try {
      const responses = await this.responseRepo.find({
        where: {
          survey: { id: surveyId },
          isComplete: true
        },
        relations: ['survey']
      });

      console.log(`Found ${responses.length} responses to recompute`);

      let processedCount = 0;
      for (const response of responses) {
        try {
          console.log(`\n🔄 Processing response ${response.id}...`);
          console.log('Original answers:', JSON.stringify(response.answers, null, 2));
          
          // Re-extract profiles from existing answers with FIXED mapping
          const demographicProfile = this.extractDemographicProfile(response.answers);
          const behavioralProfile = this.extractBehavioralProfile(response.answers);
          const assemblyData = this.extractAssemblyData(response.assembly);

          // Recompute metrics
          const computedMetrics = this.featureEngineering.computeBehavioralMetrics(
            assemblyData,
            behavioralProfile,
            demographicProfile
          );

          // Update the response
          await this.responseRepo.update(response.id, {
            demographicProfile,
            behavioralProfile,
            computedMetrics
          });

          processedCount++;
          console.log(`✅ Updated response ${response.id} with FIXED data:`, {
            demographic: demographicProfile,
            behavioral: behavioralProfile
          });
        } catch (error) {
          console.error(`❌ Error processing response ${response.id}:`, error);
        }
      }

      return {
        success: true,
        message: `Successfully recomputed metrics for ${processedCount}/${responses.length} responses`,
        processedCount
      };
    } catch (error) {
      console.error('❌ Error during metrics recomputation:', error);
      return {
        success: false,
        message: `Error during recomputation: ${error.message}`,
        processedCount: 0
      };
    }
  }

  /**
   * Get enhanced analytics for a survey
   */
  async getEnhancedSurveyAnalytics(surveyId: number): Promise<{
    overview: any;
    performanceMetrics: any;
    behavioralAnalysis: any;
    demographicBreakdown: any;
    correlationAnalysis: any;
    insights: AnalyticsInsights;
  }> {
    console.log(`📊 Generating enhanced analytics for survey ${surveyId}`);
    
    // Get all responses with computed metrics
    const responses = await this.getResponsesWithMetrics(surveyId);
    
    if (responses.length === 0) {
      throw new NotFoundException('No responses with computed metrics found');
    }

    // Generate comprehensive analytics
    const overview = this.generateOverview(responses);
    const performanceMetrics = this.analyzePerformanceMetrics(responses);
    const behavioralAnalysis = this.analyzeBehavioralPatterns(responses);
    const demographicBreakdown = this.analyzeDemographics(responses);
    const correlationAnalysis = this.analyzeCorrelations(responses);
    const insights = this.generateInsights(responses);

    return {
      overview,
      performanceMetrics,
      behavioralAnalysis,
      demographicBreakdown,
      correlationAnalysis,
      insights
    };
  }

  /**
   * Get responses with computed metrics for analysis
   */
  private async getResponsesWithMetrics(surveyId: number): Promise<Response[]> {
    return await this.responseRepo.find({
      where: {
        survey: { id: surveyId },
        isComplete: true,
        computedMetrics: Not(IsNull())
      },
      relations: ['survey']
    });
  }

  // Analytics helper methods
  private generateOverview(responses: Response[]): any {
    const totalResponses = responses.length;
    const completedResponses = responses.filter(r => r.isComplete).length;
    const avgTechnicalAptitude = this.average(responses.map(r => r.computedMetrics?.technicalAptitude || 0));
    
    return {
      totalResponses,
      completedResponses,
      completionRate: (completedResponses / totalResponses) * 100,
      avgTechnicalAptitude,
      dateRange: {
        start: Math.min(...responses.map(r => new Date(r.submittedAt).getTime())),
        end: Math.max(...responses.map(r => new Date(r.submittedAt).getTime()))
      }
    };
  }

  private analyzePerformanceMetrics(responses: Response[]): any {
    const metrics = responses
      .map(r => r.computedMetrics)
      .filter((m): m is NonNullable<typeof m> => m !== null && m !== undefined);
    
    return {
      speedIndex: {
        mean: this.average(metrics.map(m => m.speedIndex)),
        median: this.median(metrics.map(m => m.speedIndex)),
        std: this.standardDeviation(metrics.map(m => m.speedIndex))
      },
      precisionIndex: {
        mean: this.average(metrics.map(m => m.precisionIndex)),
        median: this.median(metrics.map(m => m.precisionIndex)),
        std: this.standardDeviation(metrics.map(m => m.precisionIndex))
      },
      technicalAptitude: {
        mean: this.average(metrics.map(m => m.technicalAptitude)),
        median: this.median(metrics.map(m => m.technicalAptitude)),
        std: this.standardDeviation(metrics.map(m => m.technicalAptitude))
      }
    };
  }

  private analyzeBehavioralPatterns(responses: Response[]): any {
    const behavioralProfiles = responses
      .map(r => r.behavioralProfile)
      .filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined);
    
    return {
      problemSolvingDistribution: this.calculateDistribution(behavioralProfiles.map(b => b.problemSolvingStyle)),
      techComfortDistribution: this.calculateDistribution(behavioralProfiles.map(b => b.techComfort)),
      errorHandlingDistribution: this.calculateDistribution(behavioralProfiles.map(b => b.errorHandlingStyle))
    };
  }

  private analyzeDemographics(responses: Response[]): any {
    const demographics = responses
      .map(r => r.demographicProfile)
      .filter((d): d is NonNullable<typeof d> => d !== null && d !== undefined);
    
    return {
      ageDistribution: this.calculateDistribution(demographics.map(d => d.ageGroup)),
      genderDistribution: this.calculateDistribution(demographics.map(d => d.gender)),
      educationDistribution: this.calculateDistribution(demographics.map(d => d.educationLevel)),
      occupationDistribution: this.calculateDistribution(demographics.map(d => d.occupation)),
      stemFamiliarityDistribution: this.calculateDistribution(demographics.map(d => d.stemFamiliarity))
    };
  }

  private analyzeCorrelations(responses: Response[]): any {
    const metrics = responses
      .map(r => r.computedMetrics)
      .filter((m): m is NonNullable<typeof m> => m !== null && m !== undefined);
    
    return {
      speedVsPrecision: this.calculateCorrelation(
        metrics.map(m => m.speedIndex),
        metrics.map(m => m.precisionIndex)
      ),
      confidenceVsPerformance: this.calculateCorrelation(
        metrics.map(m => m.confidenceIndex),
        metrics.map(m => m.technicalAptitude)
      ),
      systematicVsAccuracy: this.calculateCorrelation(
        metrics.map(m => m.systematicIndex),
        metrics.map(m => m.precisionIndex)
      )
    };
  }

  private generateInsights(responses: Response[]): AnalyticsInsights {
    const insights: AnalyticsInsights = {
      performanceInsights: [],
      behavioralInsights: [],
      demographicInsights: [],
      correlationInsights: []
    };

    const metrics = responses
      .map(r => r.computedMetrics)
      .filter((m): m is NonNullable<typeof m> => m !== null && m !== undefined);
    const demographics = responses
      .map(r => r.demographicProfile)
      .filter((d): d is NonNullable<typeof d> => d !== null && d !== undefined);
    const behavioral = responses
      .map(r => r.behavioralProfile)
      .filter((b): b is NonNullable<typeof b> => b !== null && b !== undefined);

    // Performance insights
    const avgTechnicalAptitude = this.average(metrics.map(m => m.technicalAptitude));
    if (avgTechnicalAptitude > 0.75) {
      insights.performanceInsights.push('Overall high technical performance - participants show strong aptitude');
    } else if (avgTechnicalAptitude < 0.5) {
      insights.performanceInsights.push('Performance indicates need for additional support or clearer instructions');
    }

    // Speed vs precision analysis
    const speedPrecisionCorr = this.calculateCorrelation(
      metrics.map(m => m.speedIndex),
      metrics.map(m => m.precisionIndex)
    );
    
    if (speedPrecisionCorr < -0.3) {
      insights.correlationInsights.push('Strong trade-off between speed and precision - faster users tend to be less accurate');
    } else if (speedPrecisionCorr > 0.3) {
      insights.correlationInsights.push('Fast users also tend to be more accurate - indicates skill rather than trade-off');
    }

    // Confidence analysis
    const confPerformanceCorr = this.calculateCorrelation(
      metrics.map(m => m.confidenceIndex),
      metrics.map(m => m.technicalAptitude)
    );
    if (confPerformanceCorr > 0.4) {
      insights.correlationInsights.push('Confident users perform significantly better overall');
    }

    // Behavioral insights
    const systematicCount = behavioral.filter(b => b.problemSolvingStyle === 'systematic').length;
    const exploratoryCount = behavioral.filter(b => b.problemSolvingStyle === 'exploratory').length;
    const collaborativeCount = behavioral.filter(b => b.problemSolvingStyle === 'collaborative').length;
    
    if (systematicCount > behavioral.length * 0.4) {
      insights.behavioralInsights.push('Most participants prefer systematic problem-solving approaches');
    }
    if (collaborativeCount > behavioral.length * 0.3) {
      insights.behavioralInsights.push('Significant portion of participants prefer collaborative problem-solving');
    }

    // Demographic insights
    const ageGroups = this.calculateDistribution(demographics.map(d => d.ageGroup));
    const dominantAge = Object.keys(ageGroups).reduce((a, b) => ageGroups[a] > ageGroups[b] ? a : b);
    insights.demographicInsights.push(`Most common age group: ${dominantAge.replace('_', '-')} years`);

    const occupations = this.calculateDistribution(demographics.map(d => d.occupation));
    const dominantOccupation = Object.keys(occupations).reduce((a, b) => occupations[a] > occupations[b] ? a : b);
    insights.demographicInsights.push(`Most common occupation: ${dominantOccupation}`);

    const stemLevels = this.calculateDistribution(demographics.map(d => d.stemFamiliarity));
    const dominantStem = Object.keys(stemLevels).reduce((a, b) => stemLevels[a] > stemLevels[b] ? a : b);
    insights.demographicInsights.push(`STEM familiarity level: ${dominantStem.replace('stem_', '').replace('_', ' ')}`);

    return insights;
  }

  // Statistical helper methods
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.average(values);
    const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.average(squaredDiffs));
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

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const meanX = this.average(x);
    const meanY = this.average(y);
    
    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;
    
    for (let i = 0; i < x.length; i++) {
      const deltaX = x[i] - meanX;
      const deltaY = y[i] - meanY;
      numerator += deltaX * deltaY;
      sumXSquared += deltaX * deltaX;
      sumYSquared += deltaY * deltaY;
    }
    
    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
  }
}