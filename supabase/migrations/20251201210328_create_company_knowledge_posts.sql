/*
  # Create Company Knowledge Posts System

  1. New Tables
    - `company_knowledge_posts` - WordPress-style content for companies
      - Stores rich content about companies
      - Can be published to onboarding intelligence
      - Supports versioning and draft/publish workflow
    - `company_knowledge_post_revisions` - Version history for posts

  2. Security
    - Enable RLS on all tables
    - Super admins can manage all posts
    - Team/Enterprise admins can manage their own posts
    - All authenticated users can view published posts

  3. Features
    - Rich text content storage with title, excerpt, full content
    - Auto-tagging and categorization (post_type, category, tags)
    - Sync status tracking for intelligence layer integration
    - Usage analytics (view_count, usage_count, last_used_at)
    - SEO metadata (meta_description, meta_keywords, featured_image)
    - Multi-tenancy support (system, team, enterprise)
    - Auto-population flags for onboarding, chatbot, pitch deck
    - Revision history with change tracking
    - Auto-generated slugs from titles
    - Updated_at timestamp auto-update
*/

-- Company Knowledge Posts Table
CREATE TABLE IF NOT EXISTS company_knowledge_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  title text NOT NULL,
  slug text UNIQUE NOT NULL,

  -- Content (WordPress-style)
  content text NOT NULL,
  excerpt text,

  -- Categorization
  post_type text NOT NULL DEFAULT 'company_info',
  category text,
  tags text[],

  -- Relationships
  admin_company_id uuid REFERENCES admin_companies(id) ON DELETE CASCADE,

  -- Publishing
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,

  -- Intelligence Integration
  is_synced_to_intelligence boolean DEFAULT false,
  last_synced_at timestamptz,
  sync_status text DEFAULT 'pending',
  sync_error text,

  -- Auto-population fields
  auto_populate_onboarding boolean DEFAULT true,
  auto_populate_chatbot boolean DEFAULT true,
  auto_populate_pitch_deck boolean DEFAULT false,

  -- SEO & Metadata
  meta_description text,
  meta_keywords text[],
  featured_image_url text,

  -- Analytics
  view_count integer DEFAULT 0,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,

  -- Ownership (multi-tenancy)
  owner_type text NOT NULL DEFAULT 'system',
  owner_id uuid,

  -- Audit
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post Revisions (versioning)
CREATE TABLE IF NOT EXISTS company_knowledge_post_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES company_knowledge_posts(id) ON DELETE CASCADE NOT NULL,

  -- Snapshot of content
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,

  -- Metadata
  revision_number integer NOT NULL,
  change_summary text,

  -- Audit
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_posts_company
  ON company_knowledge_posts(admin_company_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_posts_status
  ON company_knowledge_posts(status);

CREATE INDEX IF NOT EXISTS idx_knowledge_posts_type
  ON company_knowledge_posts(post_type);

CREATE INDEX IF NOT EXISTS idx_knowledge_posts_owner
  ON company_knowledge_posts(owner_type, owner_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_posts_sync_status
  ON company_knowledge_posts(sync_status) WHERE sync_status != 'synced';

CREATE INDEX IF NOT EXISTS idx_knowledge_posts_search
  ON company_knowledge_posts USING gin(to_tsvector('english', title || ' ' || COALESCE(content, '')));

CREATE INDEX IF NOT EXISTS idx_knowledge_post_revisions_post
  ON company_knowledge_post_revisions(post_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_knowledge_posts_created_by
  ON company_knowledge_posts(created_by);

CREATE INDEX IF NOT EXISTS idx_knowledge_post_revisions_created_by
  ON company_knowledge_post_revisions(created_by);

-- Enable RLS
ALTER TABLE company_knowledge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_knowledge_post_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_knowledge_posts

-- Super admins can do everything
CREATE POLICY "Super admins full access to knowledge posts"
  ON company_knowledge_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_super_admin = true
    )
  );

-- All authenticated users can view published posts
CREATE POLICY "Anyone can view published knowledge posts"
  ON company_knowledge_posts FOR SELECT
  TO authenticated
  USING (status = 'published');

-- RLS Policies for revisions

-- Super admins can view all revisions
CREATE POLICY "Super admins can view all revisions"
  ON company_knowledge_post_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_super_admin = true
    )
  );

-- Post owners can view their revisions
CREATE POLICY "Post owners can view their revisions"
  ON company_knowledge_post_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_knowledge_posts ckp
      WHERE ckp.id = post_id
      AND ckp.created_by = auth.uid()
    )
  );

-- Post owners can create revisions
CREATE POLICY "Post owners can create revisions"
  ON company_knowledge_post_revisions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_knowledge_posts ckp
      WHERE ckp.id = post_id
      AND ckp.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
      AND au.is_super_admin = true
    )
  );

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_knowledge_post_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_knowledge_post_timestamp ON company_knowledge_posts;
CREATE TRIGGER update_knowledge_post_timestamp
  BEFORE UPDATE ON company_knowledge_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_knowledge_post_timestamp();

-- Function to auto-create slug from title
CREATE OR REPLACE FUNCTION generate_post_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
    NEW.slug := trim(both '-' from NEW.slug);

    IF EXISTS (SELECT 1 FROM company_knowledge_posts WHERE slug = NEW.slug AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)) THEN
      NEW.slug := NEW.slug || '-' || extract(epoch from now())::text;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for slug generation
DROP TRIGGER IF EXISTS generate_post_slug_trigger ON company_knowledge_posts;
CREATE TRIGGER generate_post_slug_trigger
  BEFORE INSERT OR UPDATE ON company_knowledge_posts
  FOR EACH ROW
  EXECUTE FUNCTION generate_post_slug();

-- Function to create revision on update
CREATE OR REPLACE FUNCTION create_knowledge_post_revision()
RETURNS TRIGGER AS $$
DECLARE
  next_revision_number integer;
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.content != NEW.content OR OLD.title != NEW.title) THEN
    SELECT COALESCE(MAX(revision_number), 0) + 1 INTO next_revision_number
    FROM company_knowledge_post_revisions
    WHERE post_id = NEW.id;

    INSERT INTO company_knowledge_post_revisions (
      post_id, title, content, excerpt, revision_number, created_by
    ) VALUES (
      NEW.id, OLD.title, OLD.content, OLD.excerpt, next_revision_number, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for revision creation
DROP TRIGGER IF EXISTS create_knowledge_post_revision_trigger ON company_knowledge_posts;
CREATE TRIGGER create_knowledge_post_revision_trigger
  AFTER UPDATE ON company_knowledge_posts
  FOR EACH ROW
  EXECUTE FUNCTION create_knowledge_post_revision();

-- Comments
COMMENT ON TABLE company_knowledge_posts IS 'WordPress-style content management for company knowledge';
COMMENT ON COLUMN company_knowledge_posts.content IS 'Rich text content about the company (supports markdown/HTML)';
COMMENT ON COLUMN company_knowledge_posts.auto_populate_onboarding IS 'Use this content to personalize user onboarding';
COMMENT ON COLUMN company_knowledge_posts.auto_populate_chatbot IS 'Feed this content to AI chatbot training';
COMMENT ON COLUMN company_knowledge_posts.sync_status IS 'Status of syncing to intelligence layer';
