const toRadians = degrees => (degrees * Math.PI) / 180;

export const calculateDistanceMeters = (origin, target) => {
  const earthRadiusMeters = 6371000;
  const deltaLatitude = toRadians(target.latitude - origin.latitude);
  const deltaLongitude = toRadians(target.longitude - origin.longitude);
  const startLatitude = toRadians(origin.latitude);
  const endLatitude = toRadians(target.latitude);
  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusMeters * c);
};

export const formatDistance = meters => {
  if (!Number.isFinite(Number(meters))) return 'Not measured';
  if (Number(meters) >= 1000) {
    return `${(Number(meters) / 1000).toFixed(2)} km`;
  }
  return `${Math.round(Number(meters))} m`;
};
