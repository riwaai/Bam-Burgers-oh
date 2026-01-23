import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase, BRANCH_ID } from '@/integrations/supabase/client';
import { geocodeKuwaitAddress, validateDeliveryAddress } from '@/utils/geocoding';
import { MapContainer, TileLayer, Marker, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface DeliveryZone {
  id: string;
  zone_name: string;
  coordinates: number[][];
  delivery_fee: number;
  min_order_amount: number;
  status: string;
}

interface DeliveryAddressValidatorProps {
  formData: {
    area: string;
    block: string;
    street: string;
    building: string;
    floor: string;
    apartment: string;
    additionalInfo: string;
  };
  onValidAddress: (geoLat: number, geoLng: number, deliveryFee: number) => void;
  onInvalidAddress: (message: string) => void;
  isRTL: boolean;
}

const KUWAIT_CENTER: [number, number] = [29.3759, 47.9774];

const DeliveryAddressValidator: React.FC<DeliveryAddressValidatorProps> = ({
  formData,
  onValidAddress,
  onInvalidAddress,
  isRTL
}) => {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [validationMessage, setValidationMessage] = useState('');

  useEffect(() => {
    fetchDeliveryZones();
  }, []);

  useEffect(() => {
    // Auto-validate when address changes
    if (formData.area && formData.block && formData.building) {
      validateAddress();
    }
  }, [formData.area, formData.block, formData.street, formData.building]);

  const fetchDeliveryZones = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('branch_id', BRANCH_ID)
        .eq('status', 'active');
      
      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error('Error fetching delivery zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = async () => {
    if (!formData.area || !formData.block || !formData.building) {
      setIsValid(null);
      return;
    }

    setValidating(true);
    try {
      // Geocode the address
      const coords = await geocodeKuwaitAddress({
        area: formData.area,
        block: formData.block,
        street: formData.street,
        building: formData.building,
      });

      if (!coords) {
        setIsValid(false);
        setValidationMessage(isRTL ? 'تعذر العثور على العنوان. يرجى التحقق من التفاصيل.' : 'Could not find address. Please check details.');
        onInvalidAddress('Could not geocode address');
        toast.error(isRTL ? 'تعذر العثور على العنوان' : 'Could not find address');
        return;
      }

      setMarkerPosition([coords.lat, coords.lng]);

      // Validate against delivery zones
      const validation = validateDeliveryAddress(
        { lat: coords.lat, lng: coords.lng },
        zones
      );

      setIsValid(validation.valid);
      setValidationMessage(validation.message);

      if (validation.valid) {
        const fee = validation.zone?.delivery_fee || 0.5;
        onValidAddress(coords.lat, coords.lng, fee);
        toast.success(isRTL ? 'العنوان ضمن منطقة التوصيل' : 'Address is within delivery zone');
      } else {
        onInvalidAddress(validation.message);
        toast.error(validation.message);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setIsValid(false);
      onInvalidAddress('Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMarkerPosition([lat, lng]);
        
        // Validate clicked location
        const validation = validateDeliveryAddress({ lat, lng }, zones);
        setIsValid(validation.valid);
        setValidationMessage(validation.message);
        
        if (validation.valid) {
          const fee = validation.zone?.delivery_fee || 0.5;
          onValidAddress(lat, lng, fee);
          toast.success(isRTL ? 'الموقع ضمن منطقة التوصيل' : 'Location is within delivery zone');
        } else {
          onInvalidAddress(validation.message);
          toast.error(validation.message);
        }
      },
    });
    return markerPosition ? <Marker position={markerPosition} /> : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {validating && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-blue-700">
              {isRTL ? 'جاري التحقق من العنوان...' : 'Validating address...'}
            </span>
          </CardContent>
        </Card>
      )}

      {isValid === true && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-700">
                {isRTL ? '✓ العنوان صحيح' : '✓ Address Valid'}
              </p>
              <p className="text-xs text-green-600">{validationMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isValid === false && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700">
                {isRTL ? '✗ العنوان خارج منطقة التوصيل' : '✗ Address Outside Delivery Zone'}
              </p>
              <p className="text-xs text-red-600">{validationMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div style={{ height: '300px', width: '100%' }}>
            <MapContainer
              center={markerPosition || KUWAIT_CENTER}
              zoom={12}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {/* Draw delivery zones */}
              {zones.map((zone) => (
                <Polygon
                  key={zone.id}
                  positions={zone.coordinates.map(coord => [coord[0], coord[1]] as [number, number])}
                  pathOptions={{
                    color: '#22c55e',
                    fillColor: '#22c55e',
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                />
              ))}
              
              <LocationMarker />
            </MapContainer>
          </div>
          <div className="p-3 bg-gray-50 border-t text-xs text-gray-600 text-center">
            {isRTL ? 'المناطق الخضراء = مناطق التوصيل | انقر على الخريطة لتحديد الموقع' : 'Green areas = Delivery zones | Click on map to set location'}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={validateAddress}
        disabled={validating || !formData.area || !formData.block || !formData.building}
        className="w-full"
        variant="outline"
      >
        {validating ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4 mr-2" />
        )}
        {isRTL ? 'التحقق من العنوان' : 'Validate Address'}
      </Button>
    </div>
  );
};

export default DeliveryAddressValidator;
