# S3 gateway VPC endpoint. Routes S3 traffic (mongoose-crate-s3 uploads and
# image retrieval from ECS tasks) straight to S3 instead of out through the NAT
# gateway, which removes those bytes from NAT data-processing charges.
# Gateway endpoints themselves are free.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    module.vpc.private_route_table_ids,
    module.vpc.database_route_table_ids,
  )

  tags = merge(local.common_tags, {
    Name = "${local.name}-s3-endpoint"
  })
}
