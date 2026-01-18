import axios from 'axios';
import * as cheerio from 'cheerio';

export interface Topic {
  title: string;
  content: string;
}

const BASE_URL = 'https://www.naqt.com';
const YGK_URL = `${BASE_URL}/you-gotta-know/`;
const MIN_CONTENT_LENGTH = 100;

// More realistic browser headers to avoid Cloudflare blocking
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Cache-Control': 'max-age=0'
};

function cleanText(text: string): string {
  // Clean and normalize text
  text = text.replace(/\s+([.,;:!?)])/g, '$1');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

export async function scrapeNAQTTopics(): Promise<Topic[]> {
  try {
    const response = await axios.get(YGK_URL, {
      headers: BROWSER_HEADERS,
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    const topics: Topic[] = [];
    const topicPromises: Promise<void>[] = [];

    $('a[href*="/you-gotta-know/"]').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().trim();
      
      if (href && href.match(/\/you-gotta-know\/.*\.html/)) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        
        if (text) {
          topicPromises.push(
            scrapeTopicContent(fullUrl).then(content => {
              if (content) {
                topics.push({
                  title: text.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()),
                  content: content
                });
              }
            })
          );
        }
      }
    });

    console.log(`Found ${topicPromises.length} topics. Scraping in parallel...`);
    
    // Process topics in smaller batches with delays to avoid rate limiting
    const BATCH_SIZE = 5;
    const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
    
    for (let i = 0; i < topicPromises.length; i += BATCH_SIZE) {
      const batch = topicPromises.slice(i, i + BATCH_SIZE);
      await Promise.all(batch);
      
      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < topicPromises.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    return topics;
  } catch (error) {
    console.error('Error scraping NAQT topics:', error);
    return [];
  }
}

export async function scrapeTopicContent(url: string, retries = 2): Promise<string> {
  try {
    // Add a small random delay to make requests more human-like
    const randomDelay = Math.floor(Math.random() * 1000) + 500; // 500-1500ms
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    
    const response = await axios.get(url, {
      headers: {
        ...BROWSER_HEADERS,
        'Referer': YGK_URL // Set referer to the main page
      },
      timeout: 15000 // 15s timeout
    });
    
    const $ = cheerio.load(response.data);
    const items: string[] = [];
    
    // Find all list items (li elements)
    $('li').each((_, element) => {
      const html = $(element).html() || '';
      const text = cleanText($(element).text());
      
      // Only include items that are long enough AND contain 'label' in the HTML
      if (text.length > MIN_CONTENT_LENGTH && html.includes('label')) {
        items.push(text);
      }
    });
    
    // Join all items with double newlines
    return items.join('\n\n');
  } catch (error) {
    if (retries > 0) {
      console.warn(`Error scraping ${url}. Retrying... (${retries} attempts left)`);
      // Exponential backoff: 2s, 4s
      const delay = (3 - retries) * 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return scrapeTopicContent(url, retries - 1);
    }
    
    console.error(`Failed to scrape topic content after retries: ${url}`, error instanceof Error ? error.message : error);
    return '';
  }
}