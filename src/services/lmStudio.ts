export async function rephraseQuery(userInput: string, apiUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "local-model",
        messages: [
          {
            role: "system",
            content:
              "You are a search query optimizer. The user will give you a casual description of what they want to watch. Your job is to produce a short, precise YouTube search query (3-8 words). Rules:\n- Remove filler words, opinions, and vagueness.\n- Use specific, factual keywords.\n- Output ONLY the search query, nothing else. No quotes, no explanation.",
          },
          { role: "user", content: userInput },
        ],
        max_tokens: 50,
        temperature: 0.3,
      }),
    });
    clearTimeout(timeout);
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch {
    return userInput;
  }
}

export async function filterClickbait(titles: string[], apiUrl: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "local-model",
        messages: [
          {
            role: "system",
            content:
              'You are a clickbait detector. You will receive a JSON array of YouTube video titles. For each title, determine if it is clickbait. Clickbait indicators:\n- ALL CAPS words used for emphasis (e.g., "You WON\'T BELIEVE")\n- Vague teasers that withhold information (e.g., "What happens next will shock you")\n- Exaggerated superlatives (e.g., "THE BEST EVER", "INSANE", "DESTROYED")\n- Emotional manipulation (e.g., "This made me cry")\n- Misleading curiosity gaps (e.g., "Doctors don\'t want you to know this")\n- Excessive punctuation (!!!, ???)\n\nRespond ONLY with a JSON array of objects: [{"title": "...", "clickbait": true/false}]\nNo additional text, no markdown formatting.',
          },
          { role: "user", content: JSON.stringify(titles) },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });
    clearTimeout(timeout);
    const data = await res.json();
    const raw = data.choices[0].message.content.trim();
    const parsed: { title: string; clickbait: boolean }[] = JSON.parse(raw);
    return parsed.filter((item) => !item.clickbait).map((item) => item.title);
  } catch {
    return titles;
  }
}
