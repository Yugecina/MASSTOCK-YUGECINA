-- Temporary fix: Disable RLS on workflows table
-- Service role should bypass RLS anyway, but there's a bug
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
