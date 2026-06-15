# Mbole Pay Infrastructure (Terraform)

This directory provisions AWS infrastructure to support Mbole Pay cloud deployment with a managed PostgreSQL database.

## What gets created

- VPC with DNS enabled
- 2 public subnets + 2 private subnets across 2 AZs
- Internet Gateway + public route table
- App security group (port 3000 ingress)
- DB security group (PostgreSQL 5432 ingress from app SG only)
- RDS PostgreSQL instance (private subnets, encrypted storage, backups)

## Prerequisites

- Terraform >= 1.5
- AWS credentials configured (`aws configure` or environment variables)
- IAM permissions for VPC, EC2 networking, RDS, and tagging

## Configure

1. Copy example variables:
```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Edit `terraform.tfvars`:
- Set `aws_region`
- Set CIDRs to match your network plan
- Set `db_instance_class`, backup retention, Multi-AZ, etc.
- For production, restrict `app_ingress_cidrs`
- For production, set a secure `db_password` (or leave blank to auto-generate and retrieve from output)

## Deploy

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan -out tfplan
terraform apply tfplan
```

## Retrieve DATABASE_URL

After apply, get the database URL output and place it into your app secret manager:

```bash
terraform output -raw database_url
```

Use that value for:
- Kubernetes Secret / Helm values (`DATABASE_URL`)
- CI/CD secret store
- Runtime environment variables

## Important production notes

- Keep `db_deletion_protection = true` in production.
- Keep `db_skip_final_snapshot = false` in production.
- Increase `db_backup_retention_period` (e.g. 30) for stricter backup policy.
- Consider `db_multi_az = true` for higher availability.
- Restrict app ingress CIDRs to trusted edge/load balancer ranges.

## Destroy (non-production only)

```bash
terraform plan -destroy -out destroy.tfplan
terraform apply destroy.tfplan
```

If deletion protection is enabled, disable it first and re-apply before destroy.
