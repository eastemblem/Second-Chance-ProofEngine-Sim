import { useState, useEffect } from 'react'

/**
 * Custom hook to detect mobile and tablet breakpoints
 * Provides responsive state for consistent mobile experience
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      setIsMobile(width < 640) // sm breakpoint
      setIsTablet(width >= 640 && width < 1024) // sm to lg breakpoint
    }

    // Check on mount
    checkDevice()

    // Check on resize
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    isMobileOrTablet: isMobile || isTablet
  }
}