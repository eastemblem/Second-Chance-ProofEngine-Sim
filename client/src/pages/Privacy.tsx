import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, ArrowUp, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const Privacy = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll for back-to-top button
  useState(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  const sections = [
    { id: "introduction", title: "Introduction", number: "1" },
    { id: "definitions", title: "Definitions", number: "2" },
    { id: "data-collection", title: "What Data We Collect", number: "3" },
    { id: "processing", title: "How and Why We Process Personal Data", number: "4" },
    { id: "lawful-basis", title: "Lawful Basis for Processing", number: "5" },
    { id: "data-sharing", title: "Data Sharing and Third Parties", number: "6" },
    { id: "ai-insights", title: "AI-Generated Insights and Responsibility Disclaimer", number: "7" },
    { id: "marketing", title: "Marketing, Communications & Preferences", number: "8" },
    { id: "cookies", title: "Cookies and Tracking Technologies", number: "9" },
    { id: "data-transfers", title: "Data Transfers Outside the UAE", number: "10" },
    { id: "security", title: "Data Security Measures", number: "11" },
    { id: "retention", title: "Data Retention", number: "12" },
    { id: "rights", title: "Data Subject Rights", number: "13" },
    { id: "breach", title: "Data Breach Notification and Incident Response", number: "14" },
    { id: "contact", title: "Contact Information and Policy Updates", number: "15" },
  ];

  const SectionCard = ({ 
    id, 
    title, 
    number, 
    children, 
    defaultExpanded = false 
  }: { 
    id: string; 
    title: string; 
    number: string; 
    children: React.ReactNode; 
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.has(id) || defaultExpanded;
    
    return (
      <Card className="mb-6 overflow-hidden">
        <div className="p-6">
          <button
            onClick={() => toggleSection(id)}
            className="w-full flex items-center justify-between text-left group hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center text-white text-sm font-bold">
                {number}
              </div>
              <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {title}
              </h2>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-primary" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 text-muted-foreground leading-relaxed"
            >
              {children}
            </motion.div>
          )}
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
              Privacy Policy
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-muted-foreground space-y-1"
            >
              <p>Effective Date: July 15, 2025</p>
              <p>Last Updated: July 15, 2025</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
          <div className="flex-1">
            {/* Introduction Section - Always Expanded */}
            <div id="introduction">
              <SectionCard
                id="introduction"
                title="Introduction"
                number="1"
                defaultExpanded={true}
              >
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd ("East Emblem", "we", "us", or "our") operates the Second Chance platform, a founder
                    evaluation and investor-matching tool that uses both human and algorithmic inputs to analyze startup
                    submissions and investor preferences.
                  </p>
                  <p>
                    East Emblem is a company registered in Masdar City Free Zone, Abu Dhabi, under license number MC 13353,
                    with its principal place of business at Smart Station, First Floor, Incubator Building, Masdar City, Abu Dhabi,
                    United Arab Emirates.
                  </p>
                  <p>
                    This Privacy Policy explains how we collect, use, store, share, and protect your Personal
                    Data when you engage with Second Chance, whether as a founder, investor, partner,
                    contractor, or site visitor. It also outlines your rights under UAE Federal Decree-Law No.
                    45 of 2021 on the Protection of Personal Data (PDPL) and other applicable regulations
                    (such as GDPR where relevant), and how you may exercise those rights.
                  </p>
                  <p className="font-medium">This policy applies to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Visitors to our websites and digital platforms</li>
                    <li>Registered users and platform participants (e.g., founders, investors, analysts)</li>
                    <li>Recipients of our communications and marketing content</li>
                    <li>Business partners, service providers, and advisors</li>
                    <li>Any individual whose personal data is collected, received, or processed by East Emblem</li>
                  </ul>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                    <p className="font-medium text-foreground">
                      By using our platform, submitting information, or engaging with us, you agree to the
                      practices described in this policy.
                    </p>
                    <p className="mt-2">
                      If you do not agree with this policy, you should discontinue use of our services and contact
                      us at <a href="mailto:info@eastemblem.com" className="text-primary hover:underline">info@eastemblem.com</a> with any concerns.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Definitions */}
            <div id="definitions">
              <SectionCard id="definitions" title="Definitions" number="2">
                <div className="space-y-4">
                  <p>In this Privacy Policy, the following terms shall have the meanings set out below:</p>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-foreground">"Personal Data"</p>
                      <p>Any data relating to an identified or identifiable natural person ("Data Subject"), whether directly or indirectly. This includes, but is not limited to: names, email addresses, phone numbers, job titles, device identifiers, IP addresses, startup-related submissions, investor profiles, and online behavioral data.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-foreground">"Processing"</p>
                      <p>Any operation or set of operations performed on Personal Data, whether by automated means or not. This includes collection, recording, storage, use, analysis, modification, transfer, disclosure, publication, restriction, erasure, or destruction of Personal Data.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-foreground">"Special Category Data"</p>
                      <p>Personal Data that is sensitive in nature and requires enhanced protection, including data relating to racial or ethnic origin, health status, biometric or genetic data, religious beliefs, political opinions, or criminal records. East Emblem does not knowingly collect Special Category Data unless explicitly required and permitted by applicable law.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-foreground">"Data Controller"</p>
                      <p>The person or entity that determines the purposes and means of Processing Personal Data. For most Processing activities described in this Policy, East Emblem Ltd acts as the Data Controller.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-foreground">"Data Processor"</p>
                      <p>Any third party who processes Personal Data on behalf of the Data Controller and under its instructions, such as IT vendors, cloud service providers, analytics platforms, and subcontracted consultants.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-foreground">"UAE PDPL"</p>
                      <p>The Federal Decree Law No. 45 of 2021 on the Protection of Personal Data, applicable throughout the United Arab Emirates, which governs the lawful Processing of Personal Data and defines the rights of Data Subjects and obligations of Controllers and Processors.</p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-foreground">"AI System" or "Automated Processing"</p>
                      <p>Any system or functionality that uses algorithmic or artificial intelligence techniques to analyze or process Personal Data, including startup scoring, proof assessment, and investor-match routing on the Second Chance platform.</p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* What Data We Collect */}
            <div id="data-collection">
              <SectionCard id="data-collection" title="What Data We Collect" number="3">
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd collects various categories of Personal Data through the Second Chance
                    platform and related digital services. We collect this information directly from you,
                    automatically through your device, or from third parties, as outlined below.
                  </p>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">3.1 Information You Provide to Us</h4>
                    <p className="mb-4">
                      We collect Personal Data that you submit directly through our platform, via forms, uploads,
                      emails, live sessions, applications, surveys, and onboarding calls. This may include:
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-foreground">A. Founder & Startup Information</p>
                        <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                          <li>Full name, email address, mobile number</li>
                          <li>Nationality, location, and time zone</li>
                          <li>Company name, legal structure, registration details</li>
                          <li>Pitch decks, business models, investor decks, and traction updates</li>
                          <li>Founder profile information (CVs, LinkedIn, prior experience)</li>
                          <li>Video recordings, submitted statements, and application narratives</li>
                          <li>Financial projections and funding history</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-foreground">B. Investor and Partner Information</p>
                        <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                          <li>Full name, professional affiliation, contact details</li>
                          <li>Investor mandate, ticket size, stage/sector focus</li>
                          <li>Custom intake notes, discovery calls, and matching preferences</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-foreground">C. Communications and Support Data</p>
                        <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                          <li>Records of email exchanges, helpdesk messages, and call logs</li>
                          <li>Webinar registrations, survey responses, and workshop attendance</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">3.2 Information We Collect Automatically</h4>
                    <p className="mb-4">
                      When you interact with our platform, we automatically collect certain technical and
                      behavioral data using cookies, tracking pixels, analytics tools, and log files:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>IP address and location data (based on device or browser)</li>
                      <li>Device type, operating system, browser, and screen resolution</li>
                      <li>Login timestamps and session duration</li>
                      <li>Clickstream data, navigation paths, scroll depth, and engagement heatmaps</li>
                      <li>Cookie identifiers and unique session tokens</li>
                      <li>Behavior within founder dashboards or investor viewports (e.g. which profiles you view or shortlist)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">3.3 Data from Third Parties or Integrated Services</h4>
                    <p className="mb-4">
                      We may receive limited Personal Data about you from third-party sources or services you
                      connect to Second Chance, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>LinkedIn or Google login credentials (if used for authentication)</li>
                      <li>Event registration platforms (e.g. if you attended one of our affiliated demo days)</li>
                      <li>Partner accelerators, fund managers, or institutional sponsors who refer you to the platform</li>
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Processing */}
            <div id="processing">
              <SectionCard id="processing" title="How and Why We Process Personal Data" number="4">
                <div className="space-y-4">
                  <p>
                    We collect and process Personal Data to operate and improve the Second Chance platform,
                    provide services to our users, fulfill our legal and contractual obligations, and pursue
                    legitimate business interests. Our use of your data is guided by principles of necessity,
                    transparency, and proportionality.
                  </p>
                  
                  <p>
                    One of the primary reasons we process Personal Data is to deliver the core functionality
                    of the Second Chance platform. This includes onboarding you as a founder, investor, or
                    partner; managing user accounts and permissions; and enabling the matching, evaluation,
                    and feedback mechanisms that power the platform.
                  </p>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="font-medium text-primary">ProofScore Processing</p>
                    <p className="text-muted-foreground mt-1">
                      For founders, this means processing information such as your pitch deck, business details, 
                      and ProofScore inputs to generate automated validation assessments.
                    </p>
                  </div>
                  
                  <p>
                    Finally, the Second Chance platform uses automated processing, including artificial
                    intelligence, to generate insights and scores based on startup data. These outputs such as
                    ProofScores, validation layers, and investor matching recommendations are generated
                    through algorithms that analyze structured founder inputs and historical scoring models.
                    However, such evaluations are advisory in nature and are not intended to constitute final
                    investment decisions.
                  </p>
                </div>
              </SectionCard>
            </div>

            {/* Lawful Basis */}
            <div id="lawful-basis">
              <SectionCard id="lawful-basis" title="Lawful Basis for Processing" number="5">
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd processes Personal Data in accordance with the legal requirements set
                    out in Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL), which
                    is the principal data protection legislation in the United Arab Emirates, as well as applicable
                    international standards where relevant.
                  </p>

                  <div className="grid gap-4">
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">1. Contractual Necessity</h4>
                      <p>
                        We process Personal Data when it is necessary to enter into or perform a contract with
                        you. This includes enabling you to register for and access the Second Chance platform,
                        participate in evaluations, receive investor introductions, or access advisory tools.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">2. Consent</h4>
                      <p>
                        In some situations, we ask for your explicit consent before processing your Personal Data.
                        This typically applies to non-essential marketing communications, the placement of certain
                        cookies or trackers on your device, or the use of optional services.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">3. Legitimate Interests</h4>
                      <p>
                        We also process Personal Data where it is necessary for the purposes of our legitimate
                        interests, provided that such interests are not overridden by your rights, freedoms, or
                        reasonable expectations.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">4. Legal Obligations</h4>
                      <p>
                        We may process your Personal Data when it is required to comply with applicable legal or
                        regulatory obligations, including UAE law, Masdar City Free Zone regulations, and
                        contractual commitments to our institutional clients.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Sharing */}
            <div id="data-sharing">
              <SectionCard id="data-sharing" title="Data Sharing and Third Parties" number="6">
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd takes the privacy and confidentiality of your Personal Data seriously. We
                    do not sell, license, or trade your Personal Data for commercial gain. However, in order to
                    operate the Second Chance platform effectively, we may share Personal Data with trusted third parties
                    under clearly defined conditions and safeguards.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">6.1 Sharing with Investors and Strategic Partners</h4>
                      <p>
                        One of the core functions of the Second Chance platform is to facilitate curated
                        introductions between founders and potential investors. If you are a founder, certain Personal Data 
                        about you and your startup may be shared with selected investors whose mandates align with your profile.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">6.2 Sharing with Service Providers and Vendors</h4>
                      <p>
                        We rely on reputable third-party service providers to support the technical and operational
                        delivery of the Second Chance platform. These vendors include cloud hosting providers
                        (e.g. Amazon Web Services), analytics tools, and communication platforms.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">6.4 Legal Disclosures and Government Requests</h4>
                      <p>
                        We may disclose your Personal Data where required to comply with applicable laws,
                        regulations, court orders, or lawful requests from public authorities or regulatory agencies,
                        including authorities in the UAE.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* AI Insights */}
            <div id="ai-insights">
              <SectionCard id="ai-insights" title="AI-Generated Insights and Responsibility Disclaimer" number="7">
                <div className="space-y-4">
                  <p>
                    The Second Chance platform uses automated systems, including artificial intelligence (AI)
                    and machine learning models, to support the analysis, scoring, and validation of founder
                    submissions. These systems are integral to our ability to process high volumes of startup
                    information efficiently.
                  </p>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="font-medium text-orange-800">Important Disclaimer</p>
                    <p className="text-orange-700 mt-1">
                      It is important to understand that these AI-generated outputs are advisory in nature. They
                      are designed to augment human understanding, not to replace it. Neither East Emblem nor its 
                      algorithms make investment decisions, endorsements, or funding recommendations on behalf of any party.
                    </p>
                  </div>
                  
                  <p>
                    Founders remain fully responsible for the accuracy of the information they provide and for
                    interpreting the outcomes shared by the platform. Investors remain solely responsible for
                    their own due diligence, risk assessment, and funding decisions.
                  </p>
                  
                  <p>
                    If you believe that an AI-generated evaluation or decision may be inaccurate or unfair,
                    you are encouraged to contact us at <a href="mailto:info@eastemblem.com" className="text-primary hover:underline">info@eastemblem.com</a> to request a review.
                  </p>
                </div>
              </SectionCard>
            </div>

            {/* Marketing */}
            <div id="marketing">
              <SectionCard id="marketing" title="Marketing, Communications & Preferences" number="8">
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd may, from time to time, contact you with information about the Second
                    Chance platform, new features, founder or investor opportunities, partner events, or
                    content that we believe may be relevant or beneficial to you.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">If you are a founder, we may contact you with:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Updates about your application or evaluation</li>
                        <li>Opportunities for additional support or visibility</li>
                        <li>Announcements about platform changes or partner initiatives</li>
                      </ul>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">If you are an investor or partner, we may share:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Introductions to relevant founders</li>
                        <li>Cohort summaries or spotlight profiles</li>
                        <li>Invitations to participate in demo days or discovery sessions</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="font-medium text-foreground mb-2">You may opt out of non-essential communications at any time by:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Clicking the unsubscribe link at the bottom of our emails</li>
                      <li>Adjusting your communication preferences via your platform account</li>
                      <li>Contacting us directly at <a href="mailto:info@eastemblem.com" className="text-primary hover:underline">info@eastemblem.com</a></li>
                    </ul>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Cookies */}
            <div id="cookies">
              <SectionCard id="cookies" title="Cookies and Tracking Technologies" number="9">
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd uses cookies and other tracking technologies to enhance the
                    performance, functionality, and usability of the Second Chance platform. These
                    technologies help us understand how visitors engage with our content, monitor site
                    performance, and improve the overall user experience.
                  </p>
                  
                  <div className="grid gap-4">
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground">Essential Cookies</h4>
                      <p className="text-sm mt-1">
                        These cookies are necessary for the platform to function properly and securely. They
                        enable basic functionality such as user login, session authentication, and navigation.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground">Performance and Analytics Cookies</h4>
                      <p className="text-sm mt-1">
                        These cookies collect information about how users interact with the platform to help us
                        understand user behavior and improve effectiveness of our features.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground">Functional Cookies</h4>
                      <p className="text-sm mt-1">
                        These cookies enable the platform to remember choices you make, such as language
                        preferences, view settings, or form autofill values.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Security */}
            <div id="security">
              <SectionCard id="security" title="Data Security Measures" number="11">
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd is committed to protecting the confidentiality, integrity, and availability
                    of the Personal Data we collect and process through the Second Chance platform. We
                    implement a robust framework of technical, organizational, and contractual security
                    measures.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">11.1 Technical Safeguards</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Secure cloud infrastructure with high-grade security certifications (ISO 27001, SOC 2)</li>
                        <li>HTTPS/SSL encryption for all communications</li>
                        <li>Multi-factor authentication (MFA) for administrative accounts</li>
                        <li>Role-based access controls (RBAC)</li>
                        <li>Audit logs for system access and data changes</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">11.2 Organizational Safeguards</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>Strict confidentiality obligations for all personnel</li>
                        <li>Regular privacy and security training</li>
                        <li>Internal data classification framework</li>
                        <li>Data minimization practices</li>
                        <li>Secure device policies with encryption and automatic locking</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Retention */}
            <div id="retention">
              <SectionCard id="retention" title="Data Retention" number="12">
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd retains Personal Data only for as long as it is necessary to fulfill the
                    specific purposes for which it was collected, or to comply with applicable legal, regulatory,
                    or contractual requirements.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground">Founders and startup applicants</h4>
                      <p className="text-sm mt-1">
                        Data submitted to the platform is retained for the duration of your engagement 
                        and up to 24 months following your last login or activity.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground">Investors and partners</h4>
                      <p className="text-sm mt-1">
                        Profiles, preferences, and engagement history are retained for the duration of your 
                        relationship with East Emblem and for up to 36 months after your last interaction.
                      </p>
                    </div>
                    
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground">Security logs and system access records</h4>
                      <p className="text-sm mt-1">
                        Retained for 12 to 24 months, depending on risk classification and jurisdictional obligations.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Breach */}
            <div id="breach">
              <SectionCard id="breach" title="Data Breach Notification and Incident Response" number="14">
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd maintains a proactive and structured incident response protocol designed
                    to detect, contain, assess, and mitigate any actual or suspected breach of Personal Data.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Our Response Process</h4>
                      <ol className="list-decimal list-inside space-y-2 ml-4">
                        <li><strong>Detection & Containment:</strong> We isolate affected systems to prevent further exposure</li>
                        <li><strong>Assessment & Classification:</strong> We evaluate the type of data involved and potential consequences</li>
                        <li><strong>Notification of Authorities:</strong> We notify the UAE Data Office within the legally mandated timeframe</li>
                        <li><strong>Notification of Affected Individuals:</strong> We notify affected individuals promptly when required</li>
                        <li><strong>Remediation & Prevention:</strong> We take corrective actions and conduct post-incident reviews</li>
                      </ol>
                    </div>
                    
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-medium text-red-800">Your Role in Security</p>
                      <p className="text-red-700 mt-1 text-sm">
                        If you suspect that your data may have been compromised, please immediately contact us at 
                        <a href="mailto:info@eastemblem.com" className="underline ml-1">info@eastemblem.com</a>.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Subject Rights */}
            <div id="rights">
              <SectionCard id="rights" title="Data Subject Rights" number="13">
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd respects your rights as a data subject and is committed to ensuring that
                    you can exercise meaningful control over your Personal Data in accordance with the UAE
                    Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL) and, where
                    applicable, global privacy regulations such as the EU General Data Protection Regulation (GDPR).
                  </p>

                  <div>
                    <h4 className="font-semibold text-foreground mb-4">13.1 Your Rights</h4>
                    <div className="grid gap-4">
                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">1. Right to Access</h5>
                        <p className="mt-2">
                          You have the right to request confirmation of whether we hold Personal Data
                          about you and, if so, to access that information. Upon request, we will
                          provide a copy of the data we process, along with details about its source,
                          purpose, categories, and any third parties with whom it has been shared.
                        </p>
                      </div>
                      
                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">2. Right to Rectification</h5>
                        <p className="mt-2">
                          If you believe that any Personal Data we hold about you is inaccurate,
                          incomplete, or outdated, you have the right to request that it be corrected
                          or updated. We will take reasonable steps to verify and make the necessary
                          amendments.
                        </p>
                      </div>
                      
                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">3. Right to Erasure (Right to be Forgotten)</h5>
                        <p className="mt-2">
                          You have the right to request deletion of your Personal Data under certain
                          conditions such as when it is no longer needed for the purpose it was
                          collected, when consent is withdrawn, or when processing is unlawful.
                        </p>
                      </div>
                      
                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">4. Right to Object to Processing</h5>
                        <p className="mt-2">
                          You may object to the processing of your Personal Data where the
                          processing is based on our legitimate interests or relates to direct
                          marketing. If your objection is valid, we will cease processing the data
                          unless we can demonstrate compelling legal grounds to continue.
                        </p>
                      </div>
                      
                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">5. Right to Data Portability</h5>
                        <p className="mt-2">
                          Where processing is based on consent or contract, and is carried out by
                          automated means, you may request to receive your Personal Data in a
                          structured, commonly used, machine-readable format, and to have it
                          transmitted to another controller, where technically feasible.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">13.2 How to Exercise Your Rights</h4>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Mail className="w-5 h-5 text-primary" />
                        <p className="font-medium text-foreground">Contact Information</p>
                      </div>
                      <p className="mb-2">
                        <span className="font-medium">Email:</span> 
                        <a href="mailto:info@eastemblem.com" className="ml-2 text-primary hover:underline">
                          info@eastemblem.com
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Subject line: "Data Request – [Your Name or Organization]"
                      </p>
                    </div>
                    
                    <p className="mt-4">
                      We may ask you to verify your identity before fulfilling your request, particularly if the
                      request concerns sensitive data or could impact another party's rights. We aim to respond
                      to all valid requests within 30 days, although complex requests may take longer.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Contact Information */}
            <div id="contact">
              <SectionCard id="contact" title="Contact Information and Policy Updates" number="15">
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd is committed to maintaining transparency, accountability, and
                    responsiveness in all matters concerning your Personal Data. If you have any questions,
                    concerns, or requests relating to this Privacy Policy or to how your data is collected,
                    processed, or protected you are encouraged to contact us using the details below.
                  </p>

                  <div>
                    <h4 className="font-semibold text-foreground mb-4">15.1 Contacting East Emblem</h4>
                    <div className="bg-gradient-to-r from-primary/5 to-primary-gold/5 border border-primary/20 rounded-lg p-6">
                      <div className="flex items-start space-x-4">
                        <Mail className="w-6 h-6 text-primary mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-2">Privacy and Compliance Team</p>
                          <p className="text-lg font-semibold text-primary mb-1">
                            <a href="mailto:info@eastemblem.com" className="hover:underline">
                              info@eastemblem.com
                            </a>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Subject line: "Privacy Inquiry – [Your Name or Company]"
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <p className="font-medium text-foreground mb-2">If you wish to:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                          <li>Make a data subject request (e.g., access, deletion, rectification)</li>
                          <li>Report a suspected data breach or security concern</li>
                          <li>Withdraw consent or update your communication preferences</li>
                          <li>Lodge a complaint or seek clarification about our data practices</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">15.2 Policy Updates</h4>
                    <p className="mb-4">We may update this Privacy Policy from time to time to reflect changes in:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                      <li>Applicable data protection laws or regulatory requirements</li>
                      <li>Our internal practices, platform features, or service offerings</li>
                      <li>Technology or security infrastructure improvements</li>
                    </ul>
                    <p>
                      All updates will be posted to our website or platform with a revised "Last Updated" date.
                      In the case of material changes particularly those affecting your rights or how we use your
                      Personal Data we will provide additional notice (e.g., by email or on-platform banners)
                      and, where required, request renewed consent.
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                    <p className="text-center text-muted-foreground">
                      We encourage all users to review this Privacy Policy periodically to stay informed of how
                      we protect your information.
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
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-primary to-primary-gold text-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-50 flex items-center justify-center"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </div>
  );
};

export default Privacy;