terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "fitstudio-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "fitstudio-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "FitStudio"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================
# Data Sources
# ============================================

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# ============================================
# VPC Module
# ============================================

module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr

  availability_zones = slice(data.aws_availability_zones.available.names, 0, 3)
}

# ============================================
# ECR Repository
# ============================================

module "ecr" {
  source = "./modules/ecr"

  project_name = var.project_name
  environment  = var.environment
}

# ============================================
# RDS (PostgreSQL)
# ============================================

module "rds" {
  source = "./modules/rds"

  project_name = var.project_name
  environment  = var.environment

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password

  allowed_security_groups = [module.ecs.ecs_security_group_id]
}

# ============================================
# ElastiCache (Redis)
# ============================================

module "elasticache" {
  source = "./modules/elasticache"

  project_name = var.project_name
  environment  = var.environment

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  node_type       = var.redis_node_type
  num_cache_nodes = var.redis_num_nodes

  allowed_security_groups = [module.ecs.ecs_security_group_id]
}

# ============================================
# Application Load Balancer
# ============================================

module "alb" {
  source = "./modules/alb"

  project_name = var.project_name
  environment  = var.environment

  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids

  certificate_arn = var.certificate_arn
  health_check_path = "/api/v1/health"
}

# ============================================
# ECS Cluster and Service
# ============================================

module "ecs" {
  source = "./modules/ecs"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  ecr_repository_url = module.ecr.repository_url
  image_tag          = var.image_tag

  alb_target_group_arn = module.alb.target_group_arn
  alb_security_group_id = module.alb.security_group_id

  # App configuration
  container_port   = 3000
  cpu              = var.ecs_cpu
  memory           = var.ecs_memory
  desired_count    = var.ecs_desired_count
  min_count        = var.ecs_min_count
  max_count        = var.ecs_max_count

  # Environment variables
  environment_variables = {
    NODE_ENV     = var.environment
    PORT         = "3000"
    DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${module.rds.endpoint}/${var.db_name}?schema=public"
    REDIS_URL    = "redis://${module.elasticache.endpoint}:6379"
  }

  # Secrets from SSM Parameter Store
  secrets = {
    JWT_SECRET         = "/${var.project_name}/${var.environment}/jwt-secret"
    JWT_REFRESH_SECRET = "/${var.project_name}/${var.environment}/jwt-refresh-secret"
    STRIPE_SECRET_KEY  = "/${var.project_name}/${var.environment}/stripe-secret-key"
    SENDGRID_API_KEY   = "/${var.project_name}/${var.environment}/sendgrid-api-key"
  }
}

# ============================================
# S3 Bucket for File Storage
# ============================================

resource "aws_s3_bucket" "uploads" {
  bucket = "${var.project_name}-${var.environment}-uploads"
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================
# CloudWatch Log Group
# ============================================

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days
}

# ============================================
# Monitoring Module (CloudWatch Alarms & Dashboard)
# ============================================

module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  alert_email  = var.alert_email

  # ECS
  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_name = module.ecs.service_name
  min_task_count   = var.ecs_min_count

  # ALB
  alb_arn_suffix          = module.alb.alb_arn_suffix
  target_group_arn_suffix = module.alb.target_group_arn_suffix

  # RDS
  rds_instance_identifier = module.rds.instance_identifier
  rds_max_connections     = 100

  # Redis
  redis_cluster_id = module.elasticache.cluster_id
}
