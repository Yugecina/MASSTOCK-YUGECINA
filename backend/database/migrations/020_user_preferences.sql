-- Migration: Create user_preferences table
-- Created: 2026-01-15
-- Description: Stores user preferences for notifications, interface settings, and theme

-- ============================================
-- 1. CREATE user_preferences TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,

  -- Notification settings
  notifications_toast BOOLEAN DEFAULT true,
  notifications_sound BOOLEAN DEFAULT false,
  notifications_email BOOLEAN DEFAULT false,

  -- Interface settings
  language VARCHAR(5) DEFAULT 'fr' CHECK (language IN ('fr', 'en')),
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY' CHECK (date_format IN ('DD/MM/YYYY', 'MM/DD/YYYY')),
  results_per_page INTEGER DEFAULT 25 CHECK (results_per_page IN (10, 25, 50, 100)),

  -- Theme (syncs with localStorage)
  theme VARCHAR(10) DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_user_preferences_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 2. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Users can manage their own preferences
CREATE POLICY "Users can manage their own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all preferences (for debugging)
CREATE POLICY "Admins can view all preferences"
  ON user_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================
-- 5. CREATE TRIGGER FOR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- ============================================
-- 6. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;
GRANT ALL ON user_preferences TO service_role;

-- ============================================
-- 7. COMMENTS
-- ============================================

COMMENT ON TABLE user_preferences IS 'User preferences for notifications, interface settings, and theme';
COMMENT ON COLUMN user_preferences.notifications_email IS 'Email notifications for workflow completion (requires email service)';
COMMENT ON COLUMN user_preferences.theme IS 'User theme preference (syncs with localStorage)';
COMMENT ON COLUMN user_preferences.language IS 'User interface language';
COMMENT ON COLUMN user_preferences.date_format IS 'User preferred date format';
COMMENT ON COLUMN user_preferences.results_per_page IS 'Number of results to display per page in lists';
