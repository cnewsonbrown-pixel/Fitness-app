# Staging Environment Configuration

environment = "staging"
aws_region  = "us-east-1"

# VPC
vpc_cidr = "10.0.0.0/16"

# RDS (smaller for staging)
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20
db_name              = "fitstudio"

# ElastiCache (smaller for staging)
redis_node_type  = "cache.t3.micro"
redis_num_nodes  = 1

# ECS (smaller for staging)
ecs_cpu           = 256
ecs_memory        = 512
ecs_desired_count = 1
ecs_min_count     = 1
ecs_max_count     = 3

# Monitoring
log_retention_days = 14
