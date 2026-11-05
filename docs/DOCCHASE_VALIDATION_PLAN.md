# DocChase Validation Plan

DocChase is a planned tool that collects missing receipts and statements from bookkeeping clients through one checklist link and automatic reminders. Before we build it, we need two signals: bookkeepers feel this pain every month, and some already pay to fix it.

This plan covers the two sources of evidence for stage 1 (pre-validation):

1. The waitlist at [thetrendtimes.com/tools/docchase](https://thetrendtimes.com/tools/docchase) (stored in D1, table `waitlist`, `source = 'docchase-waitlist'`).
2. Two discussion posts in r/Bookkeeping and r/Accounting, with no product mention.

## 1. Posting rules

Both subreddits remove self-promotion fast, and a link or product name makes every reply about the product instead of the problem. The posts below follow these rules:

- No link and no product name. Ask about the problem, not the solution.
- Do not invent a persona. If you are not a bookkeeper, don't say you are; the posts below are written so they stay true for whoever posts them. A made-up backstory that gets caught kills the thread and the account.
- One post per subreddit. Do not cross-post the same text on the same day.
- Post from an account with some comment history in the subreddit. A new account with a first-post question reads as market research.
- Read each subreddit's rules on the day you post. If a weekly or monthly discussion thread is required for this kind of question, post there instead.
- Reply to every comment within 24 hours with a follow-up question, not a pitch. The follow-ups are where most of the data comes from.
- If someone asks "are you building something?", answer honestly: "Thinking about it, mostly trying to see if it's just me." Do not drop the link in the thread. If they ask for it by DM, send it.

Suggested timing: Tuesday to Thursday, 9 to 11 a.m. US Eastern. Avoid the first five days of a month, when bookkeepers are busy closing.

## 2. Post A for r/Bookkeeping

**Title:** How do you handle clients who ignore document requests until tax deadline week?

**Body:**

> I've been talking to a few solo bookkeepers about month-end, and the same thing keeps coming up: the bookkeeping isn't the hard part, getting the documents is. Bank statements show up after the 15th, receipts arrive as half-cropped photos in a text message, and some clients only answer after the third or fourth email. One of them said they feel like a debt collector by the end of the month.
>
> For those of you who have this under control:
>
> 1. What's your actual process for requesting docs each month? Email template, portal, shared folder, something else?
> 2. How many times do you usually follow up before a client sends everything?
> 3. Do you charge late fees or pause work when clients are late? Does it work?
>
> No pitch and no link, I'd just like to hear what works in practice.

**Why it is written this way:** the concrete details (statements after the 15th, cropped photos, the "debt collector" line) let readers recognize their own month-end. The three questions ask for current process, follow-up count, and policy, which map directly to the metrics in section 4.

## 3. Post B for r/Accounting

**Title:** Has anyone moved away from TaxDome / Content Snare because it was too bloated for solo bookkeeping? What do you use instead?

**Body:**

> From what I've read here and heard from a few small practices, the big practice management tools do a lot, but a one-person practice ends up paying for CRM, invoicing, and workflow features it never touches. And clients still complain about creating an account just to upload a bank statement.
>
> I'm curious what small practices (1 to 3 people) use for the "please send me your statements and receipts" part specifically:
>
> - Did you stay on TaxDome, Content Snare, Karbon, or similar, and if so, which plan and roughly what do you pay?
> - If you left, what did you switch to? Plain email, Google Drive or Dropbox requests, a form tool?
> - What's the one thing that still breaks, even with the tool?

**Why it is written this way:** naming the incumbents gets people to state prices and reasons for leaving, which tells us what DocChase competes against and what price anchors exist. Asking for the plan name and price invites specific numbers.

## 4. What to extract from the replies

Log every substantive reply (skip one-word answers) in a sheet with these columns:

| Column | What to record | Example |
|---|---|---|
| `role` | Solo bookkeeper, small firm (2 to 10), fractional CFO, in-house, other | Solo bookkeeper |
| `clients` | Number of active monthly clients, if stated | 30 |
| `current_tool` | What they use for document requests today | TaxDome Pro |
| `current_spend` | Monthly or yearly price they state, in USD | $50/mo |
| `follow_ups` | Typical number of reminders before docs arrive | 3 |
| `biggest_blocker` | The step that hurts most, in their words | "Clients won't log in to the portal" |
| `workaround` | Late fees, paused work, templates, VA doing reminders | Pauses work after the 20th |
| `switch_signal` | Did they say they left, or want to leave, a tool? Why? | Left Content Snare, too expensive per client |
| `quote` | One sentence worth reusing as landing-page wording | |

The four metrics that decide whether DocChase moves to stage 2:

1. **Current spend.** How much people already pay to collect documents. Replies stating $19/mo or more for this job back the Solo plan price. If most people say "just email, $0", the pain may be real but the budget is not.
2. **Biggest blocker.** Group the `biggest_blocker` answers. DocChase targets three: late statements, scattered receipts, and the nagging itself. If the top answer is something else (for example, clients not knowing *which* documents to send), the checklist copy needs to lead with that.
3. **Follow-up count.** Three or more follow-ups per client per month is the case where automatic reminders save real time. One or zero means reminders are a weak hook.
4. **Login friction.** Count mentions of clients refusing to create accounts or use portals. This is the "zero logins" claim on the landing page; we need it to come up on its own, without prompting.

## 5. Decision rule

Review two weeks after both posts go live, together with the waitlist count:

```sql
SELECT COUNT(*) FROM waitlist WHERE source = 'docchase-waitlist';
```

| Result | Next step |
|---|---|
| 20 or more substantive replies, at least five state current spend of $19/mo or more, and the waitlist has 30 or more emails | Move to stage 2: email the waitlist and book five 20-minute calls |
| Replies show strong pain but spend is mostly $0 | Test a lower price or a per-client price before building |
| Fewer than 10 substantive replies | The post did not land. Rewrite the hook once and try r/Bookkeeping again in a monthly thread before dropping the idea |

These thresholds are a starting point, not a benchmark. We have no measurement yet; adjust them after the first round.

## 6. What not to do

- Do not paste the landing page URL in either subreddit, in comments, or in your profile during the two-week window.
- Do not edit the post to add a link after it gets traction.
- Do not quote a commenter on the landing page without asking them first.
