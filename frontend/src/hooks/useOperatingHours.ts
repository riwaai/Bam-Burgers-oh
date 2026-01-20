import { useState, useEffect } from 'react';
import { supabase, BRANCH_ID } from '@/integrations/supabase/client';
import { isRestaurantOpen, getOperatingHoursDisplay } from '@/utils/operatingHours';

export const useOperatingHours = () => {
  const [operatingHours, setOperatingHours] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [hoursDisplay, setHoursDisplay] = useState('1:00 PM - 12:30 AM');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndCheck = async () => {
      try {
        const { data, error } = await supabase
          .from('branches')
          .select('operating_hours')
          .eq('id', BRANCH_ID)
          .single();
        
        if (data?.operating_hours) {
          setOperatingHours(data.operating_hours);
          const status = isRestaurantOpen(data.operating_hours);
          setIsOpen(status.isOpen);
          setMessage(status.message);
          setHoursDisplay(getOperatingHoursDisplay(data.operating_hours));
        }
      } catch (err) {
        console.error('Error fetching operating hours:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndCheck();
    // Check every minute
    const interval = setInterval(fetchAndCheck, 60000);
    return () => clearInterval(interval);
  }, []);

  return { operatingHours, isOpen, message, hoursDisplay, loading };
};
