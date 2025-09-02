/**
 * Currency utilities for location-based pricing
 * Handles USD to AED conversion for UAE users
 */

import React from 'react';

export interface CurrencyInfo {
  code: 'USD' | 'AED';
  symbol: string;
  amount: number;
}

// Cache for exchange rate to avoid excessive API calls
interface ExchangeRateCache {
  rate: number;
  timestamp: number;
  expiresIn: number; // milliseconds
}

let exchangeRateCache: ExchangeRateCache | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
const FALLBACK_RATE = 3.673; // Fallback rate if API fails

/**
 * Fetch live USD to AED exchange rate from multiple sources
 */
async function fetchLiveExchangeRate(): Promise<number> {
  // Check cache first
  if (exchangeRateCache && Date.now() < exchangeRateCache.timestamp + exchangeRateCache.expiresIn) {
    console.log('Using cached exchange rate:', exchangeRateCache.rate);
    return exchangeRateCache.rate;
  }

  const apis = [
    {
      name: 'ExchangeRate-API',
      url: 'https://api.exchangerate-api.com/v4/latest/USD',
      parser: (data: any) => data.rates?.AED
    },
    {
      name: 'ExchangeRate.host',
      url: 'https://api.exchangerate.host/latest?base=USD&symbols=AED',
      parser: (data: any) => data.rates?.AED
    },
    {
      name: 'Fawaz Ahmed API',
      url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      parser: (data: any) => data.usd?.aed
    }
  ];

  for (const api of apis) {
    try {
      console.log(`Fetching exchange rate from ${api.name}...`);
      const response = await fetch(api.url, {
        timeout: 5000
      } as any);

      if (response.ok) {
        const data = await response.json();
        const rate = api.parser(data);
        
        if (rate && typeof rate === 'number' && rate > 0) {
          console.log(`Exchange rate from ${api.name}: 1 USD = ${rate} AED`);
          
          // Cache the result
          exchangeRateCache = {
            rate,
            timestamp: Date.now(),
            expiresIn: CACHE_DURATION
          };
          
          return rate;
        }
      }
    } catch (error) {
      console.warn(`${api.name} failed:`, error);
    }
  }

  console.warn('All exchange rate APIs failed, using fallback rate:', FALLBACK_RATE);
  return FALLBACK_RATE;
}

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
 * Now uses live exchange rates
 */
export async function convertCurrency(usdAmount: number, targetCurrency: 'USD' | 'AED'): Promise<CurrencyInfo> {
  if (targetCurrency === 'USD') {
    return {
      code: 'USD',
      symbol: '$',
      amount: usdAmount
    };
  }

  // Fetch live exchange rate and convert to AED
  const liveRate = await fetchLiveExchangeRate();
  const aedAmount = Math.round(usdAmount * liveRate);
  
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
    // Add comma formatting for larger AED amounts
    const formattedAmount = currencyInfo.amount.toLocaleString();
    return `${formattedAmount} ${currencyInfo.code}`;
  }
  return `${currencyInfo.symbol}${currencyInfo.amount}`;
}

/**
 * Get pricing for Deal Room based on currency
 * Now async to support live exchange rates
 */
export async function getDealRoomPricing(currency: 'USD' | 'AED') {
  const basePrice = 99; // $99 USD base price
  const originalPrice = 199; // $199 USD original price
  
  const currentPrice = await convertCurrency(basePrice, currency);
  const originalPriceConverted = await convertCurrency(originalPrice, currency);
  
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