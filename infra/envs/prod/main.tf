terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.71"
    }
  }
  # Partial configuration: `terraform init -backend-config=backend.hcl` (see backend.hcl.example and infra/README.md).
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
  default_tags { tags = { Project = "dischargeflow", Environment = "prod", ManagedBy = "terraform" } }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  default_tags { tags = { Project = "dischargeflow", Environment = "prod", ManagedBy = "terraform" } }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "domain" { type = string }
variable "hosted_zone_id" { type = string }
variable "github_repository" {
  type    = string
  default = "ftaakash/DischargeFlow"
}
variable "alarm_emails" { type = list(string) }
variable "sso_saml_metadata_url" {
  description = "The hospital directory's SAML metadata URL (empty: no federation yet)"
  type        = string
  default     = ""
}
variable "sso_provider_name" {
  type    = string
  default = "Hospital sign-in"
}

module "stack" {
  source    = "../../modules/stack"
  providers = { aws = aws, aws.us_east_1 = aws.us_east_1 }

  environment       = "prod"
  aws_region        = var.aws_region
  domain            = var.domain
  hosted_zone_id    = var.hosted_zone_id
  github_repository = var.github_repository
  alarm_emails      = var.alarm_emails
  # ADR-002 item 5: Claude on Bedrock, inside the AWS account under the BAA (request model access first).
  llm_provider = "bedrock"
  # ADR-002 item 2: hospital SSO through Cognito.
  sso_saml_metadata_url = var.sso_saml_metadata_url
  sso_provider_name     = var.sso_provider_name
  # Reuses the GitHub OIDC provider created by the staging stack.
  create_oidc_provider = false

  # ADR NFRs: 99.5% availability (multi-AZ database, NAT per AZ, at least 2 API tasks), RPO 5 min via PITR.
  single_nat_gateway       = false
  db_instance_class        = "db.t4g.small"
  db_multi_az              = true
  db_backup_retention_days = 35
  api_desired_count        = 2
  api_max_count            = 6
}

output "github_environment_variables" { value = module.stack.github_environment_variables }
output "secret_arns" { value = module.stack.secret_arns }
output "sso" { value = module.stack.sso }
output "phi_kms_key_arn" { value = module.stack.phi_kms_key_arn }
