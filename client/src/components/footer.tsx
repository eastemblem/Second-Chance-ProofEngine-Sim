import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
          {/* Company Info - Compact */}
          <div className="flex items-center justify-center sm:justify-start space-x-3">
            <div className="w-6 h-6 rounded bg-gradient-to-r from-primary to-primary-gold flex items-center justify-center">
              <span className="text-white font-bold text-xs">SC</span>
            </div>
            <div>
              <span className="font-semibold text-sm bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                Second Chance
              </span>
              <p className="text-xs text-muted-foreground">ProofScaling Platform</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-xs">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              Get Started
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms
            </Link>
            <a 
              href="mailto:info@eastemblem.com" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Support
            </a>
          </div>

          {/* Copyright - Compact */}
          <div className="text-xs text-muted-foreground text-center sm:text-right">
            <p>© {new Date().getFullYear()} East Emblem Ltd</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;