-- ProofTags Migration Script
-- This script adds the prooftags column to the venture table
-- Run this on your production database when ready to deploy

-- Add prooftags column to venture table
ALTER TABLE venture 
ADD COLUMN IF NOT EXISTS prooftags JSON NOT NULL DEFAULT '[]'::json;

-- Optional: Populate prooftags from existing evaluation data
-- This will copy prooftags from the most recent evaluation for each venture
UPDATE venture v
SET prooftags = e.prooftags
FROM (
  SELECT DISTINCT ON (venture_id)
    venture_id,
    prooftags
  FROM evaluation
  WHERE is_current = true
  ORDER BY venture_id, created_at DESC
) e
WHERE v.venture_id = e.venture_id
  AND v.prooftags::text = '[]';

-- Verify the migration
SELECT 
  COUNT(*) as total_ventures,
  COUNT(*) FILTER (WHERE prooftags IS NOT NULL) as ventures_with_prooftags_column,
  COUNT(*) FILTER (WHERE prooftags::text != '[]') as ventures_with_prooftags_data
FROM venture;
