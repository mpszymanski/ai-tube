export async function analyzeQuery(
  userInput: string,
  apiUrl: string,
): Promise<{ videoQuery: string; intent: "videos" | "channel" | "channel-videos"; channelName?: string }> {
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
              'You analyze YouTube search requests. Output a JSON object with:\n- "videoQuery": a short, precise search query (3-8 words). Remove filler words and vagueness. Use specific, factual keywords.\n- "intent": one of "videos", "channel", "channel-videos":\n  - "channel": user wants to browse or find a specific channel (e.g. "show me the Fireship channel", "find MrBeast channel", "open Linus channel")\n  - "channel-videos": user wants videos from a specific channel matching a topic (e.g. "Linus Tech Tips GPU reviews", "show me veritasium videos about physics")\n  - "videos": all other searches (no specific channel mentioned, or general topic search)\n- "channelName": (optional) only if the user explicitly mentions a specific YouTube channel or creator by name.\n\nRespond ONLY with valid JSON. No markdown, no explanation.\n\nExamples:\nUser: "show me the fireship channel"\n{"videoQuery":"Fireship","intent":"channel","channelName":"Fireship"}\n\nUser: "linus tech tips GPU reviews"\n{"videoQuery":"GPU review benchmark","intent":"channel-videos","channelName":"Linus Tech Tips"}\n\nUser: "find the MrBeast channel"\n{"videoQuery":"MrBeast","intent":"channel","channelName":"MrBeast"}\n\nUser: "veritasium videos about black holes"\n{"videoQuery":"black holes explainer","intent":"channel-videos","channelName":"Veritasium"}\n\nUser: "latest rust programming tutorials"\n{"videoQuery":"Rust programming tutorial","intent":"videos"}',
          },
          { role: "user", content: userInput },
        ],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });
    clearTimeout(timeout);
    const data = await res.json();
    const raw = data.choices[0].message.content.trim();
    const parsed = JSON.parse(raw);
    const validIntents = ["videos", "channel", "channel-videos"];
    return {
      videoQuery:
        typeof parsed.videoQuery === "string" && parsed.videoQuery
          ? parsed.videoQuery
          : userInput,
      intent:
        typeof parsed.intent === "string" && validIntents.includes(parsed.intent)
          ? parsed.intent
          : "videos",
      channelName:
        typeof parsed.channelName === "string" && parsed.channelName
          ? parsed.channelName
          : undefined,
    };
  } catch {
    return { videoQuery: userInput, intent: "videos" };
  }
}

export async function filterClickbait(titles: string[], apiUrl: string): Promise<string[]> {
  const classified = await classifyClickbait(titles, apiUrl);
  return classified.filter((item) => !item.clickbait).map((item) => item.title);
}

export async function classifyClickbait(
  titles: string[],
  apiUrl: string,
): Promise<{ title: string; clickbait: boolean }[]> {
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
    return parsed;
  } catch {
    return titles.map((title) => ({ title, clickbait: false }));
  }
}
