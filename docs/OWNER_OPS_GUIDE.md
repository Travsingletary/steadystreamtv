# SteadyStream TV — Owner Ops Guide

Quick reference for signing up clients, Firestick install, DNS, and MegaOTT credits.

## Two systems

| System | URL | Purpose |
|--------|-----|---------|
| MegaOTT reseller panel | https://megaott.net | Create / renew client lines (uses credits) |
| SteadyStreamTV rebrand panel | https://gangstageeks.com/tivimate/rs6/steady/ | App DNS / rebrand backend (not per-client signup) |
| SteadyStream web app | steadystream.tv | Customer signup, payments, Connect Apps |

**You do not create a separate DNS for each client.** DNS is shared. Each client gets their own **username + password** (MegaOTT line / Xtream Codes).

---

## Sign up a client (MegaOTT)

1. Log in at https://megaott.net/login (complete CAPTCHA).
2. Create a new **M3U** user/line (not MAG unless they have a MAG box).
3. Set username, password, package, duration.
4. Copy the credentials MegaOTT returns (Xtream server / username / password, and any DNS / portal links).
5. Send the client:
   - Downloader code **1592817** (or `aftv.news/1592817`)
   - Their Xtream **server + username + password**
   - Firestick steps below

If payments go through steadystream.tv, the `create-xtream-account` Supabase function can create the MegaOTT line automatically (requires `MEGAOTT_API_KEY` in Supabase secrets).

---

## Client Firestick setup (send this)

1. Uninstall any old SteadyStream / demo app.
2. Install **Downloader** from the Amazon App Store.
3. Open Downloader → enter code **1592817**.
4. Install **SteadyStreamTV**.
5. Open SteadyStreamTV → log in with Xtream Codes (server, username, password).
6. If the icon still looks like the old demo app: Settings → Apps → SteadyStreamTV → Clear cache.

---

## Credits & pricing reality check

On typical MegaOTT-style panels:

- **1 month ≈ 0.1 credit**
- **1 year ≈ 1 credit**

So **$25 per credit** roughly means:

| Line length | Approx wholesale at $25/credit |
|-------------|--------------------------------|
| 1 month | ~$2.50 |
| 1 year | ~$25 |

Public MegaOTT marketing often quotes roughly **~$1–$2 per month-credit** at volume. Confirm in your panel whether 1 month costs **0.1** or **1** credit before judging the rate.

To buy more credits on megaott.net: log in and look for Credits / Top Up / Wallet. If those are missing, contact **your panel owner** (upline) — the login page points password help to “contact your owner.”

Negotiate bulk rates before large top-ups. Compare at least one other supplier if $25/credit with a 1-credit-per-month scale.

---

## Secrets checklist

- Store `MEGAOTT_API_KEY` only in Supabase Edge Function secrets.
- Do **not** put the MegaOTT API key in client `src/` config or commit it to git.
- Rotate the key if it was ever committed in plaintext.
