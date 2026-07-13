# DocumentDB migration — compatibility & verification runbook

The app was built for MongoDB/Atlas and uses features AWS DocumentDB doesn't
support. This documents what was fixed, how to verify, and how to cut over.

## ⚠️ Cutover blocker: indexes are NOT migrated automatically

DocumentDB is MongoDB-*API* compatible, but the data migration (DMS / document
copy) does **not** carry indexes across, and prod connects with `autoIndex:false`
(`src/services/mongo.service.ts`). A freshly migrated DocDB cluster therefore has
ONLY the default `_id_` index on every collection — so every `{team}`-scoped query
does a full collection scan. **You must build the app's indexes on each DocDB
cluster before cutover.** (Verified: on the dev cluster, `{team}` on `cars` went
COLLSCAN → IXSCAN once the indexes were built.)

Build them (create-only, safe to re-run — needs the tunnel below):
```bash
export DOCDB_PWD=$(aws secretsmanager get-secret-value --secret-id andes-dev/docdb/master_password --region sa-east-1 --query SecretString --output text)
export DOCDB_TEST_URI="mongodb://osacontrol:${DOCDB_PWD}@localhost:27018/osaAndes?tls=true&tlsCAFile=./global-bundle.pem&tlsAllowInvalidHostnames=true&directConnection=true&retryWrites=false&authSource=admin"
NODE_OPTIONS="--no-experimental-strip-types" TS_NODE_TRANSPILE_ONLY=1 \
  npx ts-node -P tsconfig.json scripts/docdb-build-indexes.ts
```
Builds ~66 schema-defined indexes across 62 models (all plain btree → DocDB-safe).
The script stubs native/S3 deps so all model files import on a dev laptop.

**The app now also builds missing indexes automatically at startup.** `server.ts` calls
`ensureIndexes()` (in `services/mongo.service.ts`) right after connecting: it runs
`Model.createIndexes()` for every registered model — create-only, idempotent, per-model
error-tolerant, and it does not block `app.listen`. So a freshly migrated DocDB environment
self-heals on first boot; the standalone script above is only needed to pre-build indexes
before cutover or from outside the app. Disable with `ENSURE_INDEXES=false` (auto-skipped in
the `testing` env). Note the `codes.correlative` unique index will log a per-boot error until
its duplicate data is cleaned.
- **dev: done. prod: still pending** — deploy the new code (self-heals on boot) or re-run
  the script against the prod cluster/secret.
- Known non-blocker: the `codes.correlative_1` UNIQUE index fails to build because
  the `codes` collection has duplicate/null `correlative` values — dedupe first.

## /api/v1 (mobile) DocDB 5.0 compatibility — assessment result

Swept all 99 `/api/v1` endpoints (comprehensive multi-agent trace + adversarial
verify) and ran the actual query shapes against real DocDB 5.0:

- **No mobile endpoint's query fails on DocDB 5.0.** Zero hard-fails reachable from
  `/api/v1` — no pipeline `$lookup`, `$facet`, `$graphLookup`, `$text`, geo,
  server-side JS, `arrayFilters`, or incompatible index definitions.
- Only concern: **11 case-insensitive / unanchored `$regex` sites** (cars,
  requestitems, transmittals). They RUN, and once the `team` indexes exist they are
  **team-bounded** (IXSCAN on `team`, regex as a residual filter) — verified live.
  Revisit only if a single team's collection grows very large.
- Verify with `src/docdb-apiv1-compat.spec.ts` (functional + query plan) and
  `scripts/docdb-index-diagnostic.js` (index/scan check).

## Web/admin (non-/api/v1, session-auth) DocDB 5.0 compatibility — assessment + fixes

Swept all 233 web/admin endpoints (multi-agent trace + adversarial verify). Found 4 HIGH
hard-fails on 2 search endpoints — now FIXED with the same patterns the mobile migration used:
- `GET /api/revisions/` (`car.controller.ts`): `$expr/$regexMatch` full-name user search →
  whitespace-split `$and` of field-level `$regex`; orphaned `$meta:'textScore'` sort + projection
  (leftover after the earlier `$text`→`$regex` flatten) → removed.
- `GET /api/admin/users/` (`user.admin.controller.ts`): same `$expr/$regexMatch` → split `$and`.

Also fixed the 3 UNBOUNDED case-insensitive `$regex` scans (the other ~26 are team/company-bounded
and fine once indexes exist):
- `/api/admin/cars/` + `/api/company/stock/:companyId` filter cars by company/handlerCompany, which
  had no index → added `carSchema.index({ company: 1 })` + `{ handlerCompany: 1 }` (**rebuild indexes**).
- `/api/inventory/container/` venue-name search → bounded by `inventoryQuery.team` (uses {team,name}).

