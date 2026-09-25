const DEFAULT_ENDPOINT = 'https://api.openai.com/v1';

export const requestStructuredAdvice = async ({ system, input }) => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey === 'your_ai_api_key_here') return null;

  const endpoint = (process.env.AI_BASE_URL || DEFAULT_ENDPOINT).replace(/\/$/, '');
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify(input) },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`AI provider returned status ${response.status}.`);

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.length > 12000) throw new Error('AI provider response was invalid.');
  return JSON.parse(content);
};
