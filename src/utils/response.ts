import { unwrapTapdEntity } from './helpers.js';

type EntityType = 'story' | 'bug' | 'task' | 'iteration' | 'workspace' | 'comment' | 'user' | string;
type AnyRecord = Record<string, unknown>;
type McpContent = { type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string };

const IMPORTANT_FIELDS: Record<string, string[]> = {
  story: ['id', 'name', 'status', 'priority', 'priority_label', 'owner', 'developer', 'iteration_id', 'begin', 'due', 'effort', 'description'],
  bug: ['id', 'title', 'status', 'severity', 'priority', 'priority_label', 'current_owner', 'iteration_id', 'due', 'description', 'reporter'],
  task: ['id', 'name', 'status', 'priority', 'priority_label', 'owner', 'iteration_id', 'begin', 'due', 'effort', 'description', 'story_id'],
  iteration: ['id', 'name', 'status', 'startdate', 'enddate', 'workspace_id'],
  workspace: ['id', 'name', 'status', 'pretty_name', 'workspace_type'],
  comment: ['id', 'entry_id', 'entry_type', 'description', 'author', 'created'],
  user: ['id', 'name', 'nick', 'email', 'status'],
};

function compactObject(value: AnyRecord): AnyRecord {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== '')
  );
}

function compactText(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function toMcpText(payload: unknown): { content: McpContent[] } {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

export function toMcpError(payload: unknown): { content: McpContent[]; isError: true } {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], isError: true };
}

export function buildEntitySummary(entityType: EntityType, item: unknown): AnyRecord {
  const unwrapped = unwrapTapdEntity(item);
  const record = unwrapped && typeof unwrapped === 'object' ? unwrapped as AnyRecord : {};
  const fields = IMPORTANT_FIELDS[entityType] || ['id', 'name', 'title', 'status'];
  const summary: AnyRecord = { entity_type: entityType };

  for (const field of fields) {
    const value = record[field];
    summary[field] = field === 'description' ? compactText(value ?? '') : (value ?? '');
  }

  return summary;
}

function getEntityTitle(item: AnyRecord): string {
  return String(item.name || item.title || item.id || 'unknown');
}

function omitEntityType(item: AnyRecord): AnyRecord {
  const rest = { ...item };
  delete rest.entity_type;
  return rest;
}

export function buildListResponse(options: {
  tool: string;
  entityType: EntityType;
  items: unknown[];
  workspaceId?: string;
  filters?: AnyRecord;
  limit?: number;
  page?: number;
}): AnyRecord {
  const context = compactObject({
    workspace_id: options.workspaceId,
    entity_type: options.entityType,
    filters: options.filters,
    pagination: options.limit || options.page ? compactObject({ limit: options.limit, page: options.page, returned: options.items.length }) : undefined,
  });

  return compactObject({
    ok: true,
    tool: options.tool,
    summary: `Found ${options.items.length} ${options.entityType} item(s).`,
    data: {
      items: options.items.map(item => omitEntityType(buildEntitySummary(options.entityType, item))),
      count: options.items.length,
    },
    context,
  });
}

export function buildDetailResponse(options: {
  tool: string;
  entityType: EntityType;
  item: unknown;
  workspaceId?: string;
  entityId?: string;
  imageResources?: AnyRecord;
  raw?: unknown;
}): AnyRecord {
  const compactItem = omitEntityType(buildEntitySummary(options.entityType, options.item));
  return compactObject({
    ok: true,
    tool: options.tool,
    summary: `${options.entityType} detail: ${getEntityTitle(compactItem)}${compactItem.id ? ` (id: ${compactItem.id})` : ''}.`,
    data: { item: compactItem },
    context: compactObject({
      workspace_id: options.workspaceId,
      entity_type: options.entityType,
      entity_id: options.entityId || compactItem.id,
    }),
    image_resources: options.imageResources,
    raw: options.raw,
  });
}

export function buildOperationResponse(options: {
  tool: string;
  action: 'created' | 'updated' | 'deleted' | 'registered' | 'removed';
  entityType: EntityType;
  item?: unknown;
  entityId?: string;
  workspaceId?: string;
}): AnyRecord {
  const compactItem = options.item ? omitEntityType(buildEntitySummary(options.entityType, options.item)) : compactObject({ id: options.entityId });
  const title = getEntityTitle(compactItem);
  return compactObject({
    ok: true,
    tool: options.tool,
    summary: `${options.action[0].toUpperCase()}${options.action.slice(1)} ${options.entityType}: ${title}${compactItem.id ? ` (id: ${compactItem.id})` : ''}.`,
    data: { item: compactItem },
    context: compactObject({
      workspace_id: options.workspaceId,
      entity_type: options.entityType,
      action: options.action,
    }),
  });
}

export function buildCountResponse(options: {
  tool: string;
  entityType: EntityType;
  count: unknown;
  workspaceId?: string;
  filters?: AnyRecord;
}): AnyRecord {
  const count = typeof options.count === 'object' && options.count !== null && 'count' in options.count
    ? (options.count as { count: unknown }).count
    : options.count;

  return compactObject({
    ok: true,
    tool: options.tool,
    summary: `Counted ${count} ${options.entityType} item(s).`,
    data: { count },
    context: compactObject({ workspace_id: options.workspaceId, entity_type: options.entityType, filters: options.filters }),
  });
}

export function classifyToolError(error: unknown): { type: string; retryable: boolean; suggestion: string } {
  const message = (error as Error).message?.toLowerCase?.() || '';
  if (message.includes('permission') || message.includes('scope limited') || message.includes('not allowed') || message.includes('权限')) {
    return { type: 'permission', retryable: false, suggestion: 'Check TAPD Open Platform app permissions for the requested module or scope.' };
  }
  if (message.includes('auth') || message.includes('unauthorized') || message.includes('token')) {
    return { type: 'auth', retryable: true, suggestion: 'Verify TAPD_CLIENT_ID and TAPD_CLIENT_SECRET, then restart the MCP server.' };
  }
  if (message.includes('not found')) {
    return { type: 'not_found', retryable: false, suggestion: 'Verify the workspace ID and entity ID.' };
  }
  if (message.includes('network') || message.includes('fetch')) {
    return { type: 'network', retryable: true, suggestion: 'Retry later or check network access to TAPD.' };
  }
  return { type: 'unknown', retryable: false, suggestion: 'Inspect the error message and TAPD API permissions.' };
}

export function buildErrorResponse(options: {
  tool: string;
  error: unknown;
  workspaceId?: string;
  entityType?: EntityType;
  entityId?: string;
}): AnyRecord {
  return compactObject({
    ok: false,
    tool: options.tool,
    error: {
      message: (options.error as Error).message || String(options.error),
      ...classifyToolError(options.error),
    },
    context: compactObject({ workspace_id: options.workspaceId, entity_type: options.entityType, entity_id: options.entityId }),
  });
}
