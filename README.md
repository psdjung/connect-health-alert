# Connect health alert

## User
A developer whose app uses Pipedream Connect so their end users can link GitHub, Slack, Google and other accounts.

## Problem
An end user's connection breaks: they revoke access, change a password, an admin removes the app, or a token refresh fails. Pipedream eventually marks the account unhealthy or dead, on its own schedule, sometimes only after a long delay. If the token still refreshes but calls fail, the account can keep showing healthy. Nobody is told. The end user finds out when their agent or action fails, and the developer finds out from a support ticket.

## Evidence (how I know)
- My own work on an integration platform: revoked or expired tokens were the most common production failure, and users usually noticed before we did.
- My test: revoked a GitHub account Sat Nov 14 00:17 PT; Pipedream marked it unhealthy Mon Nov 16 06:32 PT, about 54 hours later, with no error text and no notification.
- I checked the Connect dashboard and API: status is there if you go and look; nothing tells you when it changes.
- The Connect webhooks docs list only `CONNECTION_SUCCESS` and `CONNECTION_ERROR`, both during connect. No event when a connection breaks later.
- Pipedream Users Slack, #incidents, Oct 14: a Connect developer reported every Gong action failing for all their customers since Oct 8 ("IP address not permitted") while the accounts still showed healthy. Two customers had no Gong data for about six days before it was raised.
- Pipedream Users Slack, #bugs, Sep 15: a Connect developer asked for "a recommended health check for detecting invalid Zendesk connection metadata before workflows begin failing." No such check was offered.

## What exists today (as of Nov 13)
- Accounts page: Status column with a filter (seen in the dashboard).
- [Accounts API](https://pipedream.com/docs/connect/api-reference/list-accounts): `healthy`, `dead`, `error`, `expires_at`. Pipedream retries unhealthy accounts on its own.
- [Connect webhooks](https://pipedream.com/docs/connect/webhooks): `CONNECTION_SUCCESS` and `CONNECTION_ERROR`, which only fire while a user is connecting. No event when a connection breaks later.
- [Connect Link](https://pipedream.com/docs/connect/managed-auth/connect-link): a hosted connect URL for one end user and one app. It expires after 4 hours. The docs don't say whether using it on a dead account repairs that account or creates a new one.

## Smallest useful thing
A script that checks every connected account and reports one thing: any status change since the last run (to unhealthy, to dead, or back to healthy). It sends the developer one message listing the changes. Each unhealthy or dead account gets a fresh reconnect link, generated at send time, with its expiry shown, so the developer can forward it to the end user.

## Success looks like
Time from "account broke" to "developer knows" goes from "when a customer complains" to "the next check". Later: share of broken accounts reconnected within a day.

## What I cut and why
- **Consecutive-check counter.** An unhealthy account may recover on its own, so a production version should only alert once it stays unhealthy across several checks. The demo reports every change and sends a "back to healthy" line when an account recovers.
- **"Close to expiring" alerts.** OAuth access tokens expire and refresh all the time, so this would mostly be noise.
- **Listing triggers that depend on a broken account.** Useful, but not needed to show the core idea.
- **Test calls per account.** This version trusts Pipedream's health flag. The Gong case (Slack #incidents, Oct 14) shows an account can show healthy while every call fails. Catching that needs a cheap test request per account, which costs API calls and app-specific endpoints. Next, not now.

## What I'd do next
1. A test call per account, so failures the health flag misses (like the Gong case) are caught too.
2. Talk to five Connect developers: how many broken accounts they have today, and how they find out.
3. Propose to Pipedream: account health events (unhealthy, dead, recovered) on the existing Connect webhook, so nobody has to poll. Also deployed triggers that disappear (Slack #bugs, Sep 16).

## How it works
`check.mjs` asks Pipedream for every connected account in the project and labels each one healthy, unhealthy or dead. It compares those labels with the ones it saved in `state.json` on the last run. Under "Changes", it prints a line for every account whose label changed, such as "john / github: healthy → unhealthy", along with the error Pipedream gives, if any. Under "Still broken", it lists every account that is unhealthy or dead right now, on every run, whether or not it changed. Each broken account gets a fresh reconnect link for that user and app, created on every run and shown with its expiry time (4 hours later), so there is always a working link to forward. Finally, it saves the new labels to `state.json`, so the next run's "Changes" covers only what changed since this one.

## How to run
`node check.mjs` from the repo folder. Needs a `.env` with PIPEDREAM_CLIENT_ID, PIPEDREAM_CLIENT_SECRET, PIPEDREAM_PROJECT_ID and PIPEDREAM_PROJECT_ENVIRONMENT. Delete `state.json` to start fresh.