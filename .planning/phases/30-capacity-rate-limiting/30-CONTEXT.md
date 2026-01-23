# Phase 30: Capacity, Rate Limiting & API Security - Context

**Gathered:** 2026-01-23
**Status:** Ready for research

<vision>
## How This Should Work

Capacity and rate limiting should be tiered by subscription plan. Paid users get both queue priority AND higher usage limits compared to free tier users. When the system is under load, paid subscribers jump the queue while free users wait longer.

The system uses Inngest for background job processing and observability. AI calls (transcription, report generation) run as background jobs with proper retry/backoff handling. Inngest provides an operational dashboard showing jobs in flight, retry status, and failures — full visibility into what's happening.

</vision>

<essential>
## What Must Be Nailed

- **Cost protection** — This is the top priority. Prevent runaway API costs from abuse or bugs. The business must be protected from unexpectedly high OpenAI bills.
- **Monthly cost ceiling** — Hard cap (e.g., $500/month) where service degrades before exceeding it
- **Per-user abuse detection** — Flag users generating abnormal volumes (e.g., 50+ reports/hour)
- **Request-level controls** — Rate limits per minute/hour that prevent bursts

</essential>

<specifics>
## Specific Ideas

- **Inngest** for background job queue and observability dashboard
- **Tiered priority** — Paid users' requests jump the queue during peak times
- **Tiered limits** — Higher usage caps for paid tiers
- **Three-layer protection**: monthly ceiling + abuse detection + request limits

</specifics>

<notes>
## Additional Context

Single OpenAI API key shared across all users. Target is 50-75 concurrent users initially. Whisper used for transcription, GPT-4o for report generation.

Cost protection is explicitly the priority over user experience. Better to throttle or queue than to blow through API budget.

</notes>

---

*Phase: 30-capacity-rate-limiting*
*Context gathered: 2026-01-23*
