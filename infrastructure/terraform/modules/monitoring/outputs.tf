output "sns_topic_arn" {
  description = "ARN of the SNS alerts topic"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "alarms" {
  description = "List of CloudWatch alarm names"
  value = [
    aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name,
    aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name,
    aws_cloudwatch_metric_alarm.ecs_task_count_low.alarm_name,
    aws_cloudwatch_metric_alarm.alb_5xx_high.alarm_name,
    aws_cloudwatch_metric_alarm.alb_latency_high.alarm_name,
    aws_cloudwatch_metric_alarm.alb_unhealthy_hosts.alarm_name,
    aws_cloudwatch_metric_alarm.rds_cpu_high.alarm_name,
    aws_cloudwatch_metric_alarm.rds_storage_low.alarm_name,
    aws_cloudwatch_metric_alarm.rds_connections_high.alarm_name,
    aws_cloudwatch_metric_alarm.redis_cpu_high.alarm_name,
    aws_cloudwatch_metric_alarm.redis_memory_high.alarm_name,
  ]
}
