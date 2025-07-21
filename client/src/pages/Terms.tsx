import { useState } from "react";
import { Link } from "wouter";
import { ArrowUp, Mail, ExternalLink, Shield, Users, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import Footer from "@/components/footer";

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
    { id: "terms-of-service", title: "Terms of Service", number: "1" },
    { id: "eligibility", title: "Eligibility and Account Responsibilities", number: "2" },
    { id: "platform-services", title: "Platform Services and Purpose", number: "3" },
    { id: "user-conduct", title: "User Conduct and Platform Use Restrictions", number: "4" },
    { id: "intellectual-property", title: "Intellectual Property and Content Rights", number: "5" },
    { id: "fees-revenue", title: "Fees, Revenue Sharing, and Partner Terms", number: "6" },
    { id: "data-protection", title: "Data Protection and Privacy", number: "7" },
    { id: "disclaimers", title: "Disclaimers and Limitation of Liability", number: "8" },
    { id: "termination", title: "Termination and Suspension of Access", number: "9" },
    { id: "governing-law", title: "Governing Law and Dispute Resolution", number: "10" },
    { id: "general-provisions", title: "General Provisions", number: "11" },
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
              <p className="text-sm text-muted-foreground">Effective Date: July 17, 2025</p>
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
            {/* Terms of Service */}
            <div id="terms-of-service">
              <SectionCard id="terms-of-service" title="Terms of Service" number="1">
                <div className="space-y-4">
                  <p>
                    These Terms of Service ("Terms") govern your access to and use of the Second Chance platform 
                    (the "Platform"), which is owned and operated by East Emblem Ltd ("East Emblem", "we", "us", or 
                    "our"). East Emblem Ltd is a private company registered in Masdar City Free Zone, Abu Dhabi, United 
                    Arab Emirates, under license number MC 13353, with its registered office located at Smart Station, 
                    First Floor, Incubator Building, Masdar City, Abu Dhabi, UAE.
                  </p>
                  
                  <p>
                    By accessing or using the Platform, you agree to be bound by these Terms, along with our [Privacy 
                    Policy] and any other applicable policies or guidelines that may be published from time to time. If 
                    you do not agree to these Terms, you may not access or use the Platform.
                  </p>
                  
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Gavel className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-primary mb-1">Legally Binding Agreement</p>
                        <p className="text-sm">
                          These Terms form a legally binding agreement between you and East Emblem Ltd. You represent 
                          and warrant that you are legally eligible to enter into these Terms and, where acting on behalf of an 
                          entity, that you are duly authorized to bind such entity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Eligibility and Account Responsibilities */}
            <div id="eligibility">
              <SectionCard id="eligibility" title="Eligibility and Account Responsibilities" number="2">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">2.1 Eligibility</h4>
                    <p className="mb-3">
                      Use of the Platform is limited to individuals and legal entities who can form legally binding contracts 
                      under the laws of their respective jurisdictions. By registering an account or otherwise using the 
                      Platform, you represent and warrant that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>You are at least 18 years of age;</li>
                      <li>You are not barred from using the Platform under any applicable laws or regulations, including sanctions or export control restrictions;</li>
                      <li>You are using the Platform for legitimate business or professional purposes, and not as a consumer under UAE or other applicable laws.</li>
                    </ul>
                    <p className="mt-3 text-sm">
                      We may, at our sole discretion, refuse to offer the Platform to any person or entity and may change 
                      our eligibility criteria at any time without notice.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">2.2 User Registration</h4>
                    <p className="mb-3">
                      To access certain features of the Platform, you may be required to create an account. When creating 
                      or updating your account, you agree to provide accurate, current, and complete information, and to 
                      keep such information up to date at all times.
                    </p>
                    <p className="mb-3">
                      You are responsible for maintaining the confidentiality of your account credentials, including your 
                      username and password, and for all activities that occur under your account. You agree not to share 
                      your login credentials with any unauthorized parties.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="font-medium text-amber-800 mb-2">Security Notice</p>
                      <p className="text-sm text-amber-700">
                        You must notify us immediately at info@eastemblem.com of any unauthorized use or suspected 
                        breach of your account. East Emblem is not responsible for any losses, damages, or unauthorized 
                        activity arising from your failure to safeguard your login credentials.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">2.3 Platform Access for Entities</h4>
                    <p className="mb-3">
                      If you are accessing or using the Platform on behalf of a company, organization, investment firm, or 
                      other legal entity, you:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Represent and warrant that you are authorized to bind such entity to these Terms;</li>
                      <li>Agree that both you and the entity will be jointly and severally bound by these Terms.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">2.4 Restrictions on Use</h4>
                    <p className="mb-3">You agree that you will not:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Impersonate any person or entity;</li>
                      <li>Use the Platform for any fraudulent, unlawful, or misleading purpose;</li>
                      <li>Circumvent or attempt to circumvent any security or access controls on the Platform;</li>
                      <li>Permit any third party to use your account or credentials without authorization.</li>
                    </ul>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-red-700">
                        We reserve the right to suspend or terminate your access to the Platform at any time if we reasonably 
                        believe that you have violated these Terms or engaged in conduct that may harm East Emblem, 
                        other users, or the integrity of the Platform.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Platform Services and Purpose */}
            <div id="platform-services">
              <SectionCard id="platform-services" title="Platform Services and Purpose" number="3">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">3.1 Overview of the Platform</h4>
                    <p className="mb-3">
                      Second Chance is a digital platform operated by East Emblem Ltd that facilitates connections 
                      between early-stage startup founders and potential investors, partners, and advisors. It is designed 
                      to help founders who may have previously struggled to access funding gain a second opportunity to 
                      be discovered, validated, and supported by members of the venture ecosystem.
                    </p>
                    <p className="mb-3">The Platform may provide, among other features:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Founder onboarding and application tools;</li>
                      <li>Scoring and validation frameworks (e.g., "ProofScore" or similar diagnostics);</li>
                      <li>Curated introductions between founders and investors;</li>
                      <li>Event-based visibility opportunities (e.g., demo days or pitch reviews);</li>
                      <li>Secure data room or information-sharing features;</li>
                      <li>Partnership opportunities for institutional stakeholders.</li>
                    </ul>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-green-700">
                        East Emblem does not charge founders to submit applications or profiles. Participation as an investor, 
                        reviewer, or partner may be subject to additional agreements or sponsorship terms, which will be 
                        separately disclosed.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">3.2 Role of East Emblem</h4>
                    <p className="mb-3">
                      East Emblem Ltd acts as a facilitator of introductions and curator of opportunity—not as a broker, 
                      fund manager, or investment advisor. We do not:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Guarantee funding or outcomes for founders;</li>
                      <li>Endorse or vouch for the financial viability of any user, startup, or investor;</li>
                      <li>Conduct regulated financial services under the laws of the UAE or any other jurisdiction.</li>
                    </ul>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-blue-700">
                        While we apply a structured evaluation process and seek to maintain a high-quality ecosystem, the 
                        decision to engage, invest, or enter into further dialogue lies solely with the participating users. 
                        Users are encouraged to conduct their own due diligence before entering into any commercial or 
                        financial relationship.
                      </p>
                    </div>
                    <p className="mt-3 text-sm">
                      East Emblem may choose, at its discretion, to prioritize or promote certain users or opportunities 
                      based on internal criteria, partnerships, or editorial relevance. Such prioritization does not constitute 
                      a recommendation or assurance of merit.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">3.3 Platform Access and Availability</h4>
                    <p className="mb-3">
                      We will use reasonable efforts to make the Platform available on a continuous basis, but access may 
                      be interrupted due to maintenance, upgrades, system failures, or events beyond our control. We do 
                      not guarantee uptime or availability and disclaim all liability for any disruption, delay, or loss of 
                      access unless caused by gross negligence or willful misconduct on our part.
                    </p>
                    <p className="text-sm">
                      We may, from time to time, modify or discontinue parts of the Platform, introduce new features, or 
                      impose limits on usage. Where such changes materially affect your use of the Platform, we will 
                      endeavor to provide reasonable notice.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* User Conduct and Platform Use Restrictions */}
            <div id="user-conduct">
              <SectionCard id="user-conduct" title="User Conduct and Platform Use Restrictions" number="4">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">4.1 User Responsibilities</h4>
                    <p className="mb-3">
                      By using the Second Chance platform, you agree to engage in a professional, respectful, and lawful 
                      manner consistent with the purpose of the Platform and the rights of others. You are solely 
                      responsible for:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Ensuring that any information, content, or documents you upload or share through the Platform are accurate, lawful, and not misleading;</li>
                      <li>Using the Platform in good faith, with the intention of participating meaningfully in the founder-investor ecosystem;</li>
                      <li>Respecting the confidentiality of information received through private introductions or pitch reviews, unless explicitly made public by the disclosing party;</li>
                      <li>Complying with all applicable laws, regulations, and contractual obligations when using the Platform.</li>
                    </ul>
                    <p className="mt-3 text-sm">
                      You must not misuse the Platform to harass, defame, mislead, infringe on the rights of others, or 
                      circumvent fair usage.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">4.2 Prohibited Activities</h4>
                    <p className="mb-3">You agree that you will not, directly or indirectly:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Post or transmit any false, fraudulent, misleading, or deceptive information;</li>
                      <li>Access or use the Platform for any purpose that is unlawful, unethical, or harmful to others;</li>
                      <li>Reverse-engineer, decompile, disassemble, or otherwise attempt to derive the source code or underlying systems of the Platform;</li>
                      <li>Scrape, extract, harvest, or otherwise collect user information or platform data without express written consent from East Emblem;</li>
                      <li>Use the Platform to advertise or solicit products, services, or opportunities that are unrelated to its stated purpose;</li>
                      <li>Impersonate any person or entity, or misrepresent your affiliation with any individual, company, or organization;</li>
                      <li>Circumvent security measures or platform access restrictions, including attempting to gain unauthorized access to private data, accounts, or systems;</li>
                      <li>Upload viruses, malware, or other malicious code that may damage, interfere with, or exfiltrate data from the Platform or its users.</li>
                    </ul>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-red-700">
                        Any violation of these restrictions may result in immediate suspension or termination of your access 
                        and, where appropriate, legal action.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">4.3 Platform Integrity and Cooperation</h4>
                    <p className="mb-3">
                      East Emblem reserves the right to investigate any suspected misuse, fraud, or abuse of the Platform 
                      and may cooperate with law enforcement, regulatory authorities, or affected third parties in doing 
                      so. We may suspend or terminate access to users who are found, in our sole discretion, to have 
                      breached these Terms or acted in a manner that compromises the integrity, safety, or purpose of 
                      the Platform.
                    </p>
                    <p className="text-sm">
                      You agree to cooperate with any inquiries or investigations relating to your use of the Platform and 
                      to provide truthful, timely responses to our requests for information where relevant.
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

            {/* Intellectual Property and Content Rights */}
            <div id="intellectual-property">
              <SectionCard id="intellectual-property" title="Intellectual Property and Content Rights" number="5">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">5.1 Ownership of the Platform</h4>
                    <p className="mb-3">
                      The Second Chance platform, including all associated software, user interfaces, designs, algorithms, 
                      analytics models (including but not limited to the "ProofScore"), databases, trademarks, logos, and 
                      all other elements comprising the platform (collectively, the "Platform Materials"), are and shall 
                      remain the exclusive property of East Emblem Ltd or its licensors.
                    </p>
                    <p className="mb-3">
                      You acknowledge and agree that, except as expressly stated in these Terms, nothing grants you a 
                      right, title, or interest in or to any Platform Materials. All rights not expressly granted are reserved.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-700">
                        You may not reproduce, distribute, modify, display, create derivative works of, or otherwise exploit 
                        the Platform or any part thereof except as permitted by these Terms or with East Emblem's express 
                        written consent.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">5.2 Your Content</h4>
                    <p className="mb-3">
                      You retain full ownership of the content, data, and materials you upload or submit to the Platform 
                      (collectively, "User Content"), including but not limited to pitch decks, company profiles, financials, 
                      or biographical information. By uploading or submitting such materials, you grant East Emblem a 
                      non-exclusive, royalty-free, worldwide license to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Use, store, host, copy, display, and share the content for the purpose of delivering the services of the Platform;</li>
                      <li>Make such content available to investors, partners, and other users as part of curated introductions or event programming;</li>
                      <li>Use de-identified or aggregated elements of such content to improve scoring models, research outcomes, or platform intelligence features, provided that no personally identifiable or confidential information is disclosed without your express consent.</li>
                    </ul>
                    <p className="mt-3 text-sm">
                      You represent and warrant that you have all necessary rights, licenses, and permissions to grant the 
                      above license and that your User Content does not infringe on the rights of any third party.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">5.3 Confidentiality of Submissions</h4>
                    <p className="mb-3">
                      East Emblem applies reasonable efforts to safeguard sensitive User Content shared through private 
                      or curated workflows (e.g., cohort selection, investor review). However, we cannot guarantee the 
                      confidentiality of any materials voluntarily shared through public channels or third-party interactions 
                      facilitated via the Platform.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-700">
                        You are solely responsible for determining whether and when to share information with other users. 
                        If you have specific confidentiality requirements, we encourage you to seek separate agreements 
                        (e.g., NDAs) directly with the relevant counterparty before disclosing sensitive information.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">5.4 Feedback and Platform Suggestions</h4>
                    <p>
                      If you provide feedback, ideas, or suggestions regarding the Platform or its services (collectively, 
                      "Feedback"), East Emblem may use such Feedback without restriction or obligation. You agree that 
                      any such Feedback will be deemed non-confidential and non-proprietary and that we may 
                      incorporate it into the Platform without attribution or compensation.
                    </p>
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

            {/* Fees, Revenue Sharing, and Partner Terms */}
            <div id="fees-revenue">
              <SectionCard id="fees-revenue" title="Fees, Revenue Sharing, and Partner Terms" number="6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">6.1 Use of the Platform</h4>
                    <p className="mb-3">
                      At present, East Emblem offers core platform services to founders and early-stage companies free 
                      of charge. This includes submitting a company profile, participating in ProofScore assessments, and 
                      being considered for introductions to investors or advisors.
                    </p>
                    <p className="mb-3">However, certain features or services may be subject to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Fees, payable by investors, strategic partners, or enterprise users (e.g., for cohort sponsorship, enhanced visibility, or priority access);</li>
                      <li>Revenue-sharing agreements, whereby East Emblem may receive a success fee, referral commission, or retrocession based on downstream commercial activity (e.g., if an investment is made or a contract is signed following a platform-introduced connection);</li>
                      <li>Partnership or sponsorship contracts, which may include recurring fees, performance-based terms, or branding exposure rights.</li>
                    </ul>
                    <p className="mt-3 text-sm">
                      All such arrangements will be governed by a separate written agreement between East Emblem and 
                      the relevant party.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">6.2 Revenue Sharing with Referring Parties</h4>
                    <p className="mb-3">
                      If you have been referred to East Emblem or are participating in the Platform as part of a partner 
                      accelerator, advisor network, or investor syndicate, a portion of any commercial revenues generated 
                      through your participation may be shared with that referring party.
                    </p>
                    <p className="mb-3">This may include:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Sponsorship payments;</li>
                      <li>Success-based referral fees;</li>
                      <li>Commission on advisory, consulting, or investment facilitation agreements.</li>
                    </ul>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-blue-700">
                        Such payments are handled transparently, subject to commercial contracts and applicable law. East 
                        Emblem does not share your personal information or commercial data with third parties unless 
                        required to do so for the administration of a revenue-sharing arrangement, and only where privacy 
                        obligations are respected.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">6.3 Partner Participation and Platform Access</h4>
                    <p className="mb-3">
                      Institutional partners, including accelerators, VCs, DFIs, LPs, or other ecosystem stakeholders, may 
                      be invited to participate in Second Chance by:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Sponsoring events, content, or scoring features;</li>
                      <li>Accessing curated founder cohorts;</li>
                      <li>Contributing resources, expertise, or referrals.</li>
                    </ul>
                    <p className="mb-3 text-sm">
                      Any such participation is subject to a separate Partner Agreement, which may include:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Term and scope of engagement;</li>
                      <li>Fee structures and sponsorship value;</li>
                      <li>Rights and responsibilities in relation to founder data and introductions.</li>
                    </ul>
                    <p className="mt-3 text-sm">
                      Participation in the Platform does not grant any exclusive rights unless expressly stated in a written 
                      agreement. East Emblem reserves the right to enter into similar arrangements with other parties, 
                      including competitors of existing partners.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">6.4 Taxes and Reporting</h4>
                    <p className="mb-3">
                      Unless otherwise specified, all fees quoted or charged are exclusive of any applicable taxes, including 
                      VAT or similar levies under UAE or foreign law. Users are responsible for reporting and paying any 
                      taxes arising from payments received through or in connection with the Platform, as required by 
                      their local laws.
                    </p>
                    <p className="text-sm">
                      East Emblem will provide receipts or commercial invoices upon request and will cooperate in 
                      providing reasonable documentation to support compliance with tax or financial reporting 
                      obligations.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Protection and Privacy */}
            <div id="data-protection">
              <SectionCard id="data-protection" title="Data Protection and Privacy" number="7">
                <div className="space-y-4">
                  <p>
                    Your privacy is important to us. East Emblem Ltd handles all Personal Data in accordance with the 
                    applicable laws of the United Arab Emirates, including Federal Decree-Law No. 45 of 2021 on the 
                    Protection of Personal Data (PDPL), and any other relevant data protection legislation.
                  </p>
                  
                  <p>By using the Second Chance platform, you acknowledge and agree that:</p>
                  
                  <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                    <li>East Emblem may collect, use, process, and share your Personal Data as described in our [Privacy Policy];</li>
                    <li>Personal Data is collected only for legitimate, proportionate purposes, such as enabling platform functionality, curating introductions, improving scoring frameworks, and complying with applicable legal obligations;</li>
                    <li>You have certain rights over your Personal Data, including the rights to access, correct, delete, or object to its processing—subject to legal and contractual limitations;</li>
                    <li>Your data may be stored or processed on secure servers inside or outside the UAE, including via trusted third-party service providers who support the operation of the Platform.</li>
                  </ul>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="font-medium text-blue-800 mb-2">Data Security</p>
                    <p className="text-sm text-blue-700">
                      East Emblem maintains physical, technical, and organizational safeguards to protect your data from 
                      unauthorized access, disclosure, alteration, or destruction. However, no digital platform can 
                      guarantee absolute security, and you agree to use the Platform with reasonable caution, particularly 
                      when sharing sensitive or proprietary information.
                    </p>
                  </div>
                  
                  <p className="text-sm mt-4">
                    If you wish to review our full data practices or exercise your rights as a data subject, please refer to 
                    our Privacy Policy or contact us at info@eastemblem.com.
                  </p>
                </div>
              </SectionCard>
            </div>

            {/* Disclaimers and Limitation of Liability */}
            <div id="disclaimers">
              <SectionCard id="disclaimers" title="Disclaimers and Limitation of Liability" number="8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">8.1 No Warranties</h4>
                    <p className="mb-3">
                      The Second Chance platform is provided on an "as is" and "as available" basis without warranties of 
                      any kind, express or implied. To the maximum extent permitted by law, East Emblem Ltd disclaims 
                      all warranties, including but not limited to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Warranties of merchantability, fitness for a particular purpose, or non-infringement;</li>
                      <li>Warranties that the Platform will be uninterrupted, timely, secure, or error-free;</li>
                      <li>Warranties that the content or outcomes provided via the Platform—including scores, introductions, or opportunities—will meet your expectations or result in any commercial, investment, or professional success.</li>
                    </ul>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-orange-700">
                        We do not endorse or take responsibility for any statements, representations, commitments, or 
                        offerings made by users of the Platform, including founders, investors, advisors, or partners. All 
                        decisions made based on information obtained through the Platform are made at your own risk.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">8.2 Risk of Use</h4>
                    <p className="mb-3">By using the Platform, you acknowledge and agree that:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>The Platform is intended to facilitate discovery and engagement between early-stage actors in the startup and investment ecosystem;</li>
                      <li>Any commercial, financial, or strategic decisions you make based on information received through the Platform are your sole responsibility;</li>
                      <li>East Emblem does not guarantee the accuracy, completeness, or reliability of information submitted by third-party users;</li>
                      <li>Founders, GPs, LPs, and others using the Platform do so on a non-exclusive basis, and East Emblem does not serve as an agent or fiduciary to any party.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">8.3 Limitation of Liability</h4>
                    <p className="mb-3">
                      To the fullest extent permitted by law, East Emblem Ltd, its affiliates, directors, employees, advisors, 
                      or contractors shall not be liable for any:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Indirect, incidental, special, punitive, or consequential damages;</li>
                      <li>Loss of profits, revenue, data, or goodwill;</li>
                      <li>Business interruption, opportunity loss, or reputational damage;</li>
                      <li>Errors, omissions, or delays in the performance or delivery of the Platform;</li>
                      <li>Damages arising from third-party content or interactions on or off the Platform.</li>
                    </ul>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                      <p className="font-medium text-red-800 mb-2">Liability Cap</p>
                      <p className="text-sm text-red-700">
                        Our total aggregate liability to you for all claims arising out of or relating to the Platform or these 
                        Terms shall not exceed the greater of: (a) the amount you paid us in the twelve (12) months 
                        preceding the claim; or (b) one thousand dirhams (AED 1,000).
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">8.4 Exceptions</h4>
                    <p className="text-sm">
                      Nothing in these Terms excludes or limits liability where such exclusion would violate applicable 
                      law—such as liability for gross negligence, fraud, or willful misconduct under UAE law.
                    </p>
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

            {/* Termination and Suspension of Access */}
            <div id="termination">
              <SectionCard id="termination" title="Termination and Suspension of Access" number="9">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">9.1 Termination by You</h4>
                    <p className="mb-3">
                      You may terminate your account and discontinue use of the Second Chance platform at any time by 
                      notifying us at info@eastemblem.com. Upon termination, you must cease all access to and use of 
                      the Platform. We will deactivate your account and remove or anonymize your personal information 
                      in accordance with our Privacy Policy and applicable laws.
                    </p>
                    <p className="mb-3">Please note that termination will not affect:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Any obligations or rights that accrued before the date of termination;</li>
                      <li>Our continued right to use anonymized or aggregated data you previously submitted;</li>
                      <li>Any rights or licenses you have already granted under these Terms.</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">9.2 Termination or Suspension by East Emblem</h4>
                    <p className="mb-3">
                      We reserve the right, at our sole discretion and without liability, to suspend or terminate your access 
                      to the Platform (in whole or in part) if we determine that:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>You have breached these Terms or any applicable law or regulation;</li>
                      <li>Your activity poses a risk to the safety, integrity, or reputation of the Platform or other users;</li>
                      <li>You are engaging in behavior that is fraudulent, abusive, or disruptive;</li>
                      <li>We are required to do so by law, regulation, or regulatory instruction.</li>
                    </ul>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
                      <p className="text-sm text-amber-700">
                        In urgent situations (such as suspected fraud, unauthorized access, or data misuse), we may 
                        suspend access immediately and notify you afterward. For less urgent issues, we may attempt to 
                        resolve the matter informally before suspension.
                      </p>
                    </div>
                    <p className="mt-3 text-sm">
                      We may also terminate your access to specific features or services if they are discontinued or 
                      materially modified, with reasonable notice where feasible.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">9.3 Effects of Termination</h4>
                    <p className="mb-3">Upon termination of access:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>All licenses granted to you under these Terms shall immediately cease;</li>
                      <li>You must stop using and destroy any confidential or proprietary information obtained through the Platform, unless otherwise permitted;</li>
                      <li>East Emblem may retain certain data as necessary to comply with legal obligations, enforce our rights, or operate in accordance with our Privacy Policy.</li>
                    </ul>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                      <p className="text-sm">
                        Termination of access shall not relieve either party of any obligation intended to survive termination, 
                        including (but not limited to) confidentiality, indemnification, limitations of liability, or rights to 
                        payment.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Governing Law and Dispute Resolution */}
            <div id="governing-law">
              <SectionCard id="governing-law" title="Governing Law and Dispute Resolution" number="10">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">10.1 Governing Law</h4>
                    <p className="mb-3">
                      These Terms, and any dispute, controversy, or claim arising out of or in connection with your use of 
                      the Platform, shall be governed by and construed in accordance with the laws of the United Arab 
                      Emirates, excluding its conflict of law principles.
                    </p>
                    <p className="text-sm">
                      Unless otherwise agreed in writing, the courts of the onshore Abu Dhabi Judicial Department (ADJD) 
                      shall have exclusive jurisdiction to hear and determine any such disputes.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">10.2 Informal Dispute Resolution</h4>
                    <p className="mb-3">
                      Before initiating formal legal proceedings, both you and East Emblem Ltd agree to make reasonable 
                      efforts to resolve any disagreement amicably and in good faith. This includes:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Engaging in direct dialogue to clarify concerns;</li>
                      <li>Allowing up to 30 calendar days for informal resolution following written notice of a dispute.</li>
                    </ul>
                    <p className="mt-3 text-sm">
                      If we are unable to resolve the dispute within this timeframe, either party may proceed to initiate 
                      legal action as provided under applicable UAE law.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">10.3 Language</h4>
                    <p className="text-sm">
                      All notices, legal proceedings, and documentation related to disputes shall be conducted in English. 
                      Where Arabic translations are required for court filing or compliance, the English version shall prevail 
                      for interpretation purposes unless otherwise mandated by law.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* General Provisions */}
            <div id="general-provisions">
              <SectionCard id="general-provisions" title="General Provisions" number="11">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">11.1 Entire Agreement</h4>
                    <p>
                      These Terms, together with our Privacy Policy and any supplemental agreements you enter into with 
                      East Emblem Ltd (e.g., partner, referral, or sponsorship agreements), constitute the entire 
                      agreement between you and East Emblem with respect to your access to and use of the Second 
                      Chance platform. They supersede any prior understandings or agreements, whether oral or written, 
                      relating to the subject matter herein.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">11.2 No Waiver</h4>
                    <p>
                      Our failure to exercise or enforce any right or provision under these Terms shall not constitute a 
                      waiver of that right or provision. Any waiver must be in writing and signed by an authorized 
                      representative of East Emblem Ltd.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">11.3 Severability</h4>
                    <p>
                      If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent 
                      jurisdiction, the remaining provisions shall remain in full force and effect. The invalid provision shall 
                      be replaced with a lawful one that most closely reflects the original intent.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">11.4 Assignment</h4>
                    <p>
                      You may not assign or transfer these Terms, or any rights or obligations under them, without our 
                      prior written consent. We may assign our rights or obligations under these Terms to any affiliate, 
                      successor, or acquirer without notice or consent, provided your rights are not adversely affected.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">11.5 Force Majeure</h4>
                    <p>
                      East Emblem shall not be liable for any delay or failure to perform its obligations under these Terms 
                      due to events beyond its reasonable control, including but not limited to acts of God, war, terrorism, 
                      cyberattacks, pandemic-related restrictions, natural disasters, labor disputes, or governmental 
                      orders.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">11.6 Contact Information</h4>
                    <p>
                      If you have any questions or concerns about these Terms, you may contact us at: 
                      <a href="mailto:info@eastemblem.com" className="text-primary hover:underline ml-1">
                        info@eastemblem.com
                      </a>
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
      
      <Footer />
    </div>
  );
};

export default Terms;