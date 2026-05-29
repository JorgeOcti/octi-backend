# Bastion stack (occasional)

Standalone Terraform stack that spins up a tiny **SSM-managed EC2 bastion**
in the main stack's VPC. Used for one-off database access (migrations, ad-hoc
mongosh sessions, mongorestore, etc.).

Designed to be **created on demand and destroyed when done**:
- `terraform apply` → bastion running, ~$4/month if you forget it
- `terraform destroy` → gone, $0

No SSH keys. AWS Systems Manager Session Manager handles auth + port forwarding.

## What it provisions

| Resource | Notes |
|---|---|
| `aws_instance` t4g.nano | Amazon Linux 2023 ARM, IMDSv2-only, no public IP, private subnet |
| `aws_iam_role` + instance profile | `AmazonSSMManagedInstanceCore` only — no other rights |
| `aws_security_group` (bastion) | No inbound, full outbound (egress reaches SSM endpoints via NAT) |
| `aws_vpc_security_group_ingress_rule` × 2 | Adds rules to main stack's DocDB SG and Redis SG allowing the bastion |

## Workflow

### 1. Apply

```bash
cd terraform/bastion
terraform init
terraform workspace new dev          # or `select dev`
terraform apply
```

Outputs:

```
instance_id      = i-0abc1234...
docdb_endpoint   = andes-dev-docdb.cluster-xxxxx.sa-east-1.docdb.amazonaws.com
port_forward_docdb = aws ssm start-session --target i-0abc...
```

Allow ~30s for SSM agent on the new instance to register before you start a session.

### 2. Start the SSM port-forward (terminal 1, leave running)

```bash
terraform output -raw port_forward_docdb | bash
```

This binds `localhost:27018` on your laptop → DocDB:27017 through the bastion.
Keep this terminal open during the migration.

### 3. Dump / restore (terminal 2)

```bash
# Get DocDB master password (Terraform set it; auto-generated)
DOCDB_PWD=$(aws secretsmanager get-secret-value \
  --secret-id andes-dev/docdb/master_password \
  --query SecretString --output text)

# Dump local Mongo to a single archive
docker compose exec mongo mongodump \
  --username osacontrol --password osacontrol --authenticationDatabase admin \
  --db osaAndesProduction --gzip --archive > local-dump.archive

# Restore to DocDB via the tunnel
mongorestore \
  --uri="mongodb://osacontrol:${DOCDB_PWD}@localhost:27018/?tls=true&tlsCAFile=./global-bundle.pem&retryWrites=false&directConnection=true" \
  --gzip --archive=local-dump.archive
```

> `directConnection=true` is required. We're tunneling to a single host; without
> this flag the Mongo driver tries cluster topology discovery and gets back
> DocDB's internal hostnames (which your laptop can't resolve).

### 4. Destroy when done

```bash
cd terraform/bastion
terraform destroy
```

Or just stop the EC2 if you'll come back soon:

```bash
INSTANCE_ID=$(terraform output -raw instance_id)
aws ec2 stop-instances --instance-ids $INSTANCE_ID
# Later:
aws ec2 start-instances --instance-ids $INSTANCE_ID
```

When stopped, you pay only for the 8 GB EBS volume (~$0.80/month). When
destroyed, $0.

## Cost

| State | $/month |
|---|---|
| `terraform apply` (running) | ~$4.70 |
| `aws ec2 stop-instances` | ~$0.80 (EBS storage only) |
| `terraform destroy` | $0 |

## Troubleshooting

- **`InvalidInstanceId.NotFound`** when starting the session → instance just
  booted; wait 30–60s for the SSM agent to register.
- **Session opens but connection refused on localhost:27018** → DocDB endpoint
  rejected the connection. Check `aws docdb describe-db-clusters` — cluster
  must be `available`, not `stopped`.
- **TLS handshake failure during mongorestore** → make sure
  `global-bundle.pem` is in your current directory and the path in `tlsCAFile`
  is correct.
- **`MongoServerSelectionError`** without `directConnection=true` → see note
  above. Required for SSM-tunneled connections.

## Why a separate stack and not in main?

- Only needed occasionally — keeps the always-on infra clean.
- Different lifecycle: create / use / destroy in a single afternoon.
- Self-contained: if you ever delete this directory, the main stack is unaffected
  (the ingress rules on docdb/redis SGs get cleaned up via terraform destroy).
