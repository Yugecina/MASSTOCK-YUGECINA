# MCP Server Setup Guide for MasStock

Model Context Protocol (MCP) servers extend Claude Code with external tool integrations. This guide covers recommended MCP servers for MasStock development.

---

## Already Installed

### ✅ Supabase MCP Server

**Status:** Active and configured

**Capabilities:**
- Database operations (SELECT, INSERT, UPDATE, DELETE)
- Table listing and schema inspection
- Migration execution
- Log retrieval
- Security advisors
- TypeScript type generation

**Available Tools:**
- `mcp__supabase__search_docs` - Search Supabase documentation
- `mcp__supabase__list_tables` - List all database tables
- `mcp__supabase__list_extensions` - List Postgres extensions
- `mcp__supabase__list_migrations` - List migration history
- `mcp__supabase__apply_migration` - Apply SQL migration
- `mcp__supabase__execute_sql` - Execute raw SQL query
- `mcp__supabase__get_logs` - Retrieve service logs
- `mcp__supabase__get_advisors` - Get security/performance advisors
- `mcp__supabase__get_project_url` - Get API URL
- `mcp__supabase__get_anon_key` - Get anonymous key
- `mcp__supabase__generate_typescript_types` - Generate types
- `mcp__supabase__list_edge_functions` - List Edge Functions
- `mcp__supabase__get_edge_function` - Get Edge Function code
- `mcp__supabase__deploy_edge_function` - Deploy Edge Function
- `mcp__supabase__create_branch` - Create dev branch
- `mcp__supabase__list_branches` - List branches
- `mcp__supabase__delete_branch` - Delete branch
- `mcp__supabase__merge_branch` - Merge to production
- `mcp__supabase__reset_branch` - Reset branch
- `mcp__supabase__rebase_branch` - Rebase branch

**Configuration:** Already configured in `.claude/settings.json`

---

## Recommended MCP Servers

### 1. GitHub MCP Server

**Purpose:** Manage GitHub issues, PRs, and repository operations

**Installation:**
```bash
# User-level installation (recommended)
claude mcp add --scope user github -- bunx @modelcontextprotocol/server-github

# Or project-level
claude mcp add --scope project github -- bunx @modelcontextprotocol/server-github
```

**Environment Setup:**
1. Create GitHub Personal Access Token:
   - Go to: https://github.com/settings/tokens
   - Generate new token (classic)
   - Scopes: `repo`, `read:org`, `read:user`

2. Add to environment:
```bash
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxx
```

**Use Cases:**
- Create issues from bugs found in code review
- Create PRs automatically after feature completion
- Check PR status and reviews
- List open issues and assign them
- Search repository code
- Manage releases

**Example Usage:**
```
Create a GitHub issue for the Tailwind violation found in WorkflowTable.jsx
Check status of PR #42
List all open issues labeled "bug"
```

---

### 2. Sequential Thinking MCP

**Purpose:** Extended reasoning for complex architectural decisions

**Installation:**
```bash
claude mcp add --scope user sequential-thinking -- bunx @modelcontextprotocol/server-sequential-thinking
```

**Use Cases:**
- Complex architectural planning
- Multi-step problem solving
- Trade-off analysis (e.g., database schema design)
- Security threat modeling
- Performance optimization strategies

**Example Usage:**
```
Use sequential thinking to design a new multi-tenant workflow sharing system
Analyze trade-offs between Redis vs in-memory caching for rate limiting
```

---

### 3. Brave Search MCP

**Purpose:** Real-time web search for documentation and solutions

**Installation:**
```bash
claude mcp add --scope user brave-search -- bunx @modelcontextprotocol/server-brave-search
```

**Environment Setup:**
1. Get Brave Search API key: https://brave.com/search/api/
2. Add to environment:
```bash
export BRAVE_API_KEY=BSAxxxxxxxxxxxxx
```

**Use Cases:**
- Find latest documentation for libraries
- Search for error messages and solutions
- Check npm package latest versions
- Find security advisories

**Example Usage:**
```
Search for latest React 19 best practices
Find solutions for Vitest ESM module errors
Check latest Supabase RLS policy examples
```

