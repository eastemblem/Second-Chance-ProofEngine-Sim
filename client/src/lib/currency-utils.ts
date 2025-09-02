/**
 * Currency utilities for location-based pricing
 * Handles USD to AED conversion for UAE users
 */

export interface CurrencyInfo {
  code: 'USD' | 'AED';
  symbol: string;
  amount: number;
}

// Current exchange rate: 1 USD = 3.673 AED (fixed rate for simplicity)
const USD_TO_AED_RATE = 3.673;

/**
 * Detect user's location to determine currency
 * Uses multiple detection methods with fallbacks
 */
export async function detectUserCurrency(): Promise<'USD' | 'AED'> {
  try {
    // Method 1: Try IP geolocation API
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000
    } as any);
    
    if (response.ok) {
      const data = await response.json();
      if (data.country_code === 'AE') {
        return 'AED';
      }
    }
  } catch (error) {
    console.log('IP geolocation failed, using fallback detection');
  }

  try {
    // Method 2: Browser timezone fallback
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone === 'Asia/Dubai' || timezone === 'Asia/Abu_Dhabi') {
      return 'AED';
    }
  } catch (error) {
    console.log('Timezone detection failed');
  }

  // Method 3: Browser language fallback
  const language = navigator.language || (navigator as any).userLanguage;
  if (language && (language.includes('ar') || language.includes('AE'))) {
    return 'AED';
  }

  // Default to USD for rest of world
  return 'USD';
}

/**
 * Convert USD amount to appropriate currency based on user location
 */
export function convertCurrency(usdAmount: number, targetCurrency: 'USD' | 'AED'): CurrencyInfo {
  if (targetCurrency === 'USD') {
    return {
      code: 'USD',
      symbol: '$',
      amount: usdAmount
    };
  }

  // Convert to AED and round to nearest whole number for clean pricing
  const aedAmount = Math.round(usdAmount * USD_TO_AED_RATE);
  
  return {
    code: 'AED',
    symbol: 'د.إ',
    amount: aedAmount
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(currencyInfo: CurrencyInfo): string {
  if (currencyInfo.code === 'AED') {
    return `${currencyInfo.amount} ${currencyInfo.code}`;
  }
  return `${currencyInfo.symbol}${currencyInfo.amount}`;
}

/**
 * Get pricing for Deal Room based on currency
 */
export function getDealRoomPricing(currency: 'USD' | 'AED') {
  const basePrice = 99; // $99 USD base price
  const originalPrice = 199; // $199 USD original price
  
  const currentPrice = convertCurrency(basePrice, currency);
  const originalPriceConverted = convertCurrency(originalPrice, currency);
  
  return {
    current: currentPrice,
    original: originalPriceConverted,
    formatted: {
      current: formatCurrency(currentPrice),
      original: formatCurrency(originalPriceConverted)
    }
  };
}

/**
 * Currency context hook for React components
 */
export function useCurrency() {
  const [currency, setCurrency] = React.useState<'USD' | 'AED'>('USD');
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    detectUserCurrency().then((detectedCurrency) => {
      setCurrency(detectedCurrency);
      setIsLoading(false);
    });
  }, []);

  return { currency, setCurrency, isLoading };
}

// For non-React usage
import React from 'react';