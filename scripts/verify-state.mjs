#!/usr/bin/env node
/**
 * verify-state.mjs — Sovereign Mission Control Live State Verifier
 *
 * PURPOSE
 * -------
 * Mirrors the Sentinel Bot's `scripts/verify-state.ts`. Regenerates
 * `LIVE_STATE.md` in the Mission Control repo root from the actual source
 * files. The source files are the truth — the master reference is prose
 * that rots.
 *
 * USAGE
 * -----
 *   npm run verify-state
 *   node scripts/verify-state.mjs
 *
 * PROTOCOL
 * --------
 * Every session touching Mission Control MUST run this at session start
 * before trusting any "current state" claim in MISSION-CONTROL-MASTER-REFERENCE.md.
 * If `LIVE_STATE.md` is older than 24h, regenerate. If the master reference
 * contradicts `LIVE_STATE.md`, **`LIVE_STATE.md` wins**. Patch the master
 * reference before continuing work.
 *
 * WHAT IT INSPECTS
 * ----------------
 * 1. Git state (commit SHA, branch, dirty/clean)
 * 2. Package metadata (Next.js version, React version)
 * 3. App Router pages (which routes actually exist under src/app)
 * 4. Supabase client configuration (src/lib/supabase.ts)
 * 5. Critical Vercel env var presence (NEVER leak values)
 *
 * NOT DOES
 * --------
 * - Does NOT call any APIs
 * - Does NOT read actual env var values — only SET / UNSET
 * - Does NOT interpret source — it quotes verbatim
 *
 * WHY STATIC
 * ----------
 * A regex cannot lie about what it found. A prose section can. When the
 * two disagree, the regex wins.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..");
const OUTPUT_PATH = path.join(REPO_ROOT, "LIVE_STATE.md");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function safeRead(relPath) {
  const abs = path.join(REPO_ROOT, relPath);
  try {
    return fs.readFileSync(abs, "utf-8");
  } catch {
    return null;
  }
}

function safeExec(cmd) {
  try {
    return execSync(cmd, { cwd: REPO_ROOT, encoding: "utf-8" }).trim();
  } catch (err) {
    return `ERROR: ${String(err?.message ?? "unknown").slice(0, 120)}`;
  }
}

function envStatus(name) {
  const v = process.env[name];
  if (v === undefined) return "UNSET";
  if (v === "") return "EMPTY";
  if (/KEY|TOKEN|SECRET|PASSWORD|COOKIE/i.test(name)) return "SET (redacted)";
  if (/^(true|false|0|1)$/i.test(v)) return `SET = ${v}`;
  return `SET (${v.length} chars)`;
}

function header(title) {
  return `\n## ${title}\n`;
}

function codeBlock(lang, body) {
  return "```" + lang + "\n" + body + "\n```\n";
}

/**
 * Walk src/app and list every page.tsx / route.ts — the real App Router
 * surface. Prose about "these pages exist" can rot; fs.readdirSync cannot.
 */
