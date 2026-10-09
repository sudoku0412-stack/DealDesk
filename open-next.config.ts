import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// Serve prerendered pages (/, /privacy, /terms) straight from the build's static assets
// instead of re-rendering them with React on every request. Keeps CPU time low.
export default defineCloudflareConfig({ incrementalCache: staticAssetsIncrementalCache });
