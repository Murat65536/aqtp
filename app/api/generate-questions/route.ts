import { NextResponse } from 'next/server';
import { generateSingleQuestion } from '@/lib/llm';

export async function POST(request: Request) {
  try {
    const { topicContent, topicTitle, apiKey, baseURL } = await request.json();
    
    if (!topicContent || !topicTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const question = await generateSingleQuestion(
      topicContent,
      topicTitle,
      apiKey,
      baseURL
    );
    
    return NextResponse.json({ question });
  } catch (error) {
    console.error('Error generating question:', error);
    return NextResponse.json(
      { error: 'Failed to generate question' },
      { status: 500 }
    );
  }
}
