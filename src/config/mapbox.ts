export const MAPBOX_CONFIG = {
  // Free tier: 50,000 map loads/month
  // Get your token at https://account.mapbox.com
  accessToken: import.meta.env.VITE_MAPBOX_TOKEN || 'YOUR_MAPBOX_ACCESS_TOKEN',
  style: 'mapbox://styles/mapbox/standard',
  defaultZoom: 16.5,
  maxZoom: 19,
  minZoom: 14,
  pitchEnabled: true,
  rotateEnabled: true,
}
