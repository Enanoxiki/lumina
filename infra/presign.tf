resource "aws_iam_role" "presigner" {
  name = "lumina-presigner"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "presign_s3" {
  name = "presign-s3"
  role = aws_iam_role.presigner.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "s3:PutObject"
        Resource = "${aws_s3_bucket.raw.arn}/*"
      },
      {
        Effect = "Allow"
        Action = "s3:GetObject"
        Resource = "${aws_s3_bucket.processed.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "presign_logs" {
  role = aws_iam_role.presigner.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "archive_file" "presign" {
  type = "zip"
  source_file = "${path.module}/../apps/presign/dist/index.js"
  output_path = "${path.module}/build/presign.zip"
}

resource "aws_lambda_function" "presign" {
  function_name = "lumina-presign"
  runtime = "nodejs20.x"
  handler = "index.handler"
  filename = data.archive_file.presign.output_path
  source_code_hash = data.archive_file.presign.output_base64sha256
  role = aws_iam_role.presigner.arn
  environment {
    variables = {
      "S3_RAW_BUCKET" = aws_s3_bucket.raw.bucket
      "S3_PROCESSED_BUCKET" = aws_s3_bucket.processed.bucket
      "S3_ENDPOINT" = "http://localhost:4566"
      "S3_REGION" = "us-east-1"
    }
  }
}

resource "aws_lambda_function_url" "presign" {
  function_name = aws_lambda_function.presign.function_name
  authorization_type = "NONE"
}

output "presign_url" {
  value = aws_lambda_function_url.presign.function_url
}