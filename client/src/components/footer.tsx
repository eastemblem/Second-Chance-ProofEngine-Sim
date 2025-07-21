import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border/40 mt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
                <span className="text-white font-bold text-sm">SC</span>
              </div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                Second Chance
              </span>
            </div>
            <p className="text-muted-foreground text-sm max-w-md">
              A comprehensive startup validation platform powered by ProofScaling methodology. 
              Helping entrepreneurs assess their investment readiness through AI-driven analysis.
            </p>
            <div className="mt-4 text-xs text-muted-foreground">
              <p>Operated by East Emblem Ltd</p>
              <p>Masdar City Free Zone, Abu Dhabi, UAE</p>
              <p>License: MC 13353</p>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/onboarding-flow" className="text-muted-foreground hover:text-primary transition-colors">
                  Onboarding
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/60 cursor-not-allowed">
                  Dashboard (Coming Soon)
                </span>
              </li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal & Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:info@eastemblem.com" 
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center"
                >
                  Contact Support
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms and Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} East Emblem Ltd. All rights reserved.</p>
          </div>
          <div className="text-xs text-muted-foreground mt-4 sm:mt-0">
            <p>
              Last updated: July 15, 2025 • 
              <Link to="/privacy" className="hover:text-primary transition-colors ml-1">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;