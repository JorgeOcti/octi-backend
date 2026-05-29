resource "aws_ecs_cluster" "main" {
  name = "${local.name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
    base              = 1
  }
}

# --- Shared task config -----------------------------------------------------

locals {
  web_image     = "${aws_ecr_repository.web.repository_url}:${var.image_tag}"
  billing_image = "${aws_ecr_repository.billing.repository_url}:${var.image_tag}"

  # Plain (non-secret) env vars. Match the variable names the app already reads.
  # When mongodb_uri_override is set (using a non-DocDB Mongo), MONGO_TLS_CA_FILE
  # is cleared so connectMongo skips the DocDB TLS bundle. Otherwise the image's
  # default ENV MONGO_TLS_CA_FILE=/srv/global-bundle.pem takes effect.
  app_environment = merge(
    {
      ENV                        = var.node_env
      NODE_ENV                   = var.node_env
      PORT                       = tostring(var.container_port)
      AWS_REGION                 = var.region
      SES_REGION                 = var.ses_region
      SITE_URL                   = var.site_url != "" ? var.site_url : "https://${local.domain}"
      REDIS_SERVICE_SERVICE_HOST = aws_elasticache_replication_group.main.primary_endpoint_address
      REDIS_CLUSTERED            = "false"
      S3_BUCKET                  = var.s3_bucket
      S3_REGION                  = var.region
      SENTRY_RELEASE             = var.image_tag
    },
    var.mongodb_uri_override != "" ? { MONGO_TLS_CA_FILE = "" } : {},
  )

  # Map of container env var name → Secrets Manager ARN.
  # Combines: main-stack-derived secrets + looked-up app secrets from the secrets stack.
  app_secrets = merge(
    {
      MONGODB_URI           = aws_secretsmanager_secret.mongodb_uri.arn
      AWS_ACCESS_KEY_ID     = aws_secretsmanager_secret.aws_access_key_id.arn
      AWS_SECRET_ACCESS_KEY = aws_secretsmanager_secret.aws_secret_access_key.arn
    },
    {
      for k, s in data.aws_secretsmanager_secret.app : k => s.arn
    },
  )
}

# --- Web service (Express, behind ALB) --------------------------------------

module "web" {
  source = "./modules/ecs-service"

  name        = "web"
  name_prefix = local.name

  cluster_id = aws_ecs_cluster.main.id

  image          = local.web_image
  command        = ["pm2-runtime", "start", "pm2.json"]
  container_port = var.container_port

  cpu           = var.web.cpu
  memory        = var.web.memory
  desired_count = var.web.desired_count

  environment = local.app_environment
  secrets     = local.app_secrets

  execution_role_arn = aws_iam_role.task_execution.arn
  task_role_arn      = aws_iam_role.task.arn

  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.ecs_tasks.id]

  log_group_name = aws_cloudwatch_log_group.web.name
  log_region     = data.aws_region.current.name

  target_group_arn  = aws_lb_target_group.web.arn
  health_check_path = "/health-check/"

  tags = local.common_tags
}

# --- Worker service (Bull queues / integrations) ----------------------------

module "worker" {
  source = "./modules/ecs-service"

  name        = "worker"
  name_prefix = local.name

  cluster_id = aws_ecs_cluster.main.id

  image   = local.web_image
  command = ["pm2-runtime", "start", "pm2-worker.json"]

  cpu           = var.worker.cpu
  memory        = var.worker.memory
  desired_count = var.worker.desired_count

  environment = local.app_environment
  secrets     = local.app_secrets

  execution_role_arn = aws_iam_role.task_execution.arn
  task_role_arn      = aws_iam_role.task.arn

  subnet_ids         = module.vpc.private_subnets
  security_group_ids = [aws_security_group.ecs_tasks.id]

  log_group_name = aws_cloudwatch_log_group.worker.name
  log_region     = data.aws_region.current.name

  tags = local.common_tags
}

# --- Web service autoscaling ------------------------------------------------

resource "aws_appautoscaling_target" "web" {
  service_namespace  = "ecs"
  resource_id        = "service/${aws_ecs_cluster.main.name}/${module.web.service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = var.web.min_count
  max_capacity       = var.web.max_count
}

resource "aws_appautoscaling_policy" "web_cpu" {
  name               = "${local.name}-web-cpu"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.web.service_namespace
  resource_id        = aws_appautoscaling_target.web.resource_id
  scalable_dimension = aws_appautoscaling_target.web.scalable_dimension

  target_tracking_scaling_policy_configuration {
    target_value = 60
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# --- Billing scheduled task (monthly) ---------------------------------------

resource "aws_ecs_task_definition" "billing" {
  family                   = "${local.name}-billing"
  cpu                      = var.billing.cpu
  memory                   = var.billing.memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name      = "billing"
    image     = local.billing_image
    essential = true

    environment = [for k, v in local.app_environment : { name = k, value = v }]
    secrets     = [for k, arn in local.app_secrets : { name = k, valueFrom = arn }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.billing.name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "billing"
      }
    }
  }])
}

resource "aws_cloudwatch_event_rule" "billing" {
  name                = "${local.name}-billing-monthly"
  description         = "Monthly billing run for ${local.name}"
  schedule_expression = var.billing.schedule
  state               = var.billing.enabled ? "ENABLED" : "DISABLED"
}

resource "aws_cloudwatch_event_target" "billing" {
  rule      = aws_cloudwatch_event_rule.billing.name
  target_id = "billing-task"
  arn       = aws_ecs_cluster.main.arn
  role_arn  = aws_iam_role.events_run_task.arn

  ecs_target {
    task_definition_arn = aws_ecs_task_definition.billing.arn
    launch_type         = "FARGATE"
    platform_version    = "LATEST"

    network_configuration {
      subnets          = module.vpc.private_subnets
      security_groups  = [aws_security_group.ecs_tasks.id]
      assign_public_ip = false
    }
  }
}
