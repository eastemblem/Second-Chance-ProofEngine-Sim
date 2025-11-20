/**
 * Format ISO date string to readable date format
 * e.g., "2025-11-29T07:00:00.660Z" -> "November 29th 2025"
 */
export function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Add ordinal suffix (st, nd, rd, th)
  const ordinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  return `${month} ${day}${ordinalSuffix(day)} ${year}`;
}

/**
 * Format ISO date strings to time range
 * e.g., start: "2025-11-29T07:00:00.660Z", end: "2025-11-29T10:00:00.660Z" -> "07:00 AM - 10:00 AM"
 */
export function formatEventTime(startIsoDate: string, endIsoDate: string): string {
  const formatTime = (date: Date): string => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${hours.toString().padStart(2, '0')}:${minutesStr} ${ampm}`;
  };
  
  const startDate = new Date(startIsoDate);
  const endDate = new Date(endIsoDate);
  
  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
}
