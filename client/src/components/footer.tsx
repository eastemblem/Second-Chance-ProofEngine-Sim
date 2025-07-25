import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border/40">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Company Info - Compact */}
          <div className="flex items-center justify-center sm:justify-start space-x-3">
            <img 
              src={import.meta.env.VITE_LOGO_URL} 
              alt="Second Chance Logo" 
              className="w-8 h-8 rounded"
            />
            <div>
              <span className="font-semibold text-base bg-gradient-to-r from-primary to-primary-gold bg-clip-text text-transparent">
                Second Chance
              </span>
              <p className="text-sm text-muted-foreground">ProofScaling Platform</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 text-sm">
            <a 
              href="/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Terms
            </a>
            <a 
              href="mailto:info@eastemblem.com" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Support
            </a>
          </div>

          {/* Copyright - Compact */}
          <div className="text-sm text-muted-foreground text-center sm:text-right flex items-center justify-center sm:justify-end">
            <p>© {new Date().getFullYear()} East Emblem Ltd</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;