import { NextResponse } from 'next/server';
import { scrapeNAQTTopics, scrapeTopicContent } from '@/lib/scraper';

export async function GET() {
  try {
    const topics = await scrapeNAQTTopics();
    
    // Fetch content for first few topics (to avoid long initial load)
    const topicsWithContent = await Promise.all(
      topics.map(async (topic) => {
        const content = await scrapeTopicContent(topic.url);
        return { ...topic, content };
      })
    );
    
    return NextResponse.json(topicsWithContent);
  } catch (error) {
    console.error('Error in topics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch topics' },
      { status: 500 }
    );
  }
}
