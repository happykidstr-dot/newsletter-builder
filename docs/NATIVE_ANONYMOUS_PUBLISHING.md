# Anonymous publishing without external account setup

The default `native` provider needs no Cloudflare account, site key or secret.
Netlify Blobs privately creates and retains a random signing key on the server.
The source and browser never receive this signing key.

The editor requests a signed ticket for one operation (publish, update/revoke,
image upload, or audio chunk). Tickets expire after two minutes and bind the
site origin, trusted Netlify client IP hash and operation path. The browser
computes an 18-bit SHA-256 work proof in yielding batches. Conditional Blobs
writes consume a valid ticket once, including concurrent replay attempts.

This proof is an abuse cost, NOT a human-verification CAPTCHA. It does not
prevent a determined bot or distributed spam. Application quotas and ownership
checks are mandatory alongside it. Publication edit tokens, per-file audio
keys, HTML sanitization, private APIs and the reader sandbox remain enforced.

Current default budgets: 12 publish/update attempts per IP per hour, 200 site
publish/update attempts per day; 240 tickets per IP per hour and 5,000 tickets
per site per day; media 180 requests / 360 MiB per IP per hour and 512 MiB per
site per day. The ticket Function additionally has a platform IP/domain limit
of 120 requests per minute. Budget exhaustion returns 429 without accepting a
write. These budgets may be increased after observing real usage. Shared-NAT
users share an IP budget.

`netlify.toml` explicitly selects the native provider and anonymous publishing.
`ENABLE_ANONYMOUS_PUBLISHING=false` disables writes. To deliberately select the
optional Turnstile provider later, configure both
`PUBLISH_VERIFICATION_PROVIDER=turnstile` and
`NEXT_PUBLIC_PUBLISH_VERIFICATION_PROVIDER=turnstile`, plus the real Turnstile
site/secret keys, and rebuild. Do not use production test keys.

Production and Deploy Preview stores remain isolated. The daily scheduled
cleanup removes consumed-ticket and quota records older than two days while
preserving the signing key. Public publication/media retention is unchanged.

Validation: local behavior tests cover signed tickets, expiry, IP/path binding,
wrong signatures, replay races and quotas. `verify-anonymous-publish.mjs` performs
real Preview image/audio upload, wrong audio owner, publication, independent
reader access, XSS removal, replay denial, incorrect edit/delete keys, same-URL
update, stale revision and final unpublish. Its edit credentials stay in memory
and are never printed. CI UI regression stubs are not a production bypass.
