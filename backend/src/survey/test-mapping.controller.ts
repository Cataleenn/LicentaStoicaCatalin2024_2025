// Test Mapping Controller - backend/src/survey/test-mapping.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';

interface TestMappingDto {
  answers: Record<string, any>;
}

@Controller('test-mapping')
export class TestMappingController {
  constructor() {}

  /**
   * Test endpoint pentru verificarea mapării demografice și comportamentale
   */
  @Post('demographics')
  async testDemographicMapping(@Body() dto: TestMappingDto) {
    console.log('🧪 Testing demographic mapping with answers:', JSON.stringify(dto.answers, null, 2));
    
    try {
      // Test simplu pentru mapare
      const mappedProfiles = this.testMapping(dto.answers);
      
      console.log('📊 Demographic mapping results:', JSON.stringify(mappedProfiles.demographic, null, 2));
      console.log('🧠 Behavioral mapping results:', JSON.stringify(mappedProfiles.behavioral, null, 2));
      
      return {
        success: true,
        message: 'Mapping test completed successfully',
        data: {
          originalAnswers: dto.answers,
          mappedProfiles: mappedProfiles,
          mappingAnalysis: {
            answersCount: Object.keys(dto.answers).length,
            answersKeys: Object.keys(dto.answers),
            demographicFieldsCount: Object.keys(mappedProfiles.demographic).length,
            behavioralFieldsCount: Object.keys(mappedProfiles.behavioral).length
          }
        }
      };
    } catch (error) {
      console.error('❌ Error in mapping test:', error);
      return {
        success: false,
        error: error.message,
        message: 'Mapping test failed'
      };
    }
  }

  /**
   * Test individual field mapping
   */
  @Post('individual-field')
  async testIndividualFieldMapping(@Body() body: { field: string; value: string; type: 'demographic' | 'behavioral' }) {
    console.log(`🔍 Testing individual field mapping: ${body.field} = "${body.value}" (${body.type})`);
    
    try {
      let result: string;
      
      if (body.type === 'demographic') {
        switch (body.field) {
          case 'age':
            result = this.mapAgeGroup(body.value.toLowerCase());
            break;
          case 'gender':
            result = this.mapGender(body.value.toLowerCase());
            break;
          case 'education':
            result = this.mapEducation(body.value.toLowerCase());
            break;
          case 'occupation':
            result = this.mapOccupation(body.value.toLowerCase());
            break;
          case 'stem':
            result = this.mapStemFamiliarity(body.value.toLowerCase());
            break;
          default:
            throw new Error(`Unknown demographic field: ${body.field}`);
        }
      } else {
        switch (body.field) {
          case 'problemSolving':
            result = this.mapProblemSolvingStyle(body.value.toLowerCase());
            break;
          case 'techComfort':
            result = this.mapTechComfort(body.value.toLowerCase());
            break;
          case 'assemblyExperience':
            result = this.mapAssemblyExperience(body.value.toLowerCase());
            break;
          case 'errorHandling':
            result = this.mapErrorHandling(body.value.toLowerCase());
            break;
          case 'gaming':
            result = this.mapGamingFrequency(body.value.toLowerCase());
            break;
          default:
            throw new Error(`Unknown behavioral field: ${body.field}`);
        }
      }
      
      return {
        success: true,
        data: {
          field: body.field,
          type: body.type,
          originalValue: body.value,
          mappedValue: result,
          isDefaultValue: this.isDefaultValue(body.field, result)
        },
        message: 'Individual field mapping completed'
      };
    } catch (error) {
      console.error('❌ Error in individual field mapping:', error);
      return {
        success: false,
        error: error.message,
        message: 'Individual field mapping failed'
      };
    }
  }

