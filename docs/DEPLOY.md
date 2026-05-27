# Andes Backend — Deploy Manual

End-to-end runbook for deploying andes-backend to AWS ECS Fargate. Pair this
with `terraform/README.md` (Terraform-specific knobs) and
`terraform/secrets/README.md` (secret naming and rotation).

Audience: ops / platform engineers running the first deploy and the people
doing day-to-day rollouts after that.

---

## 1. Architecture

### 1.1 What runs where

```
                                  ┌─────────────────────────────────────────────┐
                                  │                Route 53                     │
                                  │  andes-<env>.<zone> ─► ALB (alias A record) │
                                  └───────────────────┬─────────────────────────┘
                                                      │ TLS (ACM cert, DNS-validated)
                                                      ▼
            ┌──────────────────────────────────────────────────────────────────┐
            │                Application Load Balancer (public subnets)       │
            │   :80  ─► 301 redirect to :443                                  │
            │   :443 ─► target group ──► ECS web tasks on :3030               │
            └────────────────────┬─────────────────────────────────────────────┘
                                 │ HTTP, SG = ecs_tasks
                                 ▼
        ┌────────────────────────────────────────────────────────────────────┐
        │                       VPC  (10.30.0.0/16)                          │
        │                                                                    │
        │  ┌─────────────────────┐  ┌─────────────────────┐                  │
        │  │  ECS web service    │  │  ECS worker service │                  │
        │  │  Fargate, private   │  │  Fargate, private   │                  │
        │  │  pm2-runtime        │  │  pm2-runtime        │                  │
        │  │  pm2.json           │  │  pm2-worker.json    │                  │
        │  │  CPU autoscaling    │  │  fixed count        │                  │
        │  │  Image: ECR andes/web                        │                  │
        │  └──────────┬──────────┘  └──────────┬──────────┘                  │
        │             │                        │                              │
        │             ▼                        ▼                              │
        │  ┌─────────────────────┐  ┌─────────────────────┐                  │
        │  │  DocumentDB cluster │  │  ElastiCache Redis  │                  │
        │  │  TLS enforced       │  │  sessions, Bull,    │                  │
        │  │  Mongo-compatible   │  │  mongoose cache     │                  │
        │  └─────────────────────┘  └─────────────────────┘                  │
        │                                                                    │
        │  ┌─────────────────────────────────────────────────────┐           │
        │  │  EventBridge schedule: cron(0 1 1 * ? *)            │           │
        │  │     └─► RunTask → ECS billing task (Fargate, one-shot)│         │
        │  │         Image: ECR andes/billing                    │           │
        │  └─────────────────────────────────────────────────────┘           │
        │                                                                    │
        │  NAT Gateway(s) in public subnets ◄── private egress               │
        └────────────────────────────────────────────────────────────────────┘
                                 │ egress
                                 ▼
                  Internet / S3 / SES / Sentry / Pusher / etc.
```

### 1.2 AWS services in play

| Service                | Purpose                                                    |
|------------------------|------------------------------------------------------------|
| **ECS Fargate**        | Web service, worker service, billing scheduled task        |
| **ALB**                | Public entrypoint, HTTPS termination, health checks        |
| **ACM**                | TLS cert for the ALB (DNS-validated via Route53)           |
| **Route 53**           | Public DNS — A-alias record to the ALB                     |
| **ECR**                | `andes/web` and `andes/billing` container repos            |
| **DocumentDB**         | Primary database (Mongo-compatible)                        |
| **ElastiCache Redis**  | Session store, mongoose query cache, Bull queues           |
| **Secrets Manager**    | All runtime credentials, injected to ECS tasks at startup  |
| **EventBridge**        | Monthly cron rule that fires the billing task              |
| **CloudWatch Logs**    | Per-service log groups: `/ecs/<env>/{web,worker,billing}`  |
| **CloudWatch Metrics** | Container Insights enabled on the cluster                  |
| **IAM**                | Task execution role, task role, EventBridge invoker role   |
| **S3 + DynamoDB**      | Terraform remote state + state locking                     |

### 1.3 Environment topology

Each environment (`dev`, `prod`) is a **fully isolated stack** sharing only the
S3 bucket where Terraform state lives. Naming follows
`andes-<workspace>-<resource>` across the board:

| Resource              | dev                          | prod                          |
|-----------------------|------------------------------|-------------------------------|
| ECS cluster           | `andes-dev-cluster`          | `andes-prod-cluster`          |
| ECS web service       | `andes-dev-web`              | `andes-prod-web`              |
| ECS worker service    | `andes-dev-worker`           | `andes-prod-worker`           |
| ALB                   | `andes-dev-alb`              | `andes-prod-alb`              |
| DocumentDB cluster    | `andes-dev-docdb`            | `andes-prod-docdb`            |
| Redis replication grp | `andes-dev-redis`            | `andes-prod-redis`            |
| Secret prefix         | `andes-dev/app/…`            | `andes-prod/app/…`            |
| CloudWatch log groups | `/ecs/andes-dev/{web,…}`     | `/ecs/andes-prod/{web,…}`     |

