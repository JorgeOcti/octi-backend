output "alb_dns_name" {
  description = "Public ALB DNS name. Route53 alias points here."
  value       = aws_lb.main.dns_name
}

output "app_url" {
  description = "Public app URL."
  value       = "https://${local.domain}"
}

output "ecr_web_repository_url" {
  description = "ECR repo URL for the web/worker image. Push tags here from CI."
  value       = aws_ecr_repository.web.repository_url
}

output "ecr_billing_repository_url" {
  description = "ECR repo URL for the billing image."
  value       = aws_ecr_repository.billing.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_web_service_name" {
  value = module.web.service_name
}

output "ecs_worker_service_name" {
  value = module.worker.service_name
}

output "docdb_endpoint" {
  description = "DocumentDB writer endpoint."
  value       = aws_docdb_cluster.main.endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint."
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "private_subnet_ids" {
  value = module.vpc.private_subnets
}
