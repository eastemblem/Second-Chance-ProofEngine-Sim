import { motion } from "framer-motion";
import { Rocket, GraduationCap, Users, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FinalPageProps {
  onReset: () => void;
}

export default function FinalPage({ onReset }: FinalPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-card to-background">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <motion.div 
              className="w-20 h-20 bg-gradient-to-r from-primary to-primary-gold rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "backOut" }}
            >
              <Rocket className="text-white text-2xl w-8 h-8" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-4">Welcome to Second Chance</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Your validation journey starts now. Let's turn your potential into proof.
            </p>
          </div>

          <Card className="p-8 border-border bg-card mb-8">
            <h3 className="text-xl font-semibold mb-6">Choose Your Next Step</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  className="w-full gradient-button py-6 text-lg"
                  onClick={() => window.open('https://proofscaling.com', '_blank')}
                >
                  <GraduationCap className="mr-2 w-5 h-5" />
                  Start ProofScaling Course
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="outline" 
                  className="w-full bg-background border-primary text-primary hover:bg-primary hover:text-white py-6 text-lg transition-all duration-300"
                >
                  <Users className="mr-2 w-5 h-5" />
                  Join Investor Deal Room
                </Button>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="outline" 
                  className="w-full bg-background border-border text-foreground hover:border-primary-gold hover:text-primary-gold py-4 transition-all duration-300"
                >
                  <Download className="mr-2 w-4 h-4" />
                  Download ProofVault Template
                </Button>
              </motion.div>
            </div>
          </Card>

          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-4">
              Questions? Book a free 15-minute strategy call
            </p>
            <Button variant="link" className="text-primary hover:text-primary-gold transition-colors">
              <Calendar className="mr-1 w-4 h-4" />
              Schedule Call
            </Button>
          </div>

          <Button 
            onClick={onReset}
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground"
          >
            ← Start Over
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
