import axios from 'axios';
import * as cheerio from 'cheerio';

export interface Topic {
  title: string;
  content: string;
  category: string;
}

export interface CategoryData {
  categories: string[];
  topics: Topic[];
}

const BASE_URL = 'https://www.naqt.com';
const YGK_CATEGORY_URL = `${BASE_URL}/you-gotta-know/by-category.jsp`;
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

export async function scrapeNAQTTopics(): Promise<CategoryData> {
  try {
    const response = await axios.get(YGK_CATEGORY_URL, {
      headers: BROWSER_HEADERS,
      timeout: 30000
    });
    
    const $ = cheerio.load(response.data);
    const topics: Topic[] = [];
    const categories: string[] = [];
    const topicPromises: { promise: Promise<string>; title: string; category: string; url: string }[] = [];

    let currentCategory = '';

    // Process the page content - h2 elements are category headings
    $('h2, ul li a').each((_, element) => {
      const tagName = element.tagName.toLowerCase();
      
      if (tagName === 'h2') {
        const categoryText = $(element).text().trim();
        // Skip "By Publication Date" as it's not a real category
        if (categoryText && categoryText !== 'By Publication Date') {
          currentCategory = categoryText;
          if (!categories.includes(currentCategory)) {
            categories.push(currentCategory);
          }
        }
      } else if (tagName === 'a' && currentCategory) {
        const href = $(element).attr('href');
        const text = $(element).text().trim();
        
        if (href && href.match(/\/you-gotta-know\/.*\.html/)) {
          const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
          
          // Extract title from "You Gotta Know…these [title]" format
          const titleMatch = text.match(/You Gotta Know…these (.+)/i);
          const title = titleMatch 
            ? titleMatch[1].replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase())
            : text.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase());
          
          if (title) {
            topicPromises.push({
              promise: scrapeTopicContent(fullUrl),
              title,
              category: currentCategory,
              url: fullUrl
            });
          }
        }
      }
    });

    console.log(`Found ${topicPromises.length} topics across ${categories.length} categories. Scraping in parallel...`);
    
    // Process topics in smaller batches with delays to avoid rate limiting
    const BATCH_SIZE = 5;
    const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
    
    for (let i = 0; i < topicPromises.length; i += BATCH_SIZE) {
      const batch = topicPromises.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(t => t.promise));
      
      results.forEach((content, idx) => {
        if (content) {
          const topicInfo = batch[idx];
          topics.push({
            title: topicInfo.title,
            content,
            category: topicInfo.category
          });
        }
      });
      
      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < topicPromises.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }

    return { categories, topics };
  } catch (error) {
    console.error('Error scraping NAQT topics:', error);
    return { categories: [], topics: [] };
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
        'Referer': YGK_CATEGORY_URL // Set referer to the category page
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