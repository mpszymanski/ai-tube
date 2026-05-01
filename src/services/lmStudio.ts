import { TimePeriod } from "../types";
import { log } from "./logger";

const SYSTEM_PROMPT_ANALYZE =
  'You analyze YouTube search requests. Output a JSON object with:\n- "videoQuery": a short, precise search query (3-8 words). Remove filler words and vagueness. Use specific, factual keywords.\n- "intent": one of "videos", "channel", "channel-videos":\n  - "channel": user wants to browse or find a specific channel (e.g. "show me the Fireship channel", "find MrBeast channel", "open Linus channel")\n  - "channel-videos": user wants videos from a specific channel matching a topic (e.g. "Linus Tech Tips GPU reviews", "show me veritasium videos about physics")\n  - "videos": all other searches (no specific channel mentioned, or general topic search)\n- "channelName": (optional) only if the user explicitly mentions a specific YouTube channel or creator by name.\n- "timePeriod": (optional) one of "today", "this_week", "this_month", "this_year" — only set when the user explicitly mentions a time window. Examples: "today" → "today", "this week" / "past week" → "this_week", "this month" / "past month" → "this_month", "this year" / "past year" → "this_year". Leave absent if no time window is mentioned. Do NOT set it for vague words like "latest" or "recent" alone.\n\nRespond ONLY with valid JSON. No markdown, no explanation.\n\nExamples:\nUser: "show me the fireship channel"\n{"videoQuery":"Fireship","intent":"channel","channelName":"Fireship"}\n\nUser: "linus tech tips GPU reviews"\n{"videoQuery":"GPU review benchmark","intent":"channel-videos","channelName":"Linus Tech Tips"}\n\nUser: "find the MrBeast channel"\n{"videoQuery":"MrBeast","intent":"channel","channelName":"MrBeast"}\n\nUser: "veritasium videos about black holes"\n{"videoQuery":"black holes explainer","intent":"channel-videos","channelName":"Veritasium"}\n\nUser: "latest rust programming tutorials"\n{"videoQuery":"Rust programming tutorial","intent":"videos"}\n\nUser: "best programming tutorials this week"\n{"videoQuery":"programming tutorial","intent":"videos","timePeriod":"this_week"}\n\nUser: "python videos from today"\n{"videoQuery":"Python programming","intent":"videos","timePeriod":"today"}\n\nUser: "veritasium videos this month"\n{"videoQuery":"Veritasium","intent":"channel-videos","channelName":"Veritasium","timePeriod":"this_month"}\n\nUser: "top AI news this year"\n{"videoQuery":"AI news","intent":"videos","timePeriod":"this_year"}';

const SYSTEM_PROMPT_GROUP_TOPICS =
  'You are a video content analyst. Group the given videos into distinct topics.\n' +
  'Return ONLY valid JSON (no markdown): {"groups": [{"topic": "Short Topic Name", "videoIds": ["id1", "id2"]}]}\n' +
  'Rules:\n' +
  '- Topic names: 2-5 words, specific and descriptive (e.g. "Iran Nuclear Talks", "EU Migration Crisis")\n' +
  '- Each video appears in at most one group\n' +
  '- If a filter is provided, only include groups relevant to that filter; omit unrelated videos\n' +
  '- If no filter, group all videos by topic\n' +
  '- Maximum 8 groups, minimum 1 video per group\n' +
  '- Omit videos that do not fit any clear topic';

const SYSTEM_PROMPT_CLICKBAIT =
  'You are a clickbait detector. You will receive a JSON array of YouTube video titles. For each title, determine if it is clickbait. Clickbait indicators:\n- ALL CAPS words used for emphasis (e.g., "You WON\'T BELIEVE")\n- Vague teasers that withhold information (e.g., "What happens next will shock you")\n- Exaggerated superlatives (e.g., "THE BEST EVER", "INSANE", "DESTROYED")\n- Emotional manipulation (e.g., "This made me cry")\n- Misleading curiosity gaps (e.g., "Doctors don\'t want you to know this")\n- Excessive punctuation (!!!, ???)\n\nRespond ONLY with a JSON array of objects: [{"title": "...", "clickbait": true/false}]\nNo additional text, no markdown formatting.';

const MODEL_API_URL = "http://localhost:11434";

async function callLmStudio<T>(
  systemPrompt: string,
  userContent: string,
  maxTokens: number,
  fallback: T,
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const res = await fetch(`${MODEL_API_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: "Qwen3-4B-Instruct-2507-Q8_0",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
      }),
    });
    clearTimeout(timeout);
    const data = await res.json();
    const raw = data.choices[0].message.content
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .trim();
    return JSON.parse(raw) as T;
  } catch {
    clearTimeout(timeout);
    return fallback;
  }
}

export async function analyzeQuery(
  userInput: string,
): Promise<{ videoQuery: string; intent: "videos" | "channel" | "channel-videos"; channelName?: string; timePeriod?: TimePeriod }> {
  const t0 = Date.now();
  const parsed = await callLmStudio(SYSTEM_PROMPT_ANALYZE, userInput, 2000, null);
  if (!parsed || typeof parsed !== "object") {
    log("fetch", "model_analyze", { input: userInput, intent: "videos", fallback: true, ms: Date.now() - t0 });
    return { videoQuery: userInput, intent: "videos" };
  }
  const p = parsed as Record<string, unknown>;
  const validIntents = ["videos", "channel", "channel-videos"];
  const validTimePeriods: TimePeriod[] = ["today", "this_week", "this_month", "this_year"];
  const result = {
    videoQuery: typeof p.videoQuery === "string" && p.videoQuery ? p.videoQuery : userInput,
    intent: typeof p.intent === "string" && validIntents.includes(p.intent) ? (p.intent as "videos" | "channel" | "channel-videos") : "videos",
    channelName: typeof p.channelName === "string" && p.channelName ? p.channelName : undefined,
    timePeriod: typeof p.timePeriod === "string" && validTimePeriods.includes(p.timePeriod as TimePeriod) ? (p.timePeriod as TimePeriod) : undefined,
  };
  log("fetch", "model_analyze", { input: userInput, intent: result.intent, channelName: result.channelName, ms: Date.now() - t0 });
  return result;
}

export async function groupVideosByTopic(
  videos: Array<{ videoId: string; title: string; channelTitle: string }>,
  filter: string,
): Promise<Array<{ topic: string; videoIds: string[] }>> {
  if (videos.length === 0) return [];
  const fallback = [{ topic: "Recent Videos", videoIds: videos.map((v) => v.videoId) }];
  const userContent = JSON.stringify({ videos, ...(filter ? { filter } : {}) });
  const parsed = await callLmStudio<{ groups: Array<{ topic: string; videoIds: string[] }> } | null>(
    SYSTEM_PROMPT_GROUP_TOPICS,
    userContent,
    3000,
    null,
  );
  if (!parsed || !Array.isArray(parsed.groups)) return fallback;
  const validIds = new Set(videos.map((v) => v.videoId));
  const result = parsed.groups
    .filter((g) => typeof g.topic === "string" && Array.isArray(g.videoIds))
    .map((g) => ({ topic: g.topic, videoIds: g.videoIds.filter((id) => validIds.has(id)) }))
    .filter((g) => g.videoIds.length > 0);
  return result.length > 0 ? result : fallback;
}

export async function classifyClickbait(
  titles: string[],
): Promise<{ title: string; clickbait: boolean }[]> {
  const t0 = Date.now();
  const fallback = titles.map((title) => ({ title, clickbait: false }));
  const parsed = await callLmStudio<unknown>(
    SYSTEM_PROMPT_CLICKBAIT,
    JSON.stringify(titles),
    4000,
    null,
  );
  if (!Array.isArray(parsed)) {
    log("fetch", "model_clickbait", { count: titles.length, fallback: true, ms: Date.now() - t0 });
    return fallback;
  }
  const valid = parsed.filter(
    (item): item is { title: string; clickbait: boolean } =>
      typeof item === "object" && item !== null &&
      typeof (item as Record<string, unknown>).title === "string" &&
      typeof (item as Record<string, unknown>).clickbait === "boolean",
  );
  const result = valid.length > 0 ? valid : fallback;
  log("fetch", "model_clickbait", { count: titles.length, flagged: result.filter((r) => r.clickbait).length, ms: Date.now() - t0 });
  return result;
}
