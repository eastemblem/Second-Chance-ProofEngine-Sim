import { useState, useCallback } from 'react';

export function useUploadConsent() {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [hasGivenConsent, setHasGivenConsent] = useState(() => {
    // Check if consent was previously given
    return localStorage.getItem('vaultUploadConsent') === 'true';
  });

  const requestConsent = useCallback((callback: () => void) => {
    // If consent already given, proceed directly
    if (hasGivenConsent) {
      callback();
      return;
    }
    
    // Show consent modal and store callback
    setConsentConfirmed(false);
    setShowConsentModal(true);
    // Store callback for later execution
    (window as any).__uploadConsentCallback = callback;
  }, [hasGivenConsent]);

  const handleConsentConfirm = useCallback(() => {
    setShowConsentModal(false);
    setHasGivenConsent(true);
    // Store consent in localStorage so it persists
    localStorage.setItem('vaultUploadConsent', 'true');
    
    // Execute the stored callback
    const callback = (window as any).__uploadConsentCallback;
    if (callback) {
      callback();
      delete (window as any).__uploadConsentCallback;
    }
  }, []);

  const handleConsentCancel = useCallback(() => {
    setShowConsentModal(false);
    setConsentConfirmed(false);
    // Clear the stored callback
    delete (window as any).__uploadConsentCallback;
  }, []);

  return {
    showConsentModal,
    consentConfirmed,
    setConsentConfirmed,
    hasGivenConsent,
    requestConsent,
    handleConsentConfirm,
    handleConsentCancel
  };
}