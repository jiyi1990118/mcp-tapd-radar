#!/usr/bin/env node

import 'dotenv/config';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TapdApiClient } from './api/TapdApiClient.js';
import { registerStoryTools } from './tools/story.js';
import { registerBugTools } from './tools/bug.js';
import { registerTaskTools } from './tools/task.js';
import { registerIterationTools } from './tools/iteration.js';
import { registerWorkitemTools } from './tools/workitem.js';
import { registerWorkspaceTools } from './tools/workspace.js';
import { registerCommentTools } from './tools/comment.js';
import { registerUserTools } from './tools/user.js';
import { registerPingTool } from './tools/ping.js';
import { registerImageTools } from './tools/image.js';
import { registerResources } from './resources/workspace.js';
import { registerPrompts } from './prompts/templates.js';
import { logger } from './utils/logger.js';

function getConfig() {
  const clientId = process.env.TAPD_CLIENT_ID;
  const clientSecret = process.env.TAPD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    logger.error('TAPD_CLIENT_ID and TAPD_CLIENT_SECRET environment variables are required');
    process.exit(1);
  }

  return {
    clientId,
    clientSecret,
    workspaceId: process.env.TAPD_WORKSPACE_ID,
    baseUrl: process.env.TAPD_API_BASE_URL || 'https://api.tapd.cn',
  };
}

async function main() {
  const config = getConfig();
  const client = new TapdApiClient(config);

  const server = new McpServer(
    {
      name: 'tapd-mcp-radar',
      version: '1.2.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  registerStoryTools(server, client);
  registerBugTools(server, client);
  registerTaskTools(server, client);
  registerIterationTools(server, client);
  registerWorkitemTools(server, client);
  registerWorkspaceTools(server, client);
  registerCommentTools(server, client);
  registerUserTools(server, client);
  registerPingTool(server, client);
  registerImageTools(server, client);

  registerResources(server, client);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('TAPD MCP Server (tapd-mcp-radar) started successfully');
}

function setupGracefulShutdown() {
  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

setupGracefulShutdown();

main().catch((error) => {
  logger.error('Fatal error starting TAPD MCP Server', error);
  process.exit(1);
});
