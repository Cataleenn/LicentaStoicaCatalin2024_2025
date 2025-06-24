
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

    private readonly QUESTION_KEYWORDS = {
    // Demografice
    'age': ['vârstă','varsta', 'ani', 'age', 'years', 'născut','nașterii','data','anul','nascut'],
    'gender': ['gen', 'gender', 'sex','genul'],
    'education': ['educație','educatie', 'scoala','școală', 'studii', 'education', 'diploma'],
    'occupation': ['ocupație','ocupatie', 'job', 'muncă','munca', 'profesie', 'lucrez','jobul'],
    'stem': ['stem','STEM', 'științe','stiinte', 'matematică', 'tehnică','tehnica','tehnice','matematica','fizica','fizică'],
    
    // Comportamentale
    'tech_comfort': ['confortabil', 'tehnologie', 'tech', 'computer','tehnologia','device','device-uri'],
    'problem_solving': ['rezolv','rezolva','abordezi', 'abordez', 'solve', 'probleme','problemă','problema'],
    'assembly_experience': ['asamblare', 'assembly', 'construiesc','construiești','asamblez'],
    'error_handling': ['erori', 'greșeli', 'errors', 'mistakes','gresești','gresesti', 'gresi', 'greși'],
    'gaming': ['jocuri', 'gaming', 'games', 'play' , 'joci', 'juca']
  };
  
  private detectQuestionType(questionText: string): string {
  const text = questionText.toLowerCase();
  
  for (const [dimension, keywords] of Object.entries(this.QUESTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return dimension;
      }
    }
  }
  
  return 'unknown';
}
  async saveEnhancedResponse(dto: CreateResponseDto): Promise<Response> {
     console.log('Starting enhanced response processing...');
      
  

  const survey = await this.surveyRepo.findOne({ where: { id: dto.formId } });
  if (!survey) throw new NotFoundException(`Survey with id ${dto.formId} not found`);
  
  console.log(' DEBUG - Raw DTO received:');
  console.log(' Answers:', JSON.stringify(dto.answers, null, 2));
  console.log(' Questions from survey:', JSON.stringify(survey.questions, null, 2));

  const demographicProfile = this.extractDemographicProfile(dto.answers, survey.questions);
  const behavioralProfile = this.extractBehavioralProfile(dto.answers, survey.questions);
      
   
    const assemblyData = this.extractAssemblyData(dto.assembly);
    
    
    const computedMetrics = this.featureEngineering.computeBehavioralMetrics(
      assemblyData,
      behavioralProfile,
      demographicProfile
    );

   
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
    


    return savedResponse;
  }

 
 private extractDemographicProfile(answers: Record<string, any>, questions?: Record<string, string>): DemographicProfile {

  
  const profile: any = {
    ageGroup: '19_25',      
    gender: 'N/A',
    educationLevel: 'bachelor',
    occupation: 'other',
    stemFamiliarity: 'stem_moderate'
  };
  
  if (questions) {
    
    for (const [questionKey, questionText] of Object.entries(questions)) {
      const dimensionType = this.detectQuestionType(questionText);
      const answerValue = answers[questionKey];
      
      if (answerValue) {
        switch (dimensionType) {
          case 'age':
            profile.ageGroup = this.mapAgeGroupFixed(answerValue);
            break;
          case 'gender':
            profile.gender = this.mapGenderFixed(answerValue);
            break;
          case 'education':
            profile.educationLevel = this.mapEducationFixed(answerValue);
            break;
          case 'occupation':
            profile.occupation = this.mapOccupationFixed(answerValue);
            break;
          case 'stem':
            profile.stemFamiliarity = this.mapStemFamiliarityFixed(answerValue);
            break;
        }
      }
    }
  } else {
    
    const getAnswerValue = (key: string) => {
      const raw = answers[key];
      if (!raw) return '';
      return typeof raw === 'string' ? raw.toLowerCase().trim() : String(raw).toLowerCase().trim();
    };
    
    profile.ageGroup = this.mapAgeGroupFixed(getAnswerValue('1'));
    profile.gender = this.mapGenderFixed(getAnswerValue('2'));
    profile.educationLevel = this.mapEducationFixed(getAnswerValue('3'));
    profile.occupation = this.mapOccupationFixed(getAnswerValue('4'));
    profile.stemFamiliarity = this.mapStemFamiliarityFixed(getAnswerValue('5'));
  }

  
  return profile;
}

 
  private extractBehavioralProfile(answers: Record<string, any>, questions?: Record<string, string>): BehavioralProfile {

  
  const profile: any = {
    problemSolvingStyle: 'balanced',     
    techComfort: 'tech_moderate',
    assemblyExperience: 'assembly_rare',
    errorHandlingStyle: 'analytical',
    gamingFrequency: 'gaming_occasional'
  };
  
  if (questions) {
  
    for (const [questionKey, questionText] of Object.entries(questions)) {
      const dimensionType = this.detectQuestionType(questionText);
      const answerValue = answers[questionKey];
      
      if (answerValue) {
        switch (dimensionType) {
          case 'problem_solving':
            profile.problemSolvingStyle = this.mapProblemSolvingStyleFixed(answerValue);
            break;
          case 'tech_comfort':
            profile.techComfort = this.mapTechComfortFixed(answerValue);
            break;
          case 'assembly_experience':
            profile.assemblyExperience = this.mapAssemblyExperienceFixed(answerValue);
            break;
          case 'error_handling':
            profile.errorHandlingStyle = this.mapErrorHandlingFixed(answerValue);
            break;
          case 'gaming':
            profile.gamingFrequency = this.mapGamingFrequencyFixed(answerValue);
            break;
        }
      }
    }
  } else {
    
    const getAnswerValue = (key: string) => {
      const raw = answers[key];
      if (!raw) return '';
      return typeof raw === 'string' ? raw.toLowerCase().trim() : String(raw).toLowerCase().trim();
    };
    
    profile.problemSolvingStyle = this.mapProblemSolvingStyleFixed(getAnswerValue('6'));
    profile.techComfort = this.mapTechComfortFixed(getAnswerValue('7'));
    profile.assemblyExperience = this.mapAssemblyExperienceFixed(getAnswerValue('8'));
    profile.errorHandlingStyle = this.mapErrorHandlingFixed(getAnswerValue('9'));
    profile.gamingFrequency = this.mapGamingFrequencyFixed(getAnswerValue('10'));
  }


  return profile;
}


  private mapAgeGroupFixed(value: string): string {
 
    
    if (!value) {
      return '19_25';
    }
    
  
    if (value.includes('sub 16')) {
      return 'under_16';
    }
    if (value.includes('16-18')) {
      return '16_18';
    }
    if (value.includes('19-25')) {
      return '19_25';
    }
    if (value.includes('26-35')) {
      return '26_35';
    }
    if (value.includes('36-45')) {
      return '36_45';
    }
    if (value.includes('46-55')) {
      return '46_55';
    }
    if (value.includes('peste 55') || value.includes('over 55')) {
      return 'over_55';
    }
    
    return '19_25';
  }

  private mapGenderFixed(value: string): string {
    
    if (!value) {
      return 'N/A';
    }

    if (value.includes('masculin')) {
      return 'M';
    }
    if (value.includes('feminin')) {
      return 'F';
    }
    if (value.includes('prefer să nu specific')) {
      return 'N/A';
    }
    
    return 'N/A';
  }

  private mapEducationFixed(value: string): string {
    
    if (!value) {
      return 'bachelor';
    }

    if (value.includes('școala generală')) {
      return 'elementary';
    }
    if (value.includes('liceu - profil real')) {
      return 'highschool_tech';
    }
    if (value.includes('liceu - profil uman')) {
      return 'highschool_general';
    }
    if (value.includes('studii universitare de licență')) {
      return 'bachelor';
    }
    if (value.includes('studii universitare de master')) {
      return 'master';
    }
    if (value.includes('studii de doctorat') || value.includes('phd')) {
      return 'phd';
    }

    return 'bachelor';
  }

  private mapOccupationFixed(value: string): string {
    
    if (!value) {
      return 'other';
    }

    if (value.includes('it/tehnologie')) {

      return 'tech';
    }
    if (value.includes('inginerie')) {

      return 'engineering';
    }
    if (value.includes('educație')) {
      return 'education';
    }
    if (value.includes('student')) {
      return 'student';
    }
    if (value.includes('sănătate')) {

      return 'healthcare';
    }
    if (value.includes('business/management')) {
  
      return 'business';
    }
    if (value.includes('pensionar')) {

      return 'retired';
    }
    if (value.includes('altceva')) {
 
      return 'other';
    }
    

    return 'other';
  }

  private mapStemFamiliarityFixed(value: string): string {

    
    if (!value) {

      return 'stem_moderate';
    }

    if (value.includes('expert stem')) {

      return 'stem_expert';
    }
    if (value.includes('familiar cu stem')) {

      return 'stem_familiar';
    }
    if (value.includes('moderat familiar')) {

      return 'stem_moderate';
    }
    if (value.includes('cunoștințe de bază')) {

      return 'stem_basic';
    }
    if (value.includes('fără cunoștințe stem')) {

      return 'stem_none';
    }
    
    return 'stem_moderate';
  }

  private mapProblemSolvingStyleFixed(value: string): string {
    
    if (!value) {

      return 'balanced';
    }

    if (value.includes('sistematic')) {

      return 'systematic';
    }
    if (value.includes('exploratoriu')) {

      return 'exploratory';
    }
    if (value.includes('echilibrat')) {
      return 'balanced';
    }
    if (value.includes('colaborativ')) {
      return 'collaborative';
    }

    return 'balanced';
  }

  private mapTechComfortFixed(value: string): string {

    
    if (!value) {

      return 'tech_moderate';
    }

    if (value.includes('expert în tehnologie')) {

      return 'tech_expert';
    }
    if (value.includes('confortabil cu tehnologia')) {

      return 'tech_comfortable';
    }
    if (value.includes('moderat cu tehnologia')) {
 
      return 'tech_moderate';
    }
    if (value.includes('de bază cu tehnologia')) {

      return 'tech_basic';
    }
    if (value.includes('neconfortabil cu tehnologia')) {

      return 'tech_uncomfortable';
    }
    

    return 'tech_moderate';
  }

  private mapAssemblyExperienceFixed(value: string): string {

    
    if (!value) {

      return 'assembly_rare';
    }

    if (value.includes('expert în asamblare')) {

      return 'assembly_expert';
    }
    if (value.includes('ceva experiență')) {

      return 'assembly_some';
    }
    if (value.includes('experiență rară')) {

      return 'assembly_rare';
    }
    if (value.includes('fără experiență')) {

      return 'assembly_none';
    }
    

    return 'assembly_rare';
  }

  private mapErrorHandlingFixed(value: string): string {

    
    if (!value) {

      return 'analytical';
    }

    if (value.includes('încerc din nou rapid')) {

      return 'quick_retry';
    }
    if (value.includes('mă opresc să analizez')) {

      return 'analytical';
    }
    if (value.includes('încep totul de la început')) {

      return 'restart';
    }
    if (value.includes('caut ajutor')) {

      return 'seek_help';
    }
    if (value.includes('mă frustrez')) {

      return 'frustrated';
    }

    return 'analytical';
  }

  private mapGamingFrequencyFixed(value: string): string {

    
    if (!value) {

      return 'gaming_occasional';
    }

    if (value.includes('zilnic, multe ore')) {

      return 'gaming_heavy';
    }
    if (value.includes('zilnic, moderat')) {

      return 'gaming_daily';
    }
    if (value.includes('săptămânal')) {

      return 'gaming_weekly';
    }
    if (value.includes('ocazional')) {

      return 'gaming_occasional';
    }
    if (value.includes('niciodată')) {

      return 'gaming_never';
    }

    return 'gaming_occasional';
  }

  
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

  async recomputeAllResponsesWithFixedCategories(): Promise<{ success: boolean; message: string; processedCount: number; categoriesFixed: number }> {

    
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
          console.log(`\n Processing response ${response.id}...`);
          
         
          const originalDemo = JSON.stringify(response.demographicProfile);
          const originalBehav = JSON.stringify(response.behavioralProfile);
          
        
          const demographicProfile = this.extractDemographicProfile(response.answers);
          const behavioralProfile = this.extractBehavioralProfile(response.answers);
          const assemblyData = this.extractAssemblyData(response.assembly);

        
          const computedMetrics = this.featureEngineering.computeBehavioralMetrics(
            assemblyData,
            behavioralProfile,
            demographicProfile
          );

         
          await this.responseRepo.update(response.id, {
            demographicProfile,
            behavioralProfile,
            computedMetrics
          });

          processedCount++;
          
          
          const newDemo = JSON.stringify(demographicProfile);
          const newBehav = JSON.stringify(behavioralProfile);
        
          
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
    
    try {
      const responses = await this.responseRepo.find({
        where: {
          survey: { id: surveyId },
          isComplete: true
        },
        relations: ['survey']
      });


      let processedCount = 0;
      for (const response of responses) {
        try {
       
          const demographicProfile = this.extractDemographicProfile(response.answers);
          const behavioralProfile = this.extractBehavioralProfile(response.answers);
          const assemblyData = this.extractAssemblyData(response.assembly);

          
          const computedMetrics = this.featureEngineering.computeBehavioralMetrics(
            assemblyData,
            behavioralProfile,
            demographicProfile
          );

         
          await this.responseRepo.update(response.id, {
            demographicProfile,
            behavioralProfile,
            computedMetrics
          });

          processedCount++;
         
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


  
  async getEnhancedSurveyAnalytics(surveyId: number): Promise<{
    overview: any;
    performanceMetrics: any;
    behavioralAnalysis: any;
    demographicBreakdown: any;
    correlationAnalysis: any;
    insights: AnalyticsInsights;
  }> {
    console.log(`Generating enhanced analytics for survey ${surveyId}`);
    
    
    const responses = await this.getResponsesWithMetrics(surveyId);
    
    if (responses.length === 0) {
      throw new NotFoundException('No responses with computed metrics found');
    }

   
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

  
    const avgTechnicalAptitude = this.average(metrics.map(m => m.technicalAptitude));
    if (avgTechnicalAptitude > 0.75) {
      insights.performanceInsights.push('Overall high technical performance - participants show strong aptitude');
    } else if (avgTechnicalAptitude < 0.5) {
      insights.performanceInsights.push('Performance indicates need for additional support or clearer instructions');
    }


    const speedPrecisionCorr = this.calculateCorrelation(
      metrics.map(m => m.speedIndex),
      metrics.map(m => m.precisionIndex)
    );
    
    if (speedPrecisionCorr < -0.3) {
      insights.correlationInsights.push('Strong trade-off between speed and precision - faster users tend to be less accurate');
    } else if (speedPrecisionCorr > 0.3) {
      insights.correlationInsights.push('Fast users also tend to be more accurate - indicates skill rather than trade-off');
    }

   
    const confPerformanceCorr = this.calculateCorrelation(
      metrics.map(m => m.confidenceIndex),
      metrics.map(m => m.technicalAptitude)
    );
    if (confPerformanceCorr > 0.4) {
      insights.correlationInsights.push('Confident users perform significantly better overall');
    }

  
    const systematicCount = behavioral.filter(b => b.problemSolvingStyle === 'systematic').length;
    const exploratoryCount = behavioral.filter(b => b.problemSolvingStyle === 'exploratory').length;
    const collaborativeCount = behavioral.filter(b => b.problemSolvingStyle === 'collaborative').length;
    
    if (systematicCount > behavioral.length * 0.4) {
      insights.behavioralInsights.push('Most participants prefer systematic problem-solving approaches');
    }
    if (collaborativeCount > behavioral.length * 0.3) {
      insights.behavioralInsights.push('Significant portion of participants prefer collaborative problem-solving');
    }

   
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
  

async findResponseByResponseId(responseId: number, surveyId: number): Promise<any> {
  try {
    console.log(` Searching for response: responseId=${responseId}, surveyId=${surveyId}`);
    
    const response = await this.responseRepo.findOne({
      where: { 
        id: responseId, 
        survey: { id: surveyId } 
      }
    });
    
    console.log(` Response found:`, !!response);
    if (response) {
      console.log(` Response has assembly:`, !!response.assembly);
      if (response.assembly) {
        console.log(` Assembly structure keys:`, Object.keys(response.assembly));
        console.log(` Components placed:`, response.assembly.componentsPlaced ? response.assembly.componentsPlaced.length : 0);
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Error finding response ${responseId} in survey ${surveyId}:`, error);
    return null;
  }
}
}