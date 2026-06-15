import OpenAI from 'openai';
import type { AIRecommendation } from './types';

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'placeholder',
  });
}

export async function moderateContent(
  title: string,
  description: string,
  bannedWords: string[]
): Promise<AIRecommendation> {
  const flags: string[] = [];
  const reasons: string[] = [];
  const content = `${title} ${description}`.toLowerCase();

  for (const word of bannedWords) {
    if (content.includes(word.toLowerCase())) {
      flags.push('banned_word');
      reasons.push(`Përmban fjalë të ndaluar: "${word}"`);
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      approved: flags.length === 0,
      confidence: 0.5,
      reasons: flags.length > 0 ? reasons : ['Moderimi automatik i padisponueshëm - kërkon rishikim manual'],
      flags,
      duplicate_check: false,
    };
  }

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a content moderation AI for a citizen reporting platform in Kosovo (Albanian language).
Analyze the report and determine if it should be approved. Check for:
- Spam
- Offensive language
- Hate speech
- False accusations without evidence
- Duplicate or low-quality content

Respond in JSON format:
{
  "approved": boolean,
  "confidence": number (0-1),
  "reasons": string[],
  "flags": string[] (possible: spam, offensive, hate_speech, false_accusation, low_quality)
}`,
        },
        {
          role: 'user',
          content: `Title: ${title}\nDescription: ${description}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      approved: result.approved && flags.length === 0,
      confidence: result.confidence || 0.5,
      reasons: [...reasons, ...(result.reasons || [])],
      flags: [...flags, ...(result.flags || [])],
      duplicate_check: false,
    };
  } catch {
    return {
      approved: flags.length === 0,
      confidence: 0.5,
      reasons: flags.length > 0 ? reasons : ['Moderimi automatik i padisponueshëm - kërkon rishikim manual'],
      flags,
      duplicate_check: false,
    };
  }
}

export async function moderateComment(content: string, bannedWords: string[]): Promise<{
  approved: boolean;
  flags: string[];
}> {
  const flags: string[] = [];
  const lowerContent = content.toLowerCase();

  for (const word of bannedWords) {
    if (lowerContent.includes(word.toLowerCase())) {
      flags.push('banned_word');
    }
  }

  if (flags.length > 0) {
    return { approved: false, flags };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { approved: true, flags };
  }

  try {
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Moderate this comment for spam, offensive language, or hate speech. Respond JSON: {"approved": boolean, "flags": string[]}',
        },
        { role: 'user', content },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      approved: result.approved ?? true,
      flags: [...flags, ...(result.flags || [])],
    };
  } catch {
    return { approved: flags.length === 0, flags };
  }
}
