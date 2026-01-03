import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const KUWAIT_CENTER: [number, number] = [29.3759, 47.9774];

interface CheckoutMapProps {
  onPositionChange: (pos: [number, number]) => void;
  onAddressChange: (address: { area: string; street: string; block: string; building: string }) => void;
  isRTL: boolean;
}

const CheckoutMap: React.FC<CheckoutMapProps> = ({ onPositionChange, onAddressChange, isRTL }) => {
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (!response.ok) throw new Error('Geocoding failed');
      const data = await response.json();
      const address = data.address || {};
      
      onAddressChange({
        area: address.suburb || address.neighbourhood || address.city_district || address.town || address.city || '',
        street: address.road || address.street || '',
        block: address.quarter || '',
        building: address.house_number || '',
      });
      toast.success(isRTL ? 'تم تحديد العنوان' : 'Address detected from map');
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [isRTL, onAddressChange]);

  const handleMapPositionChange = useCallback((pos: [number, number]) => {
    setMapPosition(pos);
    onPositionChange(pos);
    reverseGeocode(pos[0], pos[1]);
  }, [onPositionChange, reverseGeocode]);

  // Initialize map using vanilla Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Dynamically import Leaflet
    const initMap = async () => {
      try {
        const L = await import('leaflet');
        
        // Import CSS
        await import('leaflet/dist/leaflet.css');

        // Fix default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Create map
        const map = L.map(mapContainerRef.current!, {
          center: KUWAIT_CENTER,
          zoom: 12,
          scrollWheelZoom: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        // Handle click to add/move marker
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
          }
          
          handleMapPositionChange([lat, lng]);
        });

        mapRef.current = map;
        setIsMapReady(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [handleMapPositionChange]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        
        if (mapRef.current) {
          mapRef.current.setView(pos, 15);
          
          const L = (window as any).L;
          if (L) {
            if (markerRef.current) {
              markerRef.current.setLatLng(pos);
            } else {
              markerRef.current = L.marker(pos).addTo(mapRef.current);
            }
          }
        }
        
        handleMapPositionChange(pos);
      },
      () => toast.error('Unable to get your location')
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{isRTL ? 'حدد موقعك على الخريطة' : 'Pin your location on the map'}</Label>
        <Button type="button" variant="outline" size="sm" onClick={handleGetLocation}>
          <Navigation className="h-4 w-4 mr-2" />
          {isRTL ? 'موقعي الحالي' : 'Use my location'}
        </Button>
      </div>
      <div className="h-[200px] rounded-lg overflow-hidden border relative">
        <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
        {(!isMapReady || isReverseGeocoding) && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {isRTL ? 'انقر على الخريطة لتحديد موقعك' : 'Click on the map to pin your location'}
      </p>
    </div>
  );
};

export default CheckoutMap;
