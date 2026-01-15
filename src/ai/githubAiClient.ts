// src/ai/githubAiClient.ts

export async function callGitHubAI(prompt: string) {
  const token = import.meta.env.VITE_GITHUB_TOKEN;

  if (!token) {
    throw new Error('Missing VITE_GITHUB_TOKEN');
  }

  const res = await fetch(
    'https://models.github.ai/inference/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  const data = await res.json();

  return data.choices?.[0]?.message?.content;
}
