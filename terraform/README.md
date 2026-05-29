# Andes backend — Terraform / ECS Fargate

Infrastructure for running andes-backend on **AWS ECS Fargate** in `sa-east-1`,
fronted by an ALB with ACM/Route53, backed by **DocumentDB** + **ElastiCache Redis**,
with **CircleCI** building and deploying.

## Layout

```
terraform/
├── bootstrap/            # one-time: creates S3 state bucket + DynamoDB lock table
├── secrets/              # standalone stack — Secrets Manager entries per env
├── envs/
│   ├── dev.tfvars
│   └── prod.tfvars
├── modules/
│   └── ecs-service/      # reusable web/worker service module
├── versions.tf
├── providers.tf
├── backend.tf            # remote state config (uses workspace key prefix)
├── variables.tf
├── locals.tf             # name = "${project}-${terraform.workspace}"
├── data.tf
├── network.tf            # VPC, subnets, NAT, SGs
├── ecr.tf                # ECR: andes/web + andes/billing
├── docdb.tf              # DocumentDB cluster
├── redis.tf              # ElastiCache Redis
├── secrets.tf            # Secrets Manager entries
├── iam.tf                # ECS task / execution / EventBridge roles
├── logs.tf               # CloudWatch log groups
├── alb.tf                # ALB + listeners + target group
├── route53.tf            # ACM cert (DNS validated) + alias record
├── ecs.tf                # cluster + web service + worker service + billing scheduled task
└── outputs.tf
```

## Resources created

- **VPC** (public + private + database subnets across 2-3 AZs), NAT gateway(s)
- **Application Load Balancer** with HTTP→HTTPS redirect, HTTPS via ACM cert
- **ACM certificate** + Route53 A-alias record for `<subdomain>.<zone>`
- **ECR repos**: `andes/web` (web + worker image), `andes/billing` (monthly cron image)
- **ECS Fargate cluster** with Container Insights
- **ECS web service** behind ALB, target tracking autoscale on CPU
- **ECS worker service** (no ALB, runs Bull queue processor)
- **EventBridge scheduled task** for monthly billing (cron `0 1 1 * *`)
- **DocumentDB** cluster (Mongo-compatible) — TLS enforced
- **ElastiCache Redis** replication group
- **Secrets Manager** entries for `MONGODB_URI` (derived) + 13 app secrets (placeholder)
- **CloudWatch log groups** per service, 30-day retention
- **IAM roles**: task execution, task runtime, EventBridge invoker

## First-time setup

### 1. Bootstrap the remote state backend

```bash
cd terraform/bootstrap
terraform init
terraform apply
# note the outputs — they match the defaults in ../backend.tf
cd ..
```

### 2. Apply the secrets stack (creates placeholder Secrets Manager entries)

```bash
cd terraform/secrets
terraform init
terraform workspace new dev    # repeat for: prod
terraform apply
cd ..
```

See `terraform/secrets/README.md` for the full list of keys created and the
naming convention.

### 3. Populate the secret values

```bash
aws secretsmanager put-secret-value --secret-id andes-dev/app/S3_KEY    --secret-string "AKIA..."
aws secretsmanager put-secret-value --secret-id andes-dev/app/S3_SECRET --secret-string "..."
aws secretsmanager put-secret-value --secret-id andes-dev/app/S3_BUCKET --secret-string "andes-uploads-dev"
# …etc for every key in terraform/secrets/locals.tf::default_secret_keys
```

`SECRET_KEY` is auto-generated on first apply (override via
`-var generate_secret_key=false`). `MONGODB_URI` is created by the main stack
in the next step from the auto-generated DocumentDB password — don't set it
manually.

### 4. Init the main stack and create workspaces

```bash
terraform init
terraform workspace new dev      # repeat for: prod
```

### 5. Edit env files

Open `envs/dev.tfvars` and `envs/prod.tfvars`, set:
- `route53_zone_name` — your Route53 hosted zone (e.g. `bwg.cl`)
- `subdomain`         — host under that zone (e.g. `andes-dev`)
- sizing knobs if you want different defaults

### 6. Plan & apply per env

```bash
terraform workspace select dev
terraform plan  -var-file=envs/dev.tfvars
terraform apply -var-file=envs/dev.tfvars
```

### 7. Build & push the first image

```bash
AWS_REGION=sa-east-1
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $ECR

docker build -f Dockerfile.prod -t $ECR/andes/web:$(git rev-parse HEAD) -t $ECR/andes/web:latest .
docker push $ECR/andes/web --all-tags

docker build -f Dockerfile.billing -t $ECR/andes/billing:$(git rev-parse HEAD) -t $ECR/andes/billing:latest .
docker push $ECR/andes/billing --all-tags
```

Force a new ECS deployment:

```bash
aws ecs update-service --cluster andes-dev-cluster --service andes-dev-web    --force-new-deployment
aws ecs update-service --cluster andes-dev-cluster --service andes-dev-worker --force-new-deployment
```

## CircleCI

Wire CircleCI to push to ECR + force a deployment on `develop` / `master`. The
existing `.circleci/config.yml` already builds images — point the build at the
new ECR repo and add a deploy step:

```yaml
- run:
    name: Push to ECR + roll ECS
    command: |
      ECR=$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com
      aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR
      docker build -f Dockerfile.prod -t $ECR/andes/web:$CIRCLE_SHA1 -t $ECR/andes/web:latest .
      docker push $ECR/andes/web --all-tags
      aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-web    --force-new-deployment
      aws ecs update-service --cluster andes-$ENV-cluster --service andes-$ENV-worker --force-new-deployment
```

The ECS service has `lifecycle.ignore_changes = [task_definition, desired_count]`,
so CI deploys via `force-new-deployment` won't drift against Terraform.

## DocumentDB TLS note

DocumentDB requires `tls=true` and the AWS RDS root CA bundle. The repo
already ships `global-bundle.pem` at the repo root. Make sure `Dockerfile.prod`
copies it into the image and the app reads it. Quickest path:

```dockerfile
COPY ./global-bundle.pem /srv/global-bundle.pem
ENV MONGO_TLS_CA_FILE=/srv/global-bundle.pem
```

Then in the mongoose connect call:

```ts
mongoose.connect(MONGODB_URI, {
  autoIndex: false,
  tlsCAFile: process.env.MONGO_TLS_CA_FILE,
});
```

## Destroy

```bash
terraform workspace select dev
terraform destroy -var-file=envs/dev.tfvars
```

DocumentDB has `deletion_protection = true` in prod; toggle that off via tfvars
+ apply before destroy.
