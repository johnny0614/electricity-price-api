# Deployment Guide

This document explains how to deploy the Electricity Price API using Docker and Bitbucket Pipelines with AWS ECS Fargate.

## Prerequisites

1. **AWS Account** with ECS, ECR, and IAM permissions
2. **Bitbucket Repository** with Pipelines enabled
3. **Docker** (for local testing)

## Bitbucket Pipeline Environment Variables

Configure these variables in your Bitbucket repository settings (Repository Settings > Pipelines > Repository Variables):

### AWS Configuration

#### Staging Environment
- `AWS_ACCESS_KEY_ID` - AWS access key for staging
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for staging (secured)
- `AWS_DEFAULT_REGION` - AWS region (e.g., `us-east-1`)
- `AWS_ACCOUNT_ID` - AWS account ID for staging

#### Production Environment  
- `AWS_ACCESS_KEY_ID_PROD` - AWS access key for production
- `AWS_SECRET_ACCESS_KEY_PROD` - AWS secret key for production (secured)
- `AWS_ACCOUNT_ID_PROD` - AWS account ID for production

### ECS Configuration
- `ECR_REPOSITORY_NAME` - ECR repository name (e.g., `electricity-price-api`)
- `ECS_CLUSTER_NAME_STAGING` - ECS cluster name for staging
- `ECS_CLUSTER_NAME_PROD` - ECS cluster name for production
- `ECS_SERVICE_NAME` - ECS service name
- `ECS_TASK_DEFINITION_NAME` - ECS task definition family name
- `CONTAINER_NAME` - Container name in task definition

## AWS Setup

### 1. Create ECR Repository
```bash
aws ecr create-repository --repository-name electricity-price-api --region us-east-1
```

### 2. Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name electricity-price-api-staging --capacity-providers FARGATE
aws ecs create-cluster --cluster-name electricity-price-api-prod --capacity-providers FARGATE
```

### 3. Create IAM Roles

#### ECS Task Execution Role
```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create execution role
aws iam create-role --role-name electricity-price-api-execution-role --assume-role-policy-document file://trust-policy.json
aws iam attach-role-policy --role-name electricity-price-api-execution-role --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create task role
aws iam create-role --role-name electricity-price-api-task-role --assume-role-policy-document file://trust-policy.json
```

### 4. Store Environment Variables in AWS Systems Manager

Store sensitive configuration in Parameter Store:

```bash
# Staging
aws ssm put-parameter --name '/electricity-price-api/staging/JWT_SECRET' --value 'your-jwt-secret-key' --type SecureString
aws ssm put-parameter --name '/electricity-price-api/staging/API_USERNAME' --value 'admin' --type String
aws ssm put-parameter --name '/electricity-price-api/staging/API_PASSWORD' --value 'your-secure-password' --type SecureString

# Production
aws ssm put-parameter --name '/electricity-price-api/production/JWT_SECRET' --value 'your-production-jwt-secret' --type SecureString
aws ssm put-parameter --name '/electricity-price-api/production/API_USERNAME' --value 'admin' --type String
aws ssm put-parameter --name '/electricity-price-api/production/API_PASSWORD' --value 'your-production-password' --type SecureString
```

### 5. Create ECS Task Definition

The pipeline will automatically create and update the task definition, but here's the structure:

```json
{
  "family": "electricity-price-api-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/electricity-price-api-execution-role",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/electricity-price-api-task-role",
  "containerDefinitions": [
    {
      "name": "electricity-price-api",
      "image": "YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/electricity-price-api:latest",
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:ssm:us-east-1:YOUR_ACCOUNT:parameter/electricity-price-api/production/JWT_SECRET"
        },
        {
          "name": "API_USERNAME",
          "valueFrom": "arn:aws:ssm:us-east-1:YOUR_ACCOUNT:parameter/electricity-price-api/production/API_USERNAME"
        },
        {
          "name": "API_PASSWORD",
          "valueFrom": "arn:aws:ssm:us-east-1:YOUR_ACCOUNT:parameter/electricity-price-api/production/API_PASSWORD"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/electricity-price-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### 6. Create CloudWatch Log Group
```bash
aws logs create-log-group --log-group-name /ecs/electricity-price-api --region us-east-1
```

## Pipeline Workflows

### Automatic Triggers
- **Pull Requests**: Run tests and security scans
- **develop branch**: Deploy to staging automatically
- **main branch**: Deploy to staging, manual trigger for production
- **Tags (v*)**: Deploy to production automatically

### Manual Triggers
- `deploy-staging`: Deploy current commit to staging
- `deploy-production`: Deploy current commit to production
- `full-pipeline`: Run complete pipeline with all stages

## Local Docker Testing

### Build Docker Image
```bash
docker build -t electricity-price-api .
```

### Run Container Locally
```bash
docker run -p 8080:8080 \
  -e JWT_SECRET=your-secret-key \
  -e API_USERNAME=admin \
  -e API_PASSWORD=your-password \
  -e CSV_DATA_PATH=data/coding_challenge_prices.csv \
  electricity-price-api
```

### Test the API
```bash
# Health check
curl http://localhost:8080/

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Get price data (use token from login response)
curl -X GET "http://localhost:8080/api/price?state=NSW" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Common Issues

1. **Pipeline fails at Docker build**
   - Check Dockerfile syntax
   - Ensure all dependencies are properly installed

2. **AWS deployment fails**
   - Verify AWS credentials and permissions
   - Check ECS cluster and service names
   - Ensure ECR repository exists

3. **Service fails to start**
   - Check CloudWatch logs: `/ecs/electricity-price-api`
   - Verify environment variables in Parameter Store
   - Check security groups and network configuration

### Monitoring

- **CloudWatch Logs**: `/ecs/electricity-price-api`
- **ECS Console**: Monitor service status and task health
- **ECR Console**: View Docker images and tags

## Security Considerations

1. **Environment Variables**: Store sensitive data in AWS Systems Manager Parameter Store
2. **IAM Roles**: Use least-privilege access for ECS tasks
3. **Security Scans**: Pipeline includes npm audit and Snyk security scanning
4. **Network Security**: Configure appropriate security groups and VPC settings