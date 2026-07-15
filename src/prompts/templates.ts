import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'create_bug_from_description',
    {
      title: 'Create Bug from Description',
      description: 'Parse a natural language bug description and create a structured TAPD bug with proper fields',
      argsSchema: {
        description: z.string().describe('The bug description in natural language'),
        workspace_id: z.string().describe('TAPD workspace/project ID'),
      },
    },
    async ({ description, workspace_id }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Based on the following bug description, create a structured bug in TAPD project ${workspace_id}.

Bug Description:
${description}

Please analyze the description and:
1. Extract a clear, concise bug title
2. Determine severity (fatal/serious/normal/slight/suggest)
3. Determine priority (urgent/high/medium/low/insignificant)
4. Write a structured description including:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
5. Use the tapd_create_bug tool to create the bug with the extracted information`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'sprint_planning',
    {
      title: 'Sprint Planning',
      description: 'Help plan a sprint by analyzing stories and suggesting iteration assignments based on priority and capacity',
      argsSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        iteration_id: z.string().optional().describe('Target iteration ID (optional, uses current open iteration if not specified)'),
      },
    },
    async ({ workspace_id, iteration_id }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Help me plan a sprint for TAPD project ${workspace_id}.${iteration_id ? ` Target iteration: ${iteration_id}.` : ''}

Please:
1. First, list open iterations using tapd_list_iterations to find ${iteration_id || 'the current open iteration'}
2. List unassigned stories (stories without iteration_id or in "new" status) using tapd_list_stories
3. Analyze story priorities and dependencies
4. Suggest which stories should be included in this sprint
5. Assign stories to the iteration using tapd_update_story

Consider:
- Story priority (high priority first)
- Team capacity and story complexity
- Dependencies between stories
- Current sprint goals if mentioned`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'daily_standup_report',
    {
      title: 'Daily Standup Report',
      description: 'Generate a daily standup report by gathering yesterday\'s completed tasks and today\'s planned work',
      argsSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
        user_id: z.string().optional().describe('User ID to generate report for (optional, defaults to all)'),
      },
    },
    async ({ workspace_id, user_id }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Generate a daily standup report for TAPD project ${workspace_id}.${user_id ? ` User: ${user_id}.` : ''}

Please:
1. Get stories that were recently modified using tapd_list_stories with time filters
2. Get tasks that were recently modified using tapd_list_tasks with time filters
3. Get bugs that were recently updated using tapd_list_bugs with time filters
4. Summarize the report in this format:

## Daily Standup Report
**Project**: [project name]
**Date**: [today's date]

### Completed Yesterday
- [list of completed items]

### Planned for Today
- [list of items in progress or planned]

### Blockers
- [any blockers or issues found]

5. Include relevant details like story/bug titles, status changes, and owners`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    'bug_triage',
    {
      title: 'Bug Triage',
      description: 'Analyze and triage bugs by suggesting severity, priority, and handler assignments',
      argsSchema: {
        workspace_id: z.string().describe('TAPD workspace/project ID'),
      },
    },
    async ({ workspace_id }) => ({
      messages: [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `Help me triage bugs in TAPD project ${workspace_id}.

Please:
1. List all new/unresolved bugs using tapd_list_bugs with status filter
2. List bug counts by severity and priority using tapd_count_workitems with entity_type=bug
3. For each bug, suggest:
   - Appropriate severity level
   - Priority level
   - Recommended handler based on the bug's module/component
4. Provide a summary with:
   - Total bugs by severity
   - Critical bugs that need immediate attention
   - Recommended triage actions
5. Optionally update bug fields using tapd_update_bug based on the triage decisions

Focus on:
- Bugs with "fatal" or "serious" severity
- Bugs that have been open for a long time
- Bugs without an assigned handler`,
          },
        },
      ],
    })
  );
}