function walkPages(dir, prefix = "") {
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...walkPages(full, rel));
    } else if (/^(page|route|layout)\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Inspectors
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function inspectGit() {
  const sha = safeExec("git rev-parse HEAD");
  const branch = safeExec("git rev-parse --abbrev-ref HEAD");
  const dirtyRaw = safeExec("git status --porcelain");
  const dirty = dirtyRaw.length > 0 ? `DIRTY (${dirtyRaw.split("\n").length} files)` : "CLEAN";
  const lastCommit = safeExec('git log -1 --pretty=format:"%h %s (%cr)"');

  return (
    header("Git State") +
    `- **Branch:** \`${branch}\`\n` +
    `- **HEAD:** \`${sha}\`\n` +
    `- **Working tree:** ${dirty}\n` +
    `- **Last commit:** ${lastCommit}\n`
  );
}

function inspectPackage() {
  const raw = safeRead("package.json");
  if (!raw) return header("Package") + `⚠️ package.json not found.\n`;
  try {
    const pkg = JSON.parse(raw);
    return (
      header("Package") +
      `- **Name:** \`${pkg.name}\`\n` +
      `- **Version:** \`${pkg.version}\`\n` +
      `- **Next.js:** \`${pkg.dependencies?.next ?? "(not found)"}\`\n` +
      `- **React:** \`${pkg.dependencies?.react ?? "(not found)"}\`\n` +
      `- **@supabase/supabase-js:** \`${pkg.dependencies?.["@supabase/supabase-js"] ?? "(not found)"}\`\n`
    );
  } catch {
    return header("Package") + `⚠️ Could not parse package.json.\n`;
  }
}

function inspectAppRouter() {
  const appDir = path.join(REPO_ROOT, "src", "app");
  const entries = walkPages(appDir);
  if (entries.length === 0) {
    return header("App Router Surface") + `⚠️ No pages found under \`src/app\`.\n`;
  }

  const pages = entries.filter((e) => /page\.(tsx|ts|jsx|js)$/.test(e)).sort();
  const routes = entries.filter((e) => /route\.(tsx|ts|jsx|js)$/.test(e)).sort();

  let out = header("App Router Surface — src/app (verbatim filesystem walk)");
  out += `**${pages.length} page(s), ${routes.length} route handler(s)**\n\n`;
  out += `### Pages\n`;
  for (const p of pages) {
    const route = "/" + p.replace(/\/page\.(tsx|ts|jsx|js)$/, "").replace(/^\/?/, "");
    out += `- \`${route === "/" ? "/" : route}\` → \`src/app/${p}\`\n`;
  }
  if (routes.length > 0) {
    out += `\n### Route Handlers\n`;
    for (const r of routes) {
      out += `- \`src/app/${r}\`\n`;
    }
  }
  return out;
}

function inspectSupabaseClient() {
  const src = safeRead("src/lib/supabase.ts");
  if (!src) {
    return header("Supabase Client") + `⚠️ \`src/lib/supabase.ts\` not found.\n`;
  }

  const urlEnv = envStatus("NEXT_PUBLIC_SUPABASE_URL");
  const anonEnv = envStatus("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceEnv = envStatus("SUPABASE_SERVICE_ROLE_KEY");

  let out = header("Supabase Client — src/lib/supabase.ts");
  out += `### Environment\n`;
  out += `- \`NEXT_PUBLIC_SUPABASE_URL\`: ${urlEnv}\n`;
  out += `- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`: ${anonEnv}\n`;
  out += `- \`SUPABASE_SERVICE_ROLE_KEY\`: ${serviceEnv}\n\n`;
  out += `### Source (verbatim)\n`;
  out += codeBlock("typescript", src.trim());
  return out;
}

function inspectCriticalEnvVars() {
  const groups = {
    "Supabase (client)": ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    "Supabase (server)": ["SUPABASE_SERVICE_ROLE_KEY"],
    "Resend (nurture emails)": ["RESEND_API_KEY"],
    "Stripe (webhooks)": ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    "Bot ↔ MC bridge": ["MC_WEBHOOK_URL", "WEBHOOK_SHARED_SECRET"],
  };

  let out = header("Critical Environment Variables (presence only)");
  out += `> Only SET / UNSET status is shown. Secret values are never printed.\n\n`;
  for (const [group, names] of Object.entries(groups)) {
    out += `**${group}**\n`;
    for (const name of names) {
      out += `- \`${name}\`: ${envStatus(name)}\n`;
    }
    out += "\n";
  }
  return out;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function main() {
  // Optional dotenv — harmless if not installed
  try {
    const dotenv = await import("dotenv");
    dotenv.config({ path: path.join(REPO_ROOT, ".env.local") });
    dotenv.config({ path: path.join(REPO_ROOT, ".env") });
  } catch {
    // dotenv optional — in Vercel prod, env vars come from the platform
  }

  const timestamp = new Date().toISOString();

  let md = "";
  md += "# LIVE_STATE.md — Sovereign Mission Control\n\n";
  md += "> **⚡ AUTO-GENERATED.** Do not edit by hand. Run `npm run verify-state` to regenerate.\n";
  md += "> This file is the single source of truth for current runtime state. If\n";
  md += "> `MISSION-CONTROL-MASTER-REFERENCE.md` contradicts this file, **this file wins** —\n";
  md += "> the master reference holds invariants and history, not live values.\n\n";
  md += `**Last verified:** \`${timestamp}\`\n`;
  md += `**Generator:** \`scripts/verify-state.mjs\`\n`;

  md += inspectGit();
  md += inspectPackage();
  md += inspectAppRouter();
  md += inspectSupabaseClient();
  md += inspectCriticalEnvVars();

  md += "\n---\n\n";
  md += "## Session-Start Cross-Check Protocol\n\n";
  md += "Every session touching Mission Control must run this check before trusting any\n";
  md += "\"current state\" claim in the master reference:\n\n";
  md += "1. Read `MISSION-CONTROL-MASTER-REFERENCE.md` (invariants + history)\n";
  md += "2. Read this file (`LIVE_STATE.md`)\n";
  md += "3. If this file is older than 24h → run `npm run verify-state` first\n";
  md += "4. If the master reference contradicts this file → **this file wins**\n";
  md += "5. Flag the contradiction and patch the master reference before continuing work\n\n";
  md += "This protocol exists because session-authored references rot, and code does not.\n\n";
  md += "### Sentinel Bot cross-check\n";
  md += "For TTS routing, LLM teams, and Railway env vars, the authoritative source is\n";
  md += "`C:\\Users\\richi\\Sovereign-Sentinel-Bot\\LIVE_STATE.md` (generated by the Sentinel Bot's\n";
  md += "own `scripts/verify-state.ts`). Do not infer Sentinel Bot runtime state from this file.\n";

  fs.writeFileSync(OUTPUT_PATH, md, "utf-8");
  console.log(`✅ LIVE_STATE.md regenerated at ${OUTPUT_PATH}`);
  console.log(`   ${md.split("\n").length} lines written.`);
}

// Top-level await workaround — wrap main in an async IIFE
(async () => {
  await main();
})().catch((err) => {
  console.error("verify-state failed:", err);
  process.exit(1);
});
