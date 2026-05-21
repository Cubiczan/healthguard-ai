---
Task ID: 1
Agent: Main Agent
Task: Full audit of all Cubiczan repos (GitHub + Codeberg) and fix issues

Audit Results (58 GitHub repos):

=== CONFIRMED DUPLICATES TO ARCHIVE ===
1. MetaCommand → DUPLICATE of Metabocommand
   - Same package.json name "metabocommand", identical Next.js project
   - Action: Archive with redirect to Metabocommand

2. IR-pitch-engine → DUPLICATE of Investor-Relations-Pitch-Engine
   - Identical Python project (investor_relations_engine.py, veris_simulation_engine.py, etc.)
   - Investor-Relations-Pitch-Engine has extra files (.gitattributes, demo video)
   - Action: Archive IR-pitch-engine, keep Investor-Relations-Pitch-Engine

3. vellum-cashflow-optimizer → OLDER VERSION of cash-flow-optimizer
   - Both are Vellum-powered cash flow optimizers
   - cash-flow-optimizer (29 files) is more complete than vellum-cashflow-optimizer (20 files)
   - Action: Archive vellum-cashflow-optimizer, keep cash-flow-optimizer

4. metabocommand-kernel → MERGED into Metabocommand/crates/metabocommand-kernel/
   - Rust WASM computation kernels (escalation, velocity, CSV generation)
   - Successfully merged and pushed to Metabocommand on 2026-05-19
   - Action: Archive

5. minescope-kernel → MERGED into Minescope/crates/minescope-kernel/
   - Rust WASM computation kernels (prospectivity, risk, pricing)
   - Successfully merged and pushed to Minescope on 2026-05-19
   - Action: Archive

=== CONTENT FIXES APPLIED ===
6. greenverify-ai → Had wrong content (cubiczan-ml workspace member Rust crate)
   - Replaced with correct GreenVerify AI platform (ink! contracts + Python + Next.js)
   - Fixed remote from Stellar-critical-metal-traceability to greenverify-ai
   - Successfully pushed on 2026-05-19

=== NOT DUPLICATES (distinct projects) ===
- cash-flow-optimizer vs working-capital-optimizer: Different projects (WCO uses Arize Phoenix)
- Multi-agent-CFO-OS: Distinct project (Cognitive Mesh, 46 files)
- closed-loop-finance: Distinct (Claude-based finance ops)

=== CODEBERG STATUS ===
- IP blocked (429 rate limit) — cannot access API or push
- Previous session created/fixed: hedge-fund-13f-radar, Investor-Relations-Pitch-Engine,
  Stellar-critical-metal-traceability, consensus-hardening-protocol-differ
- Previous session deleted: stellar-Metal-and-mineral-traceability-and-tokenization-platform,
  Consensus-Hardening-Protocol-The-Differ, finflowrl, minescope, sec-earnings-workbench,
  critical-metals-ERP, Critical-mineral-traceability-solana

=== QUEUED OPERATIONS (rate-limited) ===
- Archive 5 repos on GitHub (API rate limit)
- Push all repos to Codeberg (IP block)
- Archive duplicates on Codeberg

Stage Summary:
- Total GitHub repos audited: 58
- Duplicates found: 5 (MetaCommand, IR-pitch-engine, vellum-cashflow-optimizer, metabocommand-kernel, minescope-kernel)
- Content fixes applied: 1 (greenverify-ai)
- Kernel merges completed: 2 (metabocommand-kernel → Metabocommand, minescope-kernel → Minescope)
- Actions blocked by rate limits: GitHub API archives (5), Codeberg push all
