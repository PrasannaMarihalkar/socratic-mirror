# Contributing to Socratic Mirror

## 1. Welcome

Thank you for considering a contribution to Socratic Mirror. This is a small, intentionally simple codebase — a single FastAPI backend, a single React frontend, and one prompt-engineered AI layer that constitutes the product's entire intellectual contribution (`docs/Prompt-Engineering.md` §1). That smallness is a feature, not a limitation: as `docs/Architecture.md`'s closing summary puts it, the system is "small enough to hold in your head completely," and this document exists to help keep it that way as more people contribute to it.

This guide assumes you've already read, or will shortly read, `docs/Architecture.md` and `docs/System-Design.md` for the system's overall shape, plus whichever layer-specific document (`docs/AI-Design.md`, `docs/API.md`, `docs/Database.md`, `docs/Prompt-Engineering.md`) is relevant to the area you're working in. This document does not re-explain how the system works — it explains how to work *on* it well.

## 2. Project Philosophy

Every prior document in this set has, in its own way, described the same underlying value: **honesty about what the system actually does, including its gaps, is more valuable than presenting an idealized version of it.** `docs/Architecture.md` states this explicitly in its Scope section — gaps are "called out explicitly rather than omitted, because a new engineer needs an accurate map, not an aspirational one." Contributors are expected to carry that same value into code, commit messages, and pull requests: a known limitation, a deliberate simplification, or an unresolved edge case should be stated plainly, not hidden behind confident-sounding code or documentation.

A second, related value runs throughout the codebase and should guide contribution decisions: **minimal infrastructure over architectural sophistication.** There is no ORM, no dependency injection framework, no microservice split, no message queue (`docs/System-Design.md` §3). This is a deliberate trade-off favoring a codebase a single new contributor can read end to end in a sitting, over one that anticipates scale the project doesn't have yet. Contributions that add structural complexity (a new abstraction layer, a new framework dependency, a new design pattern) should justify that complexity against a real, current need — not a hypothetical future one — consistent with how the project has been built so far.

## 3. Repository Structure

```
socratic-mirror/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, router registration
│   │   ├── api/                     # Route handlers (thin — see §5)
│   │   │   ├── chat.py
│   │   │   ├── session.py
│   │   │   └── health.py
│   │   ├── services/                # All business logic lives here
│   │   │   ├── socratic_engine.py   # The orchestrator — generate_probe()
│   │   │   ├── depth_classifier.py
│   │   │   ├── frustration_detector.py
│   │   │   └── db.py                # The only module that touches Supabase
│   │   ├── prompts/
│   │   │   └── socratic_system.py   # build_system_prompt(), DEPTH_LEVELS
│   │   └── core/
│   │       └── config.py            # Settings (pydantic-settings)
│   ├── tests/                       # Currently empty — see §11
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/              # LandingScreen, ChatScreen, StatsSidebar, ErrorScreen
│       ├── store/sessionStore.js    # The single Zustand store — all client state
│       └── utils/api.js             # The only place Axios calls are made
├── research/                        # Currently empty (.gitkeep only)
└── docs/                            # This documentation set
```

This structure maps directly onto the layering described in `docs/Architecture.md` §2–§4: routes are thin and delegate immediately to `services/`; `services/socratic_engine.py` is the single orchestration point for the AI pipeline; `prompts/socratic_system.py` is the only place prompt text exists. A contributor adding new functionality should place it according to this same separation — new business logic belongs in `services/`, not inline in a route handler; new prompt content belongs in `prompts/`, not inline in `socratic_engine.py`.

## 4. Development Workflow

For local setup, follow `docs/Deployment.md` §3–§8 exactly — this document does not repeat those steps. Once your local environment is running (backend on `:8000`, frontend on `:5173`, both pointed at a working Groq key and Supabase project), the recommended day-to-day workflow is:

```mermaid
flowchart LR
    A["Read the relevant doc(s)<br/>for the area you're changing"] --> B["Make the change locally"]
    B --> C["Manually verify against<br/>Deployment.md §8's<br/>verification steps"]
    C --> D["Update affected documentation<br/>in the SAME change<br/>(see §12)"]
    D --> E["Commit, push, open a PR<br/>(see §7-§9)"]

    style A fill:#7c3aed,color:#fff
```

Because there is no automated test suite (§11) and no CI pipeline (`docs/Deployment.md` §18), **manual verification before opening a PR is not optional — it is currently the only verification step that exists.** At minimum, this means actually running the backend and frontend together and exercising the specific behavior your change touches (a chat turn, a new endpoint, a prompt change at a specific depth level) rather than relying on the code "looking correct."

## 5. Coding Standards

The codebase does not currently enforce any linter or formatter on the backend (no `ruff`, `black`, `flake8`, or `pyproject.toml` configuration exists in `backend/`) and uses only ESLint on the frontend (`frontend/eslint.config.js`, run via `npm run lint`). In the absence of enforced tooling, contributors should match the conventions already visible in the existing code rather than introducing a new personal style:

**Backend (Python):**
- Functions are small and single-purpose, generally under 30–40 lines (`depth_classifier.py` and `frustration_detector.py` are good reference points — each is a single function plus module-level constant lists).
- Type hints are used on function signatures (see `classify_next_depth(student_message: str, current_depth: int, ...) -> int`) but not enforced via `mypy` or any static type checker — write them anyway, consistent with existing code.
- Pydantic models are used for all request/response shapes at the API boundary (`docs/API.md`'s per-endpoint request/response tables) — new endpoints should follow this pattern, not accept or return bare dicts.
- Service functions are kept free of FastAPI-specific concerns (no `Request`/`Response` objects threaded through `services/`) — routes adapt HTTP concerns into plain function calls, not the other way around.

**Frontend (JavaScript/React):**
- Functional components only — there are no class components anywhere in the codebase, and none should be introduced.
- Tailwind utility classes are used directly in JSX for styling; there is no separate CSS-in-JS system or component library beyond Tailwind itself (`frontend/tailwind.config.js`).
- All cross-component state goes through the single Zustand store (`sessionStore.js`) — local `useState` is reserved for component-local, non-shared UI state only (e.g., the chat input's current text, a loading boolean), consistent with the pattern documented in `docs/Architecture.md` §10.
- Run `npm run lint` before committing frontend changes — this is the one piece of automated tooling that does exist and should be treated as a hard gate, not a suggestion.

## 6. Naming Conventions

A few naming patterns are consistent throughout the existing code and should be followed rather than varied from:

- **Python files and functions:** `snake_case` throughout (`socratic_engine.py`, `compute_frustration_score()`, `build_system_prompt()`).
- **React component files:** the codebase is **inconsistent** here, and this inconsistency is a known, documented issue rather than a pattern to follow — `ChatScreen.jsx` and `LandingScreen.jsx` use PascalCase filenames matching their component names, while `statssidebar.jsx` and `errorscreen.jsx` use all-lowercase filenames despite exporting PascalCase component names (`StatsSidebar`, `ErrorScreen`). This exact inconsistency is the root cause of the case-sensitivity build risk documented in `docs/Architecture.md` §3 and `docs/Deployment.md` §14. **New component files should use PascalCase filenames matching their export name** — contributors are explicitly asked not to perpetuate the lowercase pattern, and fixing the two existing offenders is a welcome, low-risk contribution (see `docs/System-Design.md` §25's future-improvements list, which does not explicitly list this but is consistent with its spirit).
- **Zustand store actions:** verb-first, `camelCase` (`setSessionId`, `addUserMessage`, `updateDepth`) — new store actions should follow this same shape.
- **Depth-level constants:** the eight depth levels are referred to consistently as `DEPTH_LEVELS` (backend, `socratic_system.py`) and mirrored as `DEPTH_LABELS`/`DEPTH_COLORS` (frontend, duplicated across `ChatScreen.jsx` and `statssidebar.jsx`). Note this duplication — there is no shared constants file between the two frontend components, let alone between frontend and backend. A contributor adding a ninth depth level (hypothetically) would need to update `DEPTH_LEVELS` in the backend *and* both frontend duplicates by hand — there is no single source of truth enforced by tooling, only by convention.
- **Environment variables:** `UPPER_SNAKE_CASE` for backend (`GROQ_API_KEY`), `VITE_`-prefixed `UPPER_SNAKE_CASE` for frontend (`VITE_API_URL`), per `docs/Deployment.md` §7.

## 7. Commit Message Guidelines

No commit message convention (e.g., Conventional Commits) is enforced anywhere in this repository — there is no commit-lint configuration, no Git hook, and no documented standard prior to this one. This document introduces the following as a recommendation for contributors going forward, chosen for being lightweight and consistent with the project's overall preference for simplicity over tooling:

```
<type>: <short, imperative summary>

<optional longer explanation — what changed and why,
not just what>
```

Where `<type>` is one of: `feat` (new functionality), `fix` (a bug fix), `docs` (documentation-only changes), `refactor` (no behavior change), `chore` (dependencies, tooling, config). For example:

```
fix: correct StatsSidebar import casing for case-sensitive builds

Renames statssidebar.jsx to StatsSidebar.jsx to match its import
in ChatScreen.jsx, resolving the build failure documented in
docs/Architecture.md §3 on case-sensitive filesystems.
```

Commit messages touching AI behavior (prompt text, depth classification thresholds, frustration scoring weights) should state the **specific behavioral change**, not just "update prompt" — e.g., "fix: lower frustration threshold for HIGH_FRUSTRATION phrases from 0.4 to 0.3" is meaningfully more useful to a future contributor than "tweak frustration detector," especially given the complete absence of automated tests (§11) that would otherwise make such a change's effect self-evident from a test diff.

## 8. Branch Strategy

No branch protection rules, required-reviewer settings, or branching model are documented or configured anywhere in this repository (no `CODEOWNERS` file, no GitHub branch protection visible in the repository contents). This document recommends a simple convention consistent with the project's scale:

- `main` — the deployable branch, matching whatever is actually live (or intended to be live, per `docs/Deployment.md` §9's recommendations).
- Feature branches named `<type>/<short-description>`, mirroring the commit-type prefixes from §7 — e.g., `feat/session-resume`, `fix/stats-sidebar-casing`, `docs/contributing-guide`.
- Direct commits to `main` should be avoided once more than one contributor is active on the project, even though nothing currently prevents them technically — this is a process recommendation, not an enforced rule, since no tooling in this repository enforces it today.

## 9. Pull Request Process

In the absence of any existing PR template or CI gate, the following process is recommended for every contribution beyond a trivial documentation typo fix:

1. **Open the PR against `main`** with a description stating what changed and, critically, *why* — given the project's documented philosophy of honesty about gaps (§2), a PR description should mention any known limitation or trade-off the change introduces or leaves unresolved, not just what it adds.
2. **Reference the relevant documentation.** If the change affects behavior described in `docs/AI-Design.md`, `docs/API.md`, `docs/Database.md`, `docs/Prompt-Engineering.md`, or `docs/System-Design.md`, the PR should either update that document in the same change (preferred — see §12) or explicitly note that the documentation is now out of date and needs a follow-up.
3. **Include manual verification evidence.** Since there is no CI pipeline and no automated test suite (§11), the PR description should state how the change was actually exercised locally (e.g., "started a session, sent three messages at depth 1–3, confirmed the new frustration phrase triggers softening as expected") — this is currently the only form of verification the project has, and making it explicit in the PR helps a reviewer trust the change without re-running it themselves.
4. **Keep PRs scoped to one concern.** Given the codebase's small size and the absence of any tooling to help a reviewer untangle an unrelated mix of changes, a PR that mixes, say, a prompt-text fix with an unrelated frontend styling change should be split into two.

## 10. Code Review Guidelines

For reviewers, three checks are specifically worth applying given what's already known about this codebase's weak points, beyond standard code-quality review:

- **Check whether a change touching `current_depth`, `language`, or any other value that flows into `build_system_prompt()` respects the existing lack of bounds validation** (`docs/Prompt-Engineering.md` §6, §13) — if a change introduces a new caller of this function, confirm it doesn't introduce a new unguarded path to the `KeyError` already documented as a known gap, or, better, ask the contributor to add the validation that's currently missing rather than propagating the gap further.
- **Check whether a change to `db.py` or any Supabase call considers the lack of transactional guarantees** already documented in `docs/Database.md` §17 — a PR that adds a third sequential write to a turn's lifecycle, for instance, should be reviewed with that existing consistency risk in mind, not in isolation.
- **Check whether a change to either frontend or backend response/request shapes could reintroduce a contract mismatch** like the documented `session_complete` bug (`docs/API.md`, `docs/System-Design.md` §11) — specifically, confirm that any new field added to a backend response dict is actually declared on the corresponding Pydantic `response_model`, since Pydantic's default behavior of silently dropping undeclared fields is exactly what caused that existing bug.

Reviewers should also hold contributions to the same honesty standard described in §2: a PR description or code comment that glosses over a known trade-off, rather than stating it plainly, should be sent back for clarification before merge — not because the trade-off itself is necessarily wrong, but because hiding it is inconsistent with how the rest of this project is documented and built.

## 11. Testing Expectations

**The current, honest state of testing in this repository is: there is none.** `backend/tests/` exists as a directory containing only a `.gitkeep` file — confirmed empty, with zero test files of any kind. There is no frontend test runner configured either (no Jest, Vitest, or React Testing Library dependency in `frontend/package.json`). This is already established as a cross-cutting limitation in `docs/AI-Design.md` §17, `docs/Database.md` §15, and `docs/System-Design.md` §24 — it is restated here specifically because it directly shapes what's expected of a contributor today versus what should be expected going forward.

**Given the current state, contributors are not required to write automated tests for every change** — doing so would be inconsistent with a codebase that has none to build on, no test runner configured, and no CI to run them. What contributors **are** expected to do:

- Manually verify changes per the workflow in §4 and document that verification in the PR (§9) — this is the project's de facto current testing strategy, and should be treated as a real obligation, not a formality.
- **New contributions are strongly encouraged to include a first test** for whichever module they touch, particularly the AI pipeline's deterministic logic (`depth_classifier.py`, `frustration_detector.py`, `build_system_prompt()`) — these are pure functions with no I/O, making them the cheapest, highest-value place to start building real test coverage, exactly as `docs/AI-Design.md` §18 recommends ("a test suite of recorded adversarial and benign student inputs per depth level"). A contributor who adds the *first* test file to `backend/tests/` would be closing one of the most frequently-cited gaps across this entire documentation set.
- Avoid changes that make the system *less* testable going forward — e.g., avoid further coupling business logic directly into route handlers (already a clean separation today, per §3) in ways that would make future unit testing harder.

## 12. Documentation Standards

This documentation set (`docs/Architecture.md`, `docs/AI-Design.md`, `docs/API.md`, `docs/Database.md`, `docs/Prompt-Engineering.md`, `docs/System-Design.md`, `docs/Deployment.md`, and this document) is treated as authoritative and current — a contribution that changes behavior without a corresponding documentation update is considered incomplete, not merely "missing nice-to-have polish." Specifically:

- **Behavioral changes to the AI pipeline** (a new depth level, a changed frustration threshold, a new classification signal) require a corresponding update to `docs/AI-Design.md` and, if prompt text itself changes, `docs/Prompt-Engineering.md`.
- **New or changed API endpoints or request/response shapes** require a corresponding update to `docs/API.md`, following that document's existing per-endpoint structure (Purpose, Method, URL, Description, Request/Response Body, Parameters, Validation Rules, Status Codes, Error Responses, Example Request/Response, Internal Processing Flow, Security Notes, Sequence Diagram) — a new endpoint added without this full treatment is, per this document's standard, an incomplete contribution.
- **Schema changes** (a new column, a new table) require an update to `docs/Database.md`, including, where relevant, a note distinguishing what is now *confirmed* by an actual migration (if one is added — see `docs/Database.md` §16) versus what remains inferred from usage, consistent with that document's existing confirmed/unconfirmed distinction.
- **Documentation should match the existing voice**, established across every document in this set: precise about what is confirmed by the code versus inferred or recommended, explicit about known gaps rather than silent about them, and consistent in Mermaid diagram style (flowcharts for process/decision logic, sequence diagrams for multi-actor interactions over time, state diagrams for lifecycles, ER diagrams for schema). New documentation should read as a continuation of this same document, not a stylistically distinct addition.

## 13. Reporting Issues

When reporting a bug, the most useful report follows the same evidentiary standard this documentation set already holds itself to: state what you observed, and distinguish it clearly from what you inferred or assumed. A good issue report includes:

- The exact request or action taken (e.g., the specific `/api/v1/chat/probe` request body, or the exact UI steps).
- The exact response or symptom observed (status code, error message, or UI behavior).
- Whether the issue is reproducible, and under what conditions (a specific depth level, a specific language setting, a specific topic string).
- A check against §14 of `docs/Deployment.md` (the troubleshooting table) and the known-limitations sections of the relevant document (`docs/AI-Design.md` §17, `docs/Database.md` §15, `docs/Prompt-Engineering.md` §19, `docs/System-Design.md` §24) — if the symptom matches an already-documented, known gap, the issue report should reference that section rather than re-discovering it from scratch, which helps maintainers immediately distinguish "a known gap someone hit" from "a genuinely new problem."

## 14. Feature Requests

Feature requests are welcome, and are most useful when they engage directly with the trade-offs this project has already made deliberately (§2) rather than treating the current design as accidental. A strong feature request:

- States which existing document's "Future Improvements" section (if any) the request relates to — `docs/AI-Design.md` §18, `docs/Database.md` §16, `docs/Prompt-Engineering.md` §20, `docs/System-Design.md` §25, or `docs/Deployment.md` §18 already catalogue a substantial list of documented, reasoned possibilities; a feature request that maps onto one of these can move faster, since the rationale is already written down.
- Considers the project's stated preference for minimal infrastructure (§2) — a request that would require adding a new framework, service, or architectural layer should explain why the current simplicity is insufficient for the specific need, not just that the addition would be generally beneficial.
- Distinguishes a request for new product behavior (e.g., a ninth depth level) from a request for infrastructure hardening (e.g., authentication, rate limiting) — both are valuable, but they affect very different parts of the system and should be proposed and reviewed independently.

## 15. Security Reporting

This codebase has several known, already-documented security gaps — no authentication, no rate limiting, guessable-but-unprotected `session_id`s, an open prompt-injection surface, and an unconfirmed Supabase key type, all catalogued in detail in `docs/System-Design.md` §17, `docs/API.md`'s per-endpoint Security Notes, `docs/Database.md` §14, and `docs/Prompt-Engineering.md` §18. **Reporting any of these specific, already-documented gaps as a "new" security finding is not necessary** — they are known, and tracked via this documentation set itself; a more useful contribution is a fix or a PR addressing one of them (see §14's note on mapping to existing future-improvements sections).

For a genuinely **new** security finding — something not already described in the documents listed above — please report it privately to the project maintainers rather than opening a public issue, to allow time for a fix before public disclosure, consistent with standard responsible-disclosure practice. Include enough detail to reproduce the issue (similar to §13's reporting standard) and, if possible, an assessment of actual impact (e.g., "this allows reading another student's full conversation transcript," not just "this seems insecure").

## 16. Community Guidelines

Socratic Mirror was built, by its own README and footer copy ("PI Labs · PES University · Built for Bharat"), as a focused, education-oriented project. Contributors are expected to engage with that same spirit: constructive, specific, and oriented toward making the system genuinely better for the students it's meant to serve, rather than toward architectural elegance for its own sake. Disagreements about design trade-offs (sync vs. async, prompting vs. fine-tuning, minimal vs. defensive infrastructure) are expected and welcome — this entire documentation set exists precisely because the project has made many deliberate, debatable trade-offs already — but should be argued on the merits, with reference to the actual constraints and goals already documented (§2, and `docs/System-Design.md` §3's System Objectives), not as a matter of personal preference. Respectful, low-ego collaboration is expected of every contributor, regardless of experience level or how long they've been involved with the project.
