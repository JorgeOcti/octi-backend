locals {
  full_name = "${var.name_prefix}-${var.name}"

  container_definition = merge(
    {
      name      = var.name
      image     = var.image
      essential = true

      environment = [
        for k, v in var.environment : { name = k, value = v }
      ]

      secrets = [
        for k, arn in var.secrets : { name = k, valueFrom = arn }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = var.log_group_name
          "awslogs-region"        = var.log_region
          "awslogs-stream-prefix" = var.name
        }
      }
    },
    length(var.command) > 0 ? { command = var.command } : {},
    var.container_port > 0 ? {
      portMappings = [{
        containerPort = var.container_port
        hostPort      = var.container_port
        protocol      = "tcp"
      }]
    } : {},
    var.health_check_path != "" ? {
      healthCheck = {
        command     = ["CMD-SHELL", "wget -q -O- http://localhost:${var.container_port}${var.health_check_path} || exit 1"]
        interval    = 15
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    } : {},
  )
}

resource "aws_ecs_task_definition" "this" {
  family                   = local.full_name
  cpu                      = var.cpu
  memory                   = var.memory
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

  container_definitions = jsonencode([local.container_definition])

  tags = var.tags
}

resource "aws_ecs_service" "this" {
  name            = local.full_name
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.this.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.subnet_ids
    security_groups  = var.security_group_ids
    assign_public_ip = false
  }

  dynamic "load_balancer" {
    for_each = var.target_group_arn == null ? [] : [1]
    content {
      target_group_arn = var.target_group_arn
      container_name   = var.name
      container_port   = var.container_port
    }
  }

  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  enable_execute_command = true

  lifecycle {
    # Allow image rollouts from CI without Terraform diffs fighting them.
    ignore_changes = [task_definition, desired_count]
  }

  tags = var.tags
}
