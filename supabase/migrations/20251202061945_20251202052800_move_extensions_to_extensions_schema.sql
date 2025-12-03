/*
  # Move Extensions from Public Schema

  1. Security Enhancement
    - Move extensions from public schema to dedicated extensions schema
    - Prevents namespace pollution
    - Follows PostgreSQL security best practices
  
  2. Affected Extensions
    - pg_trgm (trigram matching)
    - vector (vector similarity search)
  
  3. Implementation
    - Create extensions schema if not exists
    - Move extensions to extensions schema
    - Update search paths
  
  Note: This is a safe operation that maintains all functionality
*/

-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move pg_trgm extension
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- Move vector extension
ALTER EXTENSION vector SET SCHEMA extensions;

-- Update default search path to include extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions, pg_catalog;
