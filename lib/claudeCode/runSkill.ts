import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// Bridge from the Next.js server runtime to a headless Claude Code invocation of one of
// this repo's .claude/skills/* skills. The skill does the real work (WebSearch/WebFetch,
// reasoning, and DB writes via scripts/db-cli.ts) and hands back one JSON result
// conforming to `jsonSchema`, which the caller maps into its existing return type. Tool
// access is scoped per-call via allowedTools — never a blanket
// --dangerously-skip-permissions — since this runs unattended from a server action.

const PROJECT_ROOT = process.cwd();

// child_process.spawn resolves the executable purely via process.env.PATH, which isn't
// guaranteed to include ~/.local/bin (e.g. non-login shells, IDE task runners). Resolve
// an absolute path once so headless invocation doesn't depend on how the server was launched.
function resolveClaudeBin(): string {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  const candidates = [
    path.join(os.homedir(), ".local/bin/claude"),
    "/usr/local/bin/claude",
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return "claude"; // fall back to PATH lookup
}

const CLAUDE_BIN = resolveClaudeBin();

export interface RunSkillOptions {
  /** Name of the skill under .claude/skills/, invoked as /<skill> <prompt>. */
  skill: string;
  /** Task-specific instructions/context appended after the skill invocation. */
  prompt: string;
  /** JSON Schema the final structured result must conform to. */
  jsonSchema: object;
  /** Tool patterns to allow, e.g. ["Bash(npx tsx scripts/db-cli.ts:*)", "WebSearch"]. Empty = no tools. */
  allowedTools: string[];
  timeoutMs: number;
}

interface ClaudeResultEnvelope {
  is_error: boolean;
  subtype: string;
  result?: string;
  structured_output?: unknown;
  api_error_status?: string | null;
}

export async function runSkill<T>(opts: RunSkillOptions): Promise<T> {
  const args = [
    "-p",
    `/${opts.skill} ${opts.prompt}`,
    "--output-format",
    "json",
    "--json-schema",
    JSON.stringify(opts.jsonSchema),
    "--allowedTools",
    opts.allowedTools.join(" "),
    "--disallowedTools",
    "Edit Write NotebookEdit",
    "--no-session-persistence",
    "--strict-mcp-config",
    "--permission-mode",
    "dontAsk",
  ];

  const { stdout, stderr, exitCode } = await spawnWithTimeout(args, opts.timeoutMs);

  if (exitCode !== 0) {
    throw new Error(
      `claude -p /${opts.skill} exited ${exitCode}: ${(stderr || stdout).slice(0, 500)}`
    );
  }

  let envelope: ClaudeResultEnvelope;
  try {
    envelope = JSON.parse(stdout);
  } catch {
    throw new Error(`claude -p /${opts.skill} returned unparseable output: ${stdout.slice(0, 500)}`);
  }

  if (envelope.is_error || envelope.subtype !== "success") {
    throw new Error(`claude -p /${opts.skill} failed: ${(envelope.result ?? stdout).slice(0, 500)}`);
  }

  if (envelope.structured_output !== undefined) {
    return envelope.structured_output as T;
  }
  if (typeof envelope.result === "string") {
    try {
      return JSON.parse(envelope.result) as T;
    } catch {
      throw new Error(`claude -p /${opts.skill} result wasn't valid JSON: ${envelope.result.slice(0, 500)}`);
    }
  }

  throw new Error(`claude -p /${opts.skill} returned no result`);
}

function spawnWithTimeout(
  args: string[],
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(CLAUDE_BIN, args, { cwd: PROJECT_ROOT });
    child.stdin.end();

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const killTimer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000);
    }, timeoutMs);

    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));

    child.on("error", (err) => {
      clearTimeout(killTimer);
      reject(err);
    });

    child.on("close", (exitCode) => {
      clearTimeout(killTimer);
      if (timedOut) {
        console.error(
          `claude -p timed out after ${timeoutMs}ms. stdout: ${stdout.slice(-500)} stderr: ${stderr.slice(-500)}`
        );
        reject(new Error(`claude -p timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({ stdout, stderr, exitCode });
    });
  });
}
