import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { execSync } from "child_process";
import * as path from "path";

const PLUGIN_ROOT = path.resolve(__dirname, "..");

const COMMANDS = [
  "atlas-graph-query", "collect-nuances", "discover", "mine-data", "mine-processes"
] as const;

function toSkillPrompt(name: string, args: string): string {
  return `/skill:${name}${args ? ` ${args}` : ""}`;
}

function runProxiedHook(
  scriptName: string,
  inputData?: Record<string, unknown>
): Record<string, unknown> {
  const scriptPath = path.join(PLUGIN_ROOT, "hooks", scriptName);
  try {
    const result = execSync(`node "${scriptPath}"`, {
      input: inputData ? JSON.stringify(inputData) : undefined,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
      env: {
        ...process.env,
        PI_PLUGIN_ROOT: PLUGIN_ROOT,
        CLAUDE_PLUGIN_ROOT: PLUGIN_ROOT,
      },
    });
    return JSON.parse(result.toString("utf8").trim());
  } catch {
    return {};
  }
}

export default function activate(pi: ExtensionAPI): void {

  const forwardPrimary = async (args: unknown) => {
    pi.sendUserMessage(toSkillPrompt("atlas", String(args ?? "").trim()));
  };

  pi.registerCommand("atlas", {
    description: "Load the atlas skill",
    handler: forwardPrimary,
  });

  for (const name of COMMANDS) {
    const forward = async (args: unknown) => {
      pi.sendUserMessage(toSkillPrompt(name, String(args ?? "").trim()));
    };

    pi.registerCommand(name, {
      description: `Open the ${name} skill`,
      handler: forward,
    });

    pi.registerCommand(`atlas:${name}`, {
      description: `Alias for /${name}`,
      handler: forward,
    });
  }
}
