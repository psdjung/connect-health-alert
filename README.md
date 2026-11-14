# Connect health alert

## User
A developer whose app uses Pipedream Connect so their end users can link GitHub, Slack, Google and other accounts.

## Problem
An end user's connection breaks: they revoke access, change a password, an admin removes the app, or a token refresh fails. Pipedream eventually marks the account unhealthy or dead, on its own schedule. Nobody is told. The end user finds out when their agent or action fails, and the developer finds out from a support ticket.

## Evidence (how I know)
- My own work on an integration platform: revoked or expired tokens were the most common production failure, and users usually noticed before we did.
- Pipedream forum threads asking for this:
  - [How Can We Receive Notifications Regarding the Health Status of a Connection?](https://pipedream.com/community/t/how-can-we-receive-notifications-regarding-the-health-status-of-a-connection/14302)
  - [Why Are User Accounts Being Randomly Disconnected from Slack, Github, and Google Integrations?](https://pipedream.com/community/t/why-are-user-accounts-being-randomly-disconnected-from-slack-github-and-google-integrations/14056)
  - [How to Handle Unhealthy or Dead Accounts in Pipedream Connect?](https://pipedream.com/community/t/how-to-handle-unhealthy-or-dead-accounts-in-pipedream-connect/13251)
- I checked the Connect dashboard and API (Nov 14): status is there if you go and look; nothing tells you when it changes.

## What exists today (as of Nov 14)
- Accounts page: Status column with a filter.
- Accounts API: `healthy`, `dead`, `error`, `expires_at`.
- Connect webhooks: `CONNECTION_SUCCESS` and `CONNECTION_ERROR`, which only fire while a user is connecting. No event when a connection breaks later.

## Smallest useful thing
A script that checks every connected account, notices when one goes unhealthy, dead, or close to expiring, and sends the developer one message with a reconnect link they can forward to the end user.

## Success looks like
Time from "account broke" to "developer knows" goes from "when a customer complains" to "the next check". Later: share of broken accounts reconnected within a day.

## What I cut and why
(fill in while building)

## What I'd do next
(fill in while building)

## How to run
(fill in once check.mjs exists)