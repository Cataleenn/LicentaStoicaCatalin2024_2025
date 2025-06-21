
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from './response.entity';
import { Survey } from './survey.entity'; 
import { CreateResponseDto } from './create-response.dto';

@Injectable()
export class ResponseService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepo: Repository<Response>,
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>
  ) {}

 
  async saveResponse(dto: CreateResponseDto): Promise<Response> {
    console.log('💾 Saving response with improved mapping...');
    console.log('📝 Raw answers:', JSON.stringify(dto.answers, null, 2));
    
    const survey = await this.surveyRepo.findOne({ where: { id: dto.formId } });
    if (!survey) {
      throw new NotFoundException(`Survey with id ${dto.formId} not found`);
    }

    
    const behavioralProfile = this.extractBehavioralProfile(dto.answers);
    const demographicProfile = this.extractDemographicProfile(dto.answers);

    console.log('📊 Extracted demographic profile:', JSON.stringify(demographicProfile, null, 2));
    console.log('🧠 Extracted behavioral profile:', JSON.stringify(behavioralProfile, null, 2));

 
    let computedMetrics = null;
    if (dto.assembly) {
      computedMetrics = this.generateSimpleMetrics(dto.assembly, behavioralProfile, demographicProfile);
    }

  
    const newResponse = new Response();
    newResponse.userId = dto.userId;
    newResponse.answers = dto.answers;
    newResponse.isComplete = dto.isComplete;
    newResponse.survey = survey;
    
 
    if (dto.assembly) {
      newResponse.assembly = dto.assembly as any;
    }
    
   
    if (behavioralProfile) {
      newResponse.behavioralProfile = behavioralProfile;
    }
    
    if (demographicProfile) {
      newResponse.demographicProfile = demographicProfile;
    }
    
    if (computedMetrics) {
      newResponse.computedMetrics = computedMetrics;
    }

 
    const saved = await this.responseRepo.save(newResponse);
    
    console.log('✅ Response saved with profiles:', {
      responseId: saved.id,
      hasAssembly: !!dto.assembly,
      hasBehavioral: !!newResponse.behavioralProfile,
      hasDemographic: !!newResponse.demographicProfile,
      hasMetrics: !!newResponse.computedMetrics,
      demographicSample: newResponse.demographicProfile ? {
        ageGroup: newResponse.demographicProfile.ageGroup,
        occupation: newResponse.demographicProfile.occupation
      } : null
    });

    return saved;
  }

 
  private extractDemographicProfile(answers: Record<string, any>): any {
    console.log('🔍 IMPROVED: Extracting demographic profile...');
    console.log('📝 Available answers:', JSON.stringify(answers, null, 2));
    
    if (!answers || Object.keys(answers).length === 0) {
      console.log('❌ No answers provided');
      return null;
    }

    
    const getAnswerValue = (questionKey: string): string => {
      const rawAnswer = answers[questionKey];
      console.log(`Getting answer for key "${questionKey}":`, rawAnswer, typeof rawAnswer);
      
      if (!rawAnswer) return '';
      
      if (typeof rawAnswer === 'string') {
        return rawAnswer.toLowerCase().trim();
      } else if (Array.isArray(rawAnswer) && rawAnswer.length > 0) {
        return String(rawAnswer[0]).toLowerCase().trim();
      } else {
        return String(rawAnswer).toLowerCase().trim();
      }
    };

    
    let ageAnswer = '';
    let genderAnswer = '';
    let educationAnswer = '';
    let occupationAnswer = '';
    let stemAnswer = '';

    
    Object.keys(answers).forEach(key => {
      const value = getAnswerValue(key);
      console.log(`🔍 Analyzing key "${key}" with value: "${value}"`);
      
      if (!ageAnswer && this.looksLikeAge(value)) {
        ageAnswer = value;
        console.log(`🎯 Identified AGE at key "${key}": "${value}"`);
      } else if (!genderAnswer && this.looksLikeGender(value)) {
        genderAnswer = value;
        console.log(`🎯 Identified GENDER at key "${key}": "${value}"`);
      } else if (!educationAnswer && this.looksLikeEducation(value)) {
        educationAnswer = value;
        console.log(`🎯 Identified EDUCATION at key "${key}": "${value}"`);
      } else if (!occupationAnswer && this.looksLikeOccupation(value)) {
        occupationAnswer = value;
        console.log(`🎯 Identified OCCUPATION at key "${key}": "${value}"`);
      } else if (!stemAnswer && this.looksLikeSTEM(value)) {
        stemAnswer = value;
        console.log(`🎯 Identified STEM at key "${key}": "${value}"`);
      }
    });

    
    if (!ageAnswer) ageAnswer = getAnswerValue('1');
    if (!genderAnswer) genderAnswer = getAnswerValue('2');
    if (!educationAnswer) educationAnswer = getAnswerValue('3');
    if (!occupationAnswer) occupationAnswer = getAnswerValue('4');
    if (!stemAnswer) stemAnswer = getAnswerValue('5');

    console.log('📝 Values before mapping:', {
      age: ageAnswer,
      gender: genderAnswer,
      education: educationAnswer,
      occupation: occupationAnswer,
      stem: stemAnswer
    });

    return {
      ageGroup: this.mapAgeGroup(ageAnswer),
      gender: this.mapGender(genderAnswer),
      educationLevel: this.mapEducation(educationAnswer),
      occupation: this.mapOccupation(occupationAnswer),
      stemFamiliarity: this.mapStemFamiliarity(stemAnswer)
    };
  }

 
  private looksLikeAge(value: string): boolean {
    if (!value) return false;
    const agePatterns = [
      /\d{1,2}/, 
      /ani/, /age/, /varsta/, /vârstă/,
      /sub/, /peste/, /între/, /under/, /over/, /between/,
      /16/, /17/, /18/, /19/, /20/, /25/, /30/, /35/, /40/, /45/, /50/, /55/
    ];
    return agePatterns.some(pattern => pattern.test(value));
  }

  private looksLikeGender(value: string): boolean {
    if (!value) return false;
    const genderPatterns = [
      /masculin/, /feminin/, /male/, /female/, /bărbat/, /femeie/,
      /prefer/, /nu specific/, /altceva/, /other/, /\bm\b/, /\bf\b/
    ];
    return genderPatterns.some(pattern => pattern.test(value));
  }

  private looksLikeEducation(value: string): boolean {
    if (!value) return false;
    const educationPatterns = [
      /școală/, /liceu/, /facultate/, /universitate/, /master/, /doctorat/,
      /elementary/, /school/, /high school/, /bachelor/, /university/, /college/,
      /gimnaziu/, /clasa/, /an/, /student/, /studii/, /învățământ/
    ];
    return educationPatterns.some(pattern => pattern.test(value));
  }

  private looksLikeOccupation(value: string): boolean {
    if (!value) return false;
    const occupationPatterns = [
      /lucr/, /job/, /muncesc/, /profesie/, /ocupat/, /serviciu/,
      /student/, /elev/, /profesor/, /inginer/, /doctor/, /programator/,
      /it/, /tehnologie/, /business/, /pensionar/, /retired/, /unemployed/
    ];
    return occupationPatterns.some(pattern => pattern.test(value));
  }

  private looksLikeSTEM(value: string): boolean {
    if (!value) return false;
    const stemPatterns = [
      /stem/, /știință/, /tehnologie/, /matematică/, /inginerie/,
      /science/, /technology/, /engineering/, /math/, /familiar/, /expert/,
      /cunoștințe/, /experiență/, /lucrez/, /domeniu/
    ];
    return stemPatterns.some(pattern => pattern.test(value));
  }

 
  private extractBehavioralProfile(answers: Record<string, any>): any {
    console.log('🔍 IMPROVED: Extracting behavioral profile...');
    
    if (!answers || Object.keys(answers).length === 0) {
      return null;
    }

    const getAnswerValue = (questionKey: string): string => {
      const rawAnswer = answers[questionKey];
      if (!rawAnswer) return '';
      
      if (typeof rawAnswer === 'string') {
        return rawAnswer.toLowerCase().trim();
      } else if (Array.isArray(rawAnswer) && rawAnswer.length > 0) {
        return String(rawAnswer[0]).toLowerCase().trim();
      } else {
        return String(rawAnswer).toLowerCase().trim();
      }
    };

  
    let problemSolvingAnswer = '';
    let techComfortAnswer = '';
    let assemblyExpAnswer = '';
    let errorHandlingAnswer = '';
    let gamingAnswer = '';


    Object.keys(answers).forEach(key => {
      const value = getAnswerValue(key);
      
      if (!problemSolvingAnswer && this.looksLikeProblemSolving(value)) {
        problemSolvingAnswer = value;
        console.log(`🎯 Identified PROBLEM SOLVING at key "${key}": "${value}"`);
      } else if (!techComfortAnswer && this.looksLikeTechComfort(value)) {
        techComfortAnswer = value;
        console.log(`🎯 Identified TECH COMFORT at key "${key}": "${value}"`);
      } else if (!assemblyExpAnswer && this.looksLikeAssemblyExperience(value)) {
        assemblyExpAnswer = value;
        console.log(`🎯 Identified ASSEMBLY EXP at key "${key}": "${value}"`);
      } else if (!errorHandlingAnswer && this.looksLikeErrorHandling(value)) {
        errorHandlingAnswer = value;
        console.log(`🎯 Identified ERROR HANDLING at key "${key}": "${value}"`);
      } else if (!gamingAnswer && this.looksLikeGaming(value)) {
        gamingAnswer = value;
        console.log(`🎯 Identified GAMING at key "${key}": "${value}"`);
      }
    });


    if (!problemSolvingAnswer) problemSolvingAnswer = getAnswerValue('6');
    if (!techComfortAnswer) techComfortAnswer = getAnswerValue('7');
    if (!assemblyExpAnswer) assemblyExpAnswer = getAnswerValue('8');
    if (!errorHandlingAnswer) errorHandlingAnswer = getAnswerValue('9');
    if (!gamingAnswer) gamingAnswer = getAnswerValue('10');

    console.log('📝 Behavioral values before mapping:', {
      problemSolving: problemSolvingAnswer,
      techComfort: techComfortAnswer,
      assemblyExp: assemblyExpAnswer,
      errorHandling: errorHandlingAnswer,
      gaming: gamingAnswer
    });

    return {
      problemSolvingStyle: this.mapProblemSolvingStyle(problemSolvingAnswer),
      techComfort: this.mapTechComfort(techComfortAnswer),
      assemblyExperience: this.mapAssemblyExperience(assemblyExpAnswer),
      errorHandlingStyle: this.mapErrorHandling(errorHandlingAnswer),
      gamingFrequency: this.mapGamingFrequency(gamingAnswer)
    };
  }

 
  private looksLikeProblemSolving(value: string): boolean {
    if (!value) return false;
    const patterns = [
      /sistematic/, /planific/, /metodic/, /organizat/, /pas cu pas/,
      /explorator/, /experimentez/, /încerc/, /spontan/,
      /echilibrat/, /combin/, /balansat/, /abordare/, /rezolv/
    ];
    return patterns.some(pattern => pattern.test(value));
  }

  private looksLikeTechComfort(value: string): boolean {
    if (!value) return false;
    const patterns = [
      /tehnolog/, /computer/, /tech/, /digital/,
      /ușor/, /dificil/, /confortabil/, /expert/, /profesionist/,
      /învăț/, /descurc/, /probleme/, /instrucțiuni/, /gadget/
    ];
    return patterns.some(pattern => pattern.test(value));
  }

  private looksLikeAssemblyExperience(value: string): boolean {
    if (!value) return false;
    const patterns = [
      /asambl/, /assembly/, /construit/, /built/, /montat/,
      /calculat/, /computer/, /pc/, /hardware/,
      /experiență/, /experience/, /expert/, /prima/, /first/, /niciodată/, /never/
    ];
    return patterns.some(pattern => pattern.test(value));
  }

  private looksLikeErrorHandling(value: string): boolean {
    if (!value) return false;
    const patterns = [
      /greșeal/, /error/, /problemă/, /issue/,
      /rapid/, /quick/, /imediat/, /analizez/, /gândesc/,
      /restart/, /reiau/, /ajutor/, /help/, /frustrez/, /enervez/
    ];
    return patterns.some(pattern => pattern.test(value));
  }

  private looksLikeGaming(value: string): boolean {
    if (!value) return false;
    const patterns = [
      /joc/, /gaming/, /game/, /play/,
      /zilnic/, /daily/, /săptămân/, /weekly/, /ocazional/, /occasional/,
      /multe ore/, /hours/, /niciodată/, /never/, /deloc/
    ];
    return patterns.some(pattern => pattern.test(value));
  }

  
  private mapAgeGroup(value: string): string {
    console.log(`🔍 Mapping age from: "${value}"`);
    if (!value) return '19_25';
    
   
    const numberMatch = value.match(/\d+/);
    if (numberMatch) {
      const age = parseInt(numberMatch[0]);
      if (age < 16) return 'under_16';
      if (age >= 16 && age <= 18) return '16_18';
      if (age >= 19 && age <= 25) return '19_25';
      if (age >= 26 && age <= 35) return '26_35';
      if (age >= 36 && age <= 45) return '36_45';
      if (age >= 46 && age <= 55) return '46_55';
      if (age > 55) return 'over_55';
    }
    
    if (value.includes('19') && value.includes('25')) return '19_25';
    if (value.includes('26') && value.includes('35')) return '26_35';
    
    return '19_25';
  }

  private mapGender(value: string): string {
    console.log(`🔍 Mapping gender from: "${value}"`);
    if (!value) return 'N/A';
    
    if (value.includes('masculin') || value.includes('male') || value.includes('bărbat') || value === 'm') return 'M';
    if (value.includes('feminin') || value.includes('female') || value.includes('femeie') || value === 'f') return 'F';
    return 'N/A';
  }

  private mapEducation(value: string): string {
    console.log(`🔍 Mapping education from: "${value}"`);
    if (!value) return 'highschool_completed';
    
    if (value.includes('licență') || value.includes('bachelor') || value.includes('facultate') || value.includes('universitate')) return 'bachelor';
    if (value.includes('master') || value.includes('masterat')) return 'master';
    if (value.includes('doctorat') || value.includes('phd')) return 'phd';
    if (value.includes('liceu') || value.includes('high school')) return 'highschool_completed';
    return 'highschool_completed';
  }

  private mapOccupation(value: string): string {
    console.log(`🔍 Mapping occupation from: "${value}"`);
    if (!value) return 'other';
    
    if (value.includes('student') || value.includes('elev')) return 'student';
    if (value.includes('it') || value.includes('programator') || value.includes('developer') || value.includes('tech')) return 'tech';
    if (value.includes('inginer') || value.includes('engineering')) return 'engineering';
    if (value.includes('profesor') || value.includes('teacher')) return 'education';
    return 'other';
  }

  private mapStemFamiliarity(value: string): string {
    console.log(`🔍 Mapping STEM from: "${value}"`);
    if (!value) return 'stem_moderate';
    
    if (value.includes('expert') || value.includes('foarte familiar')) return 'stem_expert';
    if (value.includes('familiar') || value.includes('experiență')) return 'stem_familiar';
    if (value.includes('moderat') || value.includes('ceva cunoștințe')) return 'stem_moderate';
    return 'stem_moderate';
  }

  private mapProblemSolvingStyle(value: string): string {
    if (!value) return 'balanced';
    if (value.includes('sistematic') || value.includes('planific')) return 'systematic';
    if (value.includes('explorator') || value.includes('experimentez')) return 'exploratory';
    return 'balanced';
  }

  private mapTechComfort(value: string): string {
    if (!value) return 'tech_moderate';
    if (value.includes('expert') || value.includes('foarte ușor')) return 'tech_expert';
    if (value.includes('confortabil') || value.includes('bine')) return 'tech_comfortable';
    if (value.includes('dificil') || value.includes('greu')) return 'tech_basic';
    return 'tech_moderate';
  }

  private mapAssemblyExperience(value: string): string {
    if (!value) return 'assembly_rare';
    if (value.includes('expert') || value.includes('multe') || value.includes('calculatoare')) return 'assembly_expert';
    if (value.includes('ceva') || value.includes('câteva')) return 'assembly_some';
    if (value.includes('fără') || value.includes('niciodată') || value.includes('prima')) return 'assembly_none';
    return 'assembly_rare';
  }

  private mapErrorHandling(value: string): string {
    if (!value) return 'analytical';
    if (value.includes('rapid') || value.includes('imediat')) return 'quick_retry';
    if (value.includes('analizez') || value.includes('gândesc')) return 'analytical';
    if (value.includes('restart') || value.includes('reiau')) return 'restart';
    if (value.includes('ajutor') || value.includes('întreb')) return 'seek_help';
    if (value.includes('frustrez') || value.includes('enervez')) return 'frustrated';
    return 'analytical';
  }

  private mapGamingFrequency(value: string): string {
    if (!value) return 'gaming_occasional';
    if (value.includes('multe ore') || value.includes('3+')) return 'gaming_heavy';
    if (value.includes('zilnic') || value.includes('daily')) return 'gaming_daily';
    if (value.includes('săptămân') || value.includes('weekly')) return 'gaming_weekly';
    if (value.includes('niciodată') || value.includes('never') || value.includes('deloc')) return 'gaming_never';
    return 'gaming_occasional';
  }

  private generateSimpleMetrics(assembly: any, behavioral: any, demographic: any): any {
    const timeSpent = assembly.timeSpent || 120;
    const correctness = assembly.correctnessPercentage || 70;
    
    const speedIndex = Math.max(0, Math.min(1, (300 - timeSpent) / 300));
    const precisionIndex = correctness / 100;
    const efficiencyIndex = (speedIndex + precisionIndex) / 2;
    
    return {
      speedIndex: Number(speedIndex.toFixed(2)),
      precisionIndex: Number(precisionIndex.toFixed(2)),
      efficiencyIndex: Number(efficiencyIndex.toFixed(2)),
      confidenceIndex: behavioral?.techComfort === 'tech_expert' ? 0.9 : 0.5,
      systematicIndex: behavioral?.problemSolvingStyle === 'systematic' ? 0.8 : 0.5,
      persistenceIndex: 0.6,
      adaptabilityIndex: 0.5,
      explorationIndex: behavioral?.problemSolvingStyle === 'exploratory' ? 0.8 : 0.4,
      planningIndex: behavioral?.problemSolvingStyle === 'systematic' ? 0.8 : 0.5,
      recoveryIndex: 0.5,
      impulsivityIndex: behavioral?.errorHandlingStyle === 'quick_retry' ? 0.7 : 0.3,
      frustrationTolerance: 0.7,
      technicalAptitude: demographic?.occupation === 'tech' ? 0.8 : 0.5
    };
  }

 
  async recomputeMetricsForExistingResponses(surveyId?: number): Promise<void> {
    console.log('🔄 Recomputing metrics with IMPROVED mapping...');
    
    let query = this.responseRepo.createQueryBuilder('response')
      .leftJoinAndSelect('response.survey', 'survey')
      .where('response.isComplete = :isComplete', { isComplete: true });
    
    if (surveyId) {
      query = query.andWhere('survey.id = :surveyId', { surveyId });
    }
    
    const responses = await query.getMany();
    console.log(`Found ${responses.length} responses to process`);
    
    for (const response of responses) {
      try {
        console.log(`\n--- Processing response ${response.id} ---`);
        console.log('Original answers:', JSON.stringify(response.answers, null, 2));
        
        const behavioralProfile = this.extractBehavioralProfile(response.answers);
        const demographicProfile = this.extractDemographicProfile(response.answers);
        let computedMetrics = null;
        
        if (response.assembly) {
          computedMetrics = this.generateSimpleMetrics(response.assembly, behavioralProfile, demographicProfile);
        }

        const updateData: any = {};
        
        if (behavioralProfile) {
          updateData.behavioralProfile = behavioralProfile;
        }
        
        if (demographicProfile) {
          updateData.demographicProfile = demographicProfile;
        }
        
        if (computedMetrics) {
          updateData.computedMetrics = computedMetrics;
        }
        
        if (Object.keys(updateData).length > 0) {
          await this.responseRepo.update(response.id, updateData);
          console.log(`✅ Updated response ${response.id} with:`, {
            demographic: demographicProfile,
            behavioral: behavioralProfile
          });
        }
        
      } catch (error) {
        console.error(`❌ Error processing response ${response.id}:`, error);
      }
    }
    
    console.log('✅ Metrics recomputation completed');
  }
}