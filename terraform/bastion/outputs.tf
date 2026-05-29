output "instance_id" {
  description = "Bastion EC2 instance ID. Use with `aws ssm start-session`."
  value       = aws_instance.bastion.id
}

output "docdb_endpoint" {
  description = "DocumentDB writer endpoint the bastion is allowed to reach."
  value       = data.terraform_remote_state.main.outputs.docdb_endpoint
}

output "port_forward_docdb" {
  description = "Ready-to-paste SSM port-forward command. Maps DocDB:27017 to localhost:27018."
  value = format(
    "aws ssm start-session --target %s --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters 'host=%s,portNumber=27017,localPortNumber=27018'",
    aws_instance.bastion.id,
    data.terraform_remote_state.main.outputs.docdb_endpoint,
  )
}
