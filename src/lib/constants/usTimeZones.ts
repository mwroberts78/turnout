export const US_TIME_ZONES = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Phoenix', label: 'Mountain Time (Arizona, no DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time (Puerto Rico)' },
  { value: 'Pacific/Guam', label: 'Chamorro Time (Guam)' },
];

export function getTimeZoneLabel(value: string) {
  return US_TIME_ZONES.find((tz) => tz.value === value)?.label ?? value;
}
