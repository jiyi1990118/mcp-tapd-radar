import { describe, it, expect } from 'vitest';

type ToolHandler = (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>;

interface FakeServer {
  registerTool(name: string, config: unknown, handler: ToolHandler): void;
  __handler?: ToolHandler;
  __name?: string;
}

function createFakeServer(): FakeServer {
  const srv: FakeServer = {
    registerTool(name, _config, handler) {
      srv.__name = name;
      srv.__handler = handler;
    },
  };
  return srv;
}

function createFakeClient() {
  let lastGet: { endpoint: string; params: Record<string, string> } | null = null;
  return {
    get(endpoint: string, params: Record<string, string>) {
      lastGet = { endpoint, params };
      return Promise.resolve({ count: 42 });
    },
    getLastGet() { return lastGet; },
  };
}

describe('tapd_count_workitems', () => {
  it('sends the owner filter to the API (regression: owner was dropped from QueryBuilder)', async () => {
    const server = createFakeServer();
    const fakeClient = createFakeClient();
    const { registerWorkitemTools } = await import('../src/tools/workitem.js');

    registerWorkitemTools(server as never, fakeClient as never);

    const handler = server.__handler!;
    expect(server.__name).toBe('tapd_count_workitems');

    const result = await handler({ workspace_id: '48801209', entity_type: 'story', owner: 'zhangsan' });

    const captured = fakeClient.getLastGet();
    expect(captured).not.toBeNull();
    expect(captured!.endpoint).toBe('/stories/count');
    expect(captured!.params.owner).toBe('zhangsan');

    const payload = JSON.parse(result.content[0].text);
    expect(payload.ok).toBe(true);
    expect(payload.data.count).toBe(42);
  });

  it('hits the bug endpoint and omits owner when not provided', async () => {
    const server = createFakeServer();
    const fakeClient = createFakeClient();
    const { registerWorkitemTools } = await import('../src/tools/workitem.js');

    registerWorkitemTools(server as never, fakeClient as never);

    await server.__handler!({ workspace_id: '48801209', entity_type: 'bug', status: 'new|reopened' });

    const captured = fakeClient.getLastGet();
    expect(captured!.endpoint).toBe('/bugs/count');
    expect(captured!.params.owner).toBeUndefined();
    expect(captured!.params.status).toBe('new|reopened');
  });
});