The Terraform workspace name (`dev`, `prod`) drives the `<env>` segment via
`local.name = "${var.project}-${terraform.workspace}"`.

### 1.4 Stack split

Four Terraform stacks, applied in order:

```
terraform/bootstrap   ── one-time, local state ── S3 bucket + DynamoDB lock table
terraform/ci          ── account-level, single state ── CircleCI OIDC provider + IAM role
terraform/secrets     ── per env via workspaces ── Secrets Manager entries
terraform/            ── per env via workspaces ── everything else
```

- The main stack reads secrets via `data "aws_secretsmanager_secret"` so the
  secrets stack stays decoupled — rotate secrets without touching infra.
- The CI stack is account-level (single state, no workspaces) because the
  OIDC provider URL is globally unique per AWS account. Its IAM role can
  deploy to any env enumerated in `var.environments`.

---

## 2. Prerequisites

### 2.1 Tools on your laptop

- `terraform` ≥ 1.6 (1.14.x tested)
- `aws` CLI v2, authenticated to the target account (see §2.3)
- `docker` (for building images locally if needed)
- `git`
- `jq` (recommended for inspecting secret JSON)

### 2.2 AWS account requirements

- An IAM principal with permissions to create: VPC, ECS, ALB, ACM, Route 53
  records (in your hosted zone), ECR, Secrets Manager, DocumentDB,
  ElastiCache, IAM roles, EventBridge, CloudWatch Logs.
  Start with the AWS-managed `PowerUserAccess` plus `IAMFullAccess` for the
  bootstrap; tighten later.
- An existing Route 53 **public hosted zone** for the domain you'll use
  (e.g. `bwg.cl`). The stack does a lookup — it does not create the zone.
- Service quota check: ECS Fargate vCPU per region defaults are usually
  sufficient, but verify if the account is new.

### 2.3 AWS profile

Configure a named profile per env (recommended) or rely on a single default
profile. Examples below assume `AWS_PROFILE=andes-prod` or
`AWS_PROFILE=andes-dev`.

```bash
aws configure --profile andes-prod
# region: sa-east-1
```

### 2.4 Repo state

```bash
git clone <repo>
cd andes-backend
git status                       # confirm clean working tree
ls global-bundle.pem             # MUST exist — DocumentDB CA bundle
```

If `global-bundle.pem` is missing, grab the current AWS RDS root bundle:

```bash
curl -fsSL -o global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

Commit it so CI image builds have it.

---

## 3. First-time deploy (per environment)

This sequence is for a brand-new environment. Re-run only the steps that
changed for routine updates (§5).

### Step 1 — Bootstrap the Terraform backend (once per AWS account)

```bash
cd terraform/bootstrap
terraform init
terraform apply
cd ..
```

Outputs:
- `state_bucket` — defaults to `andes-backend-tfstate-<account-id>`
- `lock_table`   — defaults to `andes-backend-tflock`

These match the defaults in `terraform/backend.tf` and
`terraform/secrets/backend.tf`. If you overrode the names in bootstrap, edit
those two `backend.tf` files to match before initializing the other stacks.

### Step 2 — Apply the secrets stack (creates placeholders)

```bash
cd terraform/secrets
terraform init
terraform workspace new dev      # or `prod`
terraform apply
```

This creates ~13 Secrets Manager entries named `andes-dev/app/<KEY>` with the
placeholder string `REPLACE_ME`. `SECRET_KEY` is auto-seeded with a random
64-char value (override via `-var generate_secret_key=false`).

See `terraform/secrets/README.md` for the full list of keys.

### Step 3 — Populate the secret values

Use the AWS CLI to set the real values. The infrastructure stack will
**fail at runtime** for any secret that's still `REPLACE_ME` (the container
will boot but auth/integrations will fail). See §4 for the full reference.

Minimum required for the app to start cleanly:

```bash
ENV=dev
aws secretsmanager put-secret-value --secret-id andes-$ENV/app/AWS_ACCESS_KEY_ID     --secret-string "AKIA…"
aws secretsmanager put-secret-value --secret-id andes-$ENV/app/AWS_SECRET_ACCESS_KEY --secret-string "…"
aws secretsmanager put-secret-value --secret-id andes-$ENV/app/SENTRY_DNS            --secret-string "https://…@sentry.io/…"
```

Everything else can stay as `REPLACE_ME` until you actually exercise the
feature (Pusher, Mixpanel, Mapbox, Gemini, Salfa SOAP).

`SECRET_KEY` is already seeded. `MONGODB_URI` is **not** in this stack — it's
created by the main stack in Step 5 with the auto-generated DocumentDB
password. `S3_BUCKET` is **not** a secret either — it's a plain env var set
from `var.s3_bucket` in tfvars.

> **Why AWS_ACCESS_KEY_ID is still in Secrets Manager**: the legacy
> `mongoose-crate-s3` library requires explicit credentials and can't consume
> the ECS task role. Every SDK-based callsite in the app already falls
> through to the task role automatically when these env vars are absent — so
> the day `mongoose-crate-s3` is replaced, these two secrets can be deleted
> and the task role takes over completely. The IAM task role
> (`andes-<env>-task`) already grants the required S3 and SES permissions.

### Step 4 — Initialize the main stack

```bash
cd ..                            # back to terraform/
terraform init
terraform workspace new dev      # match the secrets workspace
```

### Step 5 — Configure the env tfvars

Open `terraform/envs/dev.tfvars` and set:

```hcl
route53_zone_name = "your-domain.cl"   # existing Route 53 public zone
subdomain         = "andes-dev"         # produces andes-dev.your-domain.cl
s3_bucket         = "andes-uploads-dev" # existing S3 bucket the app uploads to
```

Optional: sizing knobs (`web`, `worker`, `docdb`, `redis`) — the defaults
are cost-tuned for dev. Adjust `prod.tfvars` similarly when you do prod.

### Step 6 — Plan and apply

```bash
terraform plan  -var-file=envs/dev.tfvars
terraform apply -var-file=envs/dev.tfvars
```

First apply takes **20–35 minutes**, mostly DocumentDB and ACM cert
validation. Useful outputs at the end:

- `ecr_web_repository_url`     — push images here
- `ecr_billing_repository_url` — billing image
- `ecs_cluster_name`           — for `aws ecs` commands
- `app_url`                    — e.g. `https://andes-dev.your-domain.cl`

### Step 7 — Build and push the first images

CircleCI (existing `.circleci/config.yml`) handles this on push to `develop`/
`master`. For the **first** deploy you usually want to do it manually so you
can verify before wiring CI.

```bash
AWS_REGION=sa-east-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR

# Web + worker (same image)
docker build -f Dockerfile.prod \
  -t $ECR/andes/web:$(git rev-parse HEAD) \
  -t $ECR/andes/web:latest .
docker push $ECR/andes/web --all-tags

# Billing
docker build -f Dockerfile.billing \
  -t $ECR/andes/billing:$(git rev-parse HEAD) \
  -t $ECR/andes/billing:latest .
docker push $ECR/andes/billing --all-tags
```

> The old `--build-arg S3_KEY=… --build-arg S3_SECRET=…` invocation is no
> longer needed — the images don't bake any credentials. All AWS access at
> runtime goes through Secrets Manager (for `mongoose-crate-s3`) and the ECS
> task role (for everything SDK-based). Update `.circleci/config.yml`
> accordingly: the old build-args are harmless if left, just ignored.

### Step 8 — Force the ECS services to roll the new image

```bash
ENV=dev
aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-web    --force-new-deployment
aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-worker --force-new-deployment
```

Watch the rollout:

```bash
aws ecs describe-services --cluster andes-$ENV-cluster \
  --services andes-$ENV-web andes-$ENV-worker \
  --query 'services[].{name:serviceName,running:runningCount,desired:desiredCount,deployments:length(deployments)}' \
  --output table
```

When `running == desired` and `deployments == 1` for both, the rollout is
finished.

### Step 9 — Smoke test

```bash
curl -fsS https://andes-$ENV.your-domain.cl/health-check/
# expect: 2xx
```

Then exercise an authenticated route or two through the app to confirm the
DocumentDB connection, Redis sessions, and S3 uploads all work end to end.

---

## 4. Credentials & Secrets

### 4.1 Where credentials live

| Type                          | Location                                                  | Managed by                |
|-------------------------------|-----------------------------------------------------------|---------------------------|
| App env-var secrets           | Secrets Manager `andes-<env>/app/<KEY>`                   | `terraform/secrets` stack |
| `MONGODB_URI`                 | Secrets Manager `andes-<env>/app/MONGODB_URI`             | main stack (auto)         |
| DocumentDB master password    | Secrets Manager `andes-<env>/docdb/master_password`       | main stack (auto)         |
| Redis AUTH token              | Not used (transit_encryption + SG-restricted access only) | —                         |
| ECS task execution role creds | IAM role `andes-<env>-task-execution` (STS-issued)         | main stack                |
| ECS task runtime role creds   | IAM role `andes-<env>-task` (STS-issued)                   | main stack                |
| Terraform AWS auth            | Your local `~/.aws/credentials` (operator) / CI env vars  | you                       |
| CircleCI → ECR/ECS auth       | CircleCI context env vars (`AWS_ACCESS_KEY` / `AWS_SECRET_KEY`) | CircleCI org admin   |

### 4.2 Full secret inventory

| Secret name (in `andes-<env>/app/`) | What it is                                              | Auto-generated? |
|--------------------------------------|---------------------------------------------------------|-----------------|
| `SECRET_KEY`                         | Express session-signing key                             | Yes (64 chars)  |
| `MONGODB_URI`                        | DocumentDB connection string (TLS)                      | Yes (main stack)|
| `AWS_ACCESS_KEY_ID`                  | AWS access key — required by `mongoose-crate-s3` only   | No              |
| `AWS_SECRET_ACCESS_KEY`              | AWS secret access key — required by `mongoose-crate-s3` | No              |
| `SENTRY_DNS`                         | Sentry DSN                                              | No              |
| `PUSHER_INSTANCE_ID`                 | Pusher Beams instance id                                | No              |
| `PUHSER_SECRET_KEY`                  | Pusher Beams secret (sic — app typo)                    | No              |
| `GEMINI_API_KEY`                     | Google Gemini API key                                   | No              |
| `MIXPANEL`                           | Mixpanel project token                                  | No              |
| `MAPBOX`                             | Mapbox token                                            | No              |
| `SALFA_SOAP`                         | Salfa integration SOAP endpoint/auth                    | No              |

The DocumentDB master password is also surfaced at
`andes-<env>/docdb/master_password` for break-glass debugging — the app
itself reads only `MONGODB_URI`.

> `S3_BUCKET` and `S3_REGION` are NOT secrets. They're plain env vars set by
> Terraform from `var.s3_bucket` and `var.region` and visible to anyone with
> `ecs:DescribeTaskDefinition`.

### 4.3 How secrets reach the container

```
Secrets Manager (andes-dev/app/SECRET_KEY)
   │
   │  (ARN listed in ECS task definition's `secrets[]` array)
   ▼
ECS agent at task start
   │  (uses task EXECUTION role to call secretsmanager:GetSecretValue)
   ▼
process.env.SECRET_KEY inside the container
```

The task execution role (`andes-<env>-task-execution`) is granted
`secretsmanager:GetSecretValue` on **only** the ARNs the task references —
not all secrets in the account. See `terraform/iam.tf::task_execution_secrets`.

Rotating a secret value via `put-secret-value` is picked up on the next task
restart. To force pickup immediately:

```bash
aws ecs update-service --cluster andes-<env>-cluster --service andes-<env>-web    --force-new-deployment
aws ecs update-service --cluster andes-<env>-cluster --service andes-<env>-worker --force-new-deployment
```

### 4.4 Setting a secret value

```bash
ENV=dev
KEY=S3_KEY
aws secretsmanager put-secret-value \
  --secret-id andes-$ENV/app/$KEY \
  --secret-string "AKIA…"
```

The Terraform resources use `lifecycle.ignore_changes = [secret_string]`, so
Terraform will not clobber the value on subsequent applies.

### 4.5 Reading a secret value (for debugging)

```bash
aws secretsmanager get-secret-value \
  --secret-id andes-dev/app/SECRET_KEY \
  --query SecretString --output text
```

Or pretty-print all keys at once:

```bash
ENV=dev
aws secretsmanager list-secrets \
  --filters Key=name,Values=andes-$ENV/app/ \
  --query 'SecretList[].Name' --output text \
  | tr '\t' '\n'
```

### 4.6 Rotating a secret

1. Generate / fetch the new value from the source of truth (AWS console for
   IAM users, Sentry project page for DSN, etc.).
2. `aws secretsmanager put-secret-value` (§4.4).
3. `aws ecs update-service … --force-new-deployment` for both web and worker.
4. Tail logs and confirm no auth errors:
   `aws logs tail /ecs/andes-<env>/web --since 5m --follow`.

For `SECRET_KEY` rotation specifically: existing sessions are invalidated
(users will be logged out). Schedule accordingly.

### 4.7 Adding a new secret

1. Append the key to `terraform/secrets/locals.tf::default_secret_keys`.
2. `cd terraform/secrets && terraform workspace select <env> && terraform apply`.
3. `aws secretsmanager put-secret-value` to set the value.
4. Append the same key to `terraform/secrets.tf::local.app_secret_keys` in
   the main stack — this makes it appear in the ECS task definitions' `secrets[]`
   array as a `process.env.<KEY>` mapping.
5. `cd .. && terraform apply -var-file=envs/<env>.tfvars` to roll the new task
   definition.

### 4.8 IAM principle: who can read what

| Principal                              | Can read                                              |
|----------------------------------------|-------------------------------------------------------|
| ECS task execution role (`-task-execution`) | All `andes-<env>/app/*` + `…/docdb/master_password` |
| ECS task runtime role (`-task`)             | Nothing in Secrets Manager (only S3 + SES at runtime) |
| EventBridge invoker (`-events-run-task`)    | Nothing — only `ecs:RunTask` + `iam:PassRole`        |
| You (operator)                              | Whatever your IAM principal allows                    |

Secrets are isolated by environment because the secret name itself encodes
the env: an `andes-dev-task-execution` role can only read `andes-dev/*`,
never `andes-prod/*`. Cross-env access is impossible without IAM changes.

### 4.9 What is NOT a secret (and why it's in plain env vars)

These are set as plain `environment` entries in the ECS task definition
(visible to anyone with `ecs:DescribeTaskDefinition`):

- `ENV`, `NODE_ENV`, `PORT`, `AWS_REGION`, `SES_REGION`
- `SITE_URL`, `REDIS_SERVICE_SERVICE_HOST`, `REDIS_CLUSTERED`
- `S3_BUCKET`, `S3_REGION` (bucket name and region are not credentials)
- `SENTRY_RELEASE`, `MONGO_TLS_CA_FILE` (path to the CA bundle, set in
  the Dockerfile — not a secret, just configuration)

Anything that grants access to a system goes through Secrets Manager.

### 4.10 How the app resolves AWS credentials

The app code has two ways of talking to AWS, and they resolve credentials
differently:

| Callsite                               | How credentials are resolved                                            |
|----------------------------------------|--------------------------------------------------------------------------|
| `mongoose-crate-s3` (12 model files)   | **Reads `process.env.AWS_ACCESS_KEY_ID` directly**, no SDK chain.       |
| `AWS.S3` SDK client (fileTrigger, admin) | **AWS SDK provider chain** — env vars first, then ECS task role.       |
| `AWS.SES` SDK client                   | Same — SDK provider chain (env vars first, then task role).             |

The SDK chain checks, in order:

1. Hardcoded `credentials: { … }` passed to the client constructor.
2. `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` env vars.
3. Shared credentials file (`~/.aws/credentials`).
4. **ECS task role** via the container metadata endpoint.

This is why **local dev and ECS production use the exact same code**:

- **Local**: dev's `.env` has `AWS_ACCESS_KEY_ID` → step #2 of the chain wins.
- **ECS**: env vars are set from Secrets Manager → also step #2 (matches
  what `mongoose-crate-s3` needs anyway).
- **Future** (after replacing `mongoose-crate-s3`): drop the env vars from
  Secrets Manager → SDK falls through to step #4 → task role takes over.

The IAM task role (`andes-<env>-task` in `terraform/iam.tf`) already grants:
- `ses:SendEmail`, `ses:SendRawEmail`
- `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:GetObjectAcl`,
  `s3:PutObjectAcl` on the configured bucket
- `s3:ListBucket`, `s3:GetBucketLocation` on the configured bucket

so the day the static creds are removed, nothing breaks.

---

## 5. Routine operations

### 5.1 Deploying a new app version

CircleCI builds and pushes; ECS rollout is manual for now.

1. Push code:
   ```bash
   git push origin develop      # or `master` for prod
   ```
2. Wait for CircleCI `build-and-push` to finish (auth via OIDC, see §6).
   Image is now at `andes-<env>/web:latest` and `andes-<env>/billing:latest`.
3. Force the rollout:
   ```bash
   ENV=dev
   aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-web    --force-new-deployment
   aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-worker --force-new-deployment
   ```

Adding auto-deploy is a small edit to `.circleci/config.yml` (add a `deploy`
job after `build-and-push` that runs the two `update-service` commands).
Defer until you've verified the new infra a few times.

Manual fallback (CI down — build locally):

```bash
ENV=dev
SHA=$(git rev-parse HEAD)
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR=$ACCOUNT_ID.dkr.ecr.sa-east-1.amazonaws.com

aws ecr get-login-password --region sa-east-1 | docker login -u AWS --password-stdin $ECR
docker build -f Dockerfile.prod -t $ECR/andes-$ENV/web:$SHA -t $ECR/andes-$ENV/web:latest .
docker push $ECR/andes-$ENV/web --all-tags

aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-web    --force-new-deployment
aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-worker --force-new-deployment
```

The ECS task definition uses image tag `latest` by default, with
`lifecycle.ignore_changes = [task_definition]` on the service. Deploys via
`force-new-deployment` and Terraform stays out of the way.

### 5.2 Rolling back to a previous image

```bash
ENV=dev
PREV_SHA=<commit-sha-of-good-image>

# Re-tag the older image as `latest`, then roll.
aws ecr batch-get-image --repository-name andes-$ENV/web --image-ids imageTag=$PREV_SHA \
  --query 'images[].imageManifest' --output text \
  | aws ecr put-image --repository-name andes-$ENV/web --image-tag latest --image-manifest file:///dev/stdin

aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-web    --force-new-deployment
aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-worker --force-new-deployment
```

### 5.3 Tailing logs

```bash
ENV=dev
aws logs tail /ecs/andes-$ENV/web    --since 10m --follow
aws logs tail /ecs/andes-$ENV/worker --since 10m --follow
aws logs tail /ecs/andes-$ENV/billing --since 24h
```

### 5.4 Exec into a running task

`enable_execute_command = true` is set on both services, so:

```bash
ENV=dev
TASK=$(aws ecs list-tasks --cluster andes-$ENV-cluster --service-name andes-$ENV-web \
        --query 'taskArns[0]' --output text)

aws ecs execute-command --cluster andes-$ENV-cluster --task $TASK \
  --container web --interactive --command "/bin/bash"
```

### 5.5 Running the billing task manually

```bash
ENV=dev
aws ecs run-task \
  --cluster andes-$ENV-cluster \
  --launch-type FARGATE \
  --task-definition andes-$ENV-billing \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-…,subnet-…],securityGroups=[sg-…],assignPublicIp=DISABLED}"
```

Subnet/SG IDs come from `terraform output private_subnet_ids` and the
`ecs_tasks` security group ID.

### 5.6 Scaling

Web service autoscales on CPU (target 60%) between `min_count` and
`max_count` from the env tfvars. Worker is fixed-count; adjust
`worker.desired_count` in tfvars and re-apply.

For a quick manual override (gets overridden by autoscaling for web):

```bash
aws ecs update-service --cluster andes-<env>-cluster --service andes-<env>-worker --desired-count 3
```

### 5.7 Connecting to DocumentDB from your laptop

DocDB is in private subnets — no direct internet access. Use an SSM Session
Manager port-forward via an EC2 bastion or a one-off `ecs run-task` with a
mongo-shell image. For ad-hoc debugging the simplest path:

```bash
# 1. Fetch the master password
aws secretsmanager get-secret-value \
  --secret-id andes-dev/docdb/master_password \
  --query SecretString --output text

# 2. From inside a running ECS task (§5.4):
mongosh "mongodb://osacontrol:<password>@andes-dev-docdb.…:27017/osaAndes?tls=true&replicaSet=rs0&retryWrites=false" \
  --tls --tlsCAFile /srv/global-bundle.pem
```

### 5.8 Destroying an environment

```bash
ENV=dev
cd terraform
terraform workspace select $ENV
terraform destroy -var-file=envs/$ENV.tfvars

# Then the secrets stack
cd secrets
terraform workspace select $ENV
terraform destroy
```

For prod, you'll first need to:
- Set `docdb.deletion_protection = false` and `docdb.skip_final_snapshot = true`
  (or be ready to wait for the final snapshot), then `terraform apply` once.
- Manually clean up any S3 buckets the app created at runtime (Terraform
  doesn't manage them).

---

## 6. CI/CD — CircleCI with OIDC

### 6.1 What's wired up

- **CircleCI config**: `.circleci/config.yml` has one job, `build-and-push`,
  which builds `Dockerfile.prod` and `Dockerfile.billing` and pushes to the
  env-specific ECR repos with tags `<sha>`, `<env>`, `latest`.
- **Auth**: CircleCI mints an OIDC token per job; the AWS SDK exchanges it
  for short-lived STS credentials via `sts:AssumeRoleWithWebIdentity`. There
  are no long-lived AWS keys anywhere in CircleCI.
- **Branches**: `develop` builds for `dev`, `master` builds for `prod`.
- **Rollout**: still manual today (`aws ecs update-service --force-new-deployment`).

### 6.2 One-time setup

Once per AWS account.

#### (a) Find your CircleCI Org ID and Project ID

- CircleCI UI → Organization Settings → Overview → Organization ID. Copy it.
- CircleCI UI → Project Settings → Overview → Project ID. Copy it.

#### (b) Apply the CI Terraform stack

```bash
cd terraform/ci
terraform init
terraform apply \
  -var circleci_org_id=<ORG_ID> \
  -var circleci_project_id=<PROJECT_ID>
```

Outputs:
- `ci_role_arn` — paste this into the CircleCI context (next step).
- `oidc_provider_arn` — useful for debugging, not needed by CI.

What this provisioned:
- An IAM OIDC provider for `oidc.circleci.com/org/<ORG_ID>`.
- An IAM role `andes-ci` with a trust policy scoped to your CircleCI org +
  project, and an inline policy that allows: ECR push to `andes-<env>/web`
  and `andes-<env>/billing` for each env in `var.environments`, and
  `ecs:UpdateService` on the per-env services.

#### (c) Create the CircleCI context

In CircleCI: **Organization Settings → Contexts → Create Context** → name it
`aws-ecs`. Add these environment variables:

| Name           | Value                                         |
|----------------|-----------------------------------------------|
| `AWS_ROLE_ARN` | (the `ci_role_arn` output from step b)        |
| `AWS_REGION`   | `sa-east-1`                                   |

Restrict the context to the deploy team if you want to gate who can trigger
pipelines.

#### (d) Enable the project in CircleCI

If the project isn't already enabled in CircleCI: **Projects → Set Up
Project** → pick "Fastest" or follow the existing config.

That's it. Push to `develop` or `master` and the pipeline runs.

### 6.3 How the OIDC handshake works

```
CircleCI job starts
  ├─ CircleCI mints a short-lived OIDC token (JWT)
  │    iss: https://oidc.circleci.com/org/<ORG_ID>
  │    aud: <ORG_ID>
  │    sub: org/<ORG_ID>/project/<PROJECT_ID>/...
  │
  ├─ Job calls `aws sts assume-role-with-web-identity` with the token
  │    and the role ARN from $AWS_ROLE_ARN
  │
  └─ AWS IAM verifies:
       1. Token signature → checked against the OIDC provider's JWKS
       2. Role's trust policy:
            - audience == <ORG_ID>                                  ✓
            - sub matches  org/<ORG_ID>/project/<PROJECT_ID>/*      ✓
       3. Issues 1h STS credentials (AccessKey, SecretKey, SessionToken)
       4. The orb writes those to ~/.aws/credentials for the rest of the job
```

A leaked OIDC token is useless after 1 hour, and the role's permissions are
narrowly scoped to ECR push + ECS update for the configured environments.

### 6.4 Adding `deploy` to the pipeline (when you're ready)

After `build-and-push`, add:

```yaml
  deploy:
    docker: [{ image: cimg/aws:2024.03 }]
    parameters:
      env: { type: enum, enum: ["dev", "prod"] }
    environment:
      AWS_REGION: sa-east-1
      ENV: << parameters.env >>
    steps:
      - aws-cli/setup:
          role_arn: ${AWS_ROLE_ARN}
          region: ${AWS_REGION}
          profile_name: default
      - run:
          name: Force new deployment
          command: |
            CLUSTER=andes-$ENV-cluster
            aws ecs update-service --cluster $CLUSTER --service andes-$ENV-web    --force-new-deployment
            aws ecs update-service --cluster $CLUSTER --service andes-$ENV-worker --force-new-deployment
            aws ecs wait services-stable --cluster $CLUSTER \
              --services andes-$ENV-web andes-$ENV-worker
```

And wire it into the workflow:

```yaml
workflows:
  build-deploy:
    jobs:
      - build-and-push: { name: build-dev, env: dev, context: aws-ecs,
                          filters: { branches: { only: develop } } }
      - deploy:         { name: deploy-dev, env: dev, context: aws-ecs,
                          requires: [build-dev],
                          filters: { branches: { only: develop } } }
      - build-and-push: { name: build-prod, env: prod, context: aws-ecs,
                          filters: { branches: { only: master } } }
      - hold-prod:      { type: approval, requires: [build-prod],
                          filters: { branches: { only: master } } }
      - deploy:         { name: deploy-prod, env: prod, context: aws-ecs,
                          requires: [hold-prod],
                          filters: { branches: { only: master } } }
```

### 6.5 Troubleshooting CI auth

| Symptom | Likely cause |
|---|---|
| `Not authorized to perform sts:AssumeRoleWithWebIdentity` | OIDC provider not in this AWS account, OR trust policy condition doesn't match the actual token claims. Check `terraform/ci/main.tf` and the CircleCI org/project IDs. |
| `An error occurred (AccessDeniedException) when calling the PutImage operation` | The `environments` var in `terraform/ci/` doesn't include the env you're trying to push to. Re-apply with the env added. |
| `denied: requested access to the resource is denied` (docker push) | `aws ecr get-login-password` failed silently. Run with `set -x` and check the role chain. |
| OIDC token returned but role assumption fails | The OIDC provider's thumbprint might be stale. `terraform apply` in `terraform/ci/` re-fetches it from `tls_certificate`. |

---

## 7. Troubleshooting

### 7.1 ECS task keeps restarting

```bash
ENV=dev
aws ecs describe-services --cluster andes-$ENV-cluster --services andes-$ENV-web \
  --query 'services[0].events[:5]'
```

Common causes:
- Health check on `/health-check/` failing → check `aws logs tail`.
- Secret `REPLACE_ME` somewhere the app immediately uses (e.g. Sentry init).
- DocumentDB connection failing — usually TLS bundle missing from the image
  (see §7.3).

### 7.2 Health check fails despite the app being up

The ALB target group health check expects `200-399` from `GET /health-check/`
on port 3030. If the app listens on a different port:
- Override `var.container_port` in tfvars and re-apply, OR
- Set `PORT=3030` in the task definition's plain env (already wired).

### 7.3 DocumentDB connection errors

Symptoms in logs: `MongoServerSelectionError`, `Server selection timeout`,
TLS handshake failures.

Checklist:
1. Is `MONGO_TLS_CA_FILE` set in the container?
   `aws ecs execute-command … --command "env | grep MONGO"`
2. Does the CA bundle exist at that path?
   `aws ecs execute-command … --command "ls -l /srv/global-bundle.pem"`
3. Is the DocumentDB security group allowing 27017 from the ECS task SG?
   (Terraform manages this — verify via console only if you suspect drift.)
4. Is `MONGODB_URI` actually the DocDB URI, or did somebody set it manually
   to something else? Re-read it:
   `aws secretsmanager get-secret-value --secret-id andes-<env>/app/MONGODB_URI`

### 7.4 ALB returns 503 Service Unavailable

The target group has no healthy targets. Either tasks aren't running, or
they're running but the health check is failing (see §7.1, §7.2).

### 7.5 ACM certificate stuck "Pending validation"

DNS validation records exist in Route 53 but ACM hasn't confirmed them.
- Make sure the zone passed to `route53_zone_name` is the **public** zone,
  not a private one.
- Check the validation records exist:
  `aws route53 list-resource-record-sets --hosted-zone-id <Z…>`
- AWS sometimes takes 5–30 minutes; if longer than that, recreate the cert.

### 7.6 Secrets Manager value still `REPLACE_ME`

Containers boot fine because Secrets Manager returns the placeholder string,
but the **app** will fail when it tries to use the value. To audit:

```bash
ENV=dev
for s in $(aws secretsmanager list-secrets \
            --filters Key=name,Values=andes-$ENV/app/ \
            --query 'SecretList[].Name' --output text); do
  v=$(aws secretsmanager get-secret-value --secret-id $s --query SecretString --output text)
  [ "$v" = "REPLACE_ME" ] && echo "STILL UNSET: $s"
done
```

---

## 8. Appendix

### 8.1 Common AWS resource IDs (per env)

```bash
ENV=dev
# Cluster
aws ecs describe-clusters --clusters andes-$ENV-cluster

# Services
aws ecs list-services --cluster andes-$ENV-cluster

# ALB
aws elbv2 describe-load-balancers --names andes-$ENV-alb

# DocDB
aws docdb describe-db-clusters --db-cluster-identifier andes-$ENV-docdb

# Redis
aws elasticache describe-replication-groups --replication-group-id andes-$ENV-redis

# Secrets
aws secretsmanager list-secrets --filters Key=name,Values=andes-$ENV/
```

### 8.2 Quick reference — Terraform outputs

After `terraform apply`:

```bash
cd terraform
terraform output
```

Returns: `alb_dns_name`, `app_url`, `ecr_web_repository_url`,
`ecr_billing_repository_url`, `ecs_cluster_name`, `ecs_web_service_name`,
`ecs_worker_service_name`, `docdb_endpoint`, `redis_endpoint`, `vpc_id`,
`private_subnet_ids`.

### 8.3 Files that matter

```
andes-backend/
├── terraform/                       # all infra (see terraform/README.md)
│   ├── bootstrap/                   # S3 + DynamoDB for state (once)
│   ├── ci/                          # CircleCI OIDC provider + IAM role
│   ├── secrets/                     # Secrets Manager (per env)
│   ├── envs/{dev,prod}.tfvars       # per-env sizing + DNS
│   └── (main stack at root)
├── .circleci/config.yml             # build-and-push pipeline (OIDC to AWS)
├── Dockerfile.prod                  # web + worker image (entrypoint via pm2.json / pm2-worker.json)
├── Dockerfile.billing               # billing one-shot image
├── global-bundle.pem                # AWS RDS root CA — DocumentDB TLS
├── src/services/mongo.service.ts    # DocDB-aware mongoose connect helper
├── src/server.ts                    # web entry (uses connectMongo)
├── src/app/commands/BillingTeamRun.ts  # billing entry (uses connectMongo)
└── docs/DEPLOY.md                   # this file
```