The static audit (`scripts/docdb-audit.js`) now also flags `$regexMatch` and `$meta` — it missed them
before (that's why it read "clean" while these hard-fails existed); re-running now gates them in CI.

## What was made DocDB-compatible

- **Pipeline-form `$lookup` (20)** in `inventory.controller.ts` and
  `transmittal.controller.ts` → flattened to basic `$lookup` +
  `$unwind`/`$match`/`$filter`/`$group`. DocDB supports only the basic
  `localField`/`foreignField` form (no `pipeline`, no correlated `let`).
- **`$text` search (5)** in `car.admin`, `venue.admin`, `car.controller` (×2),
  `request.controller` → `$regex` `$or` over the same fields; `textScore`
  sort/projection removed.
- **Text index definitions (4)** in `car`/`user`/`venue`/`participant` models →
  removed (DocDB has no text indexes; they were failing to create).

## Not fixed (intentional)

- `src/form/commands/asignClient.ts` — one-off script using `arrayFilters`
  (unsupported by DocDB). Not in the request path. Marked with a warning; do not
  run it against DocDB.
- `src/.old_migrations/*` — archived, not run.

## Tooling

```bash
# Static gate — fails (exit 1) on any DocDB-incompatible pattern. Wire into CI.
npm run audit:docdb

# Dynamic contract tests — run pipeline shapes against a real DocDB.
# Requires the bastion tunnel (below) + DOCDB_TEST_URI.
DOCDB_TEST_URI="mongodb://osacontrol:<pwd>@localhost:27018/osaAndes?tls=true&tlsCAFile=./global-bundle.pem&tlsAllowInvalidHostnames=true&directConnection=true&retryWrites=false&authSource=admin" \
  npm test -- --grep "DocDB compat"

# /api/v1 mobile query shapes — functional pass + query plan (IXSCAN vs COLLSCAN).
# NOTE: run ts-mocha directly (npm test is broken under Node >=22 native TS strip);
# set NODE_OPTIONS=--no-experimental-strip-types to hand .ts back to ts-node.
DOCDB_TEST_URI="..." NODE_OPTIONS="--no-experimental-strip-types" \
  npx ts-mocha -p tsconfig.json src/docdb-apiv1-compat.spec.ts --grep "mobile query shapes"

# Index/scan diagnostic — lists actual cluster indexes + whether {team} uses one.
DOCDB_TEST_URI="..." node scripts/docdb-index-diagnostic.js

# Build the app's indexes on the cluster (see the blocker section at the top).
DOCDB_TEST_URI="..." NODE_OPTIONS="--no-experimental-strip-types" TS_NODE_TRANSPILE_ONLY=1 \
  npx ts-node -P tsconfig.json scripts/docdb-build-indexes.ts
```

> Host Node must hand `.ts` to ts-node: the repo targets Node 18, but on Node
> ≥22.18 native type-stripping breaks `npm test` (chokes on `import = require()`).
> Prefix `NODE_OPTIONS=--no-experimental-strip-types`, or use `nvm install 18.17.1`.

## End-to-end test against DocDB (do this before cutover)

**1. Tunnel to DocDB** (bastion is already provisioned):
```bash
export PATH="/opt/homebrew/bin:$PATH"
# if the bastion SG rule was stripped by a main-stack apply, restore it first:
( cd terraform/bastion && terraform apply )
cd terraform/bastion && terraform output -raw port_forward_docdb | bash   # leave running
```

**2. Point the app at DocDB locally** (run on the host, NOT in Docker — the
container can't reach the host tunnel; and set the tunnel TLS opt-in):
```bash
export PATH="/opt/homebrew/bin:$PATH"
DOCDB_PWD=$(aws secretsmanager get-secret-value --secret-id andes-dev/docdb/master_password \
  --region sa-east-1 --query SecretString --output text)
export MONGODB_URI="mongodb://osacontrol:${DOCDB_PWD}@localhost:27018/osaAndes?tls=true&directConnection=true&retryWrites=false&authSource=admin"
export MONGO_TLS_CA_FILE=./global-bundle.pem
export MONGO_TLS_ALLOW_INVALID_HOSTNAMES=true   # tunnel only — never set in prod
# plus the usual REDIS_*, SECRET_KEY, etc. Then start the app (e.g. npm run dev:tsnode).
```

**3. Smoke-test the rewritten endpoints** (all previously 500'd on DocDB):
- `GET /api/inventory/container/` — containerInventoryDetail
- `GET /api/inventory/container/export`
- `GET /api/company/stock/:companyId` — currentCompanyStock
- `GET /api/company/stock/:companyId/export`
- transmittal report endpoints (distribution)
- Car/venue search boxes (admin + app) and `request` car search

Confirm each returns 200 with sensible data (especially **pagination totals** on
the stock/container endpoints — the flatten preserves cardinality, but verify
counts match the Atlas result for the same inputs).

## Cutover (dev workspace = the live env)

```bash
# 1. remove mongodb_uri_override from terraform/envs/dev.tfvars, then:
cd terraform && terraform workspace select dev && terraform apply -var-file=envs/dev.tfvars
# 2. roll the web service to the NEW task def (has MONGODB_URI=DocDB + CA env):
aws ecs update-service --cluster andes-dev-cluster --service andes-dev-web \
  --task-definition andes-dev-web --force-new-deployment --region sa-east-1
aws ecs wait services-stable --cluster andes-dev-cluster --services andes-dev-web --region sa-east-1
# 3. verify /health-check/ + logs show "mongoose: connected", no cert errors.
```
Keep Atlas alive until DocDB has run clean for a while. Rollback = re-add the
override, apply, re-roll.

## Known limitations / follow-ups

- **Search performance:** `$regex` (unanchored, case-insensitive) can't use a
  btree index → collection scans on large collections (cars ≈ 600k). If search
  latency matters, redesign (e.g. lowercased fields + anchored regex, or an
  external search service).
- **Result equivalence:** the complex stock/container flattens are cardinality-
  preserving by construction and verified to *run* on DocDB, but do the Atlas-vs-
  DocDB count diff in step 3 before trusting pagination.
- **SG footgun:** the main-stack DocDB/Redis SGs use inline `ingress`, which
  strips the bastion's standalone rule on every `apply`. Convert them to
  standalone `aws_vpc_security_group_ingress_rule` resources to stop this.