  /**
   * Test mapare completă
   */
  private testMapping(answers: Record<string, any>) {
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

    // Extract values
    const ageAnswer = getAnswerValue('1');
    const genderAnswer = getAnswerValue('2');
    const educationAnswer = getAnswerValue('3');
    const occupationAnswer = getAnswerValue('4');
    const stemAnswer = getAnswerValue('5');

    const problemSolvingAnswer = getAnswerValue('6');
    const techComfortAnswer = getAnswerValue('7');
    const assemblyExpAnswer = getAnswerValue('8');
    const errorHandlingAnswer = getAnswerValue('9');
    const gamingAnswer = getAnswerValue('10');

    return {
      demographic: {
        ageGroup: this.mapAgeGroup(ageAnswer),
        gender: this.mapGender(genderAnswer),
        educationLevel: this.mapEducation(educationAnswer),
        occupation: this.mapOccupation(occupationAnswer),
        stemFamiliarity: this.mapStemFamiliarity(stemAnswer)
      },
      behavioral: {
        problemSolvingStyle: this.mapProblemSolvingStyle(problemSolvingAnswer),
        techComfort: this.mapTechComfort(techComfortAnswer),
        assemblyExperience: this.mapAssemblyExperience(assemblyExpAnswer),
        errorHandlingStyle: this.mapErrorHandling(errorHandlingAnswer),
        gamingFrequency: this.mapGamingFrequency(gamingAnswer)
      }
    };
  }

  // Mapping methods
  private mapAgeGroup(value: string): string {
    console.log(`🔍 Mapping age: "${value}"`);
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
    
    if (value.includes('licență') || value.includes('bachelor') || value.includes('facultate')) return 'bachelor';
    if (value.includes('master')) return 'master';
    if (value.includes('doctorat') || value.includes('phd')) return 'phd';
    return 'highschool_completed';
  }

  private mapOccupation(value: string): string {
    console.log(`🔍 Mapping occupation: "${value}"`);
    if (!value) return 'other';
    
    if (value.includes('student')) return 'student';
    if (value.includes('it') || value.includes('programator') || value.includes('tech')) return 'tech';
    if (value.includes('inginer')) return 'engineering';
    if (value.includes('profesor')) return 'education';
    return 'other';
  }

  private mapStemFamiliarity(value: string): string {
    console.log(`🔍 Mapping STEM: "${value}"`);
    if (!value) return 'stem_moderate';
    
    if (value.includes('expert')) return 'stem_expert';
    if (value.includes('familiar')) return 'stem_familiar';
    return 'stem_moderate';
  }

  private mapProblemSolvingStyle(value: string): string {
    if (!value) return 'balanced';
    if (value.includes('sistematic') || value.includes('planific')) return 'systematic';
    if (value.includes('explorator')) return 'exploratory';
    return 'balanced';
  }

  private mapTechComfort(value: string): string {
    if (!value) return 'tech_moderate';
    if (value.includes('expert')) return 'tech_expert';
    if (value.includes('confortabil')) return 'tech_comfortable';
    if (value.includes('dificil')) return 'tech_basic';
    return 'tech_moderate';
  }

  private mapAssemblyExperience(value: string): string {
    if (!value) return 'assembly_rare';
    if (value.includes('expert') || value.includes('multe')) return 'assembly_expert';
    if (value.includes('ceva')) return 'assembly_some';
    if (value.includes('niciodată')) return 'assembly_none';
    return 'assembly_rare';
  }

  private mapErrorHandling(value: string): string {
    if (!value) return 'analytical';
    if (value.includes('rapid')) return 'quick_retry';
    if (value.includes('analizez')) return 'analytical';
    if (value.includes('restart')) return 'restart';
    if (value.includes('ajutor')) return 'seek_help';
    if (value.includes('frustrez')) return 'frustrated';
    return 'analytical';
  }

  private mapGamingFrequency(value: string): string {
    if (!value) return 'gaming_occasional';
    if (value.includes('multe ore')) return 'gaming_heavy';
    if (value.includes('zilnic')) return 'gaming_daily';
    if (value.includes('săptămân')) return 'gaming_weekly';
    if (value.includes('niciodată')) return 'gaming_never';
    return 'gaming_occasional';
  }

  private isDefaultValue(field: string, value: string): boolean {
    const defaults: Record<string, string> = {
      'age': '19_25',
      'gender': 'N/A',
      'education': 'highschool_completed',
      'occupation': 'other',
      'stem': 'stem_moderate'
    };
    
    return defaults[field] === value;
  }
}