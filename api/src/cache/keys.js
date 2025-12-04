//These are the keys that will be created for each user in the application

export const keys = {
  session: (sid) => `sess:${sid}`,
  prefs: (userId) => `prefs:${userId}`,
  user: (userId) => `user:${userId}`,
  gis: {
    bbox: (hash) => `gis:buildings:bbox:${hash}`,
    near: (t, lat, lon, r) => `gis:near:${t}:${lat.toFixed(5)}:${lon.toFixed(5)}:${r}`
  }
};
