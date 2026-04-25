import { hydrate as hydrateConfig } from "./config";
import { hydrate as hydrateWatchTime } from "./watchTime";
import { hydrate as hydrateSubscriptions } from "./subscriptions";
import { hydrate as hydrateApiUsage } from "./apiUsage";
import { hydrate as hydrateSearchHistory } from "./searchHistory";

export async function bootstrapStorage(): Promise<void> {
  await Promise.all([
    hydrateConfig(),
    hydrateWatchTime(),
    hydrateSubscriptions(),
    hydrateApiUsage(),
    hydrateSearchHistory(),
  ]);
}
