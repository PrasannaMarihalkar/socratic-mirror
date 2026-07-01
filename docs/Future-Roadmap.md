# Future Roadmap — Socratic Mirror

## Introduction

This roadmap consolidates the "Future Improvements" sections already scattered across `docs/AI-Design.md` §18, `docs/Database.md` §16, `docs/Prompt-Engineering.md` §20, `docs/System-Design.md` §25, and `docs/Deployment.md` §18 into a single, prioritized, checklist-driven view. Nothing in this document is a commitment or a scheduled release plan — consistent with how every source document frames its own improvements list, these are documented possibilities, organized here by rough horizon and theme rather than by date. Where an item maps directly onto a specific limitation already documented elsewhere, that source is referenced so the underlying reasoning isn't duplicated.

The horizons below (Short-Term, Medium-Term, Long-Term) are organized by **dependency and effort**, not by calendar time: short-term items are mostly self-contained, low-effort fixes to known, isolated bugs; medium-term items require new infrastructure or tooling that doesn't exist yet but don't change the system's fundamental shape; long-term items would meaningfully change the system's architecture, scale, or pedagogical model.

---

## 1. Short-Term Goals

Low-effort, high-value fixes to known, already-isolated issues — most of these are single-PR-sized changes with no new infrastructure required.

- [ ] Fix the `StatsSidebar` import casing bug (`statssidebar.jsx` → `StatsSidebar.jsx`), the confirmed case-sensitive-Linux build risk documented in `docs/Architecture.md` §3 and `docs/Deployment.md` §14
- [ ] Fix the `session_complete` field being silently dropped by the `ChatResponse` Pydantic model, the confirmed backend/frontend contract bug documented in `docs/API.md` and `docs/System-Design.md` §11
- [ ] Wire `ErrorScreen.jsx` into the component tree (currently built but never imported or rendered — `docs/Architecture.md` §3) or add a React `ErrorBoundary` that actually uses it
- [ ] Remove or guard the leftover `console.log("BACKEND RESPONSE:", result)` debugging statement in `ChatScreen.jsx` (`docs/System-Design.md` §20)
- [ ] Add bounds validation (`1 <= current_depth <= 8`) at the API boundary in `chat.py`, closing the unguarded `KeyError` path into `DEPTH_LEVELS` (`docs/Prompt-Engineering.md` §6, `docs/API.md`)
- [ ] Add the project's **first automated test file** to `backend/tests/`, targeting one of the pure, I/O-free functions (`depth_classifier.py` or `frustration_detector.py` are the cheapest starting points — `docs/Contributing.md` §11)
- [ ] Document and confirm the Supabase key type (anon vs. service role) actually in use, closing the unconfirmed-security-posture gap flagged in `docs/Database.md` §14 and `docs/Deployment.md` §13

## 2. Medium-Term Goals

Items that require new tooling, infrastructure, or process — not yet present in the repository — but don't change the system's overall architecture.

- [ ] Add a `Dockerfile` for the backend, turning the currently-undocumented hosting question into a portable artifact (`docs/Deployment.md` §18)
- [ ] Add a minimal CI/CD pipeline (e.g., GitHub Actions) that at least confirms `pip install` and `npm install && npm run build` succeed on every push (`docs/Deployment.md` §18)
- [ ] Add a SQL migration file (or adopt Supabase CLI migrations / Alembic), converting the schema from inferred-from-usage to an explicit, version-controlled artifact (`docs/Database.md` §16)
- [ ] Add a `get_session(session_id)` read function and corresponding endpoint, closing the gap where session metadata can currently only be read back at creation time (`docs/Database.md` §16)
- [ ] Wrap `save_turn()` + `update_session()` in an explicit transaction or single Supabase RPC call, removing the two-write consistency risk (`docs/Database.md` §16–§17)
- [ ] Extend `/health` to perform real dependency checks against Groq and Supabase, so a "healthy" response actually guarantees something about `/chat/probe` (`docs/System-Design.md` §21, `docs/Deployment.md` §18)
- [ ] Add application-level structured logging and a centralized aggregation target, replacing the current zero-logging baseline (`docs/System-Design.md` §20)
- [ ] Introduce authentication and per-client rate limiting at the API layer, directly addressing the system-wide exposure described in `docs/System-Design.md` §17 and §24
- [ ] Add a lightweight output-validation pass on LLM responses (rule-based scan, or a second cheap LLM call) checking that a response is actually a single, non-answering question (`docs/AI-Design.md` §18, `docs/Prompt-Engineering.md` §20)
- [ ] Make `ENVIRONMENT` actually drive behavior (CORS origin selection, log verbosity, docs visibility) instead of being read and never consulted (`docs/Deployment.md` §18)

## 3. Long-Term Vision

Items that would meaningfully change the system's architecture, scale, or pedagogical approach — genuinely open-ended, exploratory possibilities rather than scoped engineering tasks.

- [ ] Move from rule-based depth classification to a semantic, embedding- or classifier-based assessment of reasoning quality — explicitly anticipated by the code's own docstring ("v2 (planned): ML classifier trained on session data," `docs/AI-Design.md` §11, §18)
- [ ] Move from rule-based frustration detection to a fine-tuned or embedding-based emotional-state classifier, replacing the current keyword-matching approach (`docs/AI-Design.md` §10, §18)
- [ ] Introduce conversation history summarization for long sessions, bounding token cost, latency, and prompt-salience dilution as sessions grow (`docs/AI-Design.md` §17–§18, `docs/Prompt-Engineering.md` §9, §20)
- [ ] Introduce async request handling across the backend (`async def` routes, async Supabase/Groq clients), removing the synchronous-blocking concurrency ceiling described in `docs/System-Design.md` §6, §18
- [ ] Externalize prompts from source code into a versioned prompt-management system, decoupling prompt iteration from full application deployment (`docs/Prompt-Engineering.md` §20)
- [ ] Build a full automated evaluation harness for AI behavior — recorded adversarial and benign student inputs per depth level, asserting expected question shape, depth-appropriateness, and answer-avoidance (`docs/AI-Design.md` §18, `docs/Prompt-Engineering.md` §20)
- [ ] Introduce a data retention and deletion policy (including a "delete my data" capability), a meaningful privacy improvement for an education product storing free-text student input indefinitely (`docs/Database.md` §16)
- [ ] Reconsider the depth classifier's keyword-and-length heuristic as the core "reasoning quality" signal — explore whether a fundamentally different signal (e.g., a structured rubric, or peer/teacher-reviewed sessions used as training signal) produces materially better pedagogical outcomes than the current proxy

---

## 4. AI Improvements

- [ ] Replace the keyword/length-based depth classifier heuristic with a semantic reasoning-quality assessment (`docs/AI-Design.md` §11, §17)
- [ ] Replace keyword-based frustration detection with a more semantically aware classifier (`docs/AI-Design.md` §10, §17)
- [ ] Add a structured termination signal (e.g., an explicit `is_reflection_complete: true/false` flag from the model or classifier) rather than relying on a fragile substring match against the model's own free-text output (`docs/AI-Design.md` §14, §18)
- [ ] Add resilience to LLM provider failure — retries with backoff, a configured timeout, and a graceful fallback message instead of a raw 500 (`docs/AI-Design.md` §15, §18)
- [ ] Explicitly tune sampling parameters (temperature, top_p) for this specific use case rather than relying on Groq's untuned defaults (`docs/AI-Design.md` §15, §18)
- [ ] Add prompt-injection hardening — explicit instruction-hierarchy framing that delimits student input as untrusted data, rather than relying solely on the system prompt's own wording (`docs/AI-Design.md` §16, §18, `docs/Prompt-Engineering.md` §18, §20)

## 5. Educational Improvements

- [ ] Add per-depth-level few-shot examples, particularly for the more abstract levels 6–8 (Meta-Inquiry, Connections, Reflection), which currently share the same generic, depth-agnostic example pair as level 1 (`docs/Prompt-Engineering.md` §10, §16, §19)
- [ ] Dynamically select or generate the few-shot example's subject matter to match the student's actual chosen topic, rather than always referencing photosynthesis regardless of context (`docs/Prompt-Engineering.md` §15, §19, §20)
- [ ] Add a Kannada-language few-shot example, giving the model an in-language demonstration of the answer/non-answer boundary instead of asking it to transfer a pattern learned from an English example (`docs/Prompt-Engineering.md` §12, §19, §20)
- [ ] Explore session history/resume as a learning aid — `GET /session/{id}/turns` already returns everything needed to reconstruct a session, but no frontend surface uses it today (`docs/API.md`, `docs/Architecture.md` §10)
- [ ] Investigate whether the eight fixed depth levels should adapt per-topic (e.g., a "Viewpoints" question for a historical topic vs. a scientific one may need different framing) rather than using one universal instruction set

## 6. Backend Improvements

- [ ] Add `try/except` error handling to route handlers, replacing the current uniform "everything becomes a raw 500" behavior with structured, distinguishable error responses (`docs/Architecture.md` §4, §11, `docs/API.md`)
- [ ] Add a `response_model=` to every route, not just `POST /api/v1/chat/probe`, so every endpoint's output shape is contractually enforced rather than an unstructured dict (`docs/API.md`'s Cross-Endpoint Observations)
- [ ] Add proper "not found" handling for `session_id`-based endpoints (`/session/{id}/end`, `/session/{id}/turns`) instead of silently succeeding or returning empty results for a non-existent session (`docs/API.md`)
- [ ] Wire the frontend to actually use `POST /session/{id}/end` and `GET /session/{id}/turns`, the two fully-implemented but currently-unused endpoints (`docs/Architecture.md` §4, §9)
- [ ] Introduce async request handling to remove the synchronous-blocking concurrency ceiling (`docs/System-Design.md` §6, §18 — also listed under Long-Term Vision given its architectural scope)

## 7. Frontend Improvements

- [ ] Standardize component filename casing to PascalCase across the board, fixing the two existing offenders (`statssidebar.jsx`, `errorscreen.jsx`) per `docs/Contributing.md` §6
- [ ] Wire in `ErrorScreen.jsx` via a React `ErrorBoundary`, closing the "blank white screen on render crash" gap documented in `docs/Architecture.md` §11
- [ ] Add session persistence (e.g., `localStorage`, or URL-based recovery using the existing `GET /session/{id}/turns` endpoint) so a page refresh doesn't lose the entire conversation and depth progress (`docs/Architecture.md` §10)
- [ ] Extract `DEPTH_LABELS`/`DEPTH_COLORS` into a single shared constants file instead of duplicating them across `ChatScreen.jsx` and `statssidebar.jsx` (`docs/Contributing.md` §6)
- [ ] Differentiate error states in the UI (LLM failure vs. database failure vs. network failure) instead of the current single generic "Something went wrong" message for every failure mode (`docs/Architecture.md` §11)
- [ ] Either remove the unused `react-router-dom` dependency or adopt real routing instead of the current `screen` string toggle in Zustand (`docs/Architecture.md` §3)

## 8. Database Improvements

- [ ] Add an actual SQL migration file (or adopt a migration tool), resolving the majority of "unconfirmed" schema markers throughout `docs/Database.md` (`docs/Database.md` §16)
- [ ] Add a `get_session(session_id)` read function, independent of the creation-time response (`docs/Database.md` §16)
- [ ] Wrap `save_turn()` + `update_session()` in a transaction or single RPC call to eliminate the inconsistency risk between the two writes (`docs/Database.md` §16–§17)
- [ ] Add `created_at` to the `turns` table and ensure the application actually reads/uses it, enabling latency and usage-pattern analysis currently impossible without it (`docs/Database.md` §16)
- [ ] Define and enforce explicit `CHECK` constraints for `depth_level` (1–8) and `frustration_score` (0.0–1.0) at the database level, rather than relying solely on application code (`docs/Database.md` §16)
- [ ] Add explicit indexes (`session_id` on `turns`, at minimum) as part of a migration file (`docs/Database.md` §16)
- [ ] Introduce a data retention policy and deletion capability, including a user-facing "delete my data" path (`docs/Database.md` §16)

## 9. Performance Improvements

- [ ] Bound or summarize `conversation_history` before it reaches the model on long sessions, addressing both the cost/latency growth and the prompt-salience dilution effect (`docs/AI-Design.md` §17–§18, `docs/Prompt-Engineering.md` §9, §20, `docs/System-Design.md` §19)
- [ ] Parallelize or combine the two sequential Supabase writes per turn (`save_turn()` and `update_session()`) into a single round-trip where consistency requirements allow (`docs/Database.md` §17, `docs/System-Design.md` §19)
- [ ] Move to async request handling and a worker pool sized for actual concurrent load, once load is measured rather than assumed (`docs/System-Design.md` §18–§19)
- [ ] Establish baseline latency/cost measurements for the single Groq call per turn — the system's dominant cost, currently unmeasured anywhere in the codebase (`docs/System-Design.md` §19)

## 10. Security Improvements

- [ ] Introduce authentication and per-client rate limiting, closing the system-wide "anyone can call any endpoint" exposure (`docs/System-Design.md` §17, §24, `docs/API.md`'s per-endpoint Security Notes)
- [ ] Add a per-session or per-client cost budget specifically on `POST /api/v1/chat/probe`, the only billable endpoint, to bound runaway Groq cost exposure (`docs/API.md`, `docs/System-Design.md` §25)
- [ ] Add ownership/authorization checks to `session_id`-scoped endpoints so a client can't end or read another student's session by guessing or obtaining its ID (`docs/API.md`'s Security Notes for `/session/{id}/end` and `/session/{id}/turns`)
- [ ] Confirm and document Row Level Security (RLS) policy status and Supabase key type (anon vs. service role) (`docs/Database.md` §14, §16, `docs/Deployment.md` §13)
- [ ] Add input length limits on `student_message`, `topic`, and other free-text fields at the API boundary, currently unconstrained beyond basic Pydantic type checking (`docs/API.md`, `docs/Database.md` §14)
- [ ] Harden against prompt injection via explicit instruction-hierarchy delimiting of user input (`docs/Prompt-Engineering.md` §18, §20)

## 11. Deployment Improvements

- [ ] Add a `Dockerfile` for the backend (`docs/Deployment.md` §18)
- [ ] Add a CI/CD pipeline that builds and validates both backend and frontend on every push (`docs/Deployment.md` §18)
- [ ] Make `ENVIRONMENT` functional — drive CORS origin selection, log verbosity, and docs visibility from it instead of leaving it unread (`docs/Deployment.md` §12, §18)
- [ ] Move CORS origin configuration out of hardcoded Python into environment variables, removing the need to edit and redeploy `main.py` for every new frontend origin (`docs/Deployment.md` §18)
- [ ] Extend `/health` to verify Groq and Supabase reachability as part of deployment readiness checks (`docs/Deployment.md` §16, §18)
- [ ] Explicitly enable and document Supabase's backup/point-in-time-recovery configuration as a deployment checklist item, rather than leaving backup coverage unconfirmed (`docs/Deployment.md` §17–§18)

## 12. Research Ideas

These are open, exploratory questions rather than scoped engineering tasks — included here because they follow naturally from the system's current design but require investigation, not just implementation.

- [ ] Does the current 15-word-plus-reasoning-connector heuristic for depth advancement actually correlate with genuine reasoning quality, or is it primarily gameable padding detection? (`docs/AI-Design.md` §11, §17)
- [ ] Would a small, purpose-trained classifier for depth/frustration outperform the current keyword-based heuristics meaningfully enough to justify the added training/maintenance cost, given the project's cost-conscious origins? (`docs/AI-Design.md` §18)
- [ ] How does question quality at the more abstract depth levels (6–8) actually compare to the more concrete levels (1–3) in practice, given the current depth-agnostic few-shot example? Would per-level evaluation reveal a real quality gap? (`docs/Prompt-Engineering.md` §10, §19)
- [ ] What is the actual relationship between a student's measured "thinking quality" (the frontend's `maxDepthReached / 8` percentage, `docs/Architecture.md` §3) and genuine learning outcomes — is depth progression a valid proxy for understanding, or just a proxy for verbosity and persistence?
- [ ] Could the Kannada-language mode be extended to other Indian languages with minimal additional engineering, given the existing pattern (a single conditional directive plus Kannada-specific phrase lists for frustration/regression detection, `docs/AI-Design.md` §10, `docs/Prompt-Engineering.md` §12), or does each additional language require meaningfully more than a copy-paste of that pattern?
- [ ] Is there a meaningful pedagogical difference between the current fixed eight-level sequence and a non-linear, topic-adaptive depth structure — and would the added complexity be worth it relative to the project's stated preference for a simple, legible structure (`docs/AI-Design.md` §3.2)?
