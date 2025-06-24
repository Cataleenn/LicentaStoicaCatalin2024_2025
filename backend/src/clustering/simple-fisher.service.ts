
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Response } from '../survey/response.entity';
import { Survey } from '../survey/survey.entity';


export interface SimpleContingencyTable {
  inClusterWithAnswer: number;    // a
  notInClusterWithAnswer: number; // b  
  inClusterWithoutAnswer: number; // c
  notInClusterWithoutAnswer: number; // d
}

export interface SimpleQuestionResult {
  questionNumber: string;
  questionText: string;
  answerValue: string;
  pValue: number;
  isSignificant: boolean;
  explanation: string;
}

export interface ClusterQuestionAnalysis {
  clusterId: number;
  significantQuestions: SimpleQuestionResult[];
  totalQuestionsAnalyzed: number;
}

export interface AllClustersAnalysis {
  surveyId: number;
  clusters: ClusterQuestionAnalysis[];
}

@Injectable()
export class SimpleFisherService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepo: Repository<Response>,
    @InjectRepository(Survey)
    private readonly surveyRepo: Repository<Survey>
  ) {}

 
  async getSignificantQuestionsForCluster(surveyId: number, clusterId: number): Promise<ClusterQuestionAnalysis> {
    console.log(`Simple Fisher test for cluster ${clusterId} in survey ${surveyId}`);
    

    const survey = await this.surveyRepo.findOne({ where: { id: surveyId } });
    if (!survey) {
      throw new Error(`Survey ${surveyId} not found`);
    }

  
    const responses = await this.responseRepo.find({
      where: {
        survey: { id: surveyId },
        isComplete: true,
        clusterAssignment: Not(IsNull())
      }
    });

    if (responses.length < 4) {
      throw new Error('Not enough responses for Fisher test');
    }

    console.log(`Found ${responses.length} responses to analyze`);

 
    const questionTexts = this.getQuestionTexts(survey);
    

    const results: SimpleQuestionResult[] = [];
    
 
    for (let questionNum = 1; questionNum <= 10; questionNum++) {
      const questionKey = questionNum.toString();
      
    
      const uniqueAnswers = this.getUniqueAnswersForQuestion(responses, questionKey);
      
   
      for (const answer of uniqueAnswers) {
        const contingencyTable = this.buildContingencyTable(responses, questionKey, answer, clusterId);
        
        
        if (this.hasEnoughDataForTest(contingencyTable)) {
          const pValue = this.calculateSimpleFisherPValue(contingencyTable);
          
          
          if (pValue < 0.1) {
            results.push({
              questionNumber: questionKey,
              questionText: questionTexts[questionKey] || `Întrebarea ${questionKey}`,
              answerValue: answer || 'necompletat',
              pValue: pValue,
              isSignificant: pValue < 0.05,
              explanation: this.createSimpleExplanation(contingencyTable, answer, pValue)
            });
          }
        }
      }
    }


    results.sort((a, b) => a.pValue - b.pValue);

    return {
      clusterId,
      significantQuestions: results.slice(0, 5), 
      totalQuestionsAnalyzed: 10
    };
  }


  private getQuestionTexts(survey: Survey): Record<string, string> {
    const texts: Record<string, string> = {};
    
    if (survey.questions && Array.isArray(survey.questions)) {
      survey.questions.forEach((question, index) => {
        texts[(index + 1).toString()] = question.questionText || `Întrebarea ${index + 1}`;
      });
    }
    
    return texts;
  }

 
  private getUniqueAnswersForQuestion(responses: Response[], questionKey: string): (string | null)[] {
    const uniqueAnswers = new Set<string | null>();
    
    responses.forEach(response => {
      if (response.answers && response.answers[questionKey]) {
        let answer = response.answers[questionKey];
        
        if (typeof answer === 'string') {
          answer = answer.toLowerCase().trim();
        } else if (Array.isArray(answer) && answer.length > 0) {
          answer = String(answer[0]).toLowerCase().trim();
        } else {
          answer = String(answer).toLowerCase().trim();
        }
        
        uniqueAnswers.add(answer);
      } else {
        uniqueAnswers.add(null); 
      }
    });
    
    return Array.from(uniqueAnswers);
  }

 
  private buildContingencyTable(
    responses: Response[], 
    questionKey: string, 
    targetAnswer: string | null, 
    targetClusterId: number
  ): SimpleContingencyTable {
    
    let a = 0; // In cluster & has this answer
    let b = 0; // Not in cluster & has this answer  
    let c = 0; // In cluster & doesn't have this answer
    let d = 0; // Not in cluster & doesn't have this answer
    
    responses.forEach(response => {
      const isInTargetCluster = response.clusterAssignment === targetClusterId;
      
      let hasTargetAnswer = false;
      if (response.answers && response.answers[questionKey]) {
        let answer = response.answers[questionKey];
        
       
        if (typeof answer === 'string') {
          answer = answer.toLowerCase().trim();
        } else if (Array.isArray(answer) && answer.length > 0) {
          answer = String(answer[0]).toLowerCase().trim();
        } else {
          answer = String(answer).toLowerCase().trim();
        }
        
        hasTargetAnswer = (answer === targetAnswer);
      } else {
        hasTargetAnswer = (targetAnswer === null);
      }
      
      if (isInTargetCluster && hasTargetAnswer) {
        a++;
      } else if (!isInTargetCluster && hasTargetAnswer) {
        b++;
      } else if (isInTargetCluster && !hasTargetAnswer) {
        c++;
      } else {
        d++;
      }
    });
    
    return {
      inClusterWithAnswer: a,
      notInClusterWithAnswer: b,
      inClusterWithoutAnswer: c,
      notInClusterWithoutAnswer: d
    };
  }

  private hasEnoughDataForTest(table: SimpleContingencyTable): boolean {
    const { inClusterWithAnswer, notInClusterWithAnswer, inClusterWithoutAnswer, notInClusterWithoutAnswer } = table;
    
    const total = inClusterWithAnswer + notInClusterWithAnswer + inClusterWithoutAnswer + notInClusterWithoutAnswer;
    const clusterSize = inClusterWithAnswer + inClusterWithoutAnswer;
    const answersCount = inClusterWithAnswer + notInClusterWithAnswer;
    
    
    return total >= 4 && clusterSize >= 2 && answersCount >= 1;
  }

  private calculateSimpleFisherPValue(table: SimpleContingencyTable): number {
    const { inClusterWithAnswer: a, notInClusterWithAnswer: b, inClusterWithoutAnswer: c, notInClusterWithoutAnswer: d } = table;
    
    console.log(`Fisher test table: a=${a}, b=${b}, c=${c}, d=${d}`);

    
    return this.exactFisherPValue(a, b, c, d);
    
   
    //return this.chiSquareApproximation(a, b, c, d);
  }

  
  private exactFisherPValue(a: number, b: number, c: number, d: number): number {
    const n1 = a + b; // Row 1 total
    const n2 = c + d; // Row 2 total
    const m1 = a + c; // Column 1 total
    const n = n1 + n2; // Grand total
    
    if (n === 0 || m1 === 0) return 1.0;
    
   
    const pObserved = this.hypergeometricProbability(a, n1, m1, n);
    
   
    let pValue = 0;
    const minA = Math.max(0, n1 - (n - m1));
    const maxA = Math.min(n1, m1);
    
    for (let i = minA; i <= maxA; i++) {
      const prob = this.hypergeometricProbability(i, n1, m1, n);
      if (prob <= pObserved + 1e-10) { 
        pValue += prob;
      }
    }
    console.log(`p-value= ${pValue}`)
    return Math.min(pValue, 1.0);
  }

  
  private hypergeometricProbability(k: number, n: number, K: number, N: number): number {
    if (k < 0 || k > n || k > K || n - k > N - K) return 0;
    
    // P(X=k) = C(K,k) * C(N-K,n-k) / C(N,n)
    const numerator = this.combination(K, k) * this.combination(N - K, n - k);
    const denominator = this.combination(N, n);
    
    return denominator > 0 ? numerator / denominator : 0;
  }
   
  private combination(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    
    k = Math.min(k, n - k);
    
    let result = 1;
    for (let i = 0; i < k; i++) {
      result *= (n - i) / (i + 1);
    }
    
    return Math.round(result);
  }

  private createSimpleExplanation(table: SimpleContingencyTable, answer: string | null, pValue: number): string {
    const { inClusterWithAnswer, notInClusterWithAnswer, inClusterWithoutAnswer } = table;
    
    const clusterTotal = inClusterWithAnswer + inClusterWithoutAnswer;
    const clusterPercentage = clusterTotal > 0 ? (inClusterWithAnswer / clusterTotal * 100).toFixed(1) : '0';
    
    const otherTotal = notInClusterWithAnswer + table.notInClusterWithoutAnswer;
    const otherPercentage = otherTotal > 0 ? (notInClusterWithAnswer / otherTotal * 100).toFixed(1) : '0';
    
    let explanation = `Răspunsul "${answer || 'necompletat'}" apare la ${clusterPercentage}% din membrii acestui cluster `;
    explanation += `vs ${otherPercentage}% din ceilalți participanți. `;
    
    if (pValue < 0.01) {
      explanation += 'Diferența este FOARTE SEMNIFICATIVĂ statistic.';
    } else if (pValue < 0.05) {
      explanation += 'Diferența este SEMNIFICATIVĂ statistic.';
    } else {
      explanation += 'Diferența este potențial relevantă.';
    }
    
    return explanation;
  }


  async getAllClustersSignificantQuestions(surveyId: number): Promise<AllClustersAnalysis> {
    console.log(` Getting significant questions for all clusters in survey ${surveyId}`);
    
    const responses = await this.responseRepo.find({
      where: {
        survey: { id: surveyId },
        isComplete: true,
        clusterAssignment: Not(IsNull())
      }
    });

    const clusterIds = [...new Set(responses
      .map(r => r.clusterAssignment)
      .filter(c => c !== null && c !== undefined) as number[]
    )];

    console.log(`Found clusters: ${clusterIds.join(', ')}`);

    const clusters: ClusterQuestionAnalysis[] = [];
    for (const clusterId of clusterIds) {
      try {
        const result = await this.getSignificantQuestionsForCluster(surveyId, clusterId);
        clusters.push(result);
      } catch (error) {
        console.error(`Error analyzing cluster ${clusterId}:`, error.message);
        clusters.push({
          clusterId,
          significantQuestions: [],
          totalQuestionsAnalyzed: 0
        });
      }
    }

    return {
      surveyId,
      clusters
    };
  }
}