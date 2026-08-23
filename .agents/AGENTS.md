# Project Rules & AI Agent Guidelines for Beetsma Consultancy CRM

## Permanent Instructions for AI Assistants
1. **Journal Reference**: At the start of any new session or when planning major refactoring/features, ALWAYS read [JOURNAL.md](file:///c:/dev/CRM/JOURNAL.md) to understand current architecture, open technical debt, and planned roadmap.
2. **IPC Safety**: Do not modify existing method names in `electron-preload.cjs` without checking and updating all call sites across `src/views/`.
3. **Security**: Never hardcode API keys, credentials, or tokens in source files. Use `.env` or Electron `safeStorage`.
4. **Journal Maintenance**: Keep [JOURNAL.md](file:///c:/dev/CRM/JOURNAL.md) updated when completing refactoring phases, adding services, or making major design decisions.
5. **Always Rebuild Desktop Dist**: Always rebuild the Windows desktop distribution package (`npm run electron:build`) upon completing feature requests, refactoring, or major milestones so that the distribution installer in `dist/` is always synchronized and ready for deployment.
6. **Financial Report Consistency**: All client PDF reports, financial blueprints, and AI financial summaries must strictly follow the standard schema, structure, and actuarial benchmarks defined in [FINANCIAL_REPORT_SPECIFICATION.md](file:///c:/dev/CRM/FINANCIAL_REPORT_SPECIFICATION.md).
