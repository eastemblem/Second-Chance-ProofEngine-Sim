import { appLogger } from '../utils/logger';

export interface ConsistencyCheckResult {
  isValid: boolean;
  errors: ConsistencyError[];
  warnings: ConsistencyWarning[];
  score: number; // Consistency score out of 100
}

export interface ConsistencyError {
  type: 'founder_not_found' | 'company_name_mismatch' | 'industry_mismatch' | 'critical_data_missing';
  message: string;
  details?: any;
}

export interface ConsistencyWarning {
  type: 'venture_stage_mismatch' | 'team_size_variance' | 'revenue_inconsistency';
  message: string;
  details?: any;
}

export interface OnboardingData {
  founder: {
    fullName: string;
    email: string;
    positionRole: string;
  };
  venture: {
    name: string;
    industry: string;
    revenueStage: string;
    mvpStatus: string;
    geography: string;
  };
}

export interface PitchDeckAnalysis {
  output?: {
    team?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    business_model?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    market_opportunity?: {
      score: number;
      justification: string;
      related_slides: string[];
      recommendation: string;
    };
    total_score: number;
    overall_feedback?: string[];
  };
  // Legacy fallback properties
  score?: number;
  total_score?: number;
  analysis?: any;
}

export class ConsistencyValidationService {
  
  /**
   * Validate consistency between onboarding data and pitch deck analysis
   */
  static validateConsistency(
    onboardingData: OnboardingData, 
    pitchDeckAnalysis: PitchDeckAnalysis
  ): ConsistencyCheckResult {
    const errors: ConsistencyError[] = [];
    const warnings: ConsistencyWarning[] = [];
    let score = 100;

    appLogger.business('Starting consistency validation', { 
      founderName: onboardingData.founder.fullName,
      ventureName: onboardingData.venture.name 
    });

    // Extract text content from pitch deck analysis for validation
    const analysisText = this.extractAnalysisText(pitchDeckAnalysis);
    
    // 1. Validate founder presence in team
    const founderValidation = this.validateFounderInTeam(onboardingData.founder, analysisText);
    if (!founderValidation.isValid) {
      errors.push({
        type: 'founder_not_found',
        message: 'Founder information is missing from the team section. Ensure you\'re listed as a team member in your pitch deck.',
        details: { founderName: onboardingData.founder.fullName }
      });
      score -= 30;
    }

    // 2. Validate company name consistency
    const companyValidation = this.validateCompanyName(onboardingData.venture.name, analysisText);
    if (!companyValidation.isValid) {
      errors.push({
        type: 'company_name_mismatch',
        message: 'Company name in your pitch doesn\'t match your registration. Please verify your information matches.',
        details: { 
          registeredName: onboardingData.venture.name,
          suggestion: 'Ensure your pitch deck shows the same company name you registered with'
        }
      });
      score -= 25;
    }

    // 3. Validate industry consistency
    const industryValidation = this.validateIndustry(onboardingData.venture.industry, analysisText);
    if (!industryValidation.isValid) {
      errors.push({
        type: 'industry_mismatch',
        message: 'Industry details in your pitch don\'t align with your selected industry. Please ensure consistency.',
        details: { 
          selectedIndustry: onboardingData.venture.industry,
          suggestion: 'Update either your industry selection or pitch deck content to match'
        }
      });
      score -= 20;
    }

    // 4. Warning checks (less critical)
    const stageWarning = this.validateVentureStage(onboardingData.venture.mvpStatus, analysisText);
    if (!stageWarning.isValid) {
      warnings.push({
        type: 'venture_stage_mismatch',
        message: 'Your venture stage selection may not match what\'s described in the pitch deck.',
        details: { registeredStage: onboardingData.venture.mvpStatus }
      });
      score -= 10;
    }

    const revenueWarning = this.validateRevenueStage(onboardingData.venture.revenueStage, analysisText);
    if (!revenueWarning.isValid) {
      warnings.push({
        type: 'revenue_inconsistency',
        message: 'Revenue information in your pitch may not align with your selected revenue stage.',
        details: { registeredRevenue: onboardingData.venture.revenueStage }
      });
      score -= 10;
    }

    const result: ConsistencyCheckResult = {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score)
    };

    appLogger.business('Consistency validation completed', { 
      isValid: result.isValid,
      score: result.score,
      errorCount: errors.length,
      warningCount: warnings.length
    });

