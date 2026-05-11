export const TIME_ZONES = [
  { id: "America/New_York", name: "Eastern Time (ET)" },
  { id: "America/Chicago", name: "Central Time (CT)" },
  { id: "America/Denver", name: "Mountain Time (MT)" },
  { id: "America/Los_Angeles", name: "Pacific Time (PT)" },
  { id: "America/Anchorage", name: "Alaska Time (AKT)" },
  { id: "Pacific/Honolulu", name: "Hawaii Time (HT)" },
];

export const TIME_ZONES_OPTIONS = TIME_ZONES.map((zone) => ({
  id: zone.id,
  name: zone.name,
}));
