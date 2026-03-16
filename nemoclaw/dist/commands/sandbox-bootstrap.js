"use strict";
// SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureSandboxOpenClawSetup = ensureSandboxOpenClawSetup;
const node_child_process_1 = require("node:child_process");
function ensureSandboxOpenClawSetup(opts) {
    const { sandboxName, logger } = opts;
    try {
        (0, node_child_process_1.execFileSync)("openshell", ["sandbox", "connect", sandboxName, "--", "openclaw", "setup"], {
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "pipe"],
        });
        logger.info("Initialized OpenClaw config and workspace inside the sandbox.");
        return true;
    }
    catch (err) {
        const stderr = err &&
            typeof err === "object" &&
            "stderr" in err &&
            typeof err.stderr === "string"
            ? err.stderr.trim()
            : "";
        logger.error(`Failed to initialize OpenClaw inside the sandbox: ${stderr || String(err)}`);
        logger.info(`After resolving the issue, run 'openshell sandbox connect ${sandboxName} -- openclaw setup'.`);
        return false;
    }
}
//# sourceMappingURL=sandbox-bootstrap.js.map