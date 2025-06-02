// Simple Debug Controller - backend/src/survey/simple-debug.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Response } from './response.entity';

@Controller('simple-debug')
export class SimpleDebugController {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepo: Repository<Response>
  ) {}

  /**
   * Debug - arată exact ce ajunge în backend
   */
  @Post('check-raw-data')
  async checkRawData(@Body() body: any) {
    console.log('\n🔍 === RAW DATA DEBUG ===');
    console.log('📦 Full request body:', JSON.stringify(body, null, 2));
    console.log('📝 Body type:', typeof body);
    console.log('📋 Body keys:', Object.keys(body));
    
    if (body.answers) {
      console.log('\n📊 ANSWERS ANALYSIS:');
      console.log('📝 Answers type:', typeof body.answers);
      console.log('📋 Answers keys:', Object.keys(body.answers));
      console.log('📊 Answers content:', JSON.stringify(body.answers, null, 2));
      
      // Analizează fiecare răspuns
      Object.entries(body.answers).forEach(([key, value]) => {
        console.log(`\n🔍 Key "${key}":`);
        console.log(`   Type: ${typeof value}`);
        console.log(`   Value: ${JSON.stringify(value)}`);
        console.log(`   IsArray: ${Array.isArray(value)}`);
        console.log(`   IsEmpty: ${!value || value === '' || (Array.isArray(value) && value.length === 0)}`);
        
        if (Array.isArray(value) && value.length > 0) {
          console.log(`   First element: ${JSON.stringify(value[0])}`);
          console.log(`   First element type: ${typeof value[0]}`);
        }
      });
    }

    // Test rapid de mapare
    const testMapping = this.quickTestMapping(body.answers || {});
    
    return {
      success: true,
      receivedData: body,
      analysis: {
        hasAnswers: !!body.answers,
        answersType: typeof body.answers,
        answersKeys: body.answers ? Object.keys(body.answers) : [],
        totalAnswers: body.answers ? Object.keys(body.answers).length : 0
      },
      testMapping,
      message: 'Raw data analysis completed - check console logs'
    };
  }

  /**
   * Test rapid de mapare
   */
  private quickTestMapping(answers: Record<string, any>) {
    const results: any = {};
    
    // Test mapare pentru primele 5 răspunsuri
    for (let i = 1; i <= 5; i++) {
      const key = i.toString();
      const rawValue = answers[key];
      
      results[`question_${i}`] = {
        key,
        rawValue,
        rawType: typeof rawValue,
        isArray: Array.isArray(rawValue),
        processedValue: this.processValue(rawValue),
        mapping: this.quickMap(i, this.processValue(rawValue))
      };
    }
    
    return results;
  }

  /**
   * Procesează valoarea ca în serviciul real
   */
  private processValue(rawValue: any): string {
    if (!rawValue) return '';
    
    if (typeof rawValue === 'string') {
      return rawValue.toLowerCase().trim();
    }
    
    if (Array.isArray(rawValue) && rawValue.length > 0) {
      return String(rawValue[0]).toLowerCase().trim();
    }
    
    return String(rawValue).toLowerCase().trim();
  }

  /**
   * Test rapid mapare
   */
  private quickMap(questionIndex: number, value: string): string {
    if (!value) return 'EMPTY_VALUE';
    
    switch (questionIndex) {
      case 1: // Age
        if (value.includes('19') || value.includes('20') || value.includes('21') || value.includes('22') || value.includes('23') || value.includes('24') || value.includes('25')) {
          return '19_25';
        }
        if (value.includes('26') || value.includes('30') || value.includes('35')) {
          return '26_35';
        }
        return 'DEFAULT_19_25';
        
      case 2: // Gender  
        if (value.includes('masculin') || value.includes('male') || value.includes('bărbat')) {
          return 'M';
        }
        if (value.includes('feminin') || value.includes('female') || value.includes('femeie')) {
          return 'F';
        }
        return 'DEFAULT_NA';
        
      case 3: // Education
        if (value.includes('student') || value.includes('facultate') || value.includes('universitate')) {
          return 'bachelor';
        }
        if (value.includes('liceu') || value.includes('high school')) {
          return 'highschool_completed';
        }
        return 'DEFAULT_HIGHSCHOOL';
        
      case 4: // Occupation
        if (value.includes('student')) {
          return 'student';
        }
        if (value.includes('it') || value.includes('programator') || value.includes('tech')) {
          return 'tech';
        }
        return 'DEFAULT_OTHER';
        
      case 5: // STEM
        if (value.includes('expert') || value.includes('familiar')) {
          return 'stem_familiar';
        }
        return 'DEFAULT_MODERATE';
        
      default:
        return 'UNKNOWN_QUESTION';
    }
  }

  /**
   * Verifică ultimele răspunsuri din DB
   */
  @Get('last-responses/:count')
  async getLastResponses(@Param('count') count: number = 3) {
    console.log(`\n🔍 Getting last ${count} responses from DB...`);
    
    try {
      const responses = await this.responseRepo.find({
        order: { createdAt: 'DESC' },
        take: count,
        relations: ['survey']
      });

      console.log(`Found ${responses.length} responses`);

      const debugInfo = responses.map(response => {
        console.log(`\n--- Response ${response.id} ---`);
        console.log('📊 Raw answers:', JSON.stringify(response.answers, null, 2));
        console.log('📋 Demographic profile:', JSON.stringify(response.demographicProfile, null, 2));
        console.log('🧠 Behavioral profile:', JSON.stringify(response.behavioralProfile, null, 2));
        console.log('📈 Has computed metrics:', !!response.computedMetrics);

        return {
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
                processed: this.processValue(value)
              })) : []
          }
        };
      });

      return {
        success: true,
        responsesFound: responses.length,
        debugInfo,
        message: `Last ${count} responses analyzed - check console for details`
      };
    } catch (error) {
      console.error('❌ Error getting responses:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simulează exact ce face enhanced service
   */
  @Post('simulate-enhanced-service')
  async simulateEnhancedService(@Body() body: { answers: Record<string, any> }) {
    console.log('\n🧪 === SIMULATING ENHANCED SERVICE ===');
    console.log('📝 Input answers:', JSON.stringify(body.answers, null, 2));

    // Simulează exact logica din enhanced service
    const answers = body.answers || {};
    
    // Helper function to get answer value (exact copy from enhanced service)
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

    // Test pe toate cheile
    console.log('\n📋 Testing all answer keys:');
    const processedAnswers: any = {};
    Object.keys(answers).forEach(key => {
      processedAnswers[key] = getAnswerValue(key);
    });

    // Test mapare demografică
    const ageAnswer = getAnswerValue('1');
    const genderAnswer = getAnswerValue('2');
    const educationAnswer = getAnswerValue('3');
    const occupationAnswer = getAnswerValue('4');
    const stemAnswer = getAnswerValue('5');

    console.log('\n📊 Final extracted values:');
    console.log(`Age: "${ageAnswer}"`);
    console.log(`Gender: "${genderAnswer}"`);
    console.log(`Education: "${educationAnswer}"`);
    console.log(`Occupation: "${occupationAnswer}"`);
    console.log(`STEM: "${stemAnswer}"`);

    // Test mapare finală
    const mappedProfile = {
      ageGroup: this.mapAge(ageAnswer),
      gender: this.mapGender(genderAnswer),
      educationLevel: this.mapEducation(educationAnswer),
      occupation: this.mapOccupation(occupationAnswer),
      stemFamiliarity: this.mapSTEM(stemAnswer)
    };

    console.log('\n✅ Final mapped profile:', JSON.stringify(mappedProfile, null, 2));

    return {
      success: true,
      inputAnswers: answers,
      processedAnswers,
      extractedValues: {
        age: ageAnswer,
        gender: genderAnswer,
        education: educationAnswer,
        occupation: occupationAnswer,
        stem: stemAnswer
      },
      mappedProfile,
      message: 'Enhanced service simulation completed - check console'
    };
  }

  // Mapare simplificată pentru test
  private mapAge(value: string): string {
    console.log(`🔍 Mapping age: "${value}"`);
    if (!value) return '19_25';
    
    const numberMatch = value.match(/\d+/);
    if (numberMatch) {
      const age = parseInt(numberMatch[0]);
      if (age >= 19 && age <= 25) return '19_25';
      if (age >= 26 && age <= 35) return '26_35';
    }
    
    if (value.includes('19') && value.includes('25')) return '19_25';
    if (value.includes('26') && value.includes('35')) return '26_35';
    
    return '19_25';
  }

  private mapGender(value: string): string {
    console.log(`🔍 Mapping gender: "${value}"`);
    if (!value) return 'N/A';
    
    if (value.includes('masculin') || value.includes('male') || value.includes('bărbat')) return 'M';
    if (value.includes('feminin') || value.includes('female') || value.includes('femeie')) return 'F';
    
    return 'N/A';
  }

  private mapEducation(value: string): string {
    console.log(`🔍 Mapping education: "${value}"`);
    if (!value) return 'highschool_completed';
    
    if (value.includes('student') || value.includes('facultate') || value.includes('licență')) return 'bachelor';
    if (value.includes('master')) return 'master';
    
    return 'highschool_completed';
  }

  private mapOccupation(value: string): string {
    console.log(`🔍 Mapping occupation: "${value}"`);
    if (!value) return 'other';
    
    if (value.includes('student')) return 'student';
    if (value.includes('it') || value.includes('programator') || value.includes('tech')) return 'tech';
    
    return 'other';
  }

  private mapSTEM(value: string): string {
    console.log(`🔍 Mapping STEM: "${value}"`);
    if (!value) return 'stem_moderate';
    
    if (value.includes('expert')) return 'stem_expert';
    if (value.includes('familiar')) return 'stem_familiar';
    
    return 'stem_moderate';
  }
}

// INSTRUCȚIUNI PENTRU UTILIZARE:
// 1. Adaugă acest controller în survey.module.ts
// 2. Folosește aceste endpoint-uri pentru debugging:

/*
TESTARE:

1. Verifică ce ajunge în backend:
POST /api/simple-debug/check-raw-data
{
  "formId": 1,
  "userId": 1,
  "answers": {
    "1": "19-25 ani",
    "2": "Masculin"
  },
  "isComplete": true
}

2. Simulează enhanced service:
POST /api/simple-debug/simulate-enhanced-service
{
  "answers": {
    "1": "19-25 ani", 
    "2": "Masculin",
    "3": "Student",
    "4": "IT",
    "5": "Expert"
  }
}

3. Verifică ultimele răspunsuri din DB:
GET /api/simple-debug/last-responses/3

4. După ce trimiți un răspuns din frontend, rulează imediat:
GET /api/simple-debug/last-responses/1
pentru a vedea exact ce s-a salvat în DB
*/