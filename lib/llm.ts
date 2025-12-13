import { pipeline, env } from '@huggingface/transformers';

// Disable local model cache for development
env.allowLocalModels = false;
env.useBrowserCache = false;

const generator = await pipeline(
  'text-generation',
  'onnx-community/Qwen2.5-0.5B-Instruct',
  {
    dtype: 'q4'
  }
);

export async function generateQuestion(bulletPoint: string, topicTitle: string): Promise<{
  question: string;
  answer: string;
}> {
  // Generate both question and answer in a single prompt
  const messages = [
    {
      role: 'system', content: `You are an expert quiz bowl question writer who writes long, detailed questions with 4-8 sentences.`
    },
    {
      role: 'user', content: `Context:

Here is an example of the correct format and length:
EXAMPLE QUESTION (8 sentences - THIS IS THE CORRECT LENGTH):
QUESTION: This mythological woman mothered a child with a man who was later killed using a lance tipped with stingray poison by that child. This person advised her lover to sail to the underworld to meet the ghost of the blind seer Tiresias. Telegonus was a son of this resident of the island Aeaea, whose magic was countered by the herb moly. The members of Odysseus's crew were turned into swine by what sorceress? She was the daughter of Helios. Her island home was known for its dangerous magic. Many sailors feared passing near her shores. For ten points, name this enchantress from Greek mythology.
ANSWER: Circe

Now write a question EXACTLY that long (4-8 sentences) about ${topicTitle}.

Context:
${bulletPoint}

Write one long quiz bowl question (4-8 sentences) that starts with obscure clues and ends with an obvious giveaway.

Make sure the answer is not directly mentioned anywhere in the question.

The answer must be ONLY the name - no explanation, no description.

Format:
QUESTION: [question]
ANSWER: [answer]`
    },
  ];

  const result = await generator(messages, {
    max_new_tokens: 500,
    do_sample: true,
    temperature: 0.7,
    top_p: 0.9,
    top_k: 50,
    repetition_penalty: 1.2,
    no_repeat_ngram_size: 3,
  });

  const generatedText = result[0].generated_text[2].content.trim();
  console.log(generatedText);

  // Parse newline-separated format
  const lines = generatedText.split('\n');
  const question = lines[0]?.trim();
  const answer = lines[2]?.trim();

  return {
    question,
    answer,
  };
}

export async function generateSingleQuestion(
  topicContent: string,
  topicTitle: string
): Promise<{ question: string; answer: string }> {
  // Split content by double newlines to get individual bullet points
  const bulletPoints = topicContent.split('\n\n').filter(point => point.trim().length > 0);

  if (bulletPoints.length === 0) {
    console.error('No bullet points found in content');
    throw new Error('No content available');
  }

  // Select a random bullet point for this question
  const randomIndex = Math.floor(Math.random() * bulletPoints.length);
  const randomBulletPoint = bulletPoints[randomIndex];
  // console.log(randomBulletPoint);

  return await generateQuestion(randomBulletPoint, topicTitle);
}
