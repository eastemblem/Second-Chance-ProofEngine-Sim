import { appLogger } from '../utils/logger';

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
 * Server-side currency service for live exchange rates
 */
export class CurrencyService {
  
  /**
   * Fetch live USD to AED exchange rate from multiple sources
   */
  static async fetchLiveExchangeRate(): Promise<number> {
    // Check cache first
    if (exchangeRateCache && Date.now() < exchangeRateCache.timestamp + exchangeRateCache.expiresIn) {
      appLogger.external('Using cached exchange rate', { rate: exchangeRateCache.rate });
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
        appLogger.external(`Fetching exchange rate from ${api.name}`, { url: api.url });
        
        const response = await fetch(api.url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Second-Chance-Platform/1.0'
          }
        } as any);

        if (response.ok) {
          const data = await response.json();
          const rate = api.parser(data);
          
          if (rate && typeof rate === 'number' && rate > 0) {
            appLogger.external(`Live exchange rate fetched successfully`, {
              source: api.name,
              rate: rate,
              formattedRate: `1 USD = ${rate} AED`
            });
            
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
        appLogger.error(`Exchange rate API ${api.name} failed`, { 
          error: error instanceof Error ? error.message : String(error),
          url: api.url
        });
      }
    }

    appLogger.error('All exchange rate APIs failed, using fallback rate', { 
      fallbackRate: FALLBACK_RATE,
      action: 'Using hardcoded rate for payment processing'
    });
    return FALLBACK_RATE;
  }

  /**
   * Convert USD amount to appropriate currency based on location
   */
  static async convertCurrency(usdAmount: number, targetCurrency: 'USD' | 'AED'): Promise<{
    amount: number;
    currency: string;
    originalAmount: number;
    exchangeRate?: number;
  }> {
    if (targetCurrency === 'USD') {
      return {
        amount: usdAmount,
        currency: 'USD',
        originalAmount: usdAmount
      };
    }

    // Fetch live exchange rate and convert to AED
    const liveRate = await this.fetchLiveExchangeRate();
    const aedAmount = Math.round(usdAmount * liveRate);
    
    return {
      amount: aedAmount,
      currency: 'AED',
      originalAmount: usdAmount,
      exchangeRate: liveRate
    };
  }

  /**
   * Detect target currency based on IP location or request data
   */
  static detectTargetCurrency(clientIP?: string, requestCurrency?: string): 'USD' | 'AED' {
    // If frontend explicitly specifies currency, use it
    if (requestCurrency === 'AED' || requestCurrency === 'USD') {
      return requestCurrency as 'USD' | 'AED';
    }

    // Basic IP-based detection for UAE (this could be enhanced with a proper geolocation service)
    // For now, we'll rely on the frontend currency detection
    return 'USD'; // Default to USD, let frontend handle location detection
  }

  /**
   * Format currency amount for display
   */
  static formatCurrency(amount: number, currency: string): string {
    if (currency === 'AED') {
      return `${amount} AED`;
    }
    return `$${amount}`;
  }

  /**
   * Get payment amount with live conversion
   */
  static async getPaymentAmount(baseUSDAmount: number, targetCurrency: 'USD' | 'AED'): Promise<{
    amount: number;
    currency: string;
    displayAmount: string;
    metadata: {
      baseAmount: number;
      baseCurrency: string;
      exchangeRate?: number;
      source: string;
    };
  }> {
    const conversion = await this.convertCurrency(baseUSDAmount, targetCurrency);
    
    return {
      amount: conversion.amount,
      currency: conversion.currency,
      displayAmount: this.formatCurrency(conversion.amount, conversion.currency),
      metadata: {
        baseAmount: baseUSDAmount,
        baseCurrency: 'USD',
        exchangeRate: conversion.exchangeRate,
        source: 'live-api'
      }
    };
  }
}