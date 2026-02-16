# Production Environment Configuration

environment = "production"
aws_region  = "us-east-1"

# VPC
vpc_cidr = "10.1.0.0/16"

# RDS (production sized)
db_instance_class    = "db.t3.small"
db_allocated_storage = 50
db_name              = "fitstudio"

# ElastiCache (production sized)
redis_node_type  = "cache.t3.small"
redis_num_nodes  = 1

# ECS (production sized)
ecs_cpu           = 512
ecs_memory        = 1024
ecs_desired_count = 2
ecs_min_count     = 2
ecs_max_count     = 10

# Monitoring
log_retention_days = 90
