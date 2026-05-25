-- Add organization_type enum (what kind of entity the stakeholder is)
-- and replace the old archetype values with relationship-based archetypes.

-- Step 1: Convert existing archetype column to text for safe manipulation
ALTER TABLE stakeholders ALTER COLUMN archetype TYPE text;

-- Step 2: Create organization_type enum (the renamed old archetype values)
DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM (
    'government', 'foundation', 'corporate', 'individual', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Step 3: Rename archetype column → organization_type
ALTER TABLE stakeholders RENAME COLUMN archetype TO organization_type;

-- Step 4: Convert organization_type column to the new enum
--         Map any values that aren't in the new enum to 'other'
UPDATE stakeholders
SET organization_type = CASE organization_type
  WHEN 'government'  THEN 'government'
  WHEN 'foundation'  THEN 'foundation'
  WHEN 'corporate'   THEN 'corporate'
  WHEN 'individual'  THEN 'individual'
  ELSE 'other'
END;

ALTER TABLE stakeholders
  ALTER COLUMN organization_type TYPE organization_type
  USING organization_type::organization_type;

-- Step 5: Drop old stakeholder_archetype enum and create the new one
DROP TYPE IF EXISTS stakeholder_archetype;

CREATE TYPE stakeholder_archetype AS ENUM (
  'partnership',
  'funding',
  'technical_partner',
  'implementing_partner',
  'government_partner'
);

-- Step 6: Add new archetype column (relationship type; default for existing rows)
ALTER TABLE stakeholders
  ADD COLUMN IF NOT EXISTS archetype stakeholder_archetype NOT NULL DEFAULT 'partnership';
