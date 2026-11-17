// Test call: one read-only request per GitHub account, through the Connect proxy,
// next to what Pipedream's health flag says. Writes nothing (no state, no links).
// Usage: node probe.mjs
import "dotenv/config";
import { PipedreamClient } from "@pipedream/sdk";

// Read-only endpoint per app. Only GitHub for now.
const TEST_URL = { github: "https://api.github.com/user" };

const pd = new PipedreamClient({
  projectId: process.env.PIPEDREAM_PROJECT_ID,
  projectEnvironment: process.env.PIPEDREAM_PROJECT_ENVIRONMENT,
});

const statusOf = (a) => (a.dead ? "dead" : a.healthy ? "healthy" : "unhealthy");

for await (const a of await pd.accounts.list()) {
  const app = a.app?.nameSlug;
  const url = TEST_URL[app];
  if (!url) continue;

  const started = Date.now();
  let result;
  try {
    const res = await pd.proxy.get({ url, externalUserId: a.externalId, accountId: a.id });
    result = `200 OK, signed in as ${res?.login ?? "?"}`;
  } catch (e) {
    const msg = e.body?.message ?? e.message;
    result = `${e.statusCode ?? "error"} ${msg}`;
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  console.log(`• ${a.externalId} / ${app} (${a.id})`);
  console.log(`  Pipedream says: ${statusOf(a)}, error: ${a.error ?? "(none given)"}`);
  console.log(`  GitHub says:    ${result}  (GET ${new URL(url).pathname}, ${secs}s)\n`);
}
