/**
 * Operating Hours Utility
 * Handles Kuwait timezone (UTC+3) and validates if restaurant is open
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
 */
export const getKuwaitTime = (): Date => {
  const now = new Date();
  // Get UTC time
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  // Add Kuwait offset (UTC+3 = 180 minutes)
  const kuwaitTime = new Date(utcTime + (180 * 60000));
  return kuwaitTime;
};

/**
 * Check if restaurant is currently open
 */
export const isRestaurantOpen = (operatingHours: OperatingHours | null): { isOpen: boolean; message: string; currentTime: string } => {
  if (!operatingHours) {
    return {
      isOpen: true, // Default to open if no hours set
      message: '',
      currentTime: '',
    };
  }

  const kuwaitTime = getKuwaitTime();
  const dayIndex = kuwaitTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentDay = DAYS[dayIndex];
  const dayHours = operatingHours[currentDay as keyof OperatingHours];

  if (!dayHours || !dayHours.is_open) {
    return {
      isOpen: false,
      message: 'We are closed today',
      currentTime: formatTime(kuwaitTime),
    };
  }

  const currentTimeStr = `${kuwaitTime.getHours().toString().padStart(2, '0')}:${kuwaitTime.getMinutes().toString().padStart(2, '0')}`;
  const openTime = dayHours.open;
  const closeTime = dayHours.close;

  // Handle cases where closing time is after midnight (e.g., 00:30)
  const isOvernight = closeTime < openTime;

  if (isOvernight) {
    // Restaurant closes after midnight
    // Check if current time is after opening OR before closing
    const isAfterOpen = currentTimeStr >= openTime;
    const isBeforeClose = currentTimeStr < closeTime;
    
    if (isAfterOpen || isBeforeClose) {
      return {
        isOpen: true,
        message: '',
        currentTime: formatTime(kuwaitTime),
      };
    }
  } else {
    // Normal hours within same day
    if (currentTimeStr >= openTime && currentTimeStr < closeTime) {
      return {
        isOpen: true,
        message: '',
        currentTime: formatTime(kuwaitTime),
      };
    }
  }

  return {
    isOpen: false,
    message: `We are currently closed. Open ${formatTime12Hour(openTime)} - ${formatTime12Hour(closeTime)}`,
    currentTime: formatTime(kuwaitTime),
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
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Get operating hours display string
 */
export const getOperatingHoursDisplay = (operatingHours: OperatingHours | null): string => {
  if (!operatingHours) {
    return '1:00 PM - 12:30 AM';
  }

  // Check if all days have same hours
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

  return 'See hours'; // If different hours per day
};
