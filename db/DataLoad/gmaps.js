// used for connection with google maps api
import { Client } from '@googlemaps/google-maps-services-js';
import 'dotenv/config';

export const gmaps = new Client({});
export const GMAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

export function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
