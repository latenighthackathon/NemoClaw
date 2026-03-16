// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { execFileSync } from "node:child_process";
import type { PluginLogger } from "../index.js";

export interface EnsureSandboxOpenClawSetupOptions {
  sandboxName: string;
  logger: PluginLogger;
}

export function ensureSandboxOpenClawSetup(
  opts: EnsureSandboxOpenClawSetupOptions,
): boolean {
  const { sandboxName, logger } = opts;

  try {
    execFileSync("openshell", ["sandbox", "connect", sandboxName, "--", "openclaw", "setup"], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    logger.info("Initialized OpenClaw config and workspace inside the sandbox.");
    return true;
  } catch (err: unknown) {
    const stderr =
      err &&
      typeof err === "object" &&
      "stderr" in err &&
      typeof (err as { stderr?: unknown }).stderr === "string"
        ? (err as { stderr: string }).stderr.trim()
        : "";
    logger.error(`Failed to initialize OpenClaw inside the sandbox: ${stderr || String(err)}`);
    logger.info(
      `After resolving the issue, run 'openshell sandbox connect ${sandboxName} -- openclaw setup'.`,
    );
    return false;
  }
}