---

### 4. Filesystem MCP (Optional)

**Purpose:** Advanced file operations beyond standard tools

**Installation:**
```bash
claude mcp add --scope project filesystem -- bunx @modelcontextprotocol/server-filesystem
```

**Configuration:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "bunx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "/Users/dorian/Documents/MASSTOCK"
      }
    }
  }
}
```

**Use Cases:**
- Batch file operations
- Complex file searches
- Directory tree analysis

---

## Project-Level MCP Configuration

Create `.mcp.json` in project root (commit to git):

```json
{
  "mcpServers": {
    "supabase": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "description": "Supabase database operations"
    },
    "github": {
      "type": "stdio",
      "command": "bunx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      },
      "description": "GitHub issues, PRs, and repository management"
    }
  }
}
```

**Note:** Environment variables are resolved from shell environment.

---

## MCP Server Management

### List Installed Servers
```bash
claude mcp list
```

### Remove Server
```bash
claude mcp remove github
```

### Enable/Disable Server
Edit `.claude/settings.json`:
```json
{
  "mcpServers": {
    "github": {
      "disabled": true
    }
  }
}
```

---

## MCP Usage Tips

### 1. Explicit Tool Calls
Be explicit when using MCP tools:
```
Use mcp__supabase__list_tables to show all database tables
Use mcp__github__create_issue to create a bug report
```

### 2. Security Considerations
- Never commit MCP tokens to git
- Use environment variables for API keys
- Scope permissions minimally (read-only when possible)
- Regularly rotate API keys

### 3. Performance
- MCP calls are synchronous - use sparingly
- Batch operations when possible
- Cache results in conversation context

### 4. Debugging MCP Issues
```bash
# Check MCP server logs
claude mcp logs github

# Test MCP server connection
claude mcp test github
```

---

## Priority Installation Order

**High Priority (Install Now):**
1. ✅ Supabase MCP - Already installed
2. GitHub MCP - Essential for workflow automation

**Medium Priority (Install as Needed):**
3. Sequential Thinking MCP - For complex decisions
4. Brave Search MCP - For real-time documentation

**Low Priority (Optional):**
5. Filesystem MCP - Only if standard tools insufficient

---

## Installation Commands Summary

```bash
# GitHub (recommended)
claude mcp add --scope user github -- bunx @modelcontextprotocol/server-github
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxx

# Sequential Thinking (recommended)
claude mcp add --scope user sequential-thinking -- bunx @modelcontextprotocol/server-sequential-thinking

# Brave Search (optional)
claude mcp add --scope user brave-search -- bunx @modelcontextprotocol/server-brave-search
export BRAVE_API_KEY=BSAxxxxxxxxxxxxx
```

---

## Verify Installation

After installing, verify MCP servers are active:

```bash
# List all MCP servers
claude mcp list

# Should show:
# ✅ supabase (active)
# ✅ github (active)
# ✅ sequential-thinking (active)
```

Test a tool:
```
Use mcp__supabase__list_tables to verify Supabase connection
Use mcp__github__search_repos query: "react hooks" to verify GitHub connection
```

---

## Troubleshooting

### MCP Server Won't Start
```bash
# Check logs
claude mcp logs <server-name>

# Reinstall
claude mcp remove <server-name>
claude mcp add --scope user <server-name> -- bunx @modelcontextprotocol/server-<server-name>
```

### Permission Errors
- Check API token has correct scopes
- Verify environment variable is set
- Check `.claude/settings.json` for typos

### Slow Performance
- Reduce frequency of MCP calls
- Cache results in conversation
- Use built-in tools when possible

---

## Resources

- **MCP Documentation:** https://modelcontextprotocol.io
- **MCP Server Registry:** https://github.com/modelcontextprotocol/servers
- **Claude Code MCP Guide:** Run `/help mcp` in Claude Code
- **Supabase MCP:** https://github.com/modelcontextprotocol/servers/tree/main/src/supabase

---

**Last Updated:** 2025-11-30
**Version:** 1.0
