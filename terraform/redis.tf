resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name}-redis"
  subnet_ids = module.vpc.private_subnets
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${local.name}-redis"
  description                = "Redis for ${local.name} (sessions, mongoose cache, Bull queues)"
  engine                     = "redis"
  engine_version             = var.redis.engine_version
  node_type                  = var.redis.node_type
  num_cache_clusters         = var.redis.num_cache_nodes
  parameter_group_name       = var.redis.parameter_group_name
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = var.redis.num_cache_nodes > 1
  multi_az_enabled           = var.redis.num_cache_nodes > 1
  at_rest_encryption_enabled = true
  transit_encryption_enabled = var.redis.transit_encryption
  apply_immediately          = true
}
