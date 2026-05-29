# ---------------------------------------------------------------------------
# IAM — SSM-managed instance. No SSH keys.
# ---------------------------------------------------------------------------

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "bastion" {
  name               = "${local.name}-bastion"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

# Grants the SSM agent on the instance the rights to register, send heartbeats,
# and accept Session Manager connections.
resource "aws_iam_role_policy_attachment" "bastion_ssm" {
  role       = aws_iam_role.bastion.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "bastion" {
  name = "${local.name}-bastion"
  role = aws_iam_role.bastion.name
}

# ---------------------------------------------------------------------------
# Security group — no inbound, full outbound (needs egress for SSM + DocDB).
# ---------------------------------------------------------------------------

resource "aws_security_group" "bastion" {
  name        = "${local.name}-bastion"
  description = "Bastion - no inbound, outbound to DocDB/Redis/SSM via NAT"
  vpc_id      = data.aws_vpc.main.id

  egress {
    description = "All outbound (SSM endpoints via NAT, DocDB 27017, Redis 6379)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Add ingress on DocDB SG so the bastion can reach Mongo.
# Using aws_vpc_security_group_ingress_rule (the per-rule resource) keeps this
# clean even though the main stack uses inline ingress blocks elsewhere.
resource "aws_vpc_security_group_ingress_rule" "docdb_from_bastion" {
  security_group_id            = data.aws_security_group.docdb.id
  referenced_security_group_id = aws_security_group.bastion.id
  ip_protocol                  = "tcp"
  from_port                    = 27017
  to_port                      = 27017
  description                  = "Mongo from bastion (SSM port-forward)"
}

resource "aws_vpc_security_group_ingress_rule" "redis_from_bastion" {
  security_group_id            = data.aws_security_group.redis.id
  referenced_security_group_id = aws_security_group.bastion.id
  ip_protocol                  = "tcp"
  from_port                    = 6379
  to_port                      = 6379
  description                  = "Redis from bastion (SSM port-forward)"
}

# ---------------------------------------------------------------------------
# The bastion instance.
# ---------------------------------------------------------------------------

resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = data.aws_subnets.private.ids[0]
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  iam_instance_profile        = aws_iam_instance_profile.bastion.name
  associate_public_ip_address = false

  root_block_device {
    volume_type = "gp3"
    volume_size = 8
    encrypted   = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 2
  }

  tags = {
    Name = "${local.name}-bastion"
  }

  lifecycle {
    # Don't fight if you `aws ec2 stop-instances` to pause billing.
    ignore_changes = [user_data, user_data_base64]
  }
}
