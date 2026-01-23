/**
 * Geocoding and Delivery Zone Validation Utilities
 */

interface Point {
  lat: number;
  lng: number;
}

interface DeliveryZone {
  id: string;
  zone_name: string;
  coordinates: number[][];
  delivery_fee: number;
  min_order_amount: number;
  status: string;
}

/**
 * Check if a point is inside a polygon using ray-casting algorithm
 * @param point {lat, lng}
 * @param polygon Array of [lat, lng] coordinates
 */
export const isPointInPolygon = (point: Point, polygon: number[][]): boolean => {
  const { lat, lng } = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];
    
    const intersect = ((yi > lng) !== (yj > lng)) &&
      (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
};

/**
 * Geocode Kuwait address using Nominatim (free OSM service)
 * Returns lat/lng coordinates
 */
export const geocodeKuwaitAddress = async (address: {
  area?: string;
  block?: string;
  street?: string;
  building?: string;
}): Promise<{ lat: number; lng: number } | null> => {
  try {
    // Build query string for Kuwait
    const parts = [];
    if (address.area) parts.push(address.area);
    if (address.block) parts.push(`Block ${address.block}`);
    if (address.street) parts.push(address.street);
    if (address.building) parts.push(`Building ${address.building}`);
    parts.push('Kuwait');
    
    const query = encodeURIComponent(parts.join(', '));
    
    // Use Nominatim (OpenStreetMap) geocoding service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&countrycodes=kw&limit=1`,
      {
        headers: {
          'User-Agent': 'BamBurgers-App/1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error('Geocoding failed:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

/**
 * Check if address is within any active delivery zone
 */
export const validateDeliveryAddress = (
  point: Point,
  zones: DeliveryZone[]
): { valid: boolean; zone?: DeliveryZone; message: string } => {
  const activeZones = zones.filter(z => z.status === 'active');
  
  if (activeZones.length === 0) {
    // No zones defined, allow all deliveries
    return { valid: true, message: '' };
  }
  
  for (const zone of activeZones) {
    if (isPointInPolygon(point, zone.coordinates)) {
      return {
        valid: true,
        zone,
        message: `Delivery to ${zone.zone_name}`
      };
    }
  }
  
  return {
    valid: false,
    message: 'Sorry, we do not deliver to this area. Please choose a location within our delivery zones.'
  };
};

/**
 * Get delivery fee for a location
 */
export const getDeliveryFeeForLocation = (
  point: Point,
  zones: DeliveryZone[]
): number => {
  const result = validateDeliveryAddress(point, zones);
  if (result.valid && result.zone) {
    return result.zone.delivery_fee;
  }
  return 0.5; // Default delivery fee
};