    return result;
  }

  /**
   * Extract all text content from pitch deck analysis for validation
   */
  private static extractAnalysisText(analysis: PitchDeckAnalysis): string {
    const textParts: string[] = [];

    if (analysis.output) {
      // Extract justifications from all dimensions
      Object.values(analysis.output).forEach(dimension => {
        if (dimension && typeof dimension === 'object' && 'justification' in dimension) {
          textParts.push(dimension.justification);
        }
      });

      // Add overall feedback
      if (analysis.output.overall_feedback) {
        textParts.push(...analysis.output.overall_feedback);
      }
    }

    // Add legacy analysis if available
    if (analysis.analysis) {
      textParts.push(JSON.stringify(analysis.analysis));
    }

    return textParts.join(' ').toLowerCase();
  }

  /**
   * Check if founder name appears in team-related content
   */
  private static validateFounderInTeam(founder: { fullName: string; positionRole: string }, analysisText: string): { isValid: boolean } {
    const nameParts = founder.fullName.toLowerCase().split(' ');
    const firstNameRegex = new RegExp(`\\b${nameParts[0]}\\b`, 'i');
    const lastNameRegex = nameParts.length > 1 ? new RegExp(`\\b${nameParts[nameParts.length - 1]}\\b`, 'i') : null;
    
    // Check for founder name in analysis text
    const hasFirstName = firstNameRegex.test(analysisText);
    const hasLastName = lastNameRegex ? lastNameRegex.test(analysisText) : true;
    
    // Check for CEO/founder role indicators
    const roleKeywords = ['ceo', 'founder', 'co-founder', 'cofounder', 'chief executive', 'president'];
    const hasFounderRole = roleKeywords.some(keyword => analysisText.includes(keyword));
    
    // Consider valid if name is present OR if founder role is mentioned
    const isValid = (hasFirstName && hasLastName) || hasFounderRole;
    
    return { isValid };
  }

  /**
   * Check if company name appears in analysis content
   */
  private static validateCompanyName(companyName: string, analysisText: string): { isValid: boolean } {
    const companyLower = companyName.toLowerCase();
    
    // Direct name match
    if (analysisText.includes(companyLower)) {
      return { isValid: true };
    }
    
    // Check for partial matches (for companies with common words)
    const significantWords = companyLower.split(' ').filter(word => 
      word.length > 3 && !['inc', 'ltd', 'llc', 'corp', 'company', 'the'].includes(word)
    );
    
    const hasSignificantMatch = significantWords.length > 0 && 
      significantWords.some(word => analysisText.includes(word));
    
    return { isValid: hasSignificantMatch };
  }

  /**
   * Check if industry is reflected in analysis content
   */
  private static validateIndustry(industry: string, analysisText: string): { isValid: boolean } {
    const industryKeywords = this.getIndustryKeywords(industry);
    const hasIndustryMatch = industryKeywords.some(keyword => analysisText.includes(keyword.toLowerCase()));
    
    return { isValid: hasIndustryMatch };
  }

  /**
   * Check if venture stage aligns with analysis
   */
  private static validateVentureStage(mvpStatus: string, analysisText: string): { isValid: boolean } {
    const stageKeywords = this.getStageKeywords(mvpStatus);
    const hasStageMatch = stageKeywords.some(keyword => analysisText.includes(keyword.toLowerCase()));
    
    return { isValid: hasStageMatch };
  }

  /**
   * Check if revenue stage matches analysis
   */
  private static validateRevenueStage(revenueStage: string, analysisText: string): { isValid: boolean } {
    const revenueKeywords = this.getRevenueKeywords(revenueStage);
    const hasRevenueMatch = revenueKeywords.some(keyword => analysisText.includes(keyword.toLowerCase()));
    
    return { isValid: hasRevenueMatch };
  }

  /**
   * Get keywords associated with different industries
   */
  private static getIndustryKeywords(industry: string): string[] {
    const industryMap: { [key: string]: string[] } = {
      'Technology': ['tech', 'software', 'platform', 'app', 'digital', 'ai', 'machine learning', 'saas'],
      'Healthcare': ['health', 'medical', 'patient', 'clinic', 'hospital', 'medicine', 'wellness'],
      'Finance': ['financial', 'banking', 'payment', 'fintech', 'investment', 'money', 'credit'],
      'Education': ['education', 'learning', 'student', 'school', 'university', 'course', 'training'],
      'E-commerce': ['ecommerce', 'retail', 'shopping', 'marketplace', 'store', 'purchase', 'selling'],
      'Manufacturing': ['manufacturing', 'production', 'factory', 'industrial', 'supply chain'],
      'Real Estate': ['real estate', 'property', 'housing', 'construction', 'building'],
      'Energy': ['energy', 'renewable', 'solar', 'electric', 'power', 'sustainability'],
      'Transportation': ['transport', 'logistics', 'delivery', 'shipping', 'mobility', 'automotive']
    };
    
    return industryMap[industry] || [industry.toLowerCase()];
  }

  /**
   * Get keywords associated with different venture stages
   */
  private static getStageKeywords(mvpStatus: string): string[] {
    const stageMap: { [key: string]: string[] } = {
      'Mockup': ['mockup', 'prototype', 'concept', 'design', 'wireframe', 'early stage'],
      'MVP': ['mvp', 'minimum viable product', 'beta', 'pilot', 'testing'],
      'Product': ['launched', 'product', 'live', 'operational', 'customers', 'users'],
      'Scale': ['scaling', 'growth', 'expansion', 'series', 'established', 'mature']
    };
    
    return stageMap[mvpStatus] || [mvpStatus.toLowerCase()];
  }

  /**
   * Get keywords associated with different revenue stages
   */
  private static getRevenueKeywords(revenueStage: string): string[] {
    const revenueMap: { [key: string]: string[] } = {
      'None': ['pre-revenue', 'no revenue', 'startup', 'early', 'concept'],
      'Under $10K': ['revenue', 'early revenue', 'initial sales', 'first customers'],
      '$10K - $100K': ['revenue', 'growing', 'sales', 'customers', 'mrr'],
      '$100K - $1M': ['revenue', 'established', 'profitable', 'growth', 'scale'],
      'Over $1M': ['million', 'established business', 'profitable', 'series', 'funding']
    };
    
    return revenueMap[revenueStage] || ['revenue'];
  }

  /**
   * Generate user-friendly error message for UI display
   */
  static getDisplayMessage(result: ConsistencyCheckResult): string {
    if (result.isValid) {
      return 'Your details match the pitch deck information perfectly!';
    }

    const criticalErrors = result.errors.filter(e => 
      e.type === 'founder_not_found' || e.type === 'company_name_mismatch'
    );

    if (criticalErrors.length > 0) {
      return 'Your details don\'t match the pitch deck information. Please upload a document that represents your venture.';
    }

    return 'Some details in your pitch don\'t align with your registration. Please review and ensure consistency.';
  }
}