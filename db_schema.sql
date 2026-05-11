-- Add time and timezone columns to collection_external_links_notations table
ALTER TABLE collection_external_links_notations
ADD COLUMN time time,
ADD COLUMN timezone varchar(50);

-- Add time and timezone columns to external_links table
ALTER TABLE external_links
ADD COLUMN time time,
ADD COLUMN timezone varchar(50);

-- Comment for the schema update
COMMENT ON COLUMN collection_external_links_notations.time IS 'Optional time field for calendar events';
COMMENT ON COLUMN collection_external_links_notations.timezone IS 'Timezone for the time field, stored as string identifier (e.g. "America/New_York")';
COMMENT ON COLUMN external_links.time IS 'Optional time field for calendar events';
COMMENT ON COLUMN external_links.timezone IS 'Timezone for the time field, stored as string identifier (e.g. "America/New_York")'; 