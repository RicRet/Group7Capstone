//These are the keys that will be created for each user in the application

export const keys = {
  session: (sid) => `sess:${sid}`,
  prefs: (userId) => `prefs:${userId}`,
  user: (userId) => `user:${userId}`,
  shareLocation: (shareId) => `share:loc:${shareId}`,
  gis: {
    bbox: (hash) => `gis:buildings:bbox:${hash}`,
    parkingLotsBbox: (hash) => `gis:parking-lots:bbox:${hash}`,
    entrancesBbox: (hash) => `gis:entrances:bbox:${hash}`,
    bicycleParkingBbox: (hash) => `gis:bicycle-parking:bbox:${hash}`,
    emergencyPhonesBbox: (hash) => `gis:emergency-phones:bbox:${hash}`,
    near: (t, lat, lon, r) => `gis:near:${t}:${lat.toFixed(5)}:${lon.toFixed(5)}:${r}`
  }
};
