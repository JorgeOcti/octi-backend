# CI / OIDC stack

Account-level stack that provisions:

- **CircleCI OIDC identity provider** in AWS IAM.
- **Single IAM role** that CircleCI assumes via OIDC. No static access keys.
- **Scoped permissions**: ECR push on env-specific repos + `ecs:UpdateService` on
  env-specific services.

Single state (no workspaces) because OIDC providers are unique per AWS account.

## Apply

You need two pieces of info from CircleCI first:

1. **Organization ID** — CircleCI UI → Organization Settings → Overview → Organization ID.
2. **(Optional) Project ID** — Project Settings → Overview → Project ID. If set,
   only this project's pipelines can assume the role. Strongly recommended.

```bash
cd terraform/ci
terraform init
terraform apply \
  -var circleci_org_id=00000000-0000-0000-0000-000000000000 \
  -var circleci_project_id=11111111-1111-1111-1111-111111111111
```

Or put them in a `terraform.tfvars`:

```hcl
circleci_org_id     = "00000000-0000-0000-0000-000000000000"
circleci_project_id = "11111111-1111-1111-1111-111111111111"
```

Output:

```
ci_role_arn = "arn:aws:iam::123456789012:role/andes-ci"
```

## Configure CircleCI

1. In CircleCI: Organization Settings → Contexts → create context `aws-ecs`.
2. Add this env var:

   | Name           | Value                                              |
   |----------------|----------------------------------------------------|
   | `AWS_ROLE_ARN` | (output `ci_role_arn` from above)                  |
   | `AWS_REGION`   | `sa-east-1`                                        |

3. The `.circleci/config.yml` is already wired to assume `$AWS_ROLE_ARN` via OIDC.

## How the trust works

```
CircleCI job starts
  ├─ CircleCI mints a short-lived OIDC token for the job
  │    iss: https://oidc.circleci.com/org/<ORG_ID>
  │    aud: <ORG_ID>
  │    sub: org/<ORG_ID>/project/<PROJECT_ID>/...
  │
  ├─ Job calls `aws sts assume-role-with-web-identity` with the OIDC token
  │
  └─ AWS IAM:
       1. Verifies token signature against the OIDC provider's JWKS
       2. Checks the role's trust policy:
            - aud == <ORG_ID>                                 ✓
            - sub matches org/<ORG_ID>/project/<PROJECT_ID>/* ✓ (if set)
       3. Issues 1h STS credentials with this role's permissions
       4. CircleCI gets temporary AccessKey + SecretKey + SessionToken
```

## What the role can do

| Action category | Resources |
|---|---|
| `ecr:GetAuthorizationToken` | `*` (AWS requires this) |
| ECR push (`PutImage`, `Upload*`, etc.) | `andes-<env>/web`, `andes-<env>/billing` for each env in `var.environments` |
| `ecs:UpdateService` | `andes-<env>-web`, `andes-<env>-worker` for each env |
| `ecs:Describe*` / `ecs:List*` | Constrained to `andes-<env>-cluster` via the `ecs:cluster` condition |

The role canNOT:
- Read or write any secrets
- Touch databases, VPC, IAM, etc.
- Deploy to environments not in `var.environments`

## Adding a new environment

```bash
terraform apply \
  -var circleci_org_id=... \
  -var 'environments=["dev","prod","staging"]'
```

The role's policy automatically grows to include the new env's ECR repos and ECS services.

## Rotating / destroying

To kill CircleCI's access entirely:

```bash
terraform destroy
```

This removes the OIDC provider and the role. CircleCI jobs that try to assume
the role will fail. Re-running `terraform apply` restores it; nothing in
CircleCI needs to change because the role ARN stays the same (unless you
changed `var.project`).
