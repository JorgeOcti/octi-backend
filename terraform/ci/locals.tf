locals {
  account_id = data.aws_caller_identity.current.account_id

  # ECR repo ARNs the CI role is allowed to push to.
  ecr_repo_arns = flatten([
    for env in var.environments : [
      "arn:aws:ecr:${var.region}:${local.account_id}:repository/${var.project}-${env}/web",
      "arn:aws:ecr:${var.region}:${local.account_id}:repository/${var.project}-${env}/billing",
    ]
  ])

  # ECS service ARNs the CI role is allowed to update.
  ecs_service_arns = flatten([
    for env in var.environments : [
      "arn:aws:ecs:${var.region}:${local.account_id}:service/${var.project}-${env}-cluster/${var.project}-${env}-web",
      "arn:aws:ecs:${var.region}:${local.account_id}:service/${var.project}-${env}-cluster/${var.project}-${env}-worker",
    ]
  ])

  ecs_cluster_arns = [
    for env in var.environments :
    "arn:aws:ecs:${var.region}:${local.account_id}:cluster/${var.project}-${env}-cluster"
  ]
}
