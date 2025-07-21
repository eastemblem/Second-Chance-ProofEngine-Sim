import { useState } from "react";
import { Link } from "wouter";
import { ArrowUp, Mail, ExternalLink, Shield, Users, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const Terms = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle scroll for back-to-top button
  useState(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  });

  const sections = [
    { id: "introduction", title: "Introduction", number: "1" },
    { id: "definitions", title: "Definitions", number: "2" },
    { id: "acceptance", title: "Acceptance of Terms", number: "3" },
    { id: "platform-description", title: "Platform Description", number: "4" },
    { id: "user-accounts", title: "User Accounts and Registration", number: "5" },
    { id: "permitted-use", title: "Permitted Use of the Platform", number: "6" },
    { id: "prohibited-activities", title: "Prohibited Activities", number: "7" },
    { id: "content-submissions", title: "Content Submissions and Intellectual Property", number: "8" },
    { id: "proofscore-system", title: "ProofScore System and AI-Generated Content", number: "9" },
    { id: "investor-matching", title: "Investor Matching and Introductions", number: "10" },
    { id: "fees-payment", title: "Fees and Payment Terms", number: "11" },
    { id: "data-privacy", title: "Data Privacy and Protection", number: "12" },
    { id: "disclaimers", title: "Disclaimers and Limitations", number: "13" },
    { id: "liability", title: "Limitation of Liability", number: "14" },
    { id: "indemnification", title: "Indemnification", number: "15" },
    { id: "termination", title: "Termination", number: "16" },
    { id: "governing-law", title: "Governing Law and Dispute Resolution", number: "17" },
    { id: "modifications", title: "Modifications to Terms", number: "18" },
    { id: "contact", title: "Contact Information", number: "19" },
  ];

  const SectionCard = ({
    id,
    title,
    number,
    children,
  }: {
    id: string;
    title: string;
    number: string;
    children: React.ReactNode;
  }) => {
    return (
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center text-white text-sm font-bold">
              {number}
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              {title}
            </h2>
          </div>
          
          <div className="text-muted-foreground leading-relaxed">
            {children}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary-gold/10 border-b">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent mb-4"
            >
              Terms and Conditions
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <p className="text-sm text-muted-foreground mb-1">Effective Date: 15th July 2025</p>
              <p className="text-sm text-muted-foreground">Last Updated: 15th July 2025</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6"
            >
              <Link to="/">
                <Button variant="outline" className="hover:bg-primary/10">
                  ← Back to Platform
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        <div className="flex gap-8">
          {/* Sticky Table of Contents - Hidden on mobile */}
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-8">
              <Card className="p-4">
                <h3 className="font-semibold text-foreground mb-4">Table of Contents</h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left text-sm text-muted-foreground hover:text-primary transition-colors py-1 px-2 rounded hover:bg-primary/5"
                    >
                      {section.number}. {section.title}
                    </button>
                  ))}
                </nav>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Introduction */}
            <div id="introduction">
              <SectionCard id="introduction" title="Introduction" number="1">
                <div className="space-y-4">
                  <p>
                    Welcome to the Second Chance platform ("Platform"), operated by East Emblem Ltd 
                    ("East Emblem", "we", "us", or "our"), a company incorporated in the United Arab Emirates 
                    and licensed under MC 13353 in Masdar City Free Zone, Abu Dhabi.
                  </p>
                  
                  <p>
                    These Terms and Conditions ("Terms") constitute a legally binding agreement between you 
                    ("User", "you", or "your") and East Emblem Ltd regarding your access to and use of the 
                    Second Chance platform, including all associated services, features, and content.
                  </p>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Gavel className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-primary mb-1">Legal Agreement</p>
                        <p className="text-sm">
                          By accessing or using our Platform, you acknowledge that you have read, understood, 
                          and agree to be bound by these Terms, as well as our Privacy Policy.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Definitions */}
            <div id="definitions">
              <SectionCard id="definitions" title="Definitions" number="2">
                <div className="space-y-4">
                  <p>
                    For the purposes of these Terms, the following definitions apply:
                  </p>
                  
                  <div className="grid gap-4">
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">"Platform" or "Second Chance"</h4>
                      <p className="text-sm">
                        The comprehensive startup validation platform operated by East Emblem Ltd, including 
                        the website, mobile applications, APIs, and all associated services and features.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">"Founder"</h4>
                      <p className="text-sm">
                        An individual or entity that uses the Platform to submit their startup or business 
                        for evaluation, validation, and potential investor matching.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">"Investor"</h4>
                      <p className="text-sm">
                        An individual or entity that uses the Platform to discover, evaluate, and potentially 
                        invest in startups and businesses presented through our services.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">"ProofScore"</h4>
                      <p className="text-sm">
                        Our proprietary AI-powered evaluation system that assesses startup readiness across 
                        five dimensions: Desirability, Feasibility, Viability, Traction, and Readiness.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">"Content"</h4>
                      <p className="text-sm">
                        All information, data, text, documents, images, videos, pitch decks, business plans, 
                        and other materials submitted to or generated by the Platform.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Acceptance */}
            <div id="acceptance">
              <SectionCard id="acceptance" title="Acceptance of Terms" number="3">
                <div className="space-y-4">
                  <p>
                    By creating an account, accessing, or using any part of the Second Chance platform, 
                    you expressly acknowledge and agree that:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You have read and understood these Terms in their entirety</li>
                    <li>You accept and agree to be legally bound by these Terms</li>
                    <li>You have the legal authority to enter into this agreement</li>
                    <li>You will comply with all applicable laws and regulations</li>
                    <li>You understand the nature and risks of startup evaluation and investment activities</li>
                  </ul>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-medium text-amber-800 mb-2">Important Notice</p>
                    <p className="text-sm text-amber-700">
                      If you do not agree with any part of these Terms, you must not access or use the Platform. 
                      Continued use of the Platform constitutes acceptance of any modifications to these Terms.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Platform Description */}
            <div id="platform-description">
              <SectionCard id="platform-description" title="Platform Description" number="4">
                <div className="space-y-4">
                  <p>
                    The Second Chance platform is a comprehensive startup validation and investor-matching 
                    service that leverages artificial intelligence and expert analysis to:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">For Founders</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                        <li>Comprehensive startup evaluation and scoring</li>
                        <li>AI-powered business analysis and feedback</li>
                        <li>Investment readiness assessment</li>
                        <li>Investor matching and introduction services</li>
                        <li>ProofTags achievement system and gamification</li>
                      </ul>
                    </div>
                    
                    <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">For Investors</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                        <li>Curated startup discovery and evaluation</li>
                        <li>Advanced filtering and matching algorithms</li>
                        <li>Due diligence support and documentation</li>
                        <li>Deal flow management and tracking</li>
                        <li>Portfolio and investment analytics</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="font-medium text-primary mb-2">Service Availability</p>
                    <p className="text-sm">
                      We strive to maintain high availability of our Platform, but we do not guarantee 
                      uninterrupted access. Services may be temporarily unavailable due to maintenance, 
                      updates, or circumstances beyond our control.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* User Accounts */}
            <div id="user-accounts">
              <SectionCard id="user-accounts" title="User Accounts and Registration" number="5">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">5.1 Account Creation</h4>
                    <p className="mb-3">
                      To access certain features of the Platform, you must create an account. When registering, 
                      you must:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Provide accurate, current, and complete information</li>
                      <li>Maintain the accuracy of your account information</li>
                      <li>Choose a secure password and keep it confidential</li>
                      <li>Notify us immediately of any unauthorized use of your account</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">5.2 Account Responsibilities</h4>
                    <div className="space-y-3">
                      <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                        <p className="font-medium text-red-800 mb-2">Account Security</p>
                        <p className="text-sm text-red-700">
                          You are solely responsible for all activities that occur under your account. 
                          East Emblem is not liable for any loss or damage arising from unauthorized 
                          account access due to your failure to maintain account security.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">5.3 Account Verification</h4>
                    <p>
                      We may require verification of your identity, business status, or professional 
                      credentials before granting access to certain Platform features, particularly 
                      for investor accounts or high-value transactions.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Permitted Use */}
            <div id="permitted-use">
              <SectionCard id="permitted-use" title="Permitted Use of the Platform" number="6">
                <div className="space-y-4">
                  <p>
                    You may use the Second Chance platform solely for lawful business purposes 
                    related to startup evaluation, business development, and investment activities. 
                    Permitted uses include:
                  </p>
                  
                  <div className="grid gap-4">
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Founders</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Submitting accurate business information and pitch materials</li>
                        <li>Participating in the evaluation and scoring process</li>
                        <li>Engaging with matched investors in good faith</li>
                        <li>Using platform tools for business development</li>
                        <li>Accessing educational resources and feedback</li>
                      </ul>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">Investors</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Reviewing and evaluating startup opportunities</li>
                        <li>Setting investment preferences and criteria</li>
                        <li>Conducting due diligence within platform guidelines</li>
                        <li>Communicating professionally with founders</li>
                        <li>Managing deal flow and investment tracking</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-medium text-green-800 mb-2">Professional Conduct</p>
                    <p className="text-sm text-green-700">
                      All users are expected to maintain professional standards in their interactions, 
                      respect confidentiality obligations, and act with integrity throughout their 
                      use of the Platform.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Prohibited Activities */}
            <div id="prohibited-activities">
              <SectionCard id="prohibited-activities" title="Prohibited Activities" number="7">
                <div className="space-y-6">
                  <p>
                    The following activities are strictly prohibited on the Platform:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">7.1 Content and Information Violations</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Submitting false, misleading, or fraudulent information</li>
                        <li>Uploading malicious code, viruses, or harmful software</li>
                        <li>Sharing confidential information without authorization</li>
                        <li>Posting content that infringes intellectual property rights</li>
                        <li>Distributing spam, promotional content, or unsolicited communications</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">7.2 Platform Misuse</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Attempting to circumvent security measures or access controls</li>
                        <li>Reverse engineering, decompiling, or creating derivative works</li>
                        <li>Using automated tools to scrape or extract data</li>
                        <li>Overloading or interfering with platform infrastructure</li>
                        <li>Creating multiple accounts to circumvent limitations</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">7.3 Business and Legal Violations</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Engaging in money laundering, fraud, or other illegal activities</li>
                        <li>Violating securities laws or investment regulations</li>
                        <li>Using the platform for non-business or personal purposes</li>
                        <li>Circumventing or violating applicable sanctions or embargoes</li>
                        <li>Misrepresenting investment capacity or business credentials</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 mb-1">Enforcement</p>
                        <p className="text-sm text-red-700">
                          Violation of these prohibitions may result in immediate account suspension, 
                          termination, legal action, and reporting to relevant authorities. We reserve 
                          the right to investigate suspected violations and cooperate with law enforcement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Content Submissions */}
            <div id="content-submissions">
              <SectionCard id="content-submissions" title="Content Submissions and Intellectual Property" number="8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">8.1 Content Ownership</h4>
                    <p className="mb-3">
                      You retain ownership of all intellectual property rights in the content you submit 
                      to the Platform, including pitch decks, business plans, financial information, 
                      and other proprietary materials ("User Content").
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">8.2 License Grant</h4>
                    <p className="mb-3">
                      By submitting User Content, you grant East Emblem a limited, non-exclusive, 
                      royalty-free license to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Process and analyze your content using our AI systems</li>
                      <li>Generate ProofScores and evaluation reports</li>
                      <li>Share approved content with matched investors</li>
                      <li>Create aggregated, anonymized insights for platform improvement</li>
                      <li>Store and backup content for service delivery</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">8.3 Content Standards</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="font-medium text-blue-800 mb-2">Quality Requirements</p>
                      <p className="text-sm text-blue-700 mb-2">All submitted content must be:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 ml-4">
                        <li>Accurate, complete, and truthful</li>
                        <li>Legally compliant and properly authorized</li>
                        <li>Professional and appropriate for business purposes</li>
                        <li>Free from confidential third-party information (unless authorized)</li>
                        <li>Properly formatted and technically accessible</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* ProofScore System */}
            <div id="proofscore-system">
              <SectionCard id="proofscore-system" title="ProofScore System and AI-Generated Content" number="9">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">9.1 ProofScore Methodology</h4>
                    <p className="mb-3">
                      The ProofScore system evaluates startups across five key dimensions using artificial 
                      intelligence and algorithmic analysis:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li><strong>Desirability:</strong> Market demand and problem validation (max 20 points)</li>
                      <li><strong>Feasibility:</strong> Technical and execution capability (max 20 points)</li>
                      <li><strong>Viability:</strong> Business model and financial sustainability (max 20 points)</li>
                      <li><strong>Traction:</strong> Customer acquisition and growth metrics (max 20 points)</li>
                      <li><strong>Readiness:</strong> Investment and scaling preparedness (max 20 points)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">9.2 AI-Generated Content Disclaimer</h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="font-medium text-orange-800 mb-2">Important Disclaimer</p>
                      <p className="text-sm text-orange-700 mb-2">
                        All AI-generated content, including ProofScores, analysis reports, and recommendations, 
                        are advisory in nature and should not be considered as:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-orange-700 ml-4">
                        <li>Investment advice or financial recommendations</li>
                        <li>Guarantees of business success or failure</li>
                        <li>Substitutes for professional due diligence</li>
                        <li>Definitive assessments of business value or potential</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">9.3 User Responsibility</h4>
                    <p>
                      Users are solely responsible for making their own independent business and investment 
                      decisions. All AI-generated insights should be verified through independent research 
                      and professional consultation.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Investor Matching */}
            <div id="investor-matching">
              <SectionCard id="investor-matching" title="Investor Matching and Introductions" number="10">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">10.1 Matching Process</h4>
                    <p className="mb-3">
                      Our investor matching service uses algorithmic analysis to identify potential 
                      investment opportunities based on:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Investor preferences and mandates</li>
                      <li>Startup industry, stage, and geography</li>
                      <li>ProofScore and evaluation results</li>
                      <li>Historical investment patterns</li>
                      <li>Risk and return profiles</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">10.2 No Guarantee of Investment</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-medium text-red-800 mb-2">Important Disclaimer</p>
                      <p className="text-sm text-red-700">
                        Platform matching does not guarantee investment, funding, or any business outcome. 
                        All investment decisions are made independently by investors based on their own 
                        analysis and criteria. East Emblem does not participate in, influence, or guarantee 
                        any investment transactions.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">10.3 Confidentiality Obligations</h4>
                    <p>
                      All parties must respect confidentiality obligations and use shared information 
                      solely for evaluation purposes unless specific consent is given for broader use.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Fees and Payment */}
            <div id="fees-payment">
              <SectionCard id="fees-payment" title="Fees and Payment Terms" number="11">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">11.1 Service Fees</h4>
                    <p className="mb-3">
                      Second Chance operates on a freemium model with both free and premium services:
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <h5 className="font-semibold text-green-800 mb-2">Free Services</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                          <li>Basic ProofScore evaluation</li>
                          <li>Platform registration and onboarding</li>
                          <li>Educational resources and content</li>
                          <li>Limited investor visibility</li>
                        </ul>
                      </div>
                      
                      <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                        <h5 className="font-semibold text-blue-800 mb-2">Premium Services</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                          <li>Enhanced evaluation and reporting</li>
                          <li>Priority investor matching</li>
                          <li>Advanced analytics and insights</li>
                          <li>Direct investor introductions</li>
                          <li>Dedicated support and consultation</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">11.2 Payment Terms</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Fees are clearly disclosed before payment</li>
                      <li>All payments are processed securely through approved payment providers</li>
                      <li>Refunds are subject to our refund policy (available upon request)</li>
                      <li>Subscription services may be cancelled with appropriate notice</li>
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Disclaimers */}
            <div id="disclaimers">
              <SectionCard id="disclaimers" title="Disclaimers and Limitations" number="13">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">13.1 Service Disclaimers</h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="font-medium text-orange-800 mb-2">No Warranties</p>
                      <p className="text-sm text-orange-700 mb-2">
                        The Platform is provided "as is" and "as available" without warranties of any kind. 
                        We disclaim all warranties, including but not limited to:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-orange-700 ml-4">
                        <li>Merchantability, fitness for a particular purpose</li>
                        <li>Non-infringement, accuracy, or completeness</li>
                        <li>Uninterrupted or error-free operation</li>
                        <li>Security or freedom from harmful components</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">13.2 Investment Disclaimer</h4>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-medium text-red-800 mb-2">Not Investment Advice</p>
                      <p className="text-sm text-red-700">
                        Nothing on the Platform constitutes investment, financial, legal, or business advice. 
                        All users must conduct their own independent research and consult with qualified 
                        professionals before making any business or investment decisions.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Limitation of Liability */}
            <div id="liability">
              <SectionCard id="liability" title="Limitation of Liability" number="14">
                <div className="space-y-4">
                  <p>
                    To the maximum extent permitted by applicable law, East Emblem Ltd, its officers, 
                    directors, employees, and agents shall not be liable for any indirect, incidental, 
                    special, consequential, or punitive damages, including but not limited to:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Loss of profits, revenue, or business opportunities</li>
                    <li>Loss of data, goodwill, or reputation</li>
                    <li>Business interruption or operational delays</li>
                    <li>Failed investments or business decisions</li>
                    <li>Third-party claims or actions</li>
                  </ul>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="font-medium text-amber-800 mb-2">Liability Cap</p>
                    <p className="text-sm text-amber-700">
                      Our total liability for any claims arising from your use of the Platform shall not 
                      exceed the amount you have paid to us in the twelve (12) months preceding the claim, 
                      or $1,000 USD, whichever is greater.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Termination */}
            <div id="termination">
              <SectionCard id="termination" title="Termination" number="16">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">16.1 Termination by User</h4>
                    <p>
                      You may terminate your account at any time by contacting us or using account 
                      deletion features where available. Upon termination, you will lose access to 
                      Platform services and your account data may be deleted.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">16.2 Termination by East Emblem</h4>
                    <p className="mb-3">
                      We may suspend or terminate your account immediately for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Violation of these Terms or our policies</li>
                      <li>Fraudulent, illegal, or harmful activities</li>
                      <li>Extended periods of inactivity</li>
                      <li>Non-payment of fees</li>
                      <li>Risk to platform security or integrity</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">16.3 Effect of Termination</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm">
                        Upon termination, your right to use the Platform ceases immediately. 
                        We may retain certain information as required by law or for legitimate 
                        business purposes. Provisions relating to liability, disclaimers, and 
                        dispute resolution shall survive termination.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Governing Law */}
            <div id="governing-law">
              <SectionCard id="governing-law" title="Governing Law and Dispute Resolution" number="17">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">17.1 Governing Law</h4>
                    <p>
                      These Terms are governed by and construed in accordance with the laws of the 
                      United Arab Emirates and the regulations of Masdar City Free Zone. Any disputes 
                      shall be subject to the exclusive jurisdiction of the UAE courts.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">17.2 Dispute Resolution</h4>
                    <p className="mb-3">
                      We encourage resolution of disputes through direct communication. For formal 
                      disputes, the following process applies:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 ml-4 text-sm">
                      <li><strong>Direct Negotiation:</strong> Contact us within 30 days of the dispute arising</li>
                      <li><strong>Mediation:</strong> If direct negotiation fails, binding mediation in Abu Dhabi</li>
                      <li><strong>Arbitration:</strong> Final disputes subject to arbitration under UAE law</li>
                    </ol>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Modifications */}
            <div id="modifications">
              <SectionCard id="modifications" title="Modifications to Terms" number="18">
                <div className="space-y-4">
                  <p>
                    We reserve the right to modify these Terms at any time. When we make material 
                    changes, we will:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>Provide notice through the Platform or via email</li>
                    <li>Update the "Last Updated" date at the top of these Terms</li>
                    <li>Give you the opportunity to review changes before they take effect</li>
                    <li>Allow you to terminate your account if you disagree with changes</li>
                  </ul>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="font-medium text-primary mb-2">Continued Use</p>
                    <p className="text-sm">
                      Your continued use of the Platform after changes become effective constitutes 
                      acceptance of the revised Terms.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Contact Information */}
            <div id="contact">
              <SectionCard id="contact" title="Contact Information" number="19">
                <div className="space-y-4">
                  <p>
                    For questions about these Terms and Conditions or any aspect of the Second Chance platform, 
                    please contact us:
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        East Emblem Ltd
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Email:</strong> <a href="mailto:info@eastemblem.com" className="text-primary hover:underline">info@eastemblem.com</a></p>
                        <p><strong>Address:</strong> Masdar City Free Zone<br />Abu Dhabi, United Arab Emirates</p>
                        <p><strong>License:</strong> MC 13353</p>
                      </div>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-3 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Support & Legal
                      </h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>General Support:</strong> <a href="mailto:support@eastemblem.com" className="text-primary hover:underline">support@eastemblem.com</a></p>
                        <p><strong>Legal Inquiries:</strong> <a href="mailto:legal@eastemblem.com" className="text-primary hover:underline">legal@eastemblem.com</a></p>
                        <p><strong>Privacy Matters:</strong> <a href="mailto:privacy@eastemblem.com" className="text-primary hover:underline">privacy@eastemblem.com</a></p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="font-medium text-primary mb-2">Response Times</p>
                    <p className="text-sm">
                      We aim to respond to all inquiries within 2 business days. For urgent matters, 
                      please clearly mark your communication as "URGENT" in the subject line.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <Button
            onClick={scrollToTop}
            size="sm"
            className="rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default Terms;