// wkt.js
export function pointWKT(lng, lat) {
  return `SRID=4326;POINT(${lng} ${lat})`; // EWKT
}

export function lineStringWKT(coords /* [ [lng,lat], ... ] */) {
  const body = coords.map(([lng, lat]) => `${lng} ${lat}`).join(', ');
  return `SRID=4326;LINESTRING(${body})`;
}

export function polygonWKT(rings /* [ [ [lng,lat], ...closed ], ...holes ] */) {
  const body = rings
    .map(ring => `(${ring.map(([lng,lat]) => `${lng} ${lat}`).join(', ')})`)
    .join(', ');
  return `SRID=4326;POLYGON(${body})`;
}
