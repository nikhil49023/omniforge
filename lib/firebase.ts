/**
 * lib/firebase.ts
 * Lightweight Firebase/Firestore client with memory and local persistence
 * for saving generated OmniForge projects and generating shareable links.
 */

import fs from 'node:fs';
import path from 'node:path';
import { ExtractedEndpoint } from './triage';

export interface StoredProject {
  id: string;
  name: string;
  sourceUrl?: string;
  endpoints: ExtractedEndpoint[];
  pythonCode: string;
  typescriptCode: string;
  claudeDesktopConfig: string;
  readme?: string;
  modelUsed?: string;
  createdAt: string;
  updatedAt: string;
  stars?: number;
  tags?: string[];
}

const LOCAL_STORAGE_FILE = path.join(process.cwd(), '.omniforge_projects.json');

// In-memory cache
const memoryStore = new Map<string, StoredProject>();

/**
 * Load persisted projects from disk
 */
function loadPersistedStore(): void {
  try {
    if (fs.existsSync(LOCAL_STORAGE_FILE)) {
      const data = fs.readFileSync(LOCAL_STORAGE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && item.id) {
            memoryStore.set(item.id, item);
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('[Storage] Failed to read local storage file:', err.message);
  }
}

/**
 * Flush in-memory store to disk
 */
function flushToDisk(): void {
  try {
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(LOCAL_STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err: any) {
    console.warn('[Storage] Failed to write local storage file:', err.message);
  }
}

// Initial load
loadPersistedStore();

/**
 * Generate a short unique ID for shareable links
 */
export function generateShareId(prefix = 'mcp'): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let rand = '';
  for (let i = 0; i < 7; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}_${rand}`;
}

/**
 * Save or update a project
 */
export async function saveProject(
  payload: Omit<StoredProject, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<StoredProject> {
  const id = payload.id || generateShareId('mcp');
  const now = new Date().toISOString();

  const existing = memoryStore.get(id);

  const project: StoredProject = {
    ...payload,
    id,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
    stars: existing?.stars ?? 0,
    tags: payload.tags || ['mcp', 'omniforge'],
  };

  memoryStore.set(id, project);
  flushToDisk();

  return project;
}

/**
 * Get project by ID
 */
export async function getProject(id: string): Promise<StoredProject | null> {
  if (memoryStore.has(id)) {
    return memoryStore.get(id)!;
  }
  loadPersistedStore();
  return memoryStore.get(id) || null;
}

/**
 * List recent projects
 */
export async function listProjects(limit = 20): Promise<StoredProject[]> {
  loadPersistedStore();
  return Array.from(memoryStore.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

/**
 * Delete a project by ID
 */
export async function deleteProject(id: string): Promise<boolean> {
  const existed = memoryStore.delete(id);
  if (existed) {
    flushToDisk();
  }
  return existed;
}

/**
 * Helper to build a shareable link
 */
export function createShareableLink(id: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/share/${id}`;
}
