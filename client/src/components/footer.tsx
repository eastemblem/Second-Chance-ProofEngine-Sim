import { Link } from "wouter";
import { ExternalLink, Mail, MapPin, Shield, Award, Users, TrendingUp, Zap, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-b from-background to-muted/50 border-t border-border/40 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Company Info - Takes 2 columns on large screens */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">SC</span>
              </div>
              <div>
                <span className="font-bold text-xl gradient-text">
                  Second Chance
                </span>
                <p className="text-xs text-muted-foreground">ProofScaling Platform</p>
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm max-w-md mb-6 leading-relaxed">
              A comprehensive startup validation platform powered by ProofScaling methodology. 
              Helping entrepreneurs assess their investment readiness through AI-driven analysis 
              and strategic insights.
            </p>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-primary-gold" />
                <span className="text-xs text-muted-foreground">ProofScore System</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Investment Ready</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary-gold" />
                <span className="text-xs text-muted-foreground">Team Validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">AI Analysis</span>
              </div>
            </div>

            {/* Company Details */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3" />
                <span>Operated by East Emblem Ltd</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-3 h-3" />
                <span>Masdar City Free Zone, Abu Dhabi, UAE</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-3 h-3" />
                <span>License: MC 13353</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-primary" />
              Platform
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200 block">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/onboarding-flow" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200 block">
                  Onboarding Flow
                </Link>
              </li>
              <li>
                <Link to="/onboarding" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200 block">
                  ProofScore Test
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-not-allowed flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Dashboard (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 flex items-center">
              <Award className="w-4 h-4 mr-2 text-primary-gold" />
              Resources
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-muted-foreground/60 cursor-not-allowed">
                  ProofScaling Guide
                </span>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-not-allowed">
                  Validation Framework
                </span>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-not-allowed">
                  Investment Readiness
                </span>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-not-allowed">
                  Success Stories
                </span>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-primary" />
              Legal & Support
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200 block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200 block">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:info@eastemblem.com" 
                  className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Contact Support
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="mailto:legal@eastemblem.com" 
                  className="text-muted-foreground hover:text-primary transition-colors hover:translate-x-1 transform duration-200 flex items-center"
                >
                  Legal Inquiries
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary-gold/10 rounded-xl p-6 mb-8 border border-primary/20">
          <div className="text-center">
            <h3 className="font-bold text-lg text-foreground mb-2">Ready to Validate Your Startup?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Join founders who've used ProofScaling to secure investment and scale successfully.
            </p>
            <Link to="/onboarding">
              <Button className="gradient-button">
                Start Your ProofScore Journey
              </Button>
            </Link>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border/40 pt-6">
          <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
            <div className="text-xs text-muted-foreground text-center lg:text-left">
              <p>© {currentYear} East Emblem Ltd. All rights reserved.</p>
              <p className="mt-1">
                UAE Federal Decree-Law No. 45 of 2021 Compliant • 
                <Link to="/privacy" className="hover:text-primary transition-colors ml-1">
                  PDPL Protected
                </Link>
              </p>
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <span>Last updated: July 21, 2025</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Platform Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;