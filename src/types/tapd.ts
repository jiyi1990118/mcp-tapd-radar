export interface TapdConfig {
  clientId: string;
  clientSecret: string;
  workspaceId?: string;
  baseUrl?: string;
}

export interface Story {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  creator: string;
  created: string;
  modified: string;
  status: string;
  owner: string;
  priority: string;
  priority_label?: string;
  iteration_id?: string;
  begin?: string;
  due?: string;
  category_id?: string;
  parent_id?: string;
  children_id?: string;
  developer?: string;
  cc?: string;
  version?: string;
  module?: string;
  test_focus?: string;
  business_value?: string;
  source?: string;
  type?: string;
  feature?: string;
  tech_risk?: string;
  effort?: string;
  effort_completed?: string;
  remain?: string;
  exceed?: string;
  release_id?: string;
  workitem_type_id?: string;
  label?: string;
  size?: string;
  current_user?: string;
  templated_id?: string;
  custom_field_one?: string;
  custom_field_two?: string;
  custom_field_three?: string;
  custom_field_four?: string;
  custom_field_five?: string;
  custom_field_six?: string;
  custom_field_seven?: string;
  custom_field_eight?: string;
  [key: string]: string | undefined;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  workspace_id: string;
  reporter: string;
  current_owner: string;
  severity: string;
  priority: string;
  priority_label?: string;
  status: string;
  created: string;
  modified: string;
  resolution?: string;
  deadline?: string;
  due?: string;
  begin?: string;
  platform?: string;
  os?: string;
  test_type?: string;
  source?: string;
  module?: string;
  iteration_id?: string;
  cc?: string;
  version_report?: string;
  version_test?: string;
  version_close?: string;
  baseline_find?: string;
  baseline_join?: string;
  baseline_test?: string;
  baseline_close?: string;
  bugtype?: string;
  effort?: string;
  label?: string;
  custom_field_one?: string;
  custom_field_two?: string;
  custom_field_three?: string;
  custom_field_four?: string;
  custom_field_five?: string;
  custom_field_six?: string;
  custom_field_seven?: string;
  custom_field_eight?: string;
  [key: string]: string | undefined;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  workspace_id: string;
  creator: string;
  owner: string;
  status: string;
  priority: string;
  priority_label?: string;
  created: string;
  modified: string;
  begin?: string;
  due?: string;
  iteration_id?: string;
  category_id?: string;
  story_id?: string;
  effort?: string;
  effort_completed?: string;
  remain?: string;
  exceed?: string;
  cc?: string;
  label?: string;
  custom_field_one?: string;
  custom_field_two?: string;
  custom_field_three?: string;
  custom_field_four?: string;
  custom_field_five?: string;
  custom_field_six?: string;
  custom_field_seven?: string;
  custom_field_eight?: string;
  [key: string]: string | undefined;
}

export interface Iteration {
  id: string;
  name: string;
  workspace_id: string;
  status: string;
  startdate: string;
  enddate: string;
  creator: string;
  created: string;
  modified: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface Workspace {
  id: string;
  name: string;
  pretty_name: string;
  creator: string;
  created: string;
  status: string;
  parent_id?: string;
  [key: string]: string | undefined;
}

export interface Webhook {
  id: string;
  workspace_id: string;
  url: string;
  event: string;
  secret?: string;
  created: string;
  [key: string]: string | undefined;
}

export interface Comment {
  id: string;
  title: string;
  description: string;
  author: string;
  entry_type: string;
  entry_id: string;
  created: string;
  modified: string;
  workspace_id: string;
  [key: string]: string | undefined;
}

export interface User {
  id: string;
  nick: string;
  name: string;
  email: string;
  workspace_id: string;
  status: string;
  [key: string]: string | undefined;
}

export interface TapdApiResponse<T> {
  status: number;
  info: string;
  data: T;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  now: string;
}

/**
 * TAPD story status values.
 * Note: Status values are workflow-configurable per project. The values below
 * are the most common ones. Use `GET /workflows/story` or check the TAPD web
 * UI to see the exact statuses configured for a workspace.
 *
 * Common values:
 * - `new` — 新建
 * - `planning` / `planned` — 规划中 / 需求排期
 * - `developing` — 开发中
 * - `testing` — 测试中
 * - `resolved` — 已解决
 * - `done` — 已完成
 * - `closed` — 已关闭
 * - `reopened` — 重新打开
 * - `rejected` — 已拒绝
 * - `draft` — 草稿
 * - `deleted` — 已删除（用于删除需求）
 */
export type StoryStatus =
  | 'new'
  | 'planning'
  | 'planned'
  | 'developing'
  | 'testing'
  | 'resolved'
  | 'done'
  | 'closed'
  | 'reopened'
  | 'rejected'
  | 'draft'
  | 'deleted';

/**
 * TAPD bug status values.
 * Note: Status values are workflow-configurable per project.
 */
export type BugStatus =
  | 'new'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'rejected'
  | 'postponed';

export type BugSeverity = 'fatal' | 'serious' | 'normal' | 'slight' | 'suggest';
export type BugPriority = 'urgent' | 'high' | 'medium' | 'low' | 'insignificant';

/**
 * TAPD task status values.
 * Note: Status values are workflow-configurable per project.
 */
export type TaskStatus =
  | 'new'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'rejected';

export type IterationStatus = 'open' | 'done';
