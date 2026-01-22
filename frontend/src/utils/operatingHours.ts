/**
 * Operating Hours & Kuwait Time Utility
 * All times are Kuwait Time (UTC+3, no DST)
 * Current Kuwait Time: Based on server UTC + 3 hours
 */

interface DaySchedule {
  open: string;
  close: string;
  is_open: boolean;
}

interface OperatingHours {
  sunday: DaySchedule;
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Get current Kuwait time
 * Kuwait is UTC+3 with no DST
 * ALWAYS returns Kuwait time regardless of user's device timezone
 */
export const getKuwaitTime = (): Date => {
  // Get current UTC time
  const now = new Date();
  const utcTime = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );
  
  // Add Kuwait offset (UTC+3 = 180 minutes)
  const kuwaitTime = new Date(utcTime + (180 * 60000));
  return kuwaitTime;
};

/**
 * Convert any date to Kuwait time
 */
export const toKuwaitTime = (date: Date | string): Date => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const utcTime = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds()
  );
  return new Date(utcTime + (180 * 60000));
};

/**
 * Format Kuwait time for display
 * Example: "11:48 PM" or "Jan 14, 2025 11:48 PM"
 */
export const formatKuwaitTime = (date: Date | string, includeDate: boolean = false): string => {
  const kuwaitDate = typeof date === 'string' ? toKuwaitTime(new Date(date)) : toKuwaitTime(date);
  
  const hours = kuwaitDate.getUTCHours();
  const minutes = kuwaitDate.getUTCMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  
  if (includeDate) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[kuwaitDate.getUTCMonth()];
    const day = kuwaitDate.getUTCDate();
    const year = kuwaitDate.getUTCFullYear();
    return `${month} ${day}, ${year} ${timeStr}`;
  }
  
  return timeStr;
};

/**
 * Get Kuwait time as ISO string for database storage
 */
export const getKuwaitTimeISO = (): string => {
  return getKuwaitTime().toISOString();
};

/**
 * Check if restaurant is currently open
 */
export const isRestaurantOpen = (operatingHours: OperatingHours | null): { isOpen: boolean; message: string; currentTime: string } => {
  if (!operatingHours) {
    return {
      isOpen: true,
      message: '',
      currentTime: '',
    };
  }

  const kuwaitTime = getKuwaitTime();
  const dayIndex = kuwaitTime.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentDay = DAYS[dayIndex];
  const dayHours = operatingHours[currentDay as keyof OperatingHours];

  if (!dayHours || !dayHours.is_open) {
    return {
      isOpen: false,
      message: 'We are closed today',
      currentTime: formatKuwaitTime(kuwaitTime),
    };
  }

  const currentTimeStr = `${kuwaitTime.getUTCHours().toString().padStart(2, '0')}:${kuwaitTime.getUTCMinutes().toString().padStart(2, '0')}`;
  const openTime = dayHours.open;
  const closeTime = dayHours.close;

  // Handle cases where closing time is after midnight (e.g., 00:30)
  const isOvernight = closeTime < openTime;

  if (isOvernight) {
    const isAfterOpen = currentTimeStr >= openTime;
    const isBeforeClose = currentTimeStr < closeTime;
    
    if (isAfterOpen || isBeforeClose) {
      return {
        isOpen: true,
        message: '',
        currentTime: formatKuwaitTime(kuwaitTime),
      };
    }
  } else {
    if (currentTimeStr >= openTime && currentTimeStr < closeTime) {
      return {
        isOpen: true,
        message: '',
        currentTime: formatKuwaitTime(kuwaitTime),
      };
    }
  }

  return {
    isOpen: false,
    message: `We are currently closed. Open ${formatTime12Hour(openTime)} - ${formatTime12Hour(closeTime)}`,
    currentTime: formatKuwaitTime(kuwaitTime),
  };
};

/**
 * Format time to 12-hour format
 */
export const formatTime12Hour = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Format Date to readable time string
 */
export const formatTime = (date: Date): string => {
  const kuwaitDate = toKuwaitTime(date);
  return formatKuwaitTime(kuwaitDate);
};

/**
 * Get operating hours display string
 */
export const getOperatingHoursDisplay = (operatingHours: OperatingHours | null): string => {
  if (!operatingHours) {
    return '1:00 PM - 12:30 AM';
  }

  const firstDay = operatingHours.sunday;
  const allSame = DAYS.every(day => {
    const dayHours = operatingHours[day as keyof OperatingHours];
    return dayHours.open === firstDay.open && 
           dayHours.close === firstDay.close && 
           dayHours.is_open === firstDay.is_open;
  });

  if (allSame && firstDay.is_open) {
    return `${formatTime12Hour(firstDay.open)} - ${formatTime12Hour(firstDay.close)}`;
  }

  return 'See hours';
};
