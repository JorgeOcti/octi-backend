# Secrets stack

Standalone Terraform stack that owns the **Secrets Manager** entries the app
reads at runtime. Values are provided declaratively via env-specific tfvars
files — no manual `aws secretsmanager put-secret-value` needed.

## Naming convention

Each secret is created at:

```
{project}-{workspace}/app/{KEY}
```

So with `project = andes` and workspace `dev`, the `SECRET_KEY` is named:

```
andes-dev/app/SECRET_KEY
```

## Secret values come from a tfvars file

Each environment has its own gitignored tfvars file under `envs/`. Copy the
example, fill in the values, apply.

```bash
cd terraform/secrets

# 1. Init + select workspace (per env)
terraform init
terraform workspace new dev          # or `select dev` if it exists

# 2. Provide values
cp envs/dev.tfvars.example envs/dev.tfvars
$EDITOR envs/dev.tfvars               # paste the real values

# 3. Apply
terraform apply -var-file=envs/dev.tfvars
```

Repeat for `prod` against `envs/prod.tfvars`.

### `envs/<env>.tfvars` shape

```hcl
secret_values = {
  AWS_ACCESS_KEY_ID     = "AKIA..."
  AWS_SECRET_ACCESS_KEY = "..."
  SENTRY_DNS            = "https://...@sentry.io/..."
  PUSHER_INSTANCE_ID    = "..."
  # ...etc
  # SECRET_KEY = "..."   # auto-generated when omitted
}
```

Any required key (see `locals.tf::required_secret_keys`) that you leave out of
this map gets the placeholder string `REPLACE_ME` — the secret is created
but the app will fail when it tries to use that feature. SECRET_KEY is a
special case: omitting it triggers auto-generation of a random 64-char value.

### Adding a new secret

Either:

- Put the new key in your `secret_values` map. It gets created automatically.
- For consistency across envs, also add it to `locals.tf::required_secret_keys`
  so it's always created even if a value isn't provided.

## Updating / rotating a secret

1. Edit `envs/<env>.tfvars` with the new value.
2. `terraform apply -var-file=envs/<env>.tfvars`.
3. Force the ECS services to pick up the new value:
   ```bash
   aws ecs update-service --cluster andes-<env>-cluster --service andes-<env>-web    --force-new-deployment
   aws ecs update-service --cluster andes-<env>-cluster --service andes-<env>-worker --force-new-deployment
   ```

> Note: Terraform owns the values now (no `ignore_changes`). If you also use
> `aws secretsmanager put-secret-value` to override a value, the next
> `terraform apply` will revert it to whatever's in the tfvars. Pick one source
> of truth.

## Security notes

- `envs/*.tfvars` files are **gitignored**. Never commit them.
- Secret values end up in the **Terraform state file** at
  `s3://andes-backend-tfstate-<account-id>/env:/<workspace>/andes-backend/secrets.tfstate`.
  The state bucket has SSE-AES256 + public-access-block, but anyone with
  S3 read on it can decode the values. Treat S3 IAM on that bucket the same
  way you'd treat access to Secrets Manager directly.
- `var.secret_values` is marked `sensitive` in Terraform, so `terraform plan`
  and `apply` outputs redact the values to `(sensitive value)`.

## MONGODB_URI is NOT here

`MONGODB_URI` is created by the **main stack**, not this one, because its
value is derived from the DocumentDB endpoint + auto-generated master
password. Same naming convention — `andes-<env>/app/MONGODB_URI` — just
managed where the data is.

## Verifying what's in Secrets Manager

```bash
ENV=dev
aws secretsmanager list-secrets \
  --filters Key=name,Values=andes-$ENV/app/ \
  --query 'SecretList[].Name' --output text | tr '\t' '\n'
```

To find anything still set to the placeholder:

```bash
ENV=dev
for s in $(aws secretsmanager list-secrets \
            --filters Key=name,Values=andes-$ENV/app/ \
            --query 'SecretList[].Name' --output text); do
  v=$(aws secretsmanager get-secret-value --secret-id $s --query SecretString --output text)
  [ "$v" = "REPLACE_ME" ] && echo "PLACEHOLDER: $s"
done
```
