// Simple Fisher's Exact Test Service - backend/src/clustering/simple-fisher.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Response } from '../survey/response.entity';
import { Survey } from '../survey/survey.entity';

// Simple interfaces for results - using export to fix TypeScript errors
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

  /**
   * Very simple Fisher test: which questions are most important for a cluster?
   */
  async getSignificantQuestionsForCluster(surveyId: number, clusterId: number): Promise<ClusterQuestionAnalysis> {
    console.log(`🔬 Simple Fisher test for cluster ${clusterId} in survey ${surveyId}`);
    
    // Get survey to know question texts
    const survey = await this.surveyRepo.findOne({ where: { id: surveyId } });
    if (!survey) {
      throw new Error(`Survey ${surveyId} not found`);
    }

    // Get all responses with cluster assignments
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

    // Get question texts from survey
    const questionTexts = this.getQuestionTexts(survey);
    
    // Test each question
    const results: SimpleQuestionResult[] = [];
    
    // Check questions 1-10 (most common demographic/behavioral questions)
    for (let questionNum = 1; questionNum <= 10; questionNum++) {
      const questionKey = questionNum.toString();
      
      // Get all unique answers for this question
      const uniqueAnswers = this.getUniqueAnswersForQuestion(responses, questionKey);
      
      // Test each unique answer
      for (const answer of uniqueAnswers) {
        const contingencyTable = this.buildContingencyTable(responses, questionKey, answer, clusterId);
        
        // Only test if we have enough data
        if (this.hasEnoughDataForTest(contingencyTable)) {
          const pValue = this.calculateSimpleFisherPValue(contingencyTable);
          
          // Only include if somewhat significant (p < 0.1)
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

    // Sort by significance (lowest p-value first)
    results.sort((a, b) => a.pValue - b.pValue);

    return {
      clusterId,
      significantQuestions: results.slice(0, 5), // Top 5 most significant
      totalQuestionsAnalyzed: 10
    };
  }

  /**
   * Get question texts from survey
   */
  private getQuestionTexts(survey: Survey): Record<string, string> {
    const texts: Record<string, string> = {};
    
    if (survey.questions && Array.isArray(survey.questions)) {
      survey.questions.forEach((question, index) => {
        texts[(index + 1).toString()] = question.questionText || `Întrebarea ${index + 1}`;
      });
    }
    
    return texts;
  }

  /**
   * Get all unique answers for a question (simplified)
   */
  private getUniqueAnswersForQuestion(responses: Response[], questionKey: string): (string | null)[] {
    const uniqueAnswers = new Set<string | null>();
    
    responses.forEach(response => {
      if (response.answers && response.answers[questionKey]) {
        let answer = response.answers[questionKey];
        
        // Normalize answer
        if (typeof answer === 'string') {
          answer = answer.toLowerCase().trim();
        } else if (Array.isArray(answer) && answer.length > 0) {
          answer = String(answer[0]).toLowerCase().trim();
        } else {
          answer = String(answer).toLowerCase().trim();
        }
        
        uniqueAnswers.add(answer);
      } else {
        uniqueAnswers.add(null); // No answer
      }
    });
    
    return Array.from(uniqueAnswers);
  }

  /**
   * Build 2x2 contingency table
   */
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
        
        // Normalize
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
      
      // Fill contingency table
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

  /**
   * Check if we have enough data for a meaningful test
   */
  private hasEnoughDataForTest(table: SimpleContingencyTable): boolean {
    const { inClusterWithAnswer, notInClusterWithAnswer, inClusterWithoutAnswer, notInClusterWithoutAnswer } = table;
    
    const total = inClusterWithAnswer + notInClusterWithAnswer + inClusterWithoutAnswer + notInClusterWithoutAnswer;
    const clusterSize = inClusterWithAnswer + inClusterWithoutAnswer;
    const answersCount = inClusterWithAnswer + notInClusterWithAnswer;
    
    // Need at least 4 total responses, at least 2 in cluster, at least 2 with this answer
    return total >= 4 && clusterSize >= 2 && answersCount >= 1;
  }

  /**
   * Simple Fisher's exact test calculation
   */
  private calculateSimpleFisherPValue(table: SimpleContingencyTable): number {
    const { inClusterWithAnswer: a, notInClusterWithAnswer: b, inClusterWithoutAnswer: c, notInClusterWithoutAnswer: d } = table;
    
    console.log(`Fisher test table: a=${a}, b=${b}, c=${c}, d=${d}`);
    
    // For very small samples, use exact calculation
    const total = a + b + c + d;
    if (total <= 20) {
      return this.exactFisherPValue(a, b, c, d);
    }
    
    // For larger samples, use chi-square approximation
    return this.chiSquareApproximation(a, b, c, d);
  }

  /**
   * Exact Fisher p-value for small samples
   */
  private exactFisherPValue(a: number, b: number, c: number, d: number): number {
    const n1 = a + b; // Row 1 total
    const n2 = c + d; // Row 2 total
    const m1 = a + c; // Column 1 total
    const n = n1 + n2; // Grand total
    
    if (n === 0 || m1 === 0) return 1.0;
    
    // Calculate probability of observed table
    const pObserved = this.hypergeometricProbability(a, n1, m1, n);
    
    // Calculate probabilities of all more extreme tables
    let pValue = 0;
    const minA = Math.max(0, n1 - (n - m1));
    const maxA = Math.min(n1, m1);
    
    for (let i = minA; i <= maxA; i++) {
      const prob = this.hypergeometricProbability(i, n1, m1, n);
      if (prob <= pObserved + 1e-10) { // Small tolerance for floating point
        pValue += prob;
      }
    }
    
    return Math.min(pValue, 1.0);
  }

  /**
   * Hypergeometric probability
   */
  private hypergeometricProbability(k: number, n: number, K: number, N: number): number {
    if (k < 0 || k > n || k > K || n - k > N - K) return 0;
    
    // P(X=k) = C(K,k) * C(N-K,n-k) / C(N,n)
    const numerator = this.combination(K, k) * this.combination(N - K, n - k);
    const denominator = this.combination(N, n);
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calculate combination C(n,k) = n! / (k! * (n-k)!)
   */
  private combination(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    
    // Use the smaller of k and n-k for efficiency
    k = Math.min(k, n - k);
    
    let result = 1;
    for (let i = 0; i < k; i++) {
      result *= (n - i) / (i + 1);
    }
    
    return Math.round(result);
  }

  /**
   * Chi-square approximation for larger samples
   */
  private chiSquareApproximation(a: number, b: number, c: number, d: number): number {
    const n = a + b + c + d;
    const n1 = a + b;
    const n2 = c + d;
    const m1 = a + c;
    const m2 = b + d;
    
    if (n === 0) return 1.0;
    
    // Expected frequencies
    const eA = (n1 * m1) / n;
    const eB = (n1 * m2) / n;
    const eC = (n2 * m1) / n;
    const eD = (n2 * m2) / n;
    
    // Avoid division by zero
    if (eA === 0 || eB === 0 || eC === 0 || eD === 0) {
      return 1.0;
    }
    
    // Chi-square with Yates' continuity correction
    const chiSquare = Math.pow(Math.abs(a - eA) - 0.5, 2) / eA +
                      Math.pow(Math.abs(b - eB) - 0.5, 2) / eB +
                      Math.pow(Math.abs(c - eC) - 0.5, 2) / eC +
                      Math.pow(Math.abs(d - eD) - 0.5, 2) / eD;
    
    // Convert to p-value (approximation)
    if (chiSquare < 3.84) return 0.05;  // p > 0.05
    if (chiSquare < 6.64) return 0.01;  // p between 0.01 and 0.05
    if (chiSquare < 10.83) return 0.001; // p between 0.001 and 0.01
    return 0.0001; // p < 0.001
  }

  /**
   * Create simple explanation of results
   */
  private createSimpleExplanation(table: SimpleContingencyTable, answer: string | null, pValue: number): string {
    const { inClusterWithAnswer, notInClusterWithAnswer, inClusterWithoutAnswer } = table;
    
    const clusterTotal = inClusterWithAnswer + inClusterWithoutAnswer;
    const clusterPercentage = clusterTotal > 0 ? (inClusterWithAnswer / clusterTotal * 100).toFixed(1) : '0';
    
    const otherTotal = notInClusterWithAnswer + table.notInClusterWithoutAnswer;
    const otherPercentage = otherTotal > 0 ? (notInClusterWithAnswer / otherTotal * 100).toFixed(1) : '0';
    
    let explanation = `Răspunsul "${answer || 'necompletat'}" apare la ${clusterPercentage}% din membrii acestui cluster `;
    explanation += `vs ${otherPercentage}% din ceilalți participanți. `;
    
    if (pValue < 0.01) {
      explanation += 'Diferența este FOARTE SEMNIFICATIVĂ statistik.';
    } else if (pValue < 0.05) {
      explanation += 'Diferența este SEMNIFICATIVĂ statistik.';
    } else {
      explanation += 'Diferența este potențial relevantă.';
    }
    
    return explanation;
  }

  /**
   * Simple method to get all cluster significant questions for a survey
   */
  async getAllClustersSignificantQuestions(surveyId: number): Promise<AllClustersAnalysis> {
    console.log(`🔬 Getting significant questions for all clusters in survey ${surveyId}`);
    
    // Get all cluster IDs
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