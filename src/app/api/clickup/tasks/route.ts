import { NextResponse } from 'next/server';

const CLICKUP_API = 'https://api.clickup.com/api/v2';
const TOKEN = process.env.CLICKUP_API_TOKEN || '';
const TEAM_ID = '90141025752';

// Folder structure for grouping
const FOLDERS: Record<string, string> = {
  '90148540989': 'Revenue Engine',
  '90148540990': 'Content Pipeline',
  '90148540991': 'Infrastructure',
};

const LIST_TO_FOLDER: Record<string, string> = {
  '901415391249': '90148540989', // Funnel & Conversion → Revenue Engine
  '901415391250': '90148540989', // Outreach & Growth → Revenue Engine
  '901415391252': '90148540990', // Channel Analytics → Content Pipeline
  '901415391258': '90148540990', // Video Production → Content Pipeline
  '901415391254': '90148540991', // Sovereign Infra → Infrastructure
};

type ClickUpTask = {
  id: string;
  name: string;
  description?: string;
  status: { status: string };
  priority: { priority: string } | null;
  due_date: string | null;
  date_created: string;
  list: { id: string; name: string };
  url: string;
};

export type NormalizedTask = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  list_name: string;
  folder_name: string;
  folder_id: string;
  url: string;
};

function normalizePriority(p: { priority: string } | null): string {
  if (!p) return 'none';
  const map: Record<string, string> = { '1': 'Urgent', '2': 'High', '3': 'Medium', '4': 'Low' };
  return map[p.priority] || 'none';
}

function normalizeStatus(s: string): string {
  const lower = s.toLowerCase();
  if (lower === 'complete' || lower === 'closed' || lower === 'done') return 'Complete';
  if (lower === 'in progress' || lower === 'in_progress') return 'In Progress';
  return 'To Do';
}

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ error: 'CLICKUP_API_TOKEN not configured' }, { status: 500 });
  }

  try {
    // Fetch all tasks from the space via team-level filtered endpoint
    const res = await fetch(
      `${CLICKUP_API}/team/${TEAM_ID}/task?space_ids[]=90144597848&include_closed=true&subtasks=true&order_by=due_date`,
      {
        headers: { Authorization: TOKEN },
        next: { revalidate: 30 }, // cache for 30s
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `ClickUp API error: ${res.status}`, detail: err }, { status: res.status });
    }

    const data = await res.json();
    const tasks: NormalizedTask[] = (data.tasks || [])
      .filter((t: ClickUpTask) => {
        // Filter out tasks from default junk lists
        const junkLists = ['901414602195', '901414602196', '901414602201'];
        return !junkLists.includes(t.list.id);
      })
      .map((t: ClickUpTask) => {
        const folderId = LIST_TO_FOLDER[t.list.id] || '';
        return {
          id: t.id,
          title: t.name,
          description: t.description || '',
          status: normalizeStatus(t.status.status),
          priority: normalizePriority(t.priority),
          due_date: t.due_date ? new Date(Number(t.due_date)).toISOString() : null,
          created_at: new Date(Number(t.date_created)).toISOString(),
          list_name: t.list.name,
          folder_name: FOLDERS[folderId] || 'Uncategorized',
          folder_id: folderId,
          url: t.url,
        };
      });

    return NextResponse.json({ tasks, updated_at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch from ClickUp', detail: String(err) }, { status: 500 });
  }
}
