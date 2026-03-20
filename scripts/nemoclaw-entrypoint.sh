#!/usr/bin/env bash
# SPDX-FileCopyrightText: Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#
# Root entrypoint for the NemoClaw sandbox container.  Runs nemoclaw-start
# as the sandbox user via setpriv (works under no_new_privs), then locks
# openclaw.json as root before dropping to sandbox for the interactive shell.
#
# setpriv uses direct setresuid/setresgid syscalls, not setuid bits, so it
# works even when OpenShell sets the no_new_privs flag on the container.
# Ref: https://github.com/NVIDIA/NemoClaw/issues/514

set -euo pipefail

SANDBOX_UID="$(id -u sandbox)"
SANDBOX_GID="$(id -g sandbox)"
CONFIG="/sandbox/.openclaw/openclaw.json"

as_sandbox() {
  setpriv --reuid="$SANDBOX_UID" --regid="$SANDBOX_GID" --init-groups -- "$@"
}

# ── Phase 1: Setup as sandbox user ──────────────────────────────────────
# nemoclaw-start handles config, plugins, gateway, auto-pair, etc.
# In the NEMOCLAW_CMD path it exec's the command and never returns.
as_sandbox /usr/local/bin/nemoclaw-start "$@"

# ── Phase 2: Lock gateway config as root ────────────────────────────────
# If we reach here, nemoclaw-start ran the standard (gateway) path and
# returned after starting background processes.  Wait for the gateway to
# write its auth token, then lock the config.
if [ -f "$CONFIG" ] && [ ! -L "$CONFIG" ] && [ -w "$CONFIG" ]; then
  token_found=false
  for _ in $(seq 1 30); do
    if python3 -c "
import json, sys
cfg = json.load(open('$CONFIG'))
sys.exit(0 if cfg.get('gateway',{}).get('auth',{}).get('token') else 1)
" 2>/dev/null; then
      token_found=true
      break
    fi
    sleep 1
  done

  if [ "$token_found" = "true" ]; then
    chown root:root "$CONFIG"
    chmod 444 "$CONFIG"
    echo "[security] gateway config locked: $CONFIG"
  else
    echo "[security] WARNING: gateway token not found after 30s, skipping config lock" >&2
  fi
elif [ -f "$CONFIG" ] && [ ! -w "$CONFIG" ]; then
  echo "[security] gateway config already locked: $CONFIG"
fi

# ── Phase 3: Drop to sandbox for the interactive shell ──────────────────
exec as_sandbox /bin/bash
