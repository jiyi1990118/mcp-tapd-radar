#!/usr/bin/env node
/**
 * MCP工具完整功能测试
 * 直接调用项目中的方法进行测试（非MCP方式）
 */

import { TapdApiClient } from './api/TapdApiClient.js';
import { QueryBuilder } from './api/QueryBuilder.js';

const WORKSPACE_ID = '48801209';
const TEST_STORY_ID = '1148801209001019018';
const TEST_BUG_ID = '1148801209001000767';
const TEST_TASK_ID = '1148801209001018961';
const TEST_ITERATION_ID = '1148801209001000780';

interface TestResult {
  tool: string;
  endpoint: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  error?: string;
  details?: string;
}

const results: TestResult[] = [];

function log(label: string, message: string) {
  console.log(`[${label}] ${message}`);
}

async function runTest(name: string, endpoint: string, fn: () => Promise<unknown>): Promise<TestResult> {
  try {
    const start = Date.now();
    const result = await fn();
    const elapsed = Date.now() - start;
    log('PASS', `${name} (${endpoint}) - ${elapsed}ms`);
    return { tool: name, endpoint, status: 'PASS', details: JSON.stringify(result).substring(0, 200) };
  } catch (error: unknown) {
    const msg = (error as Error).message || String(error);
    log('FAIL', `${name} (${endpoint}) - ${msg.substring(0, 100)}`);
    return { tool: name, endpoint, status: 'FAIL', error: msg };
  }
}

