-- Update domain validation to support multi-part TLDs like .com.tr, .co.uk, etc.

-- Drop old constraints
ALTER TABLE brands DROP CONSTRAINT IF EXISTS domain_format;
ALTER TABLE competitors DROP CONSTRAINT IF EXISTS competitor_domain_format;

-- Add new constraints with updated regex that supports multi-part TLDs
ALTER TABLE brands ADD CONSTRAINT domain_format
  CHECK (domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$');

ALTER TABLE competitors ADD CONSTRAINT competitor_domain_format
  CHECK (competitor_domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?(\.[a-zA-Z]{2,})+$');

COMMENT ON CONSTRAINT domain_format ON brands IS 'Validates domain format, supports multi-part TLDs (.com.tr, .co.uk, etc.)';
COMMENT ON CONSTRAINT competitor_domain_format ON competitors IS 'Validates competitor domain format, supports multi-part TLDs (.com.tr, .co.uk, etc.)';
