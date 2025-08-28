import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle, X } from "lucide-react";
import { useLocation } from "wouter";

interface EmailVerificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function EmailVerificationPopup({ 
  isOpen, 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 5000 
}: EmailVerificationPopupProps) {
  const [countdown, setCountdown] = useState(autoCloseDelay / 1000);
  const [, setLocation] = useLocation();
  
  const handleClose = () => {
    onClose();
    setLocation("/");
  };

  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [isOpen, autoClose, autoCloseDelay, handleClose]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(autoCloseDelay / 1000);
    }
  }, [isOpen, autoCloseDelay]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Check Your Email
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                We've sent you a verification link to complete your account setup. 
                Please check your email and click the verification link to get started.
              </p>

              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-4">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Email sent successfully!</span>
              </div>

              {autoClose && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This popup will close in {countdown} seconds
                </p>
              )}
            </div>

            {/* Progress bar for countdown */}
            {autoClose && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <motion.div
                    className="h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: autoCloseDelay / 1000, ease: "linear" }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}