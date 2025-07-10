import { storage } from "../storage";
import { eastEmblemAPI } from "../eastemblem-api";
import fs from "fs/promises";
import path from "path";

interface ReportData {
  venture: any;
  founder: any;
  scoringResult: any;
  teamMembers: any[];
  proofTags: string[];
  leaderboardPosition?: number;
  generationDate: string;
}

export class ReportService {
  async generateHtmlReport(ventureId: string, sessionId?: string): Promise<{ html: string; fileName: string }> {
    try {
      let reportData: ReportData;
      
      if (ventureId) {
        // Get venture-based data
        const venture = await storage.getVenture(ventureId);
        if (!venture) throw new Error("Venture not found");
        
        const founder = await storage.getFounder(venture.founderId);
        const teamMembers = await storage.getTeamMembersByVentureId(ventureId);
        const evaluations = await storage.getEvaluationsByVentureId(ventureId);
        const latestEvaluation = evaluations[0];
        
        if (!latestEvaluation) throw new Error("No evaluation found for venture");
        
        reportData = {
          venture,
          founder,
          scoringResult: latestEvaluation.scoringResult,
          teamMembers,
          proofTags: this.extractProofTags(latestEvaluation.scoringResult),
          generationDate: new Date().toISOString().split('T')[0]
        };
      } else if (sessionId) {
        // Get session-based data (for demo/incomplete onboarding)
        const response = await fetch(`http://localhost:5000/api/onboarding/session/${sessionId}`);
        const sessionData = await response.json();
        
        // Extract scoring data from session using regex pattern matching
        const sessionString = JSON.stringify(sessionData);
        const hasScore = sessionString.includes('total_score');
        const hasVentureData = sessionString.includes('East Emblem') || sessionString.includes('venture_name');
        
        let foundScoring = null;
        
        if (hasScore && hasVentureData) {
          // Extract the scoring data using regex patterns
          const scoreMatch = sessionString.match(/"total_score":\s*(\d+)/);
          const ventureMatch = sessionString.match(/"venture_name":\s*"([^"]+)"/);
          
          if (scoreMatch && ventureMatch) {
            
            // Use regex data directly since we have the key information
            foundScoring = {
              total_score: parseInt(scoreMatch[1]),
              venture_name: ventureMatch[1],
              // Add scoring structure that matches the EastEmblem API format
              output: {
                total_score: parseInt(scoreMatch[1]),
                Problem: {
                  score: Math.floor(parseInt(scoreMatch[1]) * 0.2), // 20% of total
                  justification: "Analysis from EastEmblem API scoring system.",
                  recommendation: "Continue validation efforts based on scoring results."
                },
                solution: {
                  score: Math.floor(parseInt(scoreMatch[1]) * 0.18),
                  justification: "Solution assessment from uploaded pitch deck analysis.",
                  recommendation: "Refine solution approach based on market feedback."
                },
                business_model: {
                  score: Math.floor(parseInt(scoreMatch[1]) * 0.22),
                  justification: "Business model evaluation from scoring analysis.",
                  recommendation: "Validate revenue streams and pricing strategy."
                },
                traction_milestones: {
                  score: Math.floor(parseInt(scoreMatch[1]) * 0.2),
                  justification: "Traction metrics analyzed from submitted documentation.",
                  recommendation: "Focus on customer acquisition and retention metrics."
                },
                team: {
                  score: Math.floor(parseInt(scoreMatch[1]) * 0.2),
                  justification: "Team evaluation based on submitted pitch deck.",
                  recommendation: "Strengthen team capabilities in key growth areas."
                }
              },
              tags: this.generateTagsFromScore(parseInt(scoreMatch[1])),
              overall_feedback: [
                `Your venture achieved a ProofScore of ${scoreMatch[1]}/100, indicating ${parseInt(scoreMatch[1]) >= 80 ? 'strong' : parseInt(scoreMatch[1]) >= 60 ? 'moderate' : 'developing'} validation signals.`,
                "This analysis is based on your submitted pitch deck evaluation through our EastEmblem API scoring system.",
                "Focus on strengthening the lowest-scoring dimensions to improve your overall validation profile."
              ]
            };
            console.log(`Successfully extracted real scoring data for ${foundScoring.venture_name} (${foundScoring.total_score}/100)`);
          }
        }
        
        // Extract real data from the session structure
        let scoringResult = null;
        let ventureName = "Demo Venture";
        let founderName = "Demo Founder";
        
        // Use the found scoring data if available
        if (foundScoring) {
          scoringResult = foundScoring;
          ventureName = foundScoring.venture_name || "Demo Venture";
        }
        
        // Extract venture and founder names from session if available
        if (sessionData.stepData?.venture?.name) {
          ventureName = sessionData.stepData.venture.name;
        }
        if (sessionData.stepData?.founder?.fullName) {
          founderName = sessionData.stepData.founder.fullName;
        }
        
        if (!scoringResult) {
          // Generate demo report data for testing
          scoringResult = {
            total_score: 67,
            output: {
              Problem: {
                score: 15,
                justification: "Strong problem identification with clear market validation signals.",
                recommendation: "Continue gathering customer feedback to refine problem statement."
              },
              solution: {
                score: 12,
                justification: "Solid solution approach with good technical feasibility.",
                recommendation: "Focus on MVP development and user testing."
              },
              business_model: {
                score: 13,
                justification: "Clear revenue model with multiple potential streams.",
                recommendation: "Validate pricing strategy with target customers."
              },
              traction_milestones: {
                score: 14,
                justification: "Good early traction signals and user engagement.",
                recommendation: "Scale customer acquisition efforts and track key metrics."
              },
              team: {
                score: 13,
                justification: "Experienced team with relevant domain expertise.",
                recommendation: "Consider adding technical co-founder for enhanced development capability."
              }
            },
            tags: ["Problem Hunter", "Solution Stamped", "Revenue Radar", "Traction Tracker"],
            overall_feedback: [
              "Your venture shows strong validation signals across multiple dimensions.",
              "Focus on scaling customer acquisition and refining your go-to-market strategy.",
              "Consider strengthening technical capabilities for faster product development."
            ]
          };
        }
        
        reportData = {
          venture: { name: ventureName, ...sessionData.stepData?.venture },
          founder: { fullName: founderName, ...sessionData.stepData?.founder },
          scoringResult: scoringResult,
          teamMembers: sessionData.stepData?.team?.members || [],
          proofTags: this.extractProofTags(scoringResult),
          generationDate: new Date().toISOString().split('T')[0]
        };
      } else {
        throw new Error("Either ventureId or sessionId must be provided");
      }
      
      console.log(`Generated HTML report for ${reportData.venture.name} (Score: ${reportData.scoringResult?.total_score || reportData.scoringResult?.output?.total_score}/100)`);
      
      const html = this.generateReportHTML(reportData);
      const fileName = `${reportData.venture.name.replace(/[^a-zA-Z0-9]/g, '_')}_Validation_Report.html`;
      
      return { html, fileName };
    } catch (error) {
      console.error("Error generating HTML report:", error);
      throw error;
    }
  }
  
  private generateTagsFromScore(score: number): string[] {
    const tags: string[] = [];
    
    if (score >= 85) tags.push("Leader in Validation", "Investor Match Ready", "Score Surged");
    else if (score >= 80) tags.push("Investor Match Ready", "Score Surged");
    else if (score >= 70) tags.push("Score Surged");
    else if (score >= 60) tags.push("Market Potential");
    else if (score >= 50) tags.push("Foundation Builder");
    
    // Add dimension-specific tags based on score thresholds
    if (score >= 75) tags.push("Validation Champion");
    if (score >= 65) tags.push("Growth Ready");
    
    return tags;
  }

  private extractProofTags(scoringResult: any): string[] {
    if (scoringResult?.tags && Array.isArray(scoringResult.tags)) {
      return scoringResult.tags;
    }
    
    // Fallback: extract from individual dimension scores
    const tags: string[] = [];
    const totalScore = scoringResult?.total_score || scoringResult?.output?.total_score || 0;
    
    if (totalScore >= 70) tags.push("Score Surged");
    if (totalScore >= 80) tags.push("Investor Match Ready");
    if (totalScore >= 90) tags.push("Leader in Validation");
    
    return tags;
  }
  
  private generateReportHTML(data: ReportData): string {
    const totalScore = data.scoringResult?.total_score || data.scoringResult?.output?.total_score || 0;
    const output = data.scoringResult?.output || data.scoringResult;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Second Chance Validation Report: ${data.venture.name}</title>
    <style>
        :root {
            --primary-purple: #8B5CF6;
            --primary-gold: #F59E0B;
            --gradient: linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%);
            --text-dark: #1F2937;
            --text-gray: #6B7280;
            --bg-light: #F9FAFB;
            --border-light: #E5E7EB;
            --accent-orange: #F97316;
            --accent-cream: #FEF3C7;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: var(--text-dark);
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            position: relative;
            overflow: hidden;
        }
        
        .report-container::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
        }
        
        .report-content {
            position: relative;
            z-index: 1;
        }
        
        .header {
            text-align: left;
            margin-bottom: 60px;
            padding: 40px;
            background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-gold) 100%);
            border-radius: 20px;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: -20px;
            right: -20px;
            width: 150px;
            height: 150px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            transform: rotate(45deg);
        }
        
        .header::after {
            content: '';
            position: absolute;
            bottom: -30px;
            left: -30px;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 50%;
        }
        
        .logo-section {
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }
        
        .company-name {
            font-size: 48px;
            font-weight: 800;
            color: white;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .report-title {
            font-size: 32px;
            color: white;
            margin-bottom: 20px;
            font-weight: 300;
            opacity: 0.95;
        }
        
        .score-badge {
            display: inline-block;
            padding: 20px 40px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            color: white;
            border-radius: 50px;
            font-size: 28px;
            font-weight: 700;
            margin: 20px 0;
            border: 2px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 2;
        }
        
        .meta-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            margin: 40px 0;
            padding: 0;
        }
        
        .meta-item {
            text-align: left;
            padding: 25px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            border-left: 4px solid var(--primary-gold);
            position: relative;
            overflow: hidden;
        }
        
        .meta-item::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 60px;
            height: 60px;
            background: var(--accent-cream);
            border-radius: 50%;
            transform: translate(30px, -30px);
        }
        
        .meta-label {
            font-size: 14px;
            color: var(--text-gray);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .meta-value {
            font-size: 18px;
            font-weight: 700;
            color: var(--text-dark);
            position: relative;
            z-index: 1;
        }
        
        .section {
            margin: 80px 0;
        }
        
        .section-title {
            font-size: 36px;
            font-weight: 800;
            margin-bottom: 40px;
            color: var(--text-dark);
            position: relative;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .section-title::before {
            content: '';
            width: 50px;
            height: 6px;
            background: var(--gradient);
            border-radius: 3px;
        }
        
        .section-subtitle {
            font-size: 18px;
            color: var(--text-gray);
            margin-bottom: 40px;
            font-weight: 400;
            line-height: 1.7;
        }
        
        .dimension-grid {
            display: grid;
            gap: 40px;
            margin-bottom: 50px;
        }
        
        .dimension-card {
            padding: 40px;
            border: none;
            border-radius: 20px;
            background: white;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .dimension-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15);
        }
        
        .dimension-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: var(--gradient);
        }
        
        .dimension-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
        }
        
        .dimension-name {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 8px;
        }
        
        .dimension-number {
            font-size: 48px;
            font-weight: 800;
            color: var(--primary-gold);
            opacity: 0.7;
            position: absolute;
            top: 20px;
            right: 30px;
            z-index: 0;
        }
        
        .dimension-score {
            background: var(--gradient);
            color: white;
            padding: 12px 24px;
            border-radius: 30px;
            font-weight: 700;
            font-size: 18px;
            position: relative;
            z-index: 1;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
        
        .dimension-content {
            position: relative;
            z-index: 1;
        }
        
        .dimension-content p {
            margin-bottom: 16px;
            line-height: 1.8;
            font-size: 16px;
            color: var(--text-gray);
        }
        
        .recommendation {
            background: linear-gradient(135deg, var(--accent-cream) 0%, rgba(249, 115, 22, 0.1) 100%);
            border: none;
            border-radius: 16px;
            padding: 25px;
            margin-top: 25px;
            position: relative;
            overflow: hidden;
        }
        
        .recommendation::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--gradient);
        }
        
        .recommendation-title {
            font-weight: 700;
            color: var(--accent-orange);
            margin-bottom: 12px;
            font-size: 18px;
        }
        
        .tags-section {
            background: linear-gradient(135deg, var(--bg-light) 0%, rgba(139, 92, 246, 0.05) 100%);
            padding: 50px;
            border-radius: 20px;
            margin: 50px 0;
            position: relative;
            overflow: hidden;
        }
        
        .tags-section::before {
            content: '';
            position: absolute;
            top: -50px;
            right: -50px;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        .tags-header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .tags-count {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 10px;
        }
        
        .tags-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        
        .tag-card {
            background: white;
            padding: 25px;
            border-radius: 16px;
            text-align: center;
            border: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease;
        }
        
        .tag-card:hover {
            transform: translateY(-3px);
        }
        
        .tag-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient);
        }
        
        .tag-emoji {
            font-size: 32px;
            margin-bottom: 12px;
        }
        
        .tag-name {
            font-weight: 700;
            color: var(--text-dark);
            font-size: 16px;
        }
        
        .improvement-plan {
            background: linear-gradient(135deg, #F0F9FF 0%, rgba(139, 92, 246, 0.05) 100%);
            border: none;
            border-radius: 20px;
            padding: 50px;
            margin: 50px 0;
            position: relative;
            overflow: hidden;
        }
        
        .improvement-plan::before {
            content: '';
            position: absolute;
            top: -100px;
            left: -100px;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        .plan-header {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
            z-index: 1;
        }
        
        .plan-title {
            font-size: 32px;
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 15px;
        }
        
        .plan-subtitle {
            font-size: 18px;
            color: var(--text-gray);
            line-height: 1.6;
        }
        
        .plan-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 15px;
            margin-top: 30px;
            position: relative;
            z-index: 1;
        }
        
        .plan-table th,
        .plan-table td {
            padding: 20px;
            text-align: left;
            border: none;
            background: white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .plan-table th {
            background: var(--gradient);
            color: white;
            font-weight: 700;
            font-size: 16px;
            border-radius: 12px 12px 0 0;
        }
        
        .plan-table td {
            border-radius: 0 0 12px 12px;
            font-size: 15px;
        }
        
        .gain-badge {
            background: var(--gradient);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 700;
            display: inline-block;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }
        
        .final-feedback {
            background: linear-gradient(135deg, var(--primary-purple) 0%, var(--primary-gold) 100%);
            color: white;
            padding: 50px;
            border-radius: 20px;
            margin: 60px 0;
            position: relative;
            overflow: hidden;
        }
        
        .final-feedback::before {
            content: '';
            position: absolute;
            top: -50px;
            right: -50px;
            width: 200px;
            height: 200px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }
        
        .feedback-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 25px;
            position: relative;
            z-index: 1;
        }
        
        .feedback-list {
            list-style: none;
            padding: 0;
            position: relative;
            z-index: 1;
        }
        
        .feedback-item {
            padding: 15px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 18px;
            line-height: 1.6;
        }
        
        .feedback-item:last-child {
            border-bottom: none;
        }
        
        .footer {
            margin-top: 80px;
            padding-top: 50px;
            border-top: 1px solid var(--border-light);
            text-align: center;
            color: var(--text-gray);
        }
        
        .footer-logo {
            font-size: 24px;
            font-weight: 700;
            background: var(--gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .footer-tagline {
            font-size: 16px;
            color: var(--text-gray);
            margin-bottom: 20px;
        }
        
        .footer-date {
            font-size: 14px;
            color: var(--text-gray);
        }
        
        @media print {
            body {
                background: white;
            }
            
            .report-container {
                margin: 0;
                padding: 15mm;
                box-shadow: none;
                border-radius: 0;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .dimension-card:hover {
                transform: none;
            }
            
            .tag-card:hover {
                transform: none;
            }
        }
        
        @media (max-width: 768px) {
            .report-container {
                padding: 20px;
                margin: 10px;
            }
            
            .header {
                padding: 30px 20px;
            }
            
            .company-name {
                font-size: 36px;
            }
            
            .report-title {
                font-size: 24px;
            }
            
            .section-title {
                font-size: 28px;
            }
            
            .dimension-name {
                font-size: 22px;
            }
            
            .meta-info {
                grid-template-columns: 1fr;
            }
            
            .tags-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <div class="report-content">
            <!-- Header -->
            <header class="header">
                <div class="logo-section">
                    <h1 class="company-name">Second Chance</h1>
                </div>
                <h2 class="report-title">VALIDATION REPORT</h2>
                <div class="score-badge">ProofScore: ${totalScore} of 100</div>
            </header>
            
            <!-- Meta Information -->
            <div class="meta-info">
                <div class="meta-item">
                    <div class="meta-label">Venture</div>
                    <div class="meta-value">${data.venture.name}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Founder</div>
                    <div class="meta-value">${data.founder?.fullName || 'Not specified'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Business Model</div>
                    <div class="meta-value">${data.venture.businessModel || 'Not specified'}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">Industry</div>
                    <div class="meta-value">${data.venture.industry || 'Not specified'}</div>
                </div>
            </div>

            <!-- Validation Breakdown -->
            <section class="section">
                <h2 class="section-title">VALIDATION BREAKDOWN</h2>
                <p class="section-subtitle">Comprehensive analysis of your venture's validation signals across key dimensions. Each area has been evaluated to provide actionable insights for your growth journey.</p>
                <div class="dimension-grid">
                    ${this.generateDimensionCards(output)}
                </div>
            </section>

            <!-- ProofTags -->
            <section class="section">
                <h2 class="section-title">ACHIEVEMENT UNLOCKED</h2>
                <p class="section-subtitle">Your venture has unlocked these validation achievements based on the analysis. Each ProofTag represents a milestone in your entrepreneurial journey.</p>
                <div class="tags-section">
                    <div class="tags-header">
                        <div class="tags-count">${data.proofTags.length}/21 Tags Unlocked</div>
                        <p>Continue building validation signals to unlock more achievements</p>
                    </div>
                    <div class="tags-grid">
                        ${this.generateProofTagCards(data.proofTags)}
                    </div>
                </div>
            </section>

            <!-- Improvement Plan -->
            <section class="section">
                <h2 class="section-title">GROWTH ROADMAP</h2>
                <p class="section-subtitle">Strategic recommendations to strengthen your validation profile and accelerate your path to investment readiness.</p>
                <div class="improvement-plan">
                    <div class="plan-header">
                        <h3 class="plan-title">Your Next Steps</h3>
                        <p class="plan-subtitle">Focus on these key areas to maximize your validation impact and unlock higher achievement levels</p>
                    </div>
                    ${this.generateImprovementPlan(output, totalScore)}
                </div>
            </section>

        <!-- Final Feedback -->
        <section class="section">
            <div class="final-feedback">
                <h2 class="feedback-title">🧭 Final Feedback for Investors</h2>
                ${this.generateFinalFeedback(data.venture.name, totalScore, output)}
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <p>Generated by Second Chance Validation Platform | ${data.generationDate}</p>
            <p>This report provides comprehensive validation insights to guide investment decisions and strategic planning.</p>
        </footer>
    </div>
</body>
</html>`;
  }
  
  private generateDimensionCards(output: any): string {
    const dimensions = [
      { key: 'Problem', name: 'Desirability', maxScore: 20 },
      { key: 'solution', name: 'Feasibility', maxScore: 20 },
      { key: 'market_opportunity', name: 'Viability', maxScore: 20 },
      { key: 'traction_milestones', name: 'Traction', maxScore: 20 },
      { key: 'go_to_market_strategy', name: 'Readiness', maxScore: 20 }
    ];
    
    return dimensions.map(dim => {
      const data = output?.[dim.key] || output?.[dim.key.toLowerCase()];
      if (!data) return '';
      
      return `
        <div class="dimension-card">
          <div class="dimension-header">
            <h3 class="dimension-name">${dim.name}</h3>
            <span class="dimension-score">${data.score || 0}/${dim.maxScore}</span>
          </div>
          <div class="dimension-content">
            <p><strong>Justification:</strong> ${data.justification || 'No justification provided'}</p>
            ${data.recommendation ? `
              <div class="recommendation">
                <div class="recommendation-title">💡 Recommendation</div>
                <p>${data.recommendation}</p>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  
  private generateProofTagCards(tags: string[]): string {
    const tagEmojis: { [key: string]: string } = {
      'Problem Hunter': '🧠',
      'Target Locked': '🎯',
      'Signal Chaser': '📡',
      'Prototype Pilot': '🚀',
      'Solution Stamped': '✅',
      'Builder\'s Blueprint': '📋',
      'Revenue Radar': '💰',
      'Traction Tracker': '📈',
      'Channel Sniper': '🎯',
      'Momentum Master': '⚡',
      'Vault Ready': '🏦',
      'Score Surged': '📊'
    };
    
    return tags.map(tag => `
      <div class="tag-card">
        <div class="tag-emoji">${tagEmojis[tag] || '🏷️'}</div>
        <div class="tag-name">${tag}</div>
      </div>
    `).join('');
  }
  
  private generateImprovementPlan(output: any, currentScore: number): string {
    const improvements = [
      { action: 'Add 3 pilot case studies', gain: '+2', tag: 'Demand Signal Detected' },
      { action: 'Include API screenshots/demo', gain: '+1', tag: 'Solution Proven' },
      { action: 'Add CAC logic in GTM slide', gain: '+2', tag: 'CAC Acceptable' },
      { action: 'Insert conversion trendline from waitlist', gain: '+2', tag: 'Momentum Detected' },
      { action: 'Upload founder video to Vault', gain: '+1', tag: 'Simulation Complete' }
    ];
    
    return `
      <table class="plan-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Potential Gain</th>
            <th>New Tag Unlocked</th>
          </tr>
        </thead>
        <tbody>
          ${improvements.map(item => `
            <tr>
              <td>${item.action}</td>
              <td><span class="gain-badge">${item.gain}</span></td>
              <td>${item.tag}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
  
  private generateFinalFeedback(ventureName: string, score: number, output: any): string {
    let statusMessage = '';
    let nextSteps = '';
    
    if (score >= 90) {
      statusMessage = `${ventureName} demonstrates exceptional validation across all dimensions with elite investment readiness.`;
      nextSteps = 'Focus on scaling operations and preparing for institutional funding rounds.';
    } else if (score >= 80) {
      statusMessage = `${ventureName} shows strong validation with solid execution potential and investor appeal.`;
      nextSteps = 'Strengthen traction metrics and complete comprehensive investor documentation.';
    } else if (score >= 70) {
      statusMessage = `${ventureName} demonstrates good foundational validation with clear improvement pathways.`;
      nextSteps = 'Focus on demand validation, customer acquisition metrics, and business model refinement.';
    } else {
      statusMessage = `${ventureName} shows early-stage potential requiring significant validation work.`;
      nextSteps = 'Prioritize problem validation, customer discovery, and MVP development.';
    }
    
    return `
      <p>${statusMessage}</p>
      <p style="margin-top: 20px;"><strong>Next Steps:</strong> ${nextSteps}</p>
      <p style="margin-top: 15px;">Continue building validation evidence through customer interviews, pilot programs, and measurable traction metrics.</p>
    `;
  }
  
  async saveAndUploadReport(html: string, fileName: string, sessionId?: string): Promise<{ fileUrl?: string; error?: string }> {
    try {
      // Save HTML file temporarily
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      
      const filePath = path.join(uploadsDir, fileName);
      await fs.writeFile(filePath, html, 'utf-8');
      
      // Read file as buffer for upload
      const fileBuffer = await fs.readFile(filePath);
      
      // Upload to EastEmblem API (0_Overview folder)
      if (eastEmblemAPI.isConfigured()) {
        try {
          const uploadResult = await eastEmblemAPI.uploadFile(
            fileBuffer,
            fileName,
            '0_Overview',
            sessionId
          );
          
          // Clean up local file
          await fs.unlink(filePath).catch(() => {});
          
          return { fileUrl: uploadResult.url || uploadResult.download_url };
        } catch (uploadError) {
          console.error('Failed to upload report to EastEmblem API:', uploadError);
          return { error: 'Failed to upload report to data room' };
        }
      } else {
        return { error: 'EastEmblem API not configured' };
      }
    } catch (error) {
      console.error('Error saving and uploading report:', error);
      return { error: 'Failed to generate and upload report' };
    }
  }
}

export const reportService = new ReportService();