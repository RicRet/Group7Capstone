import { http } from '../http';

export type Bbox = { minLon: number; minLat: number; maxLon: number; maxLat: number };

export type ParkingLotFeature = {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: {
    lot_id: number;
    description: string;
    zone: string | null;
    fill: string | null;
  };
};

export type ParkingLotFeatureCollection = {
  type: 'FeatureCollection';
  features: ParkingLotFeature[];
};

export async function fetchParkingLots(bbox: Bbox): Promise<ParkingLotFeatureCollection> {
  const resp = await http.get<ParkingLotFeatureCollection>('/gis/parking-lots', {
    params: bbox,
  });
  return resp.data;
}
