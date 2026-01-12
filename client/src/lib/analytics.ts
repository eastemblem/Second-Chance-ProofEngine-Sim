// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// UTM parameter keys
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const UTM_STORAGE_KEY = 'sc_utm_params';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

// Capture UTM parameters from URL and store in sessionStorage
export const captureUTMParams = (): UTMParams | null => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: UTMParams = {};
  let hasUTM = false;
  
  for (const key of UTM_KEYS) {
    const value = urlParams.get(key);
    if (value) {
      utmParams[key] = value.toLowerCase().trim();
      hasUTM = true;
    }
  }
  
  if (hasUTM) {
    sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmParams));
    return utmParams;
  }
  
  return null;
};

// Get stored UTM parameters
export const getStoredUTMParams = (): UTMParams | null => {
  if (typeof window === 'undefined') return null;
  
  const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

// Get UTM params (from URL or storage)
export const getUTMParams = (): UTMParams | null => {
  const fromUrl = captureUTMParams();
  if (fromUrl) return fromUrl;
  return getStoredUTMParams();
};

// Track payment confirmed event with UTM data
export const trackPaymentConfirmed = (
  orderReference: string,
  amount: number,
  currency: string = 'USD'
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const utmParams = getStoredUTMParams();
  
  window.gtag('event', 'payment_confirmed', {
    transaction_id: orderReference,
    value: amount,
    currency: currency,
    utm_source: utmParams?.utm_source,
    utm_medium: utmParams?.utm_medium,
    utm_campaign: utmParams?.utm_campaign,
    utm_content: utmParams?.utm_content,
    utm_term: utmParams?.utm_term,
  });
};

// Clear stored UTM params (call after successful account creation)
export const clearUTMParams = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(UTM_STORAGE_KEY);
};