variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
  default     = "mbole-pay"
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)."
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region to deploy infrastructure into."
  type        = string
  default     = "eu-west-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "Two CIDR blocks for public subnets."
  type        = list(string)
  default     = ["10.20.1.0/24", "10.20.2.0/24"]

  validation {
    condition     = length(var.public_subnet_cidrs) == 2
    error_message = "public_subnet_cidrs must contain exactly 2 CIDR blocks."
  }
}

variable "private_subnet_cidrs" {
  description = "Two CIDR blocks for private subnets."
  type        = list(string)
  default     = ["10.20.11.0/24", "10.20.12.0/24"]

  validation {
    condition     = length(var.private_subnet_cidrs) == 2
    error_message = "private_subnet_cidrs must contain exactly 2 CIDR blocks."
  }
}

variable "app_ingress_cidrs" {
  description = "Allowed CIDR blocks for app HTTP ingress on port 3000."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "db_engine_version" {
  description = "PostgreSQL engine version for RDS."
  type        = string
  default     = "16"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial allocated storage (GB)."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Maximum autoscaled storage (GB)."
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Application database name."
  type        = string
  default     = "mbole_pay"
}

variable "db_username" {
  description = "Database master username."
  type        = string
  default     = "mbole"
}

variable "db_password" {
  description = "Database master password. Leave empty to auto-generate."
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_multi_az" {
  description = "Enable Multi-AZ deployment."
  type        = bool
  default     = false
}

variable "db_backup_retention_period" {
  description = "Backup retention in days."
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Preferred backup window (UTC), e.g. 01:00-02:00."
  type        = string
  default     = "01:00-02:00"
}

variable "db_maintenance_window" {
  description = "Preferred maintenance window (UTC), e.g. Sun:02:00-Sun:03:00."
  type        = string
  default     = "Sun:02:00-Sun:03:00"
}

variable "db_skip_final_snapshot" {
  description = "Whether to skip final snapshot on destroy (not recommended for prod)."
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  description = "Enable deletion protection on RDS."
  type        = bool
  default     = true
}

variable "db_performance_insights_enabled" {
  description = "Enable RDS Performance Insights."
  type        = bool
  default     = true
}

variable "db_apply_immediately" {
  description = "Apply DB modifications immediately."
  type        = bool
  default     = false
}

variable "tags" {
  description = "Extra tags to apply to all resources."
  type        = map(string)
  default     = {}
}
