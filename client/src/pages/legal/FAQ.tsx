import { useState } from "react";
import { Link } from "wouter";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import Layout from "@/components/layout/layout";
import Navbar from "@/components/layout/navbar";

const FAQ = () => {
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
    { id: "proofvault-overview", title: "ProofVault Overview", number: "1" },
    { id: "folder-structure", title: "Folder Structure & Categories", number: "2" },
    { id: "artifacts", title: "Artifacts & Document Types", number: "3" },
    { id: "file-formats", title: "Supported File Formats", number: "4" },
    { id: "file-size-limits", title: "File Size Limitations", number: "5" },
    { id: "proofscore", title: "ProofScore System", number: "6" },
    { id: "unlock-opportunities", title: "Unlocking Opportunities (70+ Points)", number: "7" },
    { id: "upload-process", title: "Upload Process & Requirements", number: "8" },
    { id: "growth-stages", title: "Growth Stage Filtering", number: "9" },
    { id: "troubleshooting", title: "Troubleshooting & Common Issues", number: "10" },
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
      <Card className="mb-6" id={id}>
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
    <Layout>
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Navbar />
      </div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary-gold/10 border-b">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent mb-4"
            >
              ProofVault FAQ
            </motion.h1>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <p className="text-muted-foreground">Everything you need to know about uploading to ProofVault</p>
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
            <div className="sticky top-24">
              <Card className="p-4">
                <h3 className="font-semibold mb-4 text-sm uppercase tracking-wide text-muted-foreground">
                  Contents
                </h3>
                <nav className="space-y-2">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left text-sm py-1.5 px-2 rounded hover:bg-primary/10 transition-colors text-muted-foreground hover:text-foreground"
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
            <SectionCard id="proofvault-overview" title="ProofVault Overview" number="1">
              <p className="mb-4">
                ProofVault is your centralized document management system designed to validate and strengthen your startup's investment readiness. It provides a structured approach to organizing critical business documents across multiple proof categories.
              </p>
              <p className="mb-4">
                <strong>Key Features:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Organized folder structure aligned with investor evaluation criteria</li>
                <li>Real-time ProofScore tracking to measure your startup's readiness</li>
                <li>Growth stage-specific artifact requirements</li>
                <li>Secure document storage and management</li>
                <li>Automated validation and scoring system</li>
              </ul>
            </SectionCard>

            <SectionCard id="folder-structure" title="Folder Structure & Categories" number="2">
              <p className="mb-4">
                ProofVault organizes your documents into seven strategic categories, each designed to validate different aspects of your startup:
              </p>
              
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">1. Overview</h4>
                  <p>High-level business summary documents including one-pagers, executive summaries, and pitch materials.</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">2. Problem Proofs</h4>
                  <p>Evidence validating the problem you're solving, including market research, customer interviews, and pain point documentation.</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">3. Solution Proofs</h4>
                  <p>Documentation of your solution including MVP demos, product roadmaps, technical specifications, and prototype evidence.</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">4. Demand Proofs</h4>
                  <p>Market validation through user acquisition data, waitlists, LOIs, customer testimonials, and traction metrics.</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">5. Credibility Proofs</h4>
                  <p>Team credentials, advisor profiles, partnerships, awards, media coverage, and industry recognition.</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">6. Commercial Proofs</h4>
                  <p>Business model validation including revenue data, financial projections, unit economics, and pricing strategies.</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">7. Investor Pack</h4>
                  <p>Investment-ready materials including cap tables, term sheets, financial models, and due diligence documents.</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard id="artifacts" title="Artifacts & Document Types" number="3">
              <p className="mb-4">
                Each folder contains specific artifact types with designated point values. Artifacts are categorized by priority level:
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">CRITICAL</span>
                  <span>Essential documents required for basic validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">HIGH</span>
                  <span>Important documents that significantly strengthen your case</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">MEDIUM</span>
                  <span>Valuable supporting documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400">LOW</span>
                  <span>Optional documents for comprehensive validation</span>
                </div>
              </div>

              <p className="mb-4">
                <strong>Example Artifacts:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>One Pager:</strong> Concise business summary (Critical Priority)</li>
                <li><strong>MVP Test Results:</strong> Product validation data (High Priority)</li>
                <li><strong>Customer Testimonials:</strong> User feedback and case studies (Medium Priority)</li>
                <li><strong>Team Bios:</strong> Founder and team credentials (Critical Priority)</li>
                <li><strong>Financial Projections:</strong> 3-5 year revenue forecasts (High Priority)</li>
              </ul>
            </SectionCard>

            <SectionCard id="file-formats" title="Supported File Formats" number="4">
              <p className="mb-4">
                ProofVault accepts a wide range of professional document formats to accommodate different types of business documentation:
              </p>

              <div className="bg-muted p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-foreground mb-3">Document Formats</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <strong>PDF Documents:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>.pdf</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Word Documents:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>.doc</li>
                      <li>.docx</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Presentations:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>.ppt</li>
                      <li>.pptx</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Spreadsheets:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>.xls</li>
                      <li>.xlsx</li>
                      <li>.csv</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Images:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>.jpg</li>
                      <li>.jpeg</li>
                      <li>.png</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Videos:</strong>
                    <ul className="list-disc pl-5 mt-1">
                      <li>.mp4</li>
                      <li>.mov</li>
                      <li>.avi</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Note:</strong> Each artifact may have specific format requirements. Check the artifact details when uploading.
              </p>
            </SectionCard>

            <SectionCard id="file-size-limits" title="File Size Limitations" number="5">
              <p className="mb-4">
                File size limits vary by artifact type to ensure optimal performance and storage efficiency:
              </p>

              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Standard Documents (5MB - 20MB)</h4>
                  <p className="text-sm">Text-based files like PDFs, Word documents, and spreadsheets typically have lower size limits.</p>
                  <p className="text-sm mt-2">Examples: One-pagers, financial models, market research reports</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Presentations (20MB - 50MB)</h4>
                  <p className="text-sm">PowerPoint and Keynote files with images and graphics have moderate limits.</p>
                  <p className="text-sm mt-2">Examples: Pitch decks, product demos, investor presentations</p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Media Files (50MB - 100MB)</h4>
                  <p className="text-sm">Video demonstrations, product walkthroughs, and high-resolution images have higher limits.</p>
                  <p className="text-sm mt-2">Examples: MVP demos, product videos, prototype recordings</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm">
                  <strong>Pro Tip:</strong> The exact size limit for each artifact is displayed when you select the document type in the upload form. Always check before uploading to avoid errors.
                </p>
              </div>
            </SectionCard>

            <SectionCard id="proofscore" title="ProofScore System" number="6">
              <p className="mb-4">
                ProofScore is your startup validation metric that combines your pitch deck score with artifact contributions:
              </p>

              <div className="bg-muted p-4 rounded-lg mb-4">
                <h4 className="font-semibold text-foreground mb-3">How ProofScore is Calculated</h4>
                <div className="space-y-3">
                  <div>
                    <strong className="text-primary">Base Score:</strong>
                    <p className="text-sm mt-1">Your pitch deck analysis provides the foundation score (typically 40-60 points)</p>
                  </div>
                  <div>
                    <strong className="text-primary">Artifact Points:</strong>
                    <p className="text-sm mt-1">Each uploaded artifact adds specific points based on its type and priority</p>
                  </div>
                  <div>
                    <strong className="text-primary">Real-time Updates:</strong>
                    <p className="text-sm mt-1">ProofScore updates immediately after each successful upload</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-primary-gold/10 p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Score Ranges & Meaning</h4>
                <ul className="space-y-2 text-sm">
                  <li><strong>0-40:</strong> Early stage - Focus on problem validation</li>
                  <li><strong>40-60:</strong> Developing - Build solution and demand proofs</li>
                  <li><strong>60-70:</strong> Advancing - Strengthen credibility and commercial validation</li>
                  <li><strong>70+:</strong> Investment Ready - Unlock Deal Room and investor matching</li>
                </ul>
              </div>
            </SectionCard>

            <SectionCard id="unlock-opportunities" title="Unlocking Opportunities (70+ Points)" number="7">
              <p className="mb-4">
                Achieving a ProofScore of 70 or higher unlocks exclusive features designed to accelerate your funding journey:
              </p>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-yellow-500/10 border border-purple-500/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Deal Room Access</h4>
                  <p className="text-sm mb-3">Premium features for qualified startups:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Priority investor matching based on your startup profile</li>
                    <li>Access to curated investor network</li>
                    <li>Professional investor introduction templates</li>
                    <li>Deal Room analytics and tracking</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Premium Downloads</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Detailed validation report with investor insights</li>
                    <li>Professional investment readiness certificate</li>
                    <li>Comprehensive analysis documents</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Expert Support</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Team review of your investor materials</li>
                    <li>Personalized feedback on strengthening your case</li>
                    <li>Strategic guidance for fundraising approach</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-sm">
                  <strong>Next Steps:</strong> Focus on uploading high-priority artifacts in categories where you're missing validation to reach the 70+ threshold.
                </p>
              </div>
            </SectionCard>

            <SectionCard id="upload-process" title="Upload Process & Requirements" number="8">
              <p className="mb-4">
                Follow these steps for successful document uploads to ProofVault:
              </p>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Step 1: Select Folder</h4>
                  <p className="text-sm">Choose the appropriate proof category for your document.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Step 2: Choose Document Type</h4>
                  <p className="text-sm mb-2">Select the specific artifact type from the dropdown. Only artifacts relevant to your growth stage are shown.</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>View priority level (Critical, High, Medium, Low)</li>
                    <li>Check point value for the artifact</li>
                    <li>Review accepted file formats and size limits</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Step 3: Add Description (Required)</h4>
                  <p className="text-sm mb-2">Provide a clear description of the document content:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Minimum 1 character required</li>
                    <li>Maximum 500 characters</li>
                    <li>Be specific about what the document contains</li>
                    <li>Include key metrics or findings if applicable</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Step 4: Upload Files</h4>
                  <p className="text-sm mb-2">Upload your document(s):</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Single file upload or batch upload supported</li>
                    <li>Drag and drop or click to browse</li>
                    <li>Real-time progress tracking</li>
                    <li>Automatic retry for failed uploads</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Step 5: Verify Upload</h4>
                  <p className="text-sm">After successful upload:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>ProofScore updates in real-time</li>
                    <li>Artifact is removed from available options</li>
                    <li>Form resets for next upload</li>
                    <li>Success confirmation displayed</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm">
                  <strong>Important:</strong> All fields are locked during upload to prevent changes. Wait for upload completion before making new selections.
                </p>
              </div>
            </SectionCard>

            <SectionCard id="growth-stages" title="Growth Stage Filtering" number="9">
              <p className="mb-4">
                ProofVault intelligently filters artifacts based on your startup's growth stage to show only relevant documents:
              </p>

              <div className="space-y-3">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Pre-Seed Stage (~35 artifacts)</h4>
                  <p className="text-sm mb-2">Focus on core validation:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Problem validation documents</li>
                    <li>MVP and early solution proofs</li>
                    <li>Founder and team credentials</li>
                    <li>Basic market research</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Seed Stage (~45 artifacts)</h4>
                  <p className="text-sm mb-2">Expanding validation requirements:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>All Pre-Seed artifacts</li>
                    <li>Customer traction evidence</li>
                    <li>Early revenue data</li>
                    <li>Product-market fit indicators</li>
                    <li>Partnership documentation</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold text-foreground mb-2">Series A Stage (~60 artifacts)</h4>
                  <p className="text-sm mb-2">Comprehensive validation:</p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>All Seed artifacts</li>
                    <li>Detailed financial models</li>
                    <li>Growth metrics and KPIs</li>
                    <li>Advanced investor materials</li>
                    <li>Due diligence documentation</li>
                  </ul>
                </div>
              </div>

              <p className="mt-4 text-sm">
                <strong>Note:</strong> Your growth stage is automatically determined during pitch deck analysis. Only relevant artifacts for your stage will appear in the upload dropdown.
              </p>
            </SectionCard>

            <SectionCard id="troubleshooting" title="Troubleshooting & Common Issues" number="10">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Upload Failed Error</h4>
                  <p className="text-sm mb-2"><strong>Possible causes:</strong></p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>File size exceeds limit for the artifact type</li>
                    <li>File format not supported for selected artifact</li>
                    <li>Network connection interrupted</li>
                    <li>Missing required description</li>
                  </ul>
                  <p className="text-sm mt-2"><strong>Solution:</strong> Check file size, verify format compatibility, ensure stable internet, and complete all required fields.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Document Type Dropdown Empty</h4>
                  <p className="text-sm mb-2"><strong>Possible causes:</strong></p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>All artifacts for this folder already uploaded</li>
                    <li>No artifacts required for your growth stage in this category</li>
                  </ul>
                  <p className="text-sm mt-2"><strong>Solution:</strong> Switch to a different folder or check the folder completion status indicator.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">ProofScore Not Updating</h4>
                  <p className="text-sm mb-2"><strong>Possible causes:</strong></p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Upload still in progress</li>
                    <li>Duplicate artifact upload (same type already exists)</li>
                    <li>Browser cache issue</li>
                  </ul>
                  <p className="text-sm mt-2"><strong>Solution:</strong> Wait for upload completion, refresh the page, or contact support if issue persists.</p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Cannot Access Deal Room at 70+ Points</h4>
                  <p className="text-sm mb-2"><strong>Solution:</strong></p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Verify your ProofScore on the dashboard</li>
                    <li>Complete the Deal Room payment process</li>
                    <li>Check for payment confirmation email</li>
                    <li>Contact support if access not granted after payment</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Batch Upload Partially Failed</h4>
                  <p className="text-sm mb-2"><strong>Solution:</strong></p>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Use the "Retry Failed" button to re-upload failed files</li>
                    <li>Check individual file errors for specific issues</li>
                    <li>Verify each file meets requirements independently</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Still Need Help?</h4>
                <p className="text-sm mb-3">Contact our support team for assistance:</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Email:</strong> <a href="mailto:support@secondchance.ventures" className="text-primary hover:underline">support@secondchance.ventures</a>
                  </li>
                  <li>
                    <strong>Response Time:</strong> Within 24 hours on business days
                  </li>
                </ul>
              </div>
            </SectionCard>

            {/* Related Resources */}
            <Card className="mt-8 bg-gradient-to-r from-primary/5 to-primary-gold/5">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Related Resources</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to="/terms">
                    <Button variant="outline" className="w-full justify-start">
                      Terms & Conditions
                    </Button>
                  </Link>
                  <Link to="/privacy">
                    <Button variant="outline" className="w-full justify-start">
                      Privacy Policy
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors z-50"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </Layout>
  );
};

export default FAQ;
