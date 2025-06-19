import { useSettingStore } from "@/store/setting";
import {
  createSearchProvider,
  type SearchProviderOptions,
} from "@/utils/deep-research/search";
import { multiApiKeyPolling } from "@/utils/model";
import { generateSignature } from "@/utils/signature";

interface SearchFilters {
  allowedSites?: string[];
}

function useWebSearch() {
  async function search(query: string, filters?: SearchFilters) {
    const { mode, searchProvider, searchMaxResult, accessPassword } =
      useSettingStore.getState();
    const options: SearchProviderOptions = {
      provider: searchProvider,
      maxResult: searchMaxResult,
      query,
      filter: filters,
    };
    let constrainedQuery = query;

    // Ajouter les contraintes de site directement dans la query
    if (filters?.allowedSites && filters.allowedSites.length > 0) {
      const siteConstraints = filters.allowedSites
        .map((site) => `site:${site}`)
        .join(" OR ");
      constrainedQuery = `${query} (${siteConstraints})`;
    }

    options.query = constrainedQuery;
    console.log("Options => ", options);
    switch (searchProvider) {
      case "tavily":
        const { tavilyApiKey, tavilyApiProxy, tavilyScope } =
          useSettingStore.getState();
        if (mode === "local") {
          options.baseURL = tavilyApiProxy;
          options.apiKey = multiApiKeyPolling(tavilyApiKey);
        } else {
          options.baseURL = location.origin + "/api/search/tavily";
        }
        options.scope = tavilyScope;
        break;
      case "firecrawl":
        const { firecrawlApiKey, firecrawlApiProxy } =
          useSettingStore.getState();
        if (mode === "local") {
          options.baseURL = firecrawlApiProxy;
          options.apiKey = multiApiKeyPolling(firecrawlApiKey);
        } else {
          options.baseURL = location.origin + "/api/search/firecrawl";
        }
        break;
      case "exa":
        const { exaApiKey, exaApiProxy, exaScope } = useSettingStore.getState();
        if (mode === "local") {
          options.baseURL = exaApiProxy;
          options.apiKey = multiApiKeyPolling(exaApiKey);
        } else {
          options.baseURL = location.origin + "/api/search/exa";
        }
        options.scope = exaScope;
        break;
      case "bocha":
        const { bochaApiKey, bochaApiProxy } = useSettingStore.getState();
        if (mode === "local") {
          options.baseURL = bochaApiProxy;
          options.apiKey = multiApiKeyPolling(bochaApiKey);
        } else {
          options.baseURL = location.origin + "/api/search/bocha";
        }
        break;
      case "searxng":
        const { searxngApiProxy, searxngScope } = useSettingStore.getState();
        if (mode === "local") {
          options.baseURL = searxngApiProxy;
        } else {
          options.baseURL = location.origin + "/api/search/searxng";
        }
        options.scope = searxngScope;
        break;
    }

    if (mode === "proxy") {
      options.apiKey = generateSignature(accessPassword, Date.now());
    }
    return createSearchProvider(options);
  }

  return { search };
}

export default useWebSearch;
