# Backend bootstrap

One-time stack that creates the S3 bucket the other stacks use as their
remote backend. Uses **local state** — don't migrate it to the bucket it just
created.

State locking uses S3-native object locks (`use_lockfile = true` in the other
stacks' backend configs). No DynamoDB table needed.

## Apply

```bash
cd terraform/bootstrap
terraform init
terraform apply
```

Note the `state_bucket` output — paste it into the `bucket` field of
`terraform/backend.tf`, `terraform/ci/backend.tf`, and
`terraform/secrets/backend.tf`.

## Defaults

- Bucket: `andes-backend-tfstate-<account-id>`
- Region: `sa-east-1`

Override via `-var state_bucket_name=...` if you need a different name.
