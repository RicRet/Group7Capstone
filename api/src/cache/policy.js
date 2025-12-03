//keep our time limits for caching here

export const TTL = Object.freeze({
  session: 60 * 30, // 30min
  gis: 60 * 10,     // 10min
  prefs: 60 * 5,     // 5min
  user: 60 * 10      // 10min user profile cache
});
