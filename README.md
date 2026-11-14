# Connect health alert

## User
A developer whose app uses Pipedream Connect so their end users can link GitHub, Slack, Google and other accounts.

## Problem
An end user's connection breaks: they revoke access, change a password, an admin removes the app, or a token refresh fails. Pipedream eventually marks the account unhealthy or dead, on its own schedule. Nobody is told. The end user finds out when their agent or action fails, and the developer finds out from a support ticket.

## Evidence (how I know)
- My own work on an integration platform: revoked or expired tokens were the most common production failure, and users usually noticed before we did.
- Pipedream forum threads asking for this:
  - [How Can We Receive Notifications Regarding the Health Status of a Connection?](https://pipedream.com/community/t/how-can-we-receive-notifications-regarding-the-health-status-of-a-connection/14302)
    - Staff reply (unverified): Pipedream doesn't proactively notify Connect developers when end-user accounts become unhealthy, "but it's something we've discussed."
  - [Why Are User Accounts Being Randomly Disconnected from Slack, Github, and Google Integrations?](https://pipedream.com/community/t/why-are-user-accounts-being-randomly-disconnected-from-slack-github-and-google-integrations/14056)
  - [How to Handle Unhealthy or Dead Accounts in Pipedream Connect?](https://pipedream.com/community/t/how-to-handle-unhealthy-or-dead-accounts-in-pipedream-connect/13251)
    - Staff reply (unverified): `healthy: false` "could be temporary and it may recover"; `dead: true` means the connection is "broken and not recoverable" and the user has to reconnect.
- I checked the Connect dashboard and API (Nov 13): status is there if you go and look; nothing tells you when it changes.

## What exists today (as of Nov 13)
- Accounts page: Status column with a filter.
- [Accounts API](https://pipedream.com/docs/connect/api-reference/list-accounts): `healthy`, `dead`, `error`, `expires_at`. Pipedream retries unhealthy accounts on its own.
- [Connect webhooks](https://pipedream.com/docs/connect/webhooks): `CONNECTION_SUCCESS` and `CONNECTION_ERROR`, which only fire while a user is connecting. No event when a connection breaks later.
- [Connect Link](https://pipedream.com/docs/connect/managed-auth/connect-link): a hosted connect URL for one end user and one app. It expires after 4 hours. The docs don't say whether using it on a dead account repairs that account or creates a new one.

## Smallest useful thing
A script that checks every connected account and reports one thing: any status change since the last run (to unhealthy, to dead, or back to healthy). It sends the developer one message listing the changes. Each dead account gets a fresh reconnect link, generated at send time, with its expiry shown, so the developer can forward it to the end user.

## Success looks like
Time from "account broke" to "developer knows" goes from "when a customer complains" to "the next check". Later: share of broken accounts reconnected within a day.

## What I cut and why
- **Consecutive-check counter.** An unhealthy account may recover on its own, so a production version should only alert once it stays unhealthy across several checks. The demo reports every change and sends a "back to healthy" line when an account recovers.
- **"Close to expiring" alerts.** OAuth access tokens expire and refresh all the time, so this would mostly be noise.
- **Listing triggers that depend on a broken account.** Useful, but not needed to show the core idea.
- **Reconnect links for unhealthy accounts.** They may recover without help. Only dead accounts get a link.

## What I'd do next
(fill in while building)

## How to run
(fill in once check.mjs exists)
