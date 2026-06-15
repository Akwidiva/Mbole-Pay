output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs."
  value       = values(aws_subnet.public)[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs."
  value       = values(aws_subnet.private)[*].id
}

output "app_security_group_id" {
  description = "Security group ID for app workloads."
  value       = aws_security_group.app.id
}

output "db_security_group_id" {
  description = "Security group ID for PostgreSQL."
  value       = aws_security_group.db.id
}

output "db_endpoint" {
  description = "RDS endpoint hostname."
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "RDS endpoint port."
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Database name."
  value       = aws_db_instance.postgres.db_name
}

output "db_username" {
  description = "Database username."
  value       = aws_db_instance.postgres.username
  sensitive   = true
}

output "database_url" {
  description = "PostgreSQL DATABASE_URL for application secret injection."
  value       = "postgresql://${aws_db_instance.postgres.username}:${local.db_password_final}@${aws_db_instance.postgres.address}:${aws_db_instance.postgres.port}/${aws_db_instance.postgres.db_name}?schema=public"
  sensitive   = true
}
