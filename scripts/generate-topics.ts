import fs from 'fs/promises';
import path from 'path';
import { scrapeNAQTTopics } from '../lib/scraper';

async function generateTopics() {
  try {
    console.log('🔄 Scraping NAQT topics by category...');
    
    const data = await scrapeNAQTTopics();
    
    const outputPath = path.join(process.cwd(), 'public', 'naqt_topics_cache.json');
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    
    console.log(`✅ Generated ${data.topics.length} topics across ${data.categories.length} categories successfully`);
  } catch (error) {
    console.error('❌ Error generating topics:', error);
    process.exit(1);
  }
}

generateTopics();