# 17 · Admin, Access & Identity Management

The complete picture of **admin management + authentication + authorization** for
NovaShop: what's built today, and a prioritized backlog of everything worth adding.
This is the source of truth for the "Users / Invited / Roles" area and the auth stack.

> Related: [08 API conventions](./08-api-conventions.md) (auth + user endpoints),
> the RBAC permission catalog in `packages/shared/src/permissions.ts`, and the
> invite flow. Design/scope rules: **invite-only**, **single-tenant**,
> **dynamic RBAC** (roles are data, not an enum), **copy-friendly / white-label**.

Priority legend: **P0** = security-critical / do soon · **P1** = high value ·
**P2** = later / enterprise. ✅ = already implemented.

---

## 1. Current state (implemented)

### Authentication
- ✅ Credential login → JWT **access** (~15 min, in-memory) + **refresh** (7-day,
  httpOnly, rotating cookie; sessions hashed + revocable in a `sessions` collection).
- ✅ bcrypt (10 rounds), `password` never selected/serialized.
- ✅ **Invite-only** — no public signup.
- ✅ Password reset (30-min token, revokes all sessions on reset).
- ✅ Email verification (1-day token; admin can resend for a user).
- ✅ Change password (authenticated).
- ✅ Session management — user lists + revokes own sessions (one / all).
- ✅ Login enforces `ACTIVE` status; refresh-on-401 on the client.
- 🟡 Google OAuth — scaffolded + gated behind creds; UI link pending.

### Authorization (RBAC)
- ✅ **Dynamic roles** collection + per-resource **read/write permission matrix**
  (14 resources × 2 = 28 permissions incl. `audit`; write implies read).
- ✅ Global `JwtAuthGuard` (`@Public` opt-out) → `RolesGuard` → `PermissionsGuard`;
  `@RequirePermission('users.write')` on routes.
- ✅ **Super Admin** bypasses all checks and is protected from ban/delete/role-change.
- ✅ Client `can(permission)` gates nav **and** route-level `<RequirePermission>` returns 403
  (defense-in-depth, not just hidden links).
- ✅ **Role-in-use guard** — can't delete a role still assigned to users (409).
- ✅ **Staff-only admin users** — the admin Users page and its stats exclude the storefront
  `Customer` role (customers are managed separately); role pickers never offer `Customer`.
- ✅ **Permissions reference page** (`/permissions`) — documents all 14 areas × read/write,
  grouped under an **Access control** sidebar section (Admin Users · Roles · Permissions · Audit log).
- ✅ **Admin profile** (`/profile`) — full-width self-service profile (avatar, contact, title,
  bio, links) with **local image upload**; Super Admin views any admin at `/profile/:id`.
- ✅ **Business Settings** (`/settings/business`) — store identity/contact/address/localization
  + **file-storage driver** (Local / S3) with S3 credentials; upload driver honored by the API.

### Security baseline
- ✅ **Global rate limit** (120/min) + tight **login/forgot throttle** (5/min).
- ✅ **Account lockout** — 15 min after 5 failed logins.
- ✅ **Password policy** — 8+ chars incl. a letter and a number (shared FE/BE).
- ✅ **Audit log** — every authenticated mutating request recorded (actor, action, status,
  IP, input + result; secrets scrubbed), viewable at `/audit` (gated by `audit.read`).
- ✅ **Security headers** (helmet: strict CSP, HSTS, nosniff, frame-ancestors none).
- ✅ **Token kill-switch** — `tokenVersion` invalidates all tokens on reset / sign-out-everywhere;
  access tokens re-validate the live user each request (bans/deletes/role changes apply instantly).

### User management
- ✅ Paginated list — `page/pageSize/sort/search/role/status/verified`.
- ✅ Count cards (`GET /users/stats`) + role breakdown.
- ✅ Single: ban / restore / soft-delete (`status = DELETED`) / change role / resend verification.
- ✅ **Bulk** ban / restore / delete / set-role (excludes self + Super Admins).
- ✅ User detail drawer; self-lockout guards.

### Invitations
- ✅ Invite (15-min token) · Invited tab · reinvite (refreshes window) · revoke (hard-delete pending).
- ✅ Tracks `invitedAt` / `inviteExpiresAt` / `invitedBy`; copy-invite-link.

### Roles & self-service
- ✅ Role CRUD + permission matrix; system roles seeded and protected.
- ✅ **Configurable default role** (invite default), **assign-role-to-many-users**, **role export/import (JSON)**, role descriptions.
- ✅ Settings page — profile, change password, active sessions.

---

## 2. Authentication — proposed

| Feature | What | Priority | Notes |
|---|---|---|---|
| **Login rate-limiting / lockout** | Throttle login + lock after N failed attempts | ✅ | Done — global 120/min + login **5/min** throttle (`@nestjs/throttler`); account **locks 15 min after 5 fails** (`failedLoginCount`/`lockedUntil`). |
| **Password policy** | Min length + complexity (breached-password check, reuse history still to do) | ✅ | Done — 8+ chars incl. a letter and a number (shared `PASSWORD_REGEX`), enforced in DTOs + client. Breached/HIBP + history pending. |
| **2FA / MFA (TOTP)** | Authenticator-app codes + backup codes; optional per-user, enforceable per-role | **P1** | `otplib`; `twoFactorSecret`/`enabled`/`backupCodes` on user; a `pending-2fa` login step. |
| **Login notifications** | Email on new-device / new-location sign-in | **P1** | Compare userAgent/IP against known sessions. |
| **Trusted devices / "remember me"** | Longer refresh + named devices; skip 2FA on trusted device | **P1** | Extend the sessions collection with device name + trusted flag. |
| **Idle / absolute session timeout** | Auto-logout after inactivity; max session age | **P1** | Config-driven; enforce on refresh. |
| **More OAuth / SSO** | Finish Google; add GitHub/Microsoft; SAML/OIDC for enterprise | **P2** | Reuse `findOrCreateOAuth`; SSO is enterprise-tier. |
| **Passwordless / magic-link** | Email link login (already have mail-token infra) | **P2** | Mirrors invite/reset token flow. |
| **WebAuthn / passkeys** | Phishing-resistant passkey login | **P2** | `@simplewebauthn/server`. |
| **CAPTCHA on login/invite** | Bot mitigation on public endpoints | **P2** | Turnstile/hCaptcha. |
| **Secure email-change flow** | Verify the *new* address and notify (+ allow revert from) the old one | **P1** | Today changing the profile email just flips `emailVerified=false`. |
| **Step-up / re-auth ("sudo mode")** | Re-enter password/2FA before sensitive actions (change password, view API keys, delete account) | **P1** | Short-lived elevated flag on the session. |
| **Global token kill-switch** | `tokenVersion` → bump to invalidate every issued token instantly | ✅ | Done — `tv` in JWT, checked per request; bumped on reset + sign-out-everywhere. JwtStrategy also rejects banned/deleted users and picks up role changes immediately. |
| **Concurrent-session limit** | Cap active sessions per user; evict the oldest | **P2** | On the `sessions` collection. |
| **JWT signing-key rotation** | Rotating keys with `kid` / JWKS instead of one static secret | **P2** | Zero-downtime secret rotation. |
| **Account recovery** | Recover when the 2FA device is lost (backup codes + admin-assisted reset + recovery email) | **P1** | Pairs with 2FA so users don't get locked out. |
| **Break-glass access** | Audited emergency Super-Admin path if every admin is locked out | **P2** | Seed/CLI recovery is the fallback today. |

## 3. Authorization — proposed

| Feature | What | Priority | Notes |
|---|---|---|---|
| **Prevent deleting a role in use** | Block deleting a role still assigned to users | ✅ | Done — `DELETE /roles/:id` returns **409** with the user count; reassign first. |
| **Last-Super-Admin guard** | Never allow removing/demoting the final Super Admin | ✅ | Covered — all Super Admin mutations are already blocked (`assertMutable`), so one always remains. |
| **Permission groups / UI grouping** | Group the 26 permissions by domain in the matrix | **P1** | Pure UX on the matrix. |
| **Clone / duplicate role** | Start a new role from an existing one | **P1** | One endpoint + button. |
| **Users-per-role list** | Drill from a role into its members | **P1** | We already show counts. |
| **API keys / service accounts** | Scoped programmatic access (PATs) with per-key permissions + revoke | **P2** | New `apiKeys` collection; header auth strategy. |
| **ABAC / conditions** | Attribute/record-level rules beyond RBAC (e.g. own-records-only) | **P2** | Ownership checks already needed for storefront. |
| **IP allow/deny list** | Restrict admin panel by IP | **P2** | Middleware + Security settings. |
| **Role hierarchy / inheritance** | Roles inherit permissions from a parent | **P2** | Only if the flat matrix gets unwieldy. |
| **Effective-permissions viewer** | "Why can / can't this user do X" — resolve a user's full permission set + where each came from | **P1** | Invaluable for debugging RBAC. |
| **Just-in-time (JIT) elevation** | Time-boxed temporary access that auto-expires, optionally after approval | **P2** | `grants` with `expiresAt`. |
| **Approval workflow (maker–checker)** | Dual control: destructive/sensitive actions need a second admin's approval | **P2** | Segregation-of-duties control. |
| **Explicit deny overrides** | Deny rules that beat grants (beyond additive allow) | **P2** | Only if policies get complex. |

## 4. Roles & permission management — proposed

Complements §3 (the authorization *engine*) with role **lifecycle, management and
UX**. Today: dynamic roles + read/write matrix, seeded system roles (protected),
role change via user/invite. Roles are data — this keeps them manageable and
[copy-friendly](./00-project-overview.md).

| Feature | What | Priority | Notes |
|---|---|---|---|
| **Configurable default role** | Which role new invites get by default | ✅ | Done — `isDefault` on Role + `PATCH /roles/:id/default`; invite defaults to it; seed self-heals one default. |
| **Assign role to many users** | From the role page, bulk-assign to selected users | ✅ | Done — "Assign to users" modal → `POST /users/bulk` (setRole). |
| **Role export / import (JSON)** | Export a role + its permissions; import into a cloned store | ✅ | Done — client-side export + JSON import creates a role. |
| **Role description & notes** | Explain what each role is for | ✅ | Description shipped (form + card); free-form *notes* still pending. |
| **Role templates / presets** | Ship ready-made starting roles (Manager, Support, Analyst, Fulfilment, Read-only) | **P1** | Editable copies; faster onboarding. |
| **"Select all" per resource group** | Bulk-toggle read/write across a whole domain in the matrix | **P1** | Matrix UX (only global select-all today). |
| **Role change history** | Audit of permission edits + assignments per role | **P1** | Part of the audit log (§8). |
| **Role label, color & icon** | Visual identity for badges + menus | **P2** | Today tone is derived from name. |
| **Role usage analytics** | Members (✅ count), last-assigned, active vs dormant | **P2** | Feeds access reviews. |
| **Role diff / compare** | Side-by-side permission diff of two roles | **P2** | Governance. |
| **Per-role security policy** | Enforce 2FA / session timeout / IP allowlist per role | **P2** | Higher assurance for admin roles. |
| **Temporary / expiring roles** | Assignment that auto-revokes at a date | **P2** | Ties to JIT elevation (§3). |
| **Role request & approval** | User requests a role → admin approves | **P2** | Intake + maker–checker (§3). |
| **Search / filter roles** | Find roles by name or permission | **P2** | Scales past a handful. |
| **Least-privilege lint** | Warn when a role is over-privileged / unused | **P2** | Governance nudge. |

## 5. Menu, navigation & UI access — proposed

The sidebar already **hides items the user can't access** via `can(permission)`.
Formalize this into a permission-driven, (optionally) configurable menu — and make
it defense-in-depth (hidden **and** route-guarded), not just cosmetic.

| Feature | What | Priority | Notes |
|---|---|---|---|
| **Permission ↔ menu mapping** | Each route/menu item declares the permission it needs | ✅ | Done — routes carry a permission; sidebar + route guard share it. |
| **Route guards mirror menu perms** | Typing a URL to a forbidden page → 403, not just a hidden link | ✅ | Done — `<RequirePermission>` renders 403; server routes already `@RequirePermission`. |
| **Default landing page per role** | Land on the first page the role is allowed to see after login | **P1** | Avoid dumping a user on a forbidden route. |
| **Menu badges / live counts** | Counts on items (pending orders, low stock, pending invites) | **P1** | Reuse the stats endpoints. |
| **Feature-flag-gated items** | Show a menu item only when its module/feature is enabled | **P1** | Progressive rollout. |
| **Menu / nav config audit** | Track who changed the navigation config | **P1** | Part of the audit log (§8). |
| **Dynamic menu config (DB-driven)** | Store items (label, icon, path, order, parent, visibility) in DB; edit from UI | **P2** | Menu builder; strengthens white-label. |
| **Per-role menu customization** | Different roles get a different menu structure/order | **P2** | Built on the config. |
| **Menu item CRUD + reorder** | Add/edit/remove items, nested submenus, drag-drop order | **P2** | Admin-configurable nav. |
| **Custom / external links** | Add links to external tools or custom pages | **P2** | e.g. docs, status page. |
| **Pinned / favourite items** | User pins frequent items to the top | **P2** | Personalization. |
| **Recently visited** | Quick jump-back list | **P2** | Pairs with the command palette ([06](./06-signature-features.md)). |
| **Breadcrumbs from menu tree** | Derive breadcrumbs from the menu hierarchy | **P2** | Navigation clarity. |
| **Menu localization** | Item labels per locale | **P2** | With i18n. |

## 6. User management — proposed

| Feature | What | Priority | Notes |
|---|---|---|---|
| **Admin session control** | View + revoke **another user's** sessions; "force logout everywhere" | **P0** | Extend session endpoints to admin scope. |
| **Admin-triggered password reset** | Send a reset link / force reset-on-next-login for a user | **P1** | Reuse reset-token flow. |
| **Suspend vs Ban** | Wire the existing `SUSPENDED` status (temporary, auto-expiring) distinct from `BANNED` | **P1** | Add suspend action + `suspendedUntil`. |
| **Impersonate ("view as")** | Support login-as with a clear banner + full audit trail | **P1** | Short-lived scoped token; never for Super Admin targets. |
| **CSV import / export** | Bulk-create users from CSV; export the filtered list | **P1** | Server export endpoint (all matching, not just page). |
| **Column sorting UX + saved views** | ✅ sort done; add saved filter presets | **P2** | Persist filter sets. |
| **Internal notes / tags** | Admin-only notes + labels on a user | **P2** | `notes[]` / `tags[]`. |
| **Avatar upload** | Real profile images (fallback to initials ✅) | ✅ | Done — local image upload on the profile page; avatar shows in navbar/tables. |
| **Online / last-active** | Presence indicator | **P2** | Needs realtime/heartbeat. |
| **Date-range filters** | Filter by joined / last-login range | **P2** | Extend list query. |
| **Lifecycle state machine** | Enforce legal status transitions (§10) + **restore from `DELETED`** | **P1** | Prevents invalid states; enables un-delete. |
| **Retention / purge** | Auto-hard-delete soft-deleted users after N days | **P1** | Job + config; ties to GDPR erase. |
| **User groups / teams** | Assign roles to a group; members inherit — bulk management | **P2** | New `groups` collection. |
| **Transfer ownership on offboard** | Reassign a leaving user's owned records before delete | **P2** | Needed once users own content (products, orders). |
| **Merge duplicate accounts** | Combine two records into one | **P2** | Rare but painful without it. |

## 7. Invitations — proposed

| Feature | What | Priority | Notes |
|---|---|---|---|
| **Bulk invite** | Paste many emails → invite all with a role | **P1** | Loops existing invite. |
| **Configurable invite TTL** | Move the 15-min window into Security settings | **P1** | Currently `INVITE_TTL_MINUTES` constant. |
| **Auto-expire cleanup** | Sweep long-expired pending invites | **P2** | Cron/job (BullMQ later). |
| **Invite audit** | Who invited whom + when accepted | **P1** | Falls out of the audit log (§8). |
| **Domain-restricted invites** | Only allow invites to allowlisted email domains | **P1** | Config in Security settings; stops typo/rogue invites. |
| **Request access / approval** | Prospective users request access → an admin approves → invite | **P2** | Optional intake flow. |
| **Pre-expiry reminder** | Nudge email before a pending invite lapses | **P2** | Job (BullMQ later). |

## 8. Security, audit & compliance — proposed

| Feature | What | Priority | Notes |
|---|---|---|---|
| **Audit log** | Immutable record of admin actions (who, what, when, IP) | ✅ | Done — `auditLogs` + global `AuditInterceptor` records **successes and failures** (mutations): actor (id/name/email/role), resource + id, status, success flag, error message, duration, **real client IP** (X-Forwarded-For / trust-proxy, IPv6 tidied), scrubbed `input` + `result`. `GET /audit` + page gated by `audit.read`. Tamper-evident hash-chain + true before-diff still to do. |
| **Login / security history** | Per-user sign-in history + security events | **P1** | Subset of audit, surfaced in the user drawer + own Settings. |
| **Security settings page** | Central config: password policy, session/idle timeout, 2FA enforcement, invite TTL, lockout thresholds | **P1** | Backed by a `settings` collection. |
| **Notify on sensitive actions** | Email the account on password change, role change, new session | **P1** | Reuse mail service. |
| **CSRF hardening** | Verify beyond SameSite=lax for cookie flows | **P1** | Double-submit token if needed. |
| **GDPR: export / erase** | Self-service data export + right-to-be-forgotten | **P2** | Export bundle + hard-erase job. |
| **CSP / security headers** | Helmet + strict CSP | ✅ | Done — `helmet` in `main.ts`: CSP `default-src 'none'`, `frame-ancestors 'none'`, HSTS, `nosniff`. |
| **Global rate limiting** | Throttle *all* endpoints, not just login | ✅ | Done — global `ThrottlerGuard` 120/min; login/forgot 5/min. |
| **Access reviews / recertification** | Periodic attestation that each user still needs their role | **P1** | SOC2/ISO evidence; export the review. |
| **Anomaly detection** | Alert on impossible-travel, failed-login spikes, new country/device | **P1** | Off session + audit signals. |
| **Tamper-evident audit** | Hash-chain audit entries + retention window + export | **P1** | Integrity for compliance. |
| **Field-level PII encryption** | Encrypt sensitive fields at rest + log PII reads (data-access audit) | **P2** | For regulated data. |
| **Consent / ToS tracking** | Record policy/ToS acceptance + versions per user | **P2** | GDPR. |

## 9. Self-service (account) — proposed

| Feature | What | Priority | Notes |
|---|---|---|---|
| **2FA setup UI** | Enroll/disable authenticator + backup codes | **P1** | Pairs with §2 2FA. |
| **Connected accounts** | Link/unlink OAuth providers | **P2** | After OAuth ships. |
| **My security activity** | Own login history + active devices (✅ sessions) | **P1** | Extends Settings. |
| **Notification preferences** | Per-channel toggles | **P2** | With notifications module. |
| **Self-deactivate / delete account** | User disables or deletes their own account (if policy allows) | **P2** | With retention rules. |
| **Locale / timezone prefs** | Per-user language + timezone | **P2** | Affects date/number formatting. |
| **Revoke session via email link** | "Not you? sign out that device" from a login-alert email | **P2** | Pairs with login notifications. |

---

## 10. User lifecycle & status model

`status` should be a real state machine, enforced in the service. Only some
transitions are wired today (ban / restore / soft-delete); `SUSPENDED` exists in
the enum + stats but has **no action yet**.

```
INVITED ──accept──▶ ACTIVE          INVITED ──revoke──▶ (hard-deleted)
ACTIVE  ──suspend─▶ SUSPENDED ──restore──▶ ACTIVE     (SUSPENDED optionally auto-expires)
ACTIVE / SUSPENDED ──ban──▶ BANNED ──restore──▶ ACTIVE
any ──delete──▶ DELETED (soft) ──restore (admin)──▶ ACTIVE ──purge after N days──▶ (gone)
```

- **Suspend** = temporary, reversible, optional `suspendedUntil`. **Ban** = indefinite.
  **Delete** = soft (kept for audit/order history), then purged by retention.
- Guard illegal transitions (e.g. can't `accept` a `BANNED` user); every transition
  is an audit event (§8). Super Admin can't be suspended/banned/deleted (already enforced).

## 11. Operations, observability & compliance

| Area | What | Priority |
|---|---|---|
| **Auth metrics** | Login success/fail rate, active sessions, MFA-adoption, invite conversion, lockouts | **P1** |
| **Alerting** | Page on auth-failure spikes, lockout storms, audit-write failures | **P1** |
| **Email deliverability** | SMTP health, bounce/complaint handling for invites & alerts | **P1** |
| **Backup & recovery** | Regular backups of `users` / `roles` / `sessions` / `auditLogs` + tested restore | **P1** |
| **Secrets management** | Rotate JWT/mail/SMTP secrets on a schedule; documented runbook | **P2** |
| **Compliance evidence** | Exportable access reviews, audit extracts, retention reports | **P2** |

**Out of scope (by design):** multi-tenant / organization switching (NovaShop is
**single-tenant**, [copy-friendly](./00-project-overview.md) — clone & reconfigure
for another store). Storefront customers authenticate through the same stack, but the
admin panel stays **invite-only**.

---

## 12. Suggested data-model additions

- **`user`** (extend): `failedLoginCount`, `lockedUntil`, `suspendedUntil`,
  `tokenVersion` (kill-switch), `twoFactorEnabled`, `twoFactorSecret` (select:false),
  `backupCodes` (hashed), `passwordChangedAt`, `passwordHistory` (hashes),
  `emailChangePending`, `notes`, `tags`, `avatarUrl`, `locale`, `timezone`.
- **`sessions`** (extend): `deviceName`, `trusted`, `ip`, `lastSeenAt`.
- **`auditLogs`** (new): `actor`, `action`, `resource`, `resourceId`,
  `before`/`after`, `ip`, `userAgent`, `createdAt` — append-only.
- **`apiKeys`** (new): `name`, `hashedKey`, `permissions[]`, `lastUsedAt`,
  `expiresAt`, `revokedAt`.
- **`settings`** (new / shared): password policy, session/idle timeout, invite TTL,
  lockout thresholds, 2FA enforcement, allowed invite domains.
- **`groups`** (new): `name`, `roles[]`, members — assign roles by team.
- **`grants`** (new): time-boxed elevation — `user`, `permissions[]`, `expiresAt`, `approvedBy`.
- **`consents`** (new): ToS/policy acceptance — `user`, `policy`, `version`, `acceptedAt`.
- **`accessReviews`** (new): recertification runs — `reviewer`, `subject`, `decision`, `reviewedAt`.
- **`menuItems`** (new, optional): DB-driven nav — `label`, `icon`, `path`, `parent`,
  `order`, `permission`, `visibleRoles[]`, `featureFlag`, `external`.
- **`role`** (extend): `description`, `color`, `icon`, `isDefault`, `expiresAt` (temporary roles).

## 13. Recommended build order

1. **P0 security baseline — ✅ COMPLETE** — global rate-limit + login lockout, password policy,
   audit log, role-in-use / last-Super-Admin guards, route guards mirroring menu permissions,
   `tokenVersion` kill-switch, helmet/CSP. *(Deeper, deferred: tamper-evident hash-chain audit + true before-diff.)*
2. **P1 admin power tools** — admin session control + admin-triggered reset, suspend-vs-ban
   + lifecycle enforcement (un-delete/retention), impersonation (audited), effective-permissions
   viewer, **configurable default role + role templates + assign-role-to-users + role export/import**,
   **menu badges + default landing page per role**, CSV import/export, Security settings page,
   sensitive-action emails.
3. **P1 auth hardening** — 2FA (TOTP + backup codes) + self-service setup + account recovery,
   secure email-change, step-up/sudo mode, login notifications, trusted devices, session
   timeouts, anomaly detection + access reviews.
4. **P2 / enterprise** — API keys/service accounts, JIT elevation + approval workflows,
   **dynamic menu builder + per-role menus, role diff / per-role security policy, temporary roles**,
   ABAC + IP rules, user groups, SSO/SAML, passkeys, passwordless, GDPR export/erase +
   consent, field-level PII encryption, saved views, avatars, presence.

> As features land, add a row to [`docs/sprint-plan.csv`](./sprint-plan.csv) and, for
> any new permission, extend `packages/shared/src/permissions.ts` (e.g. an
> `audit.read`, `apikeys.write`, `settings.write`, `menu.write` resource) — that same
> catalog drives both the role matrix and the menu ↔ permission mapping (§5).
