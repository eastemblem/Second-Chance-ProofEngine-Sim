import { useState } from "react";
import { Link } from "wouter";
import { ArrowUp, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const Privacy = () => {
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
    { id: "data-collection", title: "What Data We Collect", number: "3" },
    {
      id: "processing",
      title: "How and Why We Process Personal Data",
      number: "4",
    },
    { id: "lawful-basis", title: "Lawful Basis for Processing", number: "5" },
    {
      id: "data-sharing",
      title: "Data Sharing and Third Parties",
      number: "6",
    },
    {
      id: "ai-insights",
      title: "AI-Generated Insights and Responsibility Disclaimer",
      number: "7",
    },
    {
      id: "marketing",
      title: "Marketing, Communications & Preferences",
      number: "8",
    },
    { id: "cookies", title: "Cookies and Tracking Technologies", number: "9" },
    { id: "transfers", title: "International Data Transfers", number: "10" },
    { id: "security", title: "Data Security Measures", number: "11" },
    { id: "retention", title: "Data Retention", number: "12" },
    { id: "rights", title: "Data Subject Rights", number: "13" },
    {
      id: "breach",
      title: "Data Breach Notification and Incident Response",
      number: "14",
    },
    {
      id: "contact",
      title: "Contact Information and Policy Updates",
      number: "15",
    },
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
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
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
              Privacy Policy
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-6"
            >
              <p className="text-sm text-muted-foreground mb-1">
                Effective Date: 15th July 2025
              </p>
              <p className="text-sm text-muted-foreground">
                Last Updated: 15th July 2025
              </p>
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
                <h3 className="font-semibold text-foreground mb-4">
                  Table of Contents
                </h3>
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
            {/* Introduction Section */}
            <div id="introduction">
              <SectionCard id="introduction" title="Introduction" number="1">
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd ("East Emblem", "we", "us", or "our")
                    operates the Second Chance platform, a founder evaluation
                    and investor-matching tool that uses both human and
                    algorithmic inputs to analyze startup submissions and
                    investor preferences.
                  </p>
                  <p>
                    East Emblem is a company registered in Masdar City Free
                    Zone, Abu Dhabi, under license number MC 13353, with its
                    principal place of business at Smart Station, First Floor,
                    Incubator Building, Masdar City, Abu Dhabi, United Arab
                    Emirates.
                  </p>
                  <p>
                    This Privacy Policy explains how we collect, use, store,
                    share, and protect your Personal Data when you engage with
                    Second Chance, whether as a founder, investor, partner,
                    contractor, or site visitor. It also outlines your rights
                    under UAE Federal Decree-Law No. 45 of 2021 on the
                    Protection of Personal Data (PDPL) and other applicable
                    regulations (such as GDPR where relevant), and how you may
                    exercise those rights.
                  </p>
                  <p className="font-medium">This policy applies to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Visitors to our websites and digital platforms</li>
                    <li>
                      Registered users and platform participants (e.g.,
                      founders, investors, analysts)
                    </li>
                    <li>
                      Recipients of our communications and marketing content
                    </li>
                    <li>Business partners, service providers, and advisors</li>
                    <li>
                      Any individual whose personal data is collected, received,
                      or processed by East Emblem
                    </li>
                  </ul>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                    <p className="font-medium text-foreground">
                      By using our platform, submitting information, or engaging
                      with us, you agree to the practices described in this
                      policy.
                    </p>
                    <p className="mt-2">
                      If you do not agree with this policy, you should
                      discontinue use of our services and contact us at{" "}
                      <a
                        href="mailto:info@eastemblem.com"
                        className="text-primary hover:underline"
                      >
                        info@eastemblem.com
                      </a>{" "}
                      with any concerns.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Definitions */}
            <div id="definitions">
              <SectionCard id="definitions" title="Definitions" number="2">
                <div className="space-y-4">
                  <p>
                    In this Privacy Policy, the following terms shall have the
                    meanings set out below:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        Personal Data
                      </p>
                      <p>
                        Any data relating to an identified or identifiable
                        natural person (Data Subject), whether directly or
                        indirectly. This includes, but is not limited to: names,
                        email addresses, phone numbers, job titles, device
                        identifiers, IP addresses, startup-related submissions,
                        investor profiles, and online behavioral data.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        Processing
                      </p>
                      <p>
                        Any operation or set of operations performed on Personal
                        Data, whether by automated means or not. This includes
                        collection, recording, storage, use, analysis,
                        modification, transfer, disclosure, publication,
                        restriction, erasure, or destruction of Personal Data.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        Special Category Data
                      </p>
                      <p>
                        Personal Data that is sensitive in nature and requires
                        enhanced protection, including data relating to racial
                        or ethnic origin, health status, biometric or genetic
                        data, religious beliefs, political opinions, or criminal
                        records. East Emblem does not knowingly collect Special
                        Category Data unless explicitly required and permitted
                        by applicable law.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        Data Controller
                      </p>
                      <p>
                        The person or entity that determines the purposes and
                        means of Processing Personal Data. For most Processing
                        activities described in this Policy, East Emblem Ltd
                        acts as the Data Controller.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        Data Processor
                      </p>
                      <p>
                        Any third party who processes Personal Data on behalf of
                        the Data Controller and under its instructions, such as
                        IT vendors, cloud service providers, analytics
                        platforms, and subcontracted consultants.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        Data Subject
                      </p>
                      <p>
                        An individual whose Personal Data is collected, stored,
                        or processed by East Emblem. This includes founders,
                        investors, partners, employees, contractors, and users
                        of the Second Chance platform.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">UAE PDPL</p>
                      <p>
                        The Federal Decree Law No. 45 of 2021 on the Protection
                        of Personal Data, applicable throughout the United Arab
                        Emirates, which governs the lawful Processing of
                        Personal Data and defines the rights of Data Subjects
                        and obligations of Controllers and Processors.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        AI System or Automated Processing
                      </p>
                      <p>
                        Any system or functionality that uses algorithmic or
                        artificial intelligence techniques to analyze or process
                        Personal Data, including startup scoring, proof
                        assessment, and investor-match routing on the Second
                        Chance platform.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">
                        Standard Contractual Clauses (SCCs)
                      </p>
                      <p>
                        Legally recognized data protection safeguards used in
                        international data transfers to jurisdictions that do
                        not offer adequate protection under applicable law.
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">Consent</p>
                      <p>
                        Any clear and affirmative action that indicates the Data
                        Subject's agreement to the Processing of their Personal
                        Data for specified purposes. Consent may be withdrawn at
                        any time.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* What Data We Collect */}
            <div id="data-collection">
              <SectionCard
                id="data-collection"
                title="What Data We Collect"
                number="3"
              >
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd collects various categories of Personal Data
                    through the Second Chance platform and related digital
                    services. We collect this information directly from you,
                    automatically through your device, or from third parties, as
                    outlined below.
                  </p>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">
                      3.1 Information You Provide to Us
                    </h4>
                    <p className="mb-4">
                      We collect Personal Data that you submit directly through
                      our platform, via forms, uploads, emails, live sessions,
                      applications, surveys, and onboarding calls. This may
                      include:
                    </p>

                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-foreground">
                          A. Founder & Startup Information
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                          <li>Full name, email address, mobile number</li>
                          <li>Nationality, location, and time zone</li>
                          <li>
                            Company name, legal structure, registration details
                          </li>
                          <li>
                            Pitch decks, business models, investor decks, and
                            traction updates
                          </li>
                          <li>
                            Founder profile information (CVs, LinkedIn, prior
                            experience)
                          </li>
                          <li>
                            Video recordings, submitted statements, and
                            application narratives
                          </li>
                          <li>Financial projections and funding history</li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium text-foreground">
                          B. Investor and Partner Information
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                          <li>
                            Full name, professional affiliation, contact details
                          </li>
                          <li>
                            Investor mandate, ticket size, stage/sector focus
                          </li>
                          <li>
                            Custom intake notes, discovery calls, and matching
                            preferences
                          </li>
                        </ul>
                      </div>

                      <div>
                        <p className="font-medium text-foreground">
                          C. Communications and Support Data
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                          <li>
                            Records of email exchanges, helpdesk messages, and
                            call logs
                          </li>
                          <li>
                            Webinar registrations, survey responses, and
                            workshop attendance
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">
                      3.2 Information We Collect Automatically
                    </h4>
                    <p className="mb-4">
                      When you interact with our platform, we automatically
                      collect certain technical and behavioral data using
                      cookies, tracking pixels, analytics tools, and log files:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        IP address and location data (based on device or
                        browser)
                      </li>
                      <li>
                        Device type, operating system, browser, and screen
                        resolution
                      </li>
                      <li>Login timestamps and session duration</li>
                      <li>
                        Clickstream data, navigation paths, scroll depth, and
                        engagement heatmaps
                      </li>
                      <li>Cookie identifiers and unique session tokens</li>
                      <li>
                        Behavior within founder dashboards or investor viewports
                        (e.g. which profiles you view or shortlist)
                      </li>
                    </ul>
                    <p className="mt-3 text-sm text-muted-foreground">
                      This data helps us personalize the platform experience,
                      optimize usability, and improve investor-founder matching
                      outcomes
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">
                      3.3 Data from Third Parties or Integrated Services
                    </h4>
                    <p className="mb-4">
                      We may receive limited Personal Data about you from
                      third-party sources or services you connect to Second
                      Chance, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>
                        LinkedIn or Google login credentials (if used for
                        authentication)
                      </li>
                      <li>
                        Event registration platforms (e.g. if you attended one
                        of our affiliated demo days)
                      </li>
                      <li>
                        Partner accelerators, fund managers, or institutional
                        sponsors who refer you to the platform
                      </li>
                    </ul>
                    <p className="mt-3 text-sm text-muted-foreground">
                      Where applicable, we will ensure such third parties have a
                      lawful basis to share your data with us.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">
                      3.4 Special Category Data
                    </h4>
                    <p>
                      We do not actively request or process Special Category
                      Data (such as health status, biometric data, religion, or
                      political affiliation). If you voluntarily submit such
                      data (e.g., in a video pitch or deck), it is done at your
                      discretion and will not be used as part of automated
                      scoring unless required by law or necessary for specific
                      services (e.g., demographic data for impact funders).
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">
                      3.5 Aggregated and Anonymized Data
                    </h4>
                    <p>
                      We may aggregate and anonymize Personal Data for
                      analytical, benchmarking, or research purposes. Such data
                      will no longer be identifiable and is therefore not
                      considered Personal Data under this Policy.
                    </p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Processing */}
            <div id="processing">
              <SectionCard
                id="processing"
                title="How and Why We Process Personal Data"
                number="4"
              >
                <div className="space-y-4">
                  <p>
                    We collect and process Personal Data to operate and improve
                    the Second Chance platform, provide services to our users,
                    fulfill our legal and contractual obligations, and pursue
                    legitimate business interests. Our use of your data is
                    guided by principles of necessity, transparency, and
                    proportionality. All processing activities are based on a
                    clear legal basis and are aligned with the expectations of
                    users, partners, and regulators.
                  </p>

                  <p>
                    One of the primary reasons we process Personal Data is to
                    deliver the core functionality of the Second Chance
                    platform. This includes onboarding you as a founder,
                    investor, or partner; managing user accounts and
                    permissions; and enabling the matching, evaluation, and
                    feedback mechanisms that power the platform. For founders,
                    this means processing information such as your pitch deck,
                    business details, and ProofScore inputs to generate
                    automated validation assessments. For investors, this
                    involves handling mandate preferences, stage and sector
                    interests, and custom feedback fields to allow targeted
                    introductions and curated startup updates. Without
                    processing this information, we would be unable to provide
                    the services you expect from Second Chance.
                  </p>

                  <p>
                    We also use Personal Data to analyze platform performance,
                    understand usage patterns, and improve our technology. This
                    includes collecting and reviewing behavioral and technical
                    data such as page navigation, login frequency, and
                    engagement with evaluation dashboards in order to identify
                    bottlenecks, test new features, and measure the
                    effectiveness of our AI-assisted tools. These insights allow
                    us to make data-informed decisions to enhance the user
                    experience, improve matching accuracy, and refine our
                    validation scoring methodologies. While this data is often
                    anonymized or aggregated for product research purposes, some
                    processing involves identifiable information to support
                    personalized features or troubleshooting.
                  </p>

                  <p>
                    In addition to operational use, we process contact details
                    and engagement history to maintain communication with our
                    users. We may send you emails or notifications about
                    platform updates, upcoming pitch events, product
                    improvements, or cohort announcements. These communications
                    are designed to keep you informed and connected to relevant
                    opportunities. We will always offer you the ability to opt
                    out of non-essential marketing communications. However,
                    messages directly related to your use of the platform such
                    as onboarding reminders, matched introductions, or mandatory
                    updates will continue as necessary for the provision of our
                    services.
                  </p>

                  <p>
                    For investors and strategic partners, we may use profile and
                    preference data to facilitate curated introductions to
                    selected founders. This includes notifying you of new
                    founder cohorts, sharing summary validation outputs, and
                    enabling warm intros where a mutual interest is identified.
                    Such activities are designed to ensure relevance and
                    efficiency in the investor-founder matching process, and are
                    carried out in accordance with our legitimate interests and
                    those of our users.
                  </p>

                  <p>
                    We also process Personal Data for compliance and legal
                    purposes. This may include responding to lawful requests
                    from regulatory authorities, maintaining audit trails,
                    retaining access logs, and meeting any know-your-client
                    (KYC) or anti-money laundering (AML) obligations relevant to
                    our operations or those of our institutional partners. These
                    actions are taken in accordance with applicable UAE
                    regulations, including the PDPL, and international best
                    practices.
                  </p>

                  <p>
                    To safeguard the platform and our community, we monitor
                    technical and usage data for signs of unauthorized access,
                    fraudulent activity, or violations of our terms of service.
                    Our systems are designed to detect anomalous behavior such
                    as bot traffic, scraping, or brute- force login attempts. We
                    process this data to protect user accounts, maintain the
                    integrity of our systems, and ensure that our services are
                    used in accordance with their intended purpose.
                  </p>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <p className="font-medium text-primary">
                      ProofScore Processing
                    </p>
                    <p className="text-muted-foreground mt-1">
                      For founders, this means processing information such as
                      your pitch deck, business details, and ProofScore inputs
                      to generate automated validation assessments.
                    </p>
                  </div>

                  <p>
                    Finally, the Second Chance platform uses automated
                    processing, including artificial intelligence, to generate
                    insights and scores based on startup data. These outputs
                    such as ProofScores, validation layers, and investor
                    matching recommendations are generated through algorithms
                    that analyze structured founder inputs and historical
                    scoring models. However, such evaluations are advisory in
                    nature and are not intended to constitute final investment
                    decisions.Founders and investors retain full responsibility
                    for interpreting and acting upon AI-generated results, and
                    our use of automated processing is subject to appropriate
                    safeguards and human oversight.
                  </p>
                  <p>
                    In all cases, the lawful basis for processing your Personal
                    Data will be one of the following: the performance of a
                    contract with you; compliance with legal obligations; our
                    legitimate interests in operating and improving the
                    platform; or your explicit consent, where required.
                  </p>
                </div>
              </SectionCard>
            </div>

            {/* Lawful Basis */}
            <div id="lawful-basis">
              <SectionCard
                id="lawful-basis"
                title="Lawful Basis for Processing"
                number="5"
              >
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd processes Personal Data in accordance with
                    the legal requirements set out in Federal Decree-Law No. 45
                    of 2021 on the Protection of Personal Data (PDPL), which is
                    the principal data protection legislation in the United Arab
                    Emirates, as well as applicable international standards
                    where relevant.We ensure that every instance of data
                    processing is based on a clearly defined lawful basis, and
                    that individuals are informed of the rationale behind such
                    processing.
                  </p>
                  <p>
                    We rely on one or more of the following legal bases when
                    collecting or using Personal Data, depending on the specific
                    context and nature of the interaction:
                  </p>

                  <div className="grid gap-4">
                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        1. Contractual Necessity
                      </h4>
                      <p>
                        We process Personal Data when it is necessary to enter
                        into or perform a contract with you. This includes
                        enabling you to register for and access the Second
                        Chance platform, participate in evaluations, receive
                        investor introductions, or access advisory tools.Without
                        this data, we would not be able to provide our core
                        services to you.
                      </p>
                      For example, if you are a founder using the platform to
                      submit your startup for evaluation or to be matched with
                      potential investors, we require your contact details,
                      submission documents, and profile information in order to
                      fulfill that service. Similarly, if you are an investor
                      receiving curated introductions, we must process
                      information related to your mandate and preferences to
                      ensure relevance and quality.
                      <p></p>
                    </div>

                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        2. Consent
                      </h4>
                      <p>
                        In some situations, we ask for your explicit consent
                        before processing your Personal Data. This typically
                        applies to non-essential marketing communications, the
                        placement of certain cookies or trackers on your device,
                        or the use of optional services such as video features,
                        third-party integrations, or participation in case
                        studies and testimonials.
                      </p>
                    </div>

                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        3. Legitimate Interests
                      </h4>
                      <p>
                        We also process Personal Data where it is necessary for
                        the purposes of our legitimate interests, provided that
                        such interests are not overridden by your rights,
                        freedoms, or reasonable expectations. Our legitimate
                        interests include: improving the functionality of the
                        platform, conducting analytics and usage research,
                        maintaining security and fraud prevention systems; and
                        promoting the growth of the Second Chance ecosystem
                        through limited, relevant outreach.
                      </p>
                    </div>

                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        4. Legal Obligations
                      </h4>
                      <p>
                        We may process your Personal Data when it is required to
                        comply with applicable legal or regulatory obligations.
                        This includes obligations under UAE law Masdar City Free
                        Zone regulations tax authority requirements, clients,
                        and in some cases requests from courts, regulators, or
                        enforcement authorities. Such processing may involve
                        storing records for prescribed retention periods,
                        sharing information with lawful authorities, or
                        conducting verification processes for KYC/AML purposes
                        in collaboration with qualified partners.
                      </p>
                    </div>

                    <div className="border border-primary/20 rounded-lg p-4">
                      <h4 className="font-semibold text-foreground mb-2">
                        5. Public Interest or Protection of Vital Interests
                      </h4>
                      <p>
                        In rare cases, we may process Personal Data to protect
                        the vital interests of a person or for reasons of
                        substantial public interest, such as in the event of a
                        security breach, a legal claim, or a situation involving
                        urgent risk to safety or rights. We will only rely on
                        this ground where there is no less intrusive or
                        alternative way to achieve the intended purpose. Each
                        processing activity described in this policy is
                        supported by at least one of the lawful bases outlined
                        above. Where multiple bases apply, we rely on the most
                        specific and appropriate basis for each purpose. We are
                        committed to ensuring that your data is handled
                        lawfully, fairly, and transparently at all times, and we
                        will never use your Personal Data for purposes that are
                        incompatible with the original purpose of collection
                        without informing you and, where required, obtaining
                        your consent.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Sharing */}
            <div id="data-sharing">
              <SectionCard
                id="data-sharing"
                title="Data Sharing and Third Parties"
                number="6"
              >
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd takes the privacy and confidentiality of
                    your Personal Data seriously We do not sell or trade your
                    Personal Data for commercial gain However in order to
                    operate the Second Chance platform effectively , deliver our
                    services, and comply with legal and technical obligations,
                  </p>
                  <p>
                    we may share Personal Data with trusted third parties under
                    clearly defined conditions and safeguards We only share
                    Personal Data when it is necessary, proportionate, and
                    lawful to do so. Each recipient is carefully vetted, and
                    appropriate contractual, organizational, and technical
                    measures are implemented to ensure the security and
                    integrity of your information.{" "}
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        6.1 Sharing with Investors and Strategic Partners
                      </h4>
                      <p>
                        One of the core functions of the Second Chance platform
                        is to facilitate curated introductions between founders
                        and potential investors founder and choose to
                        participate in the platform, certain Personal Data about
                        you and your startup may be shared with selected
                        investors whose mandates align with your profile This
                        may include pitch deck content, ProofScores, summary
                        validation outputs, and limited contact information,
                        along with custom notes or comments derived from
                        platform interactions. These investor recipients are
                        contractually bound by confidentiality restrictions and
                        are only permitted to use this information for internal
                        evaluation and decision-making purposes. Investors are
                        not allowed to share or redistribute founder information
                        outside their organizations without express consent.
                      </p>
                      <p>
                        Similarly, if you are an investor or partner engaging
                        with the platform, we may share basic information with
                        founders as part of the matching or warm intro process
                        for example, your name, firm, stage/sector interest, and
                        publicly available affiliation details. You have the
                        option to customize your visibility preferences or
                        withdraw from the matching process at any time.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        6.2 Sharing with Service Providers and Vendors
                      </h4>
                      <p>
                        We rely on reputable third-party service providers to
                        support the technical and operational delivery of the
                        Second Chance platform. These vendors include cloud
                        hosting providers (e.g. Amazon Web Services), analytics
                        tools (e.g. Google Analytics, Amplitude), customer
                        relationship and marketing platforms, communication
                        tools, and security monitoring services. These providers
                        act as Data Processors on our behalf. They are
                        contractually obligated through Data Processing
                        Agreements (DPAs) to:
                      </p>
                      <ul>
                        <li>
                          Process your Personal Data only in accordance with our
                          written instructions.
                        </li>
                        <li>
                          Maintain strict confidentiality and data protection
                          standards.
                        </li>
                        <li>
                          Implement appropriate technical and organizational
                          security measures.
                        </li>
                        <li>
                          Assist us with auditability, data access requests, or
                          breach notification obligations.
                        </li>
                      </ul>
                      <p>
                        We do not authorize these service providers to use or
                        disclose your Personal Data for their own commercial
                        purposes.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        6.3 Sharing within the East Emblem Group and Successor
                        Entities
                      </h4>
                      <p>
                        If East Emblem undergoes a corporate transaction such as
                        a merger, acquisition, restructuring, or sale of assets,
                        Personal Data may be transferred to the new or acquiring
                        entity as part of the continuity of business operations.
                        In such cases, we will take all appropriate measures to
                        ensure that the receiving entity is subject to the same
                        or substantially equivalent obligations with respect to
                        data protection and privacy. We may also share data
                        internally between affiliated entities or controlled
                        subsidiaries of East Emblem for operational purposes,
                        provided that such sharing is compliant with applicable
                        laws and internal access controls.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        6.4 Legal Disclosures and Government Requests
                      </h4>
                      <p>
                        We may disclose your Personal Data where required to
                        comply with applicable laws, regulations, court orders,
                        or lawful requests from public authorities or regulatory
                        agencies, including authorities in the UAE.Such
                        disclosures may be made to:
                      </p>
                      <ul>
                        <li>Respond to subpoenas or legal proceedings.</li>
                        <li>
                          Cooperate with government investigations or regulatory
                          inquiries
                        </li>
                        <li>
                          Prevent, detect, or investigate security incidents,
                          fraud, or other unlawful activity
                        </li>
                        <li>
                          Protect the rights, property, or safety of East
                          Emblem, its users, or others
                        </li>
                      </ul>
                      <p>
                        Where permitted, we will notify you if your Personal
                        Data is subject to such a disclosure.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        6.5 Sharing for Audit, Legal, or Professional Advice
                      </h4>
                      <p>
                        We may grant limited access to Personal Data to our
                        external auditors, legal counsel, or advisors where
                        necessary to fulfill regulatory reporting obligations,
                        resolve disputes, enforce our terms, or obtain
                        professional guidance. Such access is strictly
                        controlled and limited to the minimum necessary scope.
                      </p>
                      <p>
                        East Emblem ensures that all data-sharing arrangements
                        are governed by appropriate legal safeguards, such as
                        data sharing agreements, confidentiality clauses, and
                        (where applicable) Standard Contractual Clauses or
                        equivalent mechanisms for international transfers. We
                        remain accountable for the processing of your Personal
                        Data by any third parties acting on our behalf and
                        regularly review our relationships to ensure ongoing
                        compliance.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* AI Insights */}
            <div id="ai-insights">
              <SectionCard
                id="ai-insights"
                title="AI-Generated Insights and Responsibility Disclaimer"
                number="7"
              >
                <div className="space-y-4">
                  <p>
                    The Second Chance platform uses automated systems, including
                    artificial intelligence (AI) and machine learning models, to
                    support the analysis, scoring, and validation of founder
                    submissions. These systems are integral to our ability to
                    process high volumes of startup information efficiently,
                    generate structured insights for investors, and provide
                    founders with objective, consistent feedback on their
                    readiness, strengths, and gaps.
                  </p>
                  <p>
                    When you submit materials to the platform such as your pitch
                    deck, founder profile, traction data, or milestone roadmap
                    our systems may apply algorithmic models to assess your
                    startup’s stage, progress, and alignment with investor
                    mandates. These models help generate outputs such as
                    ProofScores, validation layers, and investor matching
                    scores, all of which are designed to assist with
                    benchmarking, routing, and decision-making.
                  </p>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="font-medium text-orange-800">
                      Important Disclaimer
                    </p>
                    <p className="text-orange-700 mt-1">
                      It is important to understand that these AI-generated
                      outputs are advisory in nature. They are designed to
                      augment human understanding, not to replace it. All
                      results and scores should be interpreted as inputs into a
                      broader decision-making process. Neither East Emblem nor
                      its algorithms make investment decisions, endorsements, or
                      funding recommendations on behalf of any party.
                    </p>
                  </div>

                  <p>
                    Founders remain fully responsible for the accuracy of the
                    information they provide and for interpreting the outcomes
                    shared by the platform. Investors remain solely responsible
                    for their own due diligence, risk assessment, and funding
                    decisions. We encourage all users whether founders,
                    investors, or partners to treat AI-generated content as one
                    of several tools available to guide their decision-making.
                  </p>
                  <p>
                    Where AI systems are used, we apply robust internal
                    governance measures to ensure transparency, accuracy, and
                    fairness. Our algorithms are regularly reviewed for bias,
                    drift, and unintended outcomes. We avoid deploying fully
                    automated systems for any decisions that may have legal or
                    significant effects on individuals, such as platform
                    exclusion, investment qualification, or ranking visibility,
                    without human oversight.
                  </p>

                  <p>
                    If you believe that an AI-generated evaluation or decision
                    may be inaccurate or unfair, you are encouraged to contact
                    us at{" "}
                    <a
                      href="mailto:info@eastemblem.com"
                      className="text-primary hover:underline"
                    >
                      info@eastemblem.com
                    </a>{" "}
                    to request a review.We are committed to providing meaningful
                    explanations of how automated assessments are conducted,
                    what inputs they rely on, and what steps can be taken to
                    challenge or contextualize a result.
                  </p>
                  <p>
                    In accordance with the UAE PDPL and international data
                    protection frameworks, you have the right not to be subject
                    to solely automated decisions that significantly affect your
                    legal or personal interests without appropriate safeguards
                    in place. East Emblem complies with these requirements and
                    ensures that meaningful human involvement is maintained
                    wherever required.
                  </p>
                </div>
              </SectionCard>
            </div>

            {/* Marketing */}
            <div id="marketing">
              <SectionCard
                id="marketing"
                title="Marketing, Communications & Preferences"
                number="8"
              >
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd may, from time to time, contact you with
                    information about the Second Chance platform, new features,
                    founder or investor opportunities, partner events, or
                    content that we believe may be relevant or beneficial to
                    you.These communications may include newsletters, updates,
                    invitations to pitch events or investor roundtables, feature
                    announcements, or periodic surveys.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        8.1 Consent for Marketing Communications
                      </h4>
                      <p className="mb-3">
                        We aim to communicate with you in a thoughtful,
                        relevant, and respectful manner, and to give you
                        meaningful control over how we use your contact details
                        for marketing or outreach purposes.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        8.2 Types of Communications
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="border border-primary/20 rounded-lg p-4">
                          <h5 className="font-semibold text-foreground mb-2">
                            Founders may receive:
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>
                              Updates about your application or evaluation
                            </li>
                            <li>
                              Opportunities for additional support or visibility
                            </li>
                            <li>
                              Announcements about platform changes or partner
                              initiatives
                            </li>
                            <li>
                              Invitations to networking events or workshops
                            </li>
                          </ul>
                        </div>

                        <div className="border border-primary/20 rounded-lg p-4">
                          <h5 className="font-semibold text-foreground mb-2">
                            Investors may receive:
                          </h5>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Introductions to relevant founders</li>
                            <li>Cohort summaries or spotlight profiles</li>
                            <li>
                              Invitations to participate in demo days, discovery
                              sessions, or validation pilot groups
                            </li>
                            <li>Market insights and trend reports</li>
                          </ul>
                        </div>
                        <p>
                          We send these communications based on either your
                          explicit consent (e.g., opting in via a form or
                          checkbox) or our legitimate interest in keeping
                          platform participants informed and engaged always in a
                          manner that is non-intrusive and aligned with your
                          role and expectations.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        8.3 Communication Preferences and Opt-Out
                      </h4>
                      <p className="mb-3">
                        Our policy is to communicate in a non-intrusive manner
                        and to respect your time and preferences. All marketing
                        emails include clear opt-out mechanisms.
                      </p>
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="font-medium text-foreground mb-2">
                          You may opt out of marketing communications at any
                          time by:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>
                            Clicking the unsubscribe link at the bottom of our
                            emails
                          </li>
                          <li>
                            Adjusting your communication preferences via your
                            platform account
                          </li>
                          <li>
                            Contacting us directly at{" "}
                            <a
                              href="mailto:info@eastemblem.com"
                              className="text-primary hover:underline"
                            >
                              info@eastemblem.com
                            </a>
                          </li>
                        </ul>
                        <p className="text-sm mt-2 text-muted-foreground">
                          Opting out of marketing communications will not affect
                          transactional or operational messages, such as updates
                          about your account, introductions, security notices,
                          or required compliance correspondence. These
                          service-related messages are essential for the
                          delivery of the platform and cannot be disabled
                          without deactivating your user account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p>
                    We will never send you direct marketing without an
                    appropriate legal basis and will not share your contact
                    information with third parties for their own marketing
                    purposes without your express consent. Where required by
                    law, we will request affirmative opt-in consent before
                    sending you promotional content.
                  </p>
                  <p>
                    If you previously gave consent to receive marketing
                    communications but no longer wish to receive them, you may
                    withdraw that consent at any time using the methods
                    described above. We will act promptly to update your
                    preferences in our systems.
                  </p>
                </div>
              </SectionCard>
            </div>

            {/* Cookies */}
            <div id="cookies">
              <SectionCard
                id="cookies"
                title="Cookies and Tracking Technologies"
                number="9"
              >
                <div className="space-y-4">
                  <p>
                    East Emblem Ltd uses cookies and other tracking technologies
                    to enhance the performance, functionality, and usability of
                    the Second Chance platform. These technologies help us
                    understand how visitors engage with our content, monitor
                    site performance, enable secure logins, personalize
                    features, and improve the overall user experience.
                  </p>
                  <p>
                    Cookies are small text files stored on your device when you
                    visit or interact with a website or application. They allow
                    us to remember your preferences, recognize returning users,
                    and deliver features in a consistent and secure manner. Some
                    cookies are set by us directly (first-party cookies), while
                    others may be placed by third-party service providers whose
                    tools or analytics are integrated into the platform.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        9.1 Types of Cookies We Use
                      </h4>
                      <p className="mb-3">
                        We use the following categories of cookies and similar
                        tracking technologies:
                      </p>

                      <div className="grid gap-4">
                        <div className="border border-primary/20 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground">
                            Essential Cookies
                          </h4>
                          <p className="text-sm mt-1">
                            These cookies are necessary for the platform to
                            function properly and securely. They enable basic
                            functionality such as user login, session
                            authentication, CSRF protection, and navigation.
                            Because they are required for the site to operate,
                            you cannot opt out of essential cookies through
                            platform settings.
                          </p>
                        </div>

                        <div className="border border-primary/20 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground">
                            Performance and Analytics Cookies
                          </h4>
                          <p className="text-sm mt-1">
                            These cookies collect information about how users
                            interact with the platform, such as which pages are
                            visited, how long users stay on certain sections,
                            which links are clicked, and whether any errors
                            occur. This data helps us understand user behavior,
                            measure engagement, and improve the effectiveness of
                            our layout, content, and features. We may use tools
                            such as Google Analytics or Amplitude to collect and
                            process this data. Where required by law, these
                            cookies will only be activated with your consent.
                          </p>
                        </div>

                        <div className="border border-primary/20 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground">
                            Functional Cookies
                          </h4>
                          <p className="text-sm mt-1">
                            These cookies enable the platform to remember
                            choices you make, such as language preferences, view
                            settings, or form autofill values. They allow us to
                            personalize your experience and reduce friction when
                            returning to the site. Functional cookies may be
                            disabled in your browser, but doing so may impact
                            usability.
                          </p>
                        </div>

                        <div className="border border-primary/20 rounded-lg p-4">
                          <h4 className="font-semibold text-foreground">
                            Targeting and Third-Party Cookies
                          </h4>
                          <p className="text-sm mt-1">
                            In limited cases, we may partner with trusted
                            third-party services to display relevant platform
                            updates or partnership content through advertising
                            or embedded media. These cookies may track user
                            behavior across websites for the purpose of
                            measuring engagement or optimizing reach. We will
                            always seek your consent before enabling these
                            cookies and will provide clear instructions on how
                            to opt out.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        9.2 Cookie Consent and Control
                      </h4>
                      <p className="mb-3">
                        When you visit the Second Chance platform for the first
                        time (or after clearing your cookies), you will be
                        presented with a cookie banner or consent manager that
                        allows you to review and manage your cookie preferences.
                        You may choose to accept all cookies, reject
                        non-essential ones, or customize your preferences
                        according to cookie category. You may also manage
                        cookies through your browser settings. Most browsers
                        allow you to view, delete, or block cookies for specific
                        websites. Please note that disabling cookies may affect
                        certain features and functionality of the platform.
                      </p>
                      <p>
                        Where required by the UAE PDPL or similar laws, we will
                        not set non-essential cookies without your prior,
                        affirmative consent. We keep detailed records of cookie
                        consent and will refresh consent periodically in
                        accordance with regulatory guidance.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        9.3 Web Beacons, Pixels, and Device Fingerprinting
                      </h4>
                      <p className="mb-3">
                        In addition to cookies, we may use other tracking
                        mechanisms such as:
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>
                            Web beacons or tracking pixels, which allow us to
                            monitor email opens, link clicks, and session
                            behavior.
                          </li>
                          <li>
                            Session tokens, which associate your activity with
                            your logged-in profile without storing personal
                            identifiers in cookies.
                          </li>
                          <li>
                            Device fingerprinting methods for security and fraud
                            prevention, which help detect unauthorized or
                            suspicious access patterns.
                          </li>
                        </ul>
                      </p>
                      These technologies serve security, analytics, and feature
                      enablement purposes and are used in a manner consistent
                      with our privacy obligations. Where feasible, we minimize
                      the use of intrusive technologies and seek consent when
                      required.
                      <p></p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        9.4 Contact and Additional Information
                      </h4>
                      <p className="mb-3">
                        If you have any questions about how we use cookies or
                        tracking technologies or if you wish to withdraw or
                        change your cookie preferences you may contact us at
                        info@eastemblem.com at any time. A standalone Cookie
                        Policy with updated details about individual cookies and
                        third-party providers may also be available on our
                        website or platform interface.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            <div id="transfers">
              <SectionCard
                id="transfers"
                title="Data Transfers Outside the UAE"
                number="10"
              >
                <div className="space-y-4">
                  <p>
                    As a digital platform with a globally distributed user base
                    and service infrastructure, East Emblem Ltd may, from time
                    to time, transfer Personal Data outside the United Arab
                    Emirates, including to countries that may not offer the same
                    level of data protection as the UAE or the user’s country of
                    residence. These transfers may occur for various operational
                    reasons, such as when we:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>
                      Use third-party cloud infrastructure or hosting providers
                      based abroad (e.g. AWS or other secure cloud platforms).
                    </li>
                    <li>
                      Engage data processors or service providers (such as
                      analytics tools or communication platforms) located in
                      foreign jurisdictions.
                    </li>
                    <li>
                      Interact with investors, partners, or founders based
                      outside the UAE in the context of Second Chance
                      introductions or platform services.
                    </li>
                  </ul>
                  <p>
                    Where such international transfers are necessary, we take
                    appropriate legal and technical measures to ensure that your
                    Personal Data remains protected, secure, and handled in a
                    manner that is consistent with the rights and obligations
                    set out in the UAE Federal Decree- Law No. 45 of 2021 on the
                    Protection of Personal Data (PDPL), as well as relevant
                    international frameworks such as the EU GDPR, where
                    applicable.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        10.1 Transfer Safeguards
                      </h4>
                      <p className="mb-3">
                        In accordance with Article 23 of the UAE PDPL, we only
                        transfer Personal Data outside the UAE if one of the
                        following conditions is met:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                        <li>
                          The recipient jurisdiction has been deemed to offer an
                          adequate level of protection by the UAE Data Office or
                          other recognized authority.
                        </li>
                        <li>
                          We have entered into legally binding instruments, such
                          as Standard Contractual Clauses (SCCs) or equivalent
                          data transfer agreements, with the receiving party to
                          ensure the data is processed in accordance with UAE
                          and international data protection standards.
                        </li>
                        <li>
                          The transfer is otherwise justified by explicit
                          consent from the Data Subject, contractual necessity,
                          legal obligation, or to protect the vital interests of
                          the individual.
                        </li>
                      </ul>

                      <p>
                        Where appropriate, we also implement additional
                        technical safeguards, such as encryption,
                        pseudonymization, role-based access control, and storage
                        limitation to reduce the risk of unauthorized access or
                        misuse during or after transfer.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        10.2 Transfers to Multinational or Cross-Border Teams
                      </h4>
                      <p className="mb-3">
                        Some members of the East Emblem team including analysts,
                        product managers, and data scientists may be located
                        outside the UAE. Where such personnel access Personal
                        Data in the course of delivering platform services, they
                        do so under strict internal policies and access
                        controls. All East Emblem employees and contractors are
                        subject to confidentiality obligations and privacy
                        training regardless of their location.
                      </p>
                      <p>
                        Where access is granted from jurisdictions without an
                        adequacy ruling, we ensure that it is limited to only
                        what is necessary, secured through encrypted
                        connections, and subject to oversight by our UAE-based
                        data governance function.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        10.3 Your Rights in International Transfers
                      </h4>
                      <p className="mb-3">
                        You have the right to be informed when your Personal
                        Data is transferred to another country, and to request
                        further information about the safeguards we have put in
                        place. If you would like more detail about our
                        cross-border data transfer arrangements, including the
                        list of service providers and data processors located
                        abroad, you may contact us at
                        <a
                          href="mailto:info@eastemblem.com"
                          className="underline font-medium"
                        >
                          info@eastemblem.com
                        </a>
                      </p>
                      <p>
                        We will provide you with a response in accordance with
                        our legal obligations and with respect for the
                        commercial sensitivity of our security architecture.
                      </p>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Security */}
            <div id="security">
              <SectionCard
                id="security"
                title="Data Security Measures"
                number="11"
              >
                <div className="space-y-4">
                  <p className="mb-3">
                    East Emblem Ltd is committed to protecting the
                    confidentiality, integrity, and availability of the Personal
                    Data we collect and process through the Second Chance
                    platform. We implement a robust framework of technical,
                    organizational, and contractual security measures to
                    safeguard data against unauthorized access, accidental loss,
                    destruction, misuse, or unlawful disclosure.
                  </p>
                  <p>
                    Our data security program is built on internationally
                    recognized standards and is regularly reviewed to ensure
                    that it evolves in response to emerging threats, legal
                    developments, and platform changes.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        11.1 Technical Safeguards
                      </h4>
                      <p className="mb-3">
                        All Personal Data processed by East Emblem is hosted on
                        secure cloud infrastructure using trusted service
                        providers that comply with high-grade security
                        certifications (e.g., ISO 27001, SOC 2). Our
                        infrastructure is designed to ensure fault tolerance,
                        redundancy, and data encryption both at rest and in
                        transit.
                      </p>
                      <p className="mb-3">
                        We use HTTPS/SSL encryption for all communications
                        between user devices and our servers, enforce strong
                        access credentials, and apply multi-factor
                        authentication (MFA) for administrative or privileged
                        user accounts. Role-based access controls (RBAC) are in
                        place to ensure that only authorized personnel may
                        access specific categories of data relevant to their
                        function.
                      </p>
                      <p className="mb-3">
                        Audit logs are maintained to record system access, data
                        changes, and permission modifications, enabling
                        traceability and post-incident forensics if required.
                        Passwords are securely hashed using modern cryptographic
                        standards and are never stored in plain text.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        11.2 Organizational Safeguards
                      </h4>
                      <p className="mb-3">
                        All East Emblem employees, consultants, and contractors
                        with access to Personal Data are subject to strict
                        confidentiality obligations and undergo regular privacy
                        and security training. Personnel are trained to
                        recognize and respond to phishing, social engineering
                        attempts, and data handling risks.
                      </p>
                      <p className="mb-3">
                        We maintain an internal data classification framework to
                        distinguish between public, internal, sensitive, and
                        restricted information. Data minimization practices are
                        applied to limit collection and retention to what is
                        necessary for each specific use case.
                      </p>
                      <p className="mb-3">
                        All devices used by East Emblem staff must comply with
                        security policies that include endpoint encryption,
                        automatic locking, screen timeout, and mandatory
                        software updates. Remote access is secured through VPN
                        and endpoint protection tools.
                      </p>
                      <p className="mb-3">
                        Where third-party processors or service providers handle
                        data on our behalf, we ensure they are contractually
                        bound to uphold equivalent security standards through
                        detailed Data Processing Agreements (DPAs). These
                        contracts also include audit rights, breach notification
                        clauses, and access restrictions.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        11.3 Physical and Environmental Security
                      </h4>
                      <p className="mb-3">
                        Although East Emblem operates primarily through
                        cloud-based systems, any physical locations or
                        on-premises storage (e.g., for partner events or
                        workshops) are subject to physical access controls,
                        locked storage, and secure disposal protocols. Any
                        hard-copy records are stored in locked cabinets and
                        disposed of via shredding or certified destruction
                        services when no longer needed.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        11.4 Vulnerability Management and Monitoring
                      </h4>
                      <p className="mb-3">
                        Our systems are continuously monitored for suspicious
                        behavior, unauthorized access attempts, and performance
                        anomalies. We perform routine vulnerability scans,
                        dependency reviews, and (where appropriate) third-party
                        penetration tests to identify and address weaknesses.
                      </p>
                      <p className="mb-3">
                        Software updates and patches are applied regularly to
                        protect against known threats, and change management
                        policies govern updates to platform components and
                        infrastructure configurations.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        11.5 Business Continuity and Disaster Recovery
                      </h4>
                      <p className="mb-3">
                        East Emblem maintains backup and recovery procedures to
                        ensure the continuity of service in the event of data
                        loss, system failure, or disaster scenarios. Backups are
                        encrypted and stored in geographically redundant
                        locations. Business continuity plans are reviewed and
                        tested periodically to verify readiness and alignment
                        with operational risk thresholds. We take seriously our
                        responsibility to keep your data safe and secure, and we
                        continuously invest in improvements to our technical
                        systems, employee awareness, and platform resilience.
                        However, it is important to recognize that no system can
                        guarantee absolute security. If you suspect any misuse
                        or unauthorized access to your data, please contact{" "}
                        <a
                          href="mailto:info@eastemblem.com"
                          className="underline font-medium"
                        >
                          info@eastemblem.com
                        </a>{" "}
                        immediately so we can investigate and take appropriate
                        action.
                      </p>
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
                    East Emblem Ltd retains Personal Data only for as long as it
                    is necessary to fulfill the specific purposes for which it
                    was collected, or to comply with applicable legal,
                    regulatory, or contractual requirements. Once the relevant
                    purpose has been satisfied or the applicable retention
                    period has expired we will securely delete, anonymize, or
                    archive the data in accordance with our internal retention
                    and disposal policies.
                  </p>
                  <p>
                    Our data retention framework is designed to support the
                    following goals:
                    <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                      <li>Ensure data is kept no longer than necessary.</li>
                      <li>
                        Comply with relevant UAE data protection laws, including
                        Article 10 of the UAE PDPL.
                      </li>
                      <li>
                        Maintain the ability to respond to audits, regulatory
                        inquiries, or legal claims.
                      </li>
                      <li>
                        Mitigate the risk of unauthorized access by minimizing
                        data sprawl or duplication.
                      </li>
                    </ul>
                  </p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        12.1 Retention Periods by Use Case
                      </h4>
                      <p className="text-sm mt-1">
                        Personal Data is retained for different durations
                        depending on the nature of the relationship and the
                        purpose for which it was collected. For example:
                        <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                          <li>
                            Founders and startup applicants: Data submitted to
                            the Second Chance platform (e.g. pitch decks,
                            ProofScores, onboarding forms) is retained for the
                            duration of your engagement with the platform and up
                            to 24 months following your last login or activity,
                            unless earlier deletion is requested. This allows us
                            to maintain historical scoring data, performance
                            benchmarking, and access for potential investors
                            during follow-on periods.
                          </li>
                          <li>
                            Investors and partners: Investor profiles,
                            preferences, and engagement history are retained for
                            the duration of your relationship with East Emblem
                            and for up to 36 months after your last interaction,
                            to support ongoing curation and cohort access. You
                            may request that we anonymize your account at any
                            time while preserving your firm’s interaction
                            history for analytics purposes.
                          </li>
                          <li>
                            Email communications, support logs, and feedback
                            surveys: These records are typically retained for up
                            to 18 months, unless a longer period is required for
                            legal or audit purposes.
                          </li>
                          <li>
                            Security logs, authentication data, and system
                            access records: Retained for 12 to 24 months,
                            depending on risk classification and jurisdictional
                            obligations.
                          </li>
                          <li>
                            Financial and invoicing records: Retained for a
                            minimum of 5 years, as required by UAE commercial
                            regulations and accounting standards.
                          </li>
                        </ul>
                      </p>
                      <p>
                        Where we are legally required to retain records beyond
                        the periods noted above for example, due to court
                        orders, tax laws, or regulatory audits we will comply
                        accordingly.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground">
                        12.2 Anonymization and Aggregation
                      </h4>
                      <p className="text-sm mt-1">
                        In some cases, we may retain data in an anonymized or
                        aggregated form after the original retention period has
                        expired. This means the data is no longer associated
                        with an identifiable individual and cannot be used to
                        re-identify a person. Aggregated data may be used for
                        analytics, benchmarking, or research purposes and does
                        not fall within the scope of Personal Data under this
                        policy.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground">
                        12.3 Secure Disposal and Deletion
                      </h4>
                      <p className="text-sm mt-1">
                        At the end of a retention period, or upon valid request
                        for erasure, we take reasonable steps to securely delete
                        or de-identify Personal Data from our systems. This
                        includes:
                        <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                          <li>
                            Overwriting or cryptographic wiping of digital
                            records.
                          </li>
                          <li>
                            Physical destruction of paper records, where
                            applicable.
                          </li>
                          <li>
                            Ensuring that backups containing Personal Data are
                            either deleted on rotation or flagged for erasure at
                            the next recovery cycle.
                          </li>
                        </ul>
                      </p>
                      <p>
                        Deletion processes are applied across production, test,
                        and backup environments to ensure consistency. We
                        maintain audit records of deletion activities in
                        accordance with our internal compliance policies.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground">
                        12.4 Data Subject-Initiated Deletion
                      </h4>
                      <p className="text-sm mt-1">
                        You may request deletion of your Personal Data at any
                        time, subject to any legal or operational obligations
                        that require us to retain it. If no such obligations
                        apply, we will honor your request and confirm deletion
                        within a reasonable timeframe. See Section 14: Data
                        Subject Rights for more information on your right to
                        erasure. We periodically review all categories of
                        Personal Data held by East Emblem to ensure ongoing
                        alignment with our retention policy and to minimize
                        unnecessary data storage. If you have questions about
                        how long your data is retained, or would like to
                        initiate a deletion request, please contact us at
                        info@eastemblem.com.
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
                    East Emblem Ltd respects your rights as a data subject and
                    is committed to ensuring that you can exercise meaningful
                    control over your Personal Data in accordance with the UAE
                    Federal Decree-Law No. 45 of 2021 on the Protection of
                    Personal Data (PDPL) and, where applicable, global privacy
                    regulations such as the EU General Data Protection
                    Regulation (GDPR).
                  </p>
                  <p>
                    If you interact with the Second Chance platform as a
                    founder, investor, partner, or visitor you have a range of
                    rights regarding your Personal Data. We take these rights
                    seriously and have procedures in place to address any
                    request you may make in a timely, transparent, and secure
                    manner.
                  </p>

                  <div>
                    <h4 className="font-semibold text-foreground mb-4">
                      13.1 Your Rights
                    </h4>
                    <p>
                      As a data subject, you may exercise the following rights:
                    </p>
                    <div className="grid gap-4">
                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">
                          1. Right to Access
                        </h5>
                        <p className="mt-2">
                          You have the right to request confirmation of whether
                          we hold Personal Data about you and, if so, to access
                          that information. Upon request, we will provide a copy
                          of the data we process, along with details about its
                          source, purpose, categories, and any third parties
                          with whom it has been shared.
                        </p>
                      </div>

                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">
                          2. Right to Rectification
                        </h5>
                        <p className="mt-2">
                          If you believe that any Personal Data we hold about
                          you is inaccurate, incomplete, or outdated, you have
                          the right to request that it be corrected or updated.
                          We will take reasonable steps to verify and make the
                          necessary amendments.
                        </p>
                      </div>

                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">
                          3. Right to Erasure (Right to be Forgotten)
                        </h5>
                        <p className="mt-2">
                          You have the right to request deletion of your
                          Personal Data under certain conditions such as when it
                          is no longer needed for the purpose it was collected,
                          when consent is withdrawn, or when processing is
                          unlawful. We will evaluate each request in light of
                          any legal or contractual obligations requiring data
                          retention and inform you of the outcome.
                        </p>
                      </div>

                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">
                          4. Right to Object to Processing
                        </h5>
                        <p className="mt-2">
                          You may object to the processing of your Personal Data
                          where the processing is based on our legitimate
                          interests or relates to direct marketing. If your
                          objection is valid, we will cease processing the data
                          unless we can demonstrate compelling legal grounds to
                          continue.
                        </p>
                      </div>

                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">
                          5. Right to Data Portability
                        </h5>
                        <p className="mt-2">
                          In certain situations, you may request that we
                          temporarily suspend processing of your data such as
                          while verifying its accuracy or reviewing an objection
                          request. During this period, we will not use the data
                          for any purpose other than storage.
                        </p>
                      </div>

                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">
                          6. Right to Restrict Processing
                        </h5>
                        <p className="mt-2">
                          Where processing is based on consent or contract, and
                          is carried out by automated means, you may request to
                          receive your Personal Data in a structured, commonly
                          used, machine-readable format, and to have it
                          transmitted to another controller, where technically
                          feasible.
                        </p>
                      </div>

                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">
                          7. Right to Withdraw Consent
                        </h5>
                        <p className="mt-2">
                          Where we rely on your consent to process Personal Data
                          such as for marketing communications you may withdraw
                          your consent at any time. Withdrawal does not affect
                          any processing that took place prior to your request.
                        </p>
                      </div>

                      <div className="border border-primary/20 rounded-lg p-4">
                        <h5 className="font-semibold text-foreground">
                          8. Right to Lodge a Complaint
                        </h5>
                        <p className="mt-2">
                          If you believe your rights have been violated or that
                          we have not handled your Personal Data in accordance
                          with the law, you have the right to lodge a complaint
                          with the UAE Data Office, or with the relevant
                          supervisory authority in your country of residence, if
                          applicable.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">
                      13.2 How to Exercise Your Rights
                    </h4>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Mail className="w-5 h-5 text-primary" />
                        <p className="font-medium text-foreground">
                          Contact Information
                        </p>
                      </div>
                      <p className="mb-2">
                        <span className="font-medium">Email:</span>
                        <a
                          href="mailto:info@eastemblem.com"
                          className="ml-2 text-primary hover:underline"
                        >
                          info@eastemblem.com
                        </a>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Subject line: "Data Request – [Your Name or
                        Organization]"
                      </p>
                    </div>

                    <p className="mt-4">
                      We may ask you to verify your identity before fulfilling your request, particularly if the
                      request concerns sensitive data or could impact another party’s rights. We aim to respond
                      to all valid requests within 30 days, although complex requests may take longer. In such
                      cases, we will keep you informed of progress.
                    </p>
                    <p className="mt-4">Please note that your rights may be subject to certain legal exceptions or limitations. For
                    example, we may decline a request if fulfilling it would infringe on the rights of another
                    individual, violate a legal obligation, or compromise a legitimate investigation.</p>
                    <p className="mt-4">At East Emblem, we believe that data protection is not only a legal obligation, but also a
                    foundation of trust. If you have any questions or concerns about your rights or how to
                    exercise them, we encourage you to reach out directly to our privacy team.</p>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Data Breach */}
            <div id="breach">
              <SectionCard
                id="breach"
                title="Data Breach Notification and Incident Response"
                number="14"
              >
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd maintains a proactive and structured incident response protocol designed
                    to detect, contain, assess, and mitigate any actual or suspected breach of Personal Data.
                    While we implement robust security safeguards to minimize the risk of incidents, we also
                    recognize the importance of being prepared to act decisively if a breach occurs.
                  </p>
                  <p>In accordance with Article 9 of the UAE Personal Data Protection Law (PDPL) and applicable
                  international frameworks, East Emblem commits to timely and transparent notification
                  procedures in the event of any breach that poses a risk to the confidentiality, integrity, or
                  availability of Personal Data.</p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        14.1 What Constitutes a Data Breach?
                      </h4>
                      <p className="mb-3">
                        A data breach may include, but is not limited to:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4 mb-3">
                        <li>
                          Unauthorized access to Personal Data by a third party (e.g. hacking or phishing
                          attack).
                        </li>
                        <li>
                          Accidental disclosure or loss of data due to human error or system malfunction.
                        </li>
                        <li>
                          Malicious data corruption or ransomware attacks.
                        </li>
                        <li>
                          Internal misuse of Personal Data in violation of access policies.
                        </li>
                      </ul>
                      <p>Breaches may involve data in digital or physical form and can result from acts of omission,
                      negligence, or deliberate wrongdoing.</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        14.2 Five-Step Incident Response Process
                      </h4>
                      <p className="mb-3">
                        If we detect or are informed of a potential data breach, we immediately activate our
                        incident response plan, which includes the following steps:
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 border border-red-200 bg-red-50 rounded-lg p-3">
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            1
                          </div>
                          <div>
                            <h5 className="font-semibold text-red-800">
                              Detection & Containment
                            </h5>
                            <p className="text-sm text-red-700">
                              We isolate affected systems to prevent further exposure or escalation and begin
                              assessing the scope of the breach.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 border border-orange-200 bg-orange-50 rounded-lg p-3">
                          <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            2
                          </div>
                          <div>
                            <h5 className="font-semibold text-orange-800">
                              Assessment & Classification
                            </h5>
                            <p className="text-sm text-orange-700">
                              We evaluate the type of data involved, the number of individuals affected, the root
                              cause, and the potential consequences for users or stakeholders.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            3
                          </div>
                          <div>
                            <h5 className="font-semibold text-yellow-800">
                              Notification of Authorities
                            </h5>
                            <p className="text-sm text-yellow-700">
                              If the breach presents a risk to the privacy, security, or rights of individuals, we
                              notify the UAE Data Office (or other competent authority) within the legally
                              mandated timeframe. This includes details of the incident, potential impact,
                              mitigation measures, and steps taken to prevent recurrence.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 border border-blue-200 bg-blue-50 rounded-lg p-3">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            4
                          </div>
                          <div>
                            <h5 className="font-semibold text-blue-800">
                              Notification of Affected Individuals
                            </h5>
                            <p className="text-sm text-blue-700">
                              Where required by law or where we believe it is necessary to protect your interests
                              we will notify affected individuals promptly. Notifications will describe the nature of
                              the breach, any data affected, recommended steps you can take to reduce potential
                              harm (e.g., password resets), and how to contact us for further information.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 border border-green-200 bg-green-50 rounded-lg p-3">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            5
                          </div>
                          <div>
                            <h5 className="font-semibold text-green-800">
                              Remediation & Prevention
                            </h5>
                            <p className="text-sm text-green-700">
                              We take corrective actions to fix the root cause of the incident, including security
                              patches, access changes, policy revisions, and employee re-training. A post-
                              incident review is conducted to document lessons learned and enhance our
                              protocols.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3">
                        14.3 Individual Notification Process
                      </h4>
                      <p className="mb-3">
                        While we maintain strong technical and organizational security controls, the protection of
                        your Personal Data also depends on your cooperation. You are responsible for safeguarding
                        your login credentials, not sharing access with unauthorized parties, and promptly
                        reporting any suspicious activity involving your account.
                      </p>
                      <p className="mb-3">
                        If you suspect that your data may have been compromised whether through phishing,
                        unauthorized account access, or platform misuse you should immediately contact us at 
                        <a
                          href="mailto:info@eastemblem.com"
                          className="underline font-medium"
                        >
                           info@eastemblem.com 
                        </a>
                        
                        East Emblem is committed to accountability, transparency, and rapid response in the event
                        of a breach. We treat all incidents with the urgency and seriousness they deserve, and we
                        view breach response not as a compliance obligation but as a critical part of maintaining
                        trust with our community.
                      </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="font-medium text-red-800 mb-2">
                        Your Role in Maintaining Security
                      </p>
                      <div className="space-y-2 text-sm text-red-700">
                        <p>
                          You play an important role in protecting your Personal
                          Data. Please:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Use strong, unique passwords for your account</li>
                          <li>
                            Report suspicious activity or unauthorized access
                            immediately
                          </li>
                          <li>
                            Keep your contact information updated for security
                            notifications
                          </li>
                          <li>Review your account activity regularly</li>
                        </ul>
                        <p className="mt-2">
                          If you suspect that your data may have been
                          compromised, please immediately contact us at 
                          <a
                            href="mailto:info@eastemblem.com"
                            className="underline font-medium"
                          >
                            info@eastemblem.com
                          </a>
                          with the subject line "Security Incident Report".
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Contact Information */}
            <div id="contact">
              <SectionCard
                id="contact"
                title="Contact Information and Policy Updates"
                number="15"
              >
                <div className="space-y-6">
                  <p>
                    East Emblem Ltd is committed to maintaining transparency, accountability, and
                    responsiveness in all matters concerning your Personal Data. If you have any questions,
                    concerns, or requests relating to this Privacy Policy or to how your data is collected,
                    processed, or protected you are encouraged to contact us using the details below.
                  </p>

                  <div>
                    <h4 className="font-semibold text-foreground mb-4">
                      15.1 Contacting East Emblem
                    </h4>
                    <div className="bg-gradient-to-r from-primary/5 to-primary-gold/5 border border-primary/20 rounded-lg p-6">
                      <div className="flex items-start space-x-4">
                        <Mail className="w-6 h-6 text-primary mt-1" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground mb-2">
                            Privacy and Compliance Team
                          </p>
                          <p className="text-lg font-semibold text-primary mb-1">
                            <a
                              href="mailto:info@eastemblem.com"
                              className="hover:underline"
                            >
                              info@eastemblem.com
                            </a>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Subject line: "Privacy Inquiry – [Your Name or
                            Company]"
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <p className="font-medium text-foreground mb-2">
                          If you wish to:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                          <li>
                            Make a data subject request (e.g., access, deletion,
                            rectification)
                          </li>
                          <li>
                            Report a suspected data breach or security concern
                          </li>
                          <li>
                            Withdraw consent or update your communication
                            preferences
                          </li>
                          <li>
                            Lodge a complaint or seek clarification about our
                            data practices
                          </li>
                        </ul>
                      </div>
                    </div>
                    <p>We will acknowledge and respond to your request in accordance with applicable legal
                    timeframes. If your concern cannot be resolved internally, you have the right to escalate
                    it to the UAE Data Office or another relevant supervisory authority, depending on your
                    jurisdiction.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3">
                      15.2 Policy Updates
                    </h4>
                    <p className="mb-4">
                      We may update this Privacy Policy from time to time to
                      reflect changes in:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4 mb-4">
                      <li>
                        Applicable data protection laws or regulatory
                        requirements
                      </li>
                      <li>
                        Our internal practices, platform features, or service
                        offerings
                      </li>
                      <li>
                        Technology or security infrastructure improvements
                      </li>
                    </ul>
                    <p className="mt-4">
                      All updates will be posted to our website or platform with
                      a revised "Last Updated" date. In the case of material
                      changes particularly those affecting your rights or how we
                      use your Personal Data we will provide additional notice
                      (e.g., by email or on-platform banners) and, where
                      required, request renewed consent.
                    </p>
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
                    <p className="text-center text-muted-foreground">
                      We encourage all users to review this Privacy Policy
                      periodically to stay informed of how we protect your
                      information.
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
