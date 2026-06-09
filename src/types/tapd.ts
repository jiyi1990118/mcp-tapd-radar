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
  iteration_id?: string;
  begin?: string;
  due?: string;
  category_id?: string;
  parent_id?: string;
  children_id?: string;
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
  status: string;
  created: string;
  modified: string;
  resolution?: string;
  deadline?: string;
  platform?: string;
  os?: string;
  test_type?: string;
  source?: string;
  module?: string;
  iteration_id?: string;
  custom_field_one?: string;
  custom_field_two?: string;
  custom_field_three?: string;
  custom_field_four?: string;
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
  created: string;
  modified: string;
  begin?: string;
  due?: string;
  iteration_id?: string;
  category_id?: string;
  custom_field_one?: string;
  custom_field_two?: string;
  custom_field_three?: string;
  custom_field_four?: string;
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

export type StoryStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened' | 'rejected' | 'draft';
export type BugStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened' | 'rejected' | 'postponed';
export type BugSeverity = 'fatal' | 'serious' | 'normal' | 'slight' | 'suggest';
export type BugPriority = 'urgent' | 'high' | 'medium' | 'low' | 'insignificant';
export type TaskStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'reopened' | 'rejected';
export type IterationStatus = 'open' | 'done';
