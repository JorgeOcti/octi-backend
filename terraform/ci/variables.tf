variable "region" {
  description = "AWS region."
  type        = string
  default     = "sa-east-1"
}

variable "project" {
  description = "Project name. Must match the main stack."
  type        = string
  default     = "andes"
}

variable "circleci_orgs" {
  description = <<-EOT
    CircleCI organizations allowed to assume the CI role, keyed by a stable
    short name (the key is only used for resource addressing — changing it
    forces the OIDC provider to be replaced).

    Each org gets its own OIDC provider, because the provider URL embeds the
    org UUID. One role trusts all of them.

      org_id     — Organization Settings → Overview → Organization ID.
      project_id — Project Settings → Overview → Project ID. When set, only
                   that project's jobs can assume the role. Leave empty to
                   allow any project in the org (less secure).
  EOT
  type = map(object({
    org_id     = string
    project_id = optional(string, "")
  }))
}

variable "github_repos" {
  description = <<-EOT
    Repositorios de GitHub cuyos workflows pueden asumir el rol de CI, con las
    ramas desde las que se permite.

    Se restringe por rama a propósito: un `repo:owner/name:*` habilitaría a
    cualquier workflow del repo —incluido el de un pull request de un fork— a
    desplegar.

      repo — "owner/nombre", tal cual aparece en la URL de GitHub.
      refs — refs del token OIDC. Por defecto las dos ramas que despliegan.
    EOT
  type = map(object({
    repo = string
    refs = optional(list(string), ["refs/heads/develop", "refs/heads/master"])
  }))
  default = {}
}

variable "environments" {
  description = "Environments the CI role can deploy to. Used to scope IAM permissions to the specific ECR repos and ECS services."
  type        = list(string)
  default     = ["dev", "prod"]
}
