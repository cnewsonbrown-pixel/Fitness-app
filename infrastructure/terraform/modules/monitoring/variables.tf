variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "alert_email" {
  description = "Email address for alert notifications"
  type        = string
  default     = ""
}

# ECS Variables
variable "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "ecs_service_name" {
  description = "Name of the ECS service"
  type        = string
}

variable "min_task_count" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 1
}

# ALB Variables
variable "alb_arn_suffix" {
  description = "ARN suffix of the ALB"
  type        = string
}

variable "target_group_arn_suffix" {
  description = "ARN suffix of the target group"
  type        = string
}

# RDS Variables
variable "rds_instance_identifier" {
  description = "RDS instance identifier"
  type        = string
}

variable "rds_max_connections" {
  description = "Maximum number of RDS connections"
  type        = number
  default     = 100
}

# Redis Variables
variable "redis_cluster_id" {
  description = "ElastiCache Redis cluster ID"
  type        = string
}
