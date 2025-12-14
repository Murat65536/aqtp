import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';

function getOpenAI(apiKey: string, baseURL: string) {
  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });
}

export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export async function fetchAvailableModels(apiKey: string, baseURL: string): Promise<string[]> {
  const openai = getOpenAI(apiKey, baseURL);
  const result = await openai.models.list();
  // body is a protected field, so result must be cast to any.
  return ((result as any).body || []).map((m: any) => m.name);
}

export async function generateQuestion(
  context: string,
  apiKey: string,
  baseURL: string,
  model: string
): Promise<{
  question: string;
  answer: string;
  context: string;
}> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a quiz bowl question writer.

Given background information, write a quiz bowl question following these rules:
- Start with 3-5 descriptive sentences from the background information giving clues about the answer
- Begin with obscure facts, gradually become more obvious
- Write as ONE continuous paragraph
- NEVER reveal the answer directly in your clues
- Do NOT write multiple questions - only ONE question at the very end

Here are a few examples:
This mythological woman mothered a child with a man who was later killed using a lance tipped with stingray poison by that child. This person advised her lover to sail to the underworld to meet the ghost of the blind seer Tiresias. Telegonus was a son of this resident of the island Aeaea, whose magic was countered by the herb moly. The members of Odysseus's crew were turned into swine by what sorceress?
Circe

Question: Biologist Rudolf Virchow legendarily offered to "duel" this man by eating poisoned sausages. This man engineered the Second Schleswig War to seize territory from Denmark. With his subordinate Adalbert Falk, this man tried to minimize Catholic influence in his country through the Kulturkampf. A war this man caused with France led Wilhelm I to be crowned as kaiser. What Prussian chancellor unified Germany?
Otto von Bismarck


FOLLOW THE FORMAT GIVEN BY THE EXAMPLES

Format:
[question here]
[answer here]`
    },
    {
      role: 'user',
      content: `Write a quiz bowl question based on the following context:
${context}`,
    }
  ];

  const openai = getOpenAI(apiKey, baseURL);
  const completion = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: 256,
    temperature: 0,
    presence_penalty: 0.6,
    frequency_penalty: 0.3,
  });

  const response = completion.choices[0].message?.content?.trim().split('\n') ?? ['Error', 'Error'];
  const question = response[0];
  const answer = response[1];

  return {
    question,
    answer,
    context,
  };
}

export async function generateSingleQuestion(
  topicContent: string,
  apiKey: string,
  baseURL: string,
  model: string
): Promise<{ question: string; answer: string; context: string }> {
  // Split content by double newlines to get individual bullet points
  const bulletPoints = topicContent.split('\n\n').filter(point => point.trim().length > 0);

  if (bulletPoints.length === 0) {
    console.error('No bullet points found in content');
    throw new Error('No content available');
  }

  // Select a random bullet point for this question
  const randomIndex = Math.floor(Math.random() * bulletPoints.length);
  const randomBulletPoint = bulletPoints[randomIndex];

  return await generateQuestion(randomBulletPoint, apiKey, baseURL, model);
}

export async function checkAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
  apiKey: string,
  baseURL: string,
  model: string
): Promise<boolean> {
  const messages: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a quiz grading assistant. Compare the user's answer to the correct answer and determine if it's correct.

Guidelines for grading:
- Be lenient with minor spelling errors
- Accept different phrasings that convey the same meaning
- If the answer is a person, last names are acceptable

Respond by ONLY saying "correct" or "incorrect".`
    },
    {
      role: 'user',
      content: `Question: ${question}

Correct Answer: ${correctAnswer}

User's Answer: ${userAnswer}

Is the user's answer correct?`
    }
  ];

  const openai = getOpenAI(apiKey, baseURL);
  const completion = await openai.chat.completions.create({
    model,
    messages,
    max_tokens: 200,
    temperature: 0.0,
  });
  
  console.log(completion.choices[0].message?.content?.trim() === "correct");
  return completion.choices[0].message?.content?.trim() === "correct";
}