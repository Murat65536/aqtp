import axios from 'axios';
import * as cheerio from 'cheerio';

export interface Topic {
  title: string;
  content: string;
}

const BASE_URL = 'https://www.naqt.com';
const YGK_URL = `${BASE_URL}/you-gotta-know/`;
const MIN_CONTENT_LENGTH = 100;

function cleanText(text: string): string {
  // Clean and normalize text
  text = text.replace(/\s+([.,;:!?)])/g, '$1');
  text = text.replace(/\s+/g, ' ');
  return text.trim();
}

export async function scrapeNAQTTopics(): Promise<Topic[]> {
  try {
    const response = await axios.get(YGK_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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
              topics.push({
                title: text.replace(/\w\S*/g, text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()),
                content: content
              });
            })
          );
        }
      }
    });

    await Promise.all(topicPromises);

    return topics;
  } catch (error) {
    console.error('Error scraping NAQT topics:', error);
    return [];
  }
}

export async function scrapeTopicContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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
    console.error('Error scraping topic content:', error);
    return '';
  }
}
