import { NextResponse } from 'next/server';
import { scrapeNAQTTopics, scrapeTopicContent } from '@/lib/scraper';

import fs from 'fs/promises';
import path from 'path';

const CACHE_PATH = path.resolve(process.cwd(), 'naqt_topics_cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

async function getCachedTopics(): Promise<Topic[] | null> {
  try {
    const stat = await fs.stat(CACHE_PATH);
    const now = Date.now();
    if (now - stat.mtimeMs < CACHE_TTL_MS) {
      const data = await fs.readFile(CACHE_PATH, 'utf-8');
      return JSON.parse(data) as Topic[];
    }
  } catch {
    // Cache miss or file does not exist
  }
  return null;
}

import type { Topic } from '@/lib/scraper';

async function setCachedTopics(topics: Topic[]) {
  await fs.writeFile(CACHE_PATH, JSON.stringify(topics), 'utf-8');
}

export async function GET() {
  try {
    let topics: Topic[] | null = await getCachedTopics();
    if (!topics) {
      topics = await scrapeNAQTTopics();
      await setCachedTopics(topics);
    }
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error in topics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