async function main() {
  const client = new TapdApiClient({
    clientId: process.env.TAPD_CLIENT_ID || 'tapd-app-342653',
    clientSecret: process.env.TAPD_CLIENT_SECRET || 'AE912537-2437-E182-300A-B28556E7C545',
    baseUrl: process.env.TAPD_API_BASE_URL || 'https://api.tapd.cn',
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('  MCP工具完整功能回归测试');
  console.log('═══════════════════════════════════════════════════════\n');

  // ========== Story 需求 ==========
  console.log('\n📋 Story 需求测试');
  console.log('─────────────────────────────────');

  results.push(await runTest(
    'tapd_list_stories',
    'GET /stories',
    async () => {
      const qb = new QueryBuilder()
        .add('workspace_id', WORKSPACE_ID)
        .addPagination(2, 1);
      return client.get('/stories', Object.fromEntries(new URLSearchParams(qb.build())));
    }
  ));

  results.push(await runTest(
    'tapd_get_story',
    'GET /stories?id={id}',
    async () => client.get('/stories', { workspace_id: WORKSPACE_ID, id: TEST_STORY_ID })
  ));

  results.push(await runTest(
    'tapd_create_story',
    'POST /stories',
    async () => client.post('/stories', {
      workspace_id: WORKSPACE_ID,
      name: `[测试-${Date.now()}] API对齐回归测试`,
      description: '由自动化测试脚本创建的测试需求',
    })
  ));

  results.push(await runTest(
    'tapd_update_story',
    'POST /stories',
    async () => client.post('/stories', {
      workspace_id: WORKSPACE_ID,
      id: TEST_STORY_ID,
      size: '3',
    })
  ));

  results.push(await runTest(
    'tapd_batch_update_stories',
    'POST /stories/batch_update_story',
    async () => client.post('/stories/batch_update_story', {
      workspace_id: WORKSPACE_ID,
      workitems: [{ id: TEST_STORY_ID, size: '3' }],
    })
  ));

  results.push(await runTest(
    'tapd_count_workitems (stories)',
    'GET /stories/count',
    async () => client.get('/stories/count', { workspace_id: WORKSPACE_ID })
  ));

  results.push(await runTest(
    'tapd_delete_story',
    'POST /stories (status=deleted)',
    async () => {
      // 先创建一个临时需求用于删除
      const created = await client.post('/stories', {
        workspace_id: WORKSPACE_ID,
        name: `[测试删除-${Date.now()}] 待删除需求`,
      });
      const storyObj = created ? Object.values(created)[0] : null;
      const storyId = storyObj ? (storyObj as Record<string, string>).id : null;
      if (!storyId) throw new Error('创建失败');
      return client.post('/stories', {
        workspace_id: WORKSPACE_ID,
        id: storyId,
        status: 'deleted',
      });
    }
  ));

  // ========== Bug 缺陷 ==========
  console.log('\n🐛 Bug 缺陷测试');
  console.log('─────────────────────────────────');

  results.push(await runTest(
    'tapd_list_bugs',
    'GET /bugs',
    async () => {
      const qb = new QueryBuilder()
        .add('workspace_id', WORKSPACE_ID)
        .addPagination(2, 1);
      return client.get('/bugs', Object.fromEntries(new URLSearchParams(qb.build())));
    }
  ));

  results.push(await runTest(
    'tapd_get_bug',
    'GET /bugs?id={id}',
    async () => client.get('/bugs', { workspace_id: WORKSPACE_ID, id: TEST_BUG_ID })
  ));

  results.push(await runTest(
    'tapd_create_bug',
    'POST /bugs',
    async () => client.post('/bugs', {
      workspace_id: WORKSPACE_ID,
      title: `[测试-${Date.now()}] API对齐回归测试`,
      description: '由自动化测试脚本创建的测试缺陷',
    })
  ));

  results.push(await runTest(
    'tapd_update_bug',
    'POST /bugs',
    async () => client.post('/bugs', {
      workspace_id: WORKSPACE_ID,
      id: TEST_BUG_ID,
      priority: '高',
    })
  ));

  results.push(await runTest(
    'tapd_batch_update_bugs',
    'POST /bugs/batch_update_bug',
    async () => client.post('/bugs/batch_update_bug', {
      workspace_id: WORKSPACE_ID,
      project_id: WORKSPACE_ID,
      workitems: [{ id: TEST_BUG_ID, priority: '高' }],
    })
  ));

  results.push(await runTest(
    'tapd_count_workitems (bugs)',
    'GET /bugs/count',
    async () => client.get('/bugs/count', { workspace_id: WORKSPACE_ID })
  ));

  results.push(await runTest(
    'tapd_delete_bug',
    'POST /bugs (status=deleted)',
    async () => {
      const created = await client.post('/bugs', {
        workspace_id: WORKSPACE_ID,
        title: `[测试删除-${Date.now()}] 待删除缺陷`,
      });
      const bugObj = created ? Object.values(created)[0] : null;
      const bugId = bugObj ? (bugObj as Record<string, string>).id : null;
      if (!bugId) throw new Error('创建失败');
      return client.post('/bugs', {
        workspace_id: WORKSPACE_ID,
        id: bugId,
        status: 'deleted',
      });
    }
  ));

  // ========== Task 任务 ==========
  console.log('\n📋 Task 任务测试');
  console.log('─────────────────────────────────');

  results.push(await runTest(
    'tapd_list_tasks',
    'GET /tasks',
    async () => {
      const qb = new QueryBuilder()
        .add('workspace_id', WORKSPACE_ID)
        .addPagination(2, 1);
      return client.get('/tasks', Object.fromEntries(new URLSearchParams(qb.build())));
    }
  ));

  results.push(await runTest(
    'tapd_get_task',
    'GET /tasks?id={id}',
    async () => client.get('/tasks', { workspace_id: WORKSPACE_ID, id: TEST_TASK_ID })
  ));

  results.push(await runTest(
    'tapd_create_task',
    'POST /tasks',
    async () => client.post('/tasks', {
      workspace_id: WORKSPACE_ID,
      name: `[测试-${Date.now()}] API对齐回归测试`,
      description: '由自动化测试脚本创建的测试任务',
    })
  ));

  results.push(await runTest(
    'tapd_update_task',
    'POST /tasks',
    async () => client.post('/tasks', {
      workspace_id: WORKSPACE_ID,
      id: TEST_TASK_ID,
      status: 'open',
    })
  ));

  results.push(await runTest(
    'tapd_batch_update_tasks',
    'POST /tasks/batch_update_task',
    async () => client.post('/tasks/batch_update_task', {
      workspace_id: WORKSPACE_ID,
      workitems: [{ id: TEST_TASK_ID, status: 'open' }],
    })
  ));

  results.push(await runTest(
    'tapd_count_workitems (tasks)',
    'GET /tasks/count',
    async () => client.get('/tasks/count', { workspace_id: WORKSPACE_ID })
  ));

  results.push(await runTest(
    'tapd_delete_task',
    'POST /tasks (status=deleted)',
    async () => {
      const created = await client.post('/tasks', {
        workspace_id: WORKSPACE_ID,
        name: `[测试删除-${Date.now()}] 待删除任务`,
      });
      const taskObj = created ? Object.values(created)[0] : null;
      const taskId = taskObj ? (taskObj as Record<string, string>).id : null;
      if (!taskId) throw new Error('创建失败');
      return client.post('/tasks', {
        workspace_id: WORKSPACE_ID,
        id: taskId,
        status: 'deleted',
      });
    }
  ));

  // ========== Iteration 迭代 ==========
  console.log('\n🔄 Iteration 迭代测试');
  console.log('─────────────────────────────────');

  results.push(await runTest(
    'tapd_list_iterations',
    'GET /iterations',
    async () => {
      const qb = new QueryBuilder()
        .add('workspace_id', WORKSPACE_ID)
        .addPagination(2, 1);
      return client.get('/iterations', Object.fromEntries(new URLSearchParams(qb.build())));
    }
  ));

  results.push(await runTest(
    'tapd_get_iteration',
    'GET /iterations?id={id}',
    async () => client.get('/iterations', { workspace_id: WORKSPACE_ID, id: TEST_ITERATION_ID })
  ));

  results.push(await runTest(
    'tapd_set_iteration_lock (lock)',
    'POST /iterations/lock',
    async () => client.post('/iterations/lock', {
      workspace_id: WORKSPACE_ID,
      id: TEST_ITERATION_ID,
    })
  ));

  results.push(await runTest(
    'tapd_set_iteration_lock (unlock)',
    'POST /iterations/unlock',
    async () => client.post('/iterations/unlock', {
      workspace_id: WORKSPACE_ID,
      id: TEST_ITERATION_ID,
    })
  ));

  // ========== Comment 评论 ==========
  console.log('\n💬 Comment 评论测试');
  console.log('─────────────────────────────────');

  results.push(await runTest(
    'tapd_list_comments (story)',
    'GET /comments?entry_type=stories',
    async () => {
      const qb = new QueryBuilder()
        .add('workspace_id', WORKSPACE_ID)
        .add('entry_type', 'stories')
        .add('entry_id', TEST_STORY_ID)
        .addPagination(2, 1);
      return client.get('/comments', Object.fromEntries(new URLSearchParams(qb.build())));
    }
  ));

  results.push(await runTest(
    'tapd_list_comments (bug)',
    'GET /comments?entry_type=bug',
    async () => {
      const qb = new QueryBuilder()
        .add('workspace_id', WORKSPACE_ID)
        .add('entry_type', 'bug')
        .add('entry_id', TEST_BUG_ID)
        .addPagination(2, 1);
      return client.get('/comments', Object.fromEntries(new URLSearchParams(qb.build())));
    }
  ));

  results.push(await runTest(
    'tapd_create_comment (story)',
    'POST /comments (entry_type=stories)',
    async () => client.post('/comments', {
      workspace_id: WORKSPACE_ID,
      entry_type: 'stories',
      entry_id: TEST_STORY_ID,
      description: `回归测试评论 ${Date.now()}`,
    })
  ));

  results.push(await runTest(
    'tapd_create_comment (bug)',
    'POST /comments (entry_type=bug)',
    async () => client.post('/comments', {
      workspace_id: WORKSPACE_ID,
      entry_type: 'bug',
      entry_id: TEST_BUG_ID,
      description: `回归测试评论 ${Date.now()}`,
    })
  ));

  results.push(await runTest(
    'tapd_create_comment (task)',
    'POST /comments (entry_type=tasks)',
    async () => client.post('/comments', {
      workspace_id: WORKSPACE_ID,
      entry_type: 'tasks',
      entry_id: TEST_TASK_ID,
      description: `回归测试评论 ${Date.now()}`,
    })
  ));

  // ========== User 用户 ==========
  console.log('\n👤 User 用户测试');
  console.log('─────────────────────────────────');

  results.push(await runTest(
    'tapd_list_users',
    'GET /workspaces/users',
    async () => client.get('/workspaces/users', { workspace_id: WORKSPACE_ID, limit: '2' })
  ));

  results.push(await runTest(
    'tapd_get_user',
    'GET /workspaces/users',
    async () => client.get('/workspaces/users', { workspace_id: WORKSPACE_ID })
  ));

  // ========== Workspace 工作空间 ==========
  console.log('\n🏢 Workspace 工作空间测试');
  console.log('─────────────────────────────────');

  results.push(await runTest(
    'tapd_list_workspaces',
    'GET /workspaces',
    async () => {
      const qb = new QueryBuilder().addPagination(2, 1);
      return client.get('/workspaces', Object.fromEntries(new URLSearchParams(qb.build())));
    }
  ));

  results.push(await runTest(
    'tapd_get_workspace',
    'GET /workspaces?workspace_id={id}',
    async () => client.get('/workspaces', { workspace_id: WORKSPACE_ID })
  ));

  // ========== Ping 连通性 ==========
  console.log('\n📡 Ping 连通性测试');
  console.log('─────────────────────────────────');

  results.push(await runTest(
    'tapd_ping',
    'GET /workspaces?limit=1',
    async () => client.get('/workspaces', { limit: '1' })
  ));

  // ========== 生成测试报告 ==========
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  测试报告');
  console.log('═══════════════════════════════════════════════════════');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`\n总计: ${total} | ✅ 通过: ${passed} | ❌ 失败: ${failed} | 通过率: ${((passed/total)*100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('失败详情:');
    console.log('─────────────────────────────────');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`❌ ${r.tool}`);
      console.log(`   端点: ${r.endpoint}`);
      console.log(`   错误: ${r.error?.substring(0, 200)}`);
      console.log('');
    });
  }

  console.log('\n全部结果:');
  console.log('─────────────────────────────────');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.tool.padEnd(30)} ${r.endpoint}`);
  });
}

main().catch(console.error);
