import React, { useState, useEffect } from 'react';
import { Clock, Save, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase, TENANT_ID, BRANCH_ID } from '@/integrations/supabase/client';

interface DaySchedule {
  open: string;
  close: string;
  is_open: boolean;
}

interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS: Record<string, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

const DEFAULT_HOURS: DaySchedule = {
  open: '13:00',
  close: '00:30',
  is_open: true,
};

const AdminOperatingHours = () => {
  const [hours, setHours] = useState<OperatingHours>({
    sunday: { ...DEFAULT_HOURS },
    monday: { ...DEFAULT_HOURS },
    tuesday: { ...DEFAULT_HOURS },
    wednesday: { ...DEFAULT_HOURS },
    thursday: { ...DEFAULT_HOURS },
    friday: { ...DEFAULT_HOURS },
    saturday: { ...DEFAULT_HOURS },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOperatingHours();
  }, []);

  const fetchOperatingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('operating_hours')
        .eq('id', BRANCH_ID)
        .single();

      if (error) throw error;

      if (data?.operating_hours) {
        const dbHours = data.operating_hours as any;
        const loadedHours: OperatingHours = { ...hours };
        
        DAYS.forEach(day => {
          if (dbHours[day]) {
            loadedHours[day as keyof OperatingHours] = dbHours[day];
          }
        });
        
        setHours(loadedHours);
      }
    } catch (err) {
      console.error('Error fetching operating hours:', err);
      toast.error('Failed to load operating hours');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('branches')
        .update({ 
          operating_hours: hours,
          updated_at: new Date().toISOString()
        })
        .eq('id', BRANCH_ID);

      if (error) throw error;

      toast.success('Operating hours saved successfully!');
    } catch (err) {
      console.error('Error saving operating hours:', err);
      toast.error('Failed to save operating hours');
    } finally {
      setSaving(false);
    }
  };

  const updateDay = (day: string, field: keyof DaySchedule, value: string | boolean) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof OperatingHours],
        [field]: value,
      },
    }));
  };

  const copyToAll = (sourceDay: string) => {
    const sourceDayHours = hours[sourceDay as keyof OperatingHours];
    const newHours = { ...hours };
    DAYS.forEach(day => {
      newHours[day as keyof OperatingHours] = { ...sourceDayHours };
    });
    setHours(newHours);
    toast.success(`Copied ${DAY_LABELS[sourceDay]} hours to all days`);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Operating Hours
          </h1>
          <p className="text-muted-foreground">Manage restaurant opening and closing times (Kuwait Time)</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
            <div className="text-sm text-orange-700">
              <p className="font-medium mb-1">Important: Kuwait Timezone</p>
              <p>All times are in Kuwait Time (UTC+3). Orders will only be accepted during these hours.</p>
              <p className="mt-1">Note: If closing time is before opening time (e.g., 00:30), it means the next day.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {DAYS.map((day) => {
          const dayHours = hours[day as keyof OperatingHours];
          return (
            <Card key={day}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{DAY_LABELS[day]}</CardTitle>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToAll(day)}
                    >
                      Copy to All Days
                    </Button>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`${day}-open`}>Open</Label>
                      <Switch
                        id={`${day}-open`}
                        checked={dayHours.is_open}
                        onCheckedChange={(checked) => updateDay(day, 'is_open', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dayHours.is_open ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${day}-open-time`}>Opening Time</Label>
                      <Input
                        id={`${day}-open-time`}
                        type="time"
                        value={dayHours.open}
                        onChange={(e) => updateDay(day, 'open', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${day}-close-time`}>Closing Time</Label>
                      <Input
                        id={`${day}-close-time`}
                        type="time"
                        value={dayHours.close}
                        onChange={(e) => updateDay(day, 'close', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">Closed</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminOperatingHours;
