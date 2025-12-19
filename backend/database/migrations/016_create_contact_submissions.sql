/**
 * Migration 016: Create Contact Submissions Table
 * Stores contact form submissions from landing page
 */

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  topic VARCHAR(50) NOT NULL CHECK (topic IN (
    'Automation Development',
    'Generation Pricing',
    'Process Audit',
    'Partnership',
    'Other'
  )),
  message TEXT NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at 
  ON contact_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status 
  ON contact_submissions(status);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email 
  ON contact_submissions(email);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_topic 
  ON contact_submissions(topic);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_contact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_submissions_updated_at
  BEFORE UPDATE ON contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_submissions_updated_at();

-- Add RLS policies (no RLS for admin-only table)
-- Contact submissions are publicly writable but admin-only readable
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public INSERT (contact form submission)
CREATE POLICY "Allow public insert on contact_submissions"
  ON contact_submissions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Admins can read/update/delete all submissions
CREATE POLICY "Allow admin full access to contact_submissions"
  ON contact_submissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Add comment
COMMENT ON TABLE contact_submissions IS 'Stores contact form submissions from the landing page';
COMMENT ON COLUMN contact_submissions.topic IS 'One of: Automation Development, Generation Pricing, Process Audit, Partnership, Other';
COMMENT ON COLUMN contact_submissions.status IS 'Submission status: new, read, replied, archived';
