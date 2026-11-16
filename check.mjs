// Connect health check: list accounts, compare with last run, print what changed.
// Usage: node check.mjs
import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { PipedreamClient } from "@pipedream/sdk";

const STATE_FILE = new URL("./state.json", import.meta.url);

const pd = new PipedreamClient({
  projectId: process.env.PIPEDREAM_PROJECT_ID,
  projectEnvironment: process.env.PIPEDREAM_PROJECT_ENVIRONMENT,
});

const statusOf = (a) => (a.dead ? "dead" : a.healthy ? "healthy" : "unhealthy");

async function loadState() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return null; // first run
    throw e;
  }
}

async function reconnectLink(externalUserId, appSlug) {
  const t = await pd.tokens.create({ externalUserId });
  return { url: `${t.connectLinkUrl}&app=${appSlug}`, expiresAt: new Date(t.expiresAt) };
}

const fmt = (d) => d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

// 1. List every account in the project.
const accounts = [];
for await (const a of await pd.accounts.list()) {
  accounts.push({
    id: a.id,
    user: a.externalId,
    app: a.app?.nameSlug,
    status: statusOf(a),
    error: a.error ?? null,
  });
}

// 2. Compare with last run.
const previous = await loadState();
const changes = [];
for (const a of accounts) {
  const before = previous?.[a.id]?.status ?? null;
  if (before !== a.status && !(before === null && a.status === "healthy")) {
    changes.push({ ...a, before });
  }
}

// 3. Report.
console.log(`Connect health check, ${fmt(new Date())} (${process.env.PIPEDREAM_PROJECT_ENVIRONMENT})`);
console.log(`${accounts.length} accounts checked.${previous ? "" : " First run: no previous state to compare with."}\n`);

// One fresh link per broken account per run, shared by both sections below.
const broken = accounts.filter((a) => a.status !== "healthy");
const links = new Map();
for (const a of broken) links.set(a.id, await reconnectLink(a.user, a.app));

const printBroken = (a) => {
  const link = links.get(a.id);
  console.log(`  error: ${a.error ?? "(none given)"}`);
  console.log(`  reconnect link (expires ${fmt(link.expiresAt)}):\n  ${link.url}`);
};

console.log("Changes");
if (changes.length === 0) {
  console.log("No changes since last run.\n");
} else {
  for (const c of changes) {
    const from = c.before ?? "new";
    console.log(`• ${c.user} / ${c.app} (${c.id}): ${from} → ${c.status}`);
    if (c.status !== "healthy") printBroken(c);
    console.log();
  }
}

console.log("Still broken");
if (broken.length === 0) {
  console.log("None. Every account is healthy.");
} else {
  for (const a of broken) {
    console.log(`• ${a.user} / ${a.app} (${a.id}): ${a.status}`);
    printBroken(a);
    console.log();
  }
}

// 4. Save state for next run (only after everything above succeeded).
const state = Object.fromEntries(accounts.map((a) => [a.id, { status: a.status, user: a.user, app: a.app }]));
await writeFile(STATE_FILE, JSON.stringify(state, null, 2) + "\n");
