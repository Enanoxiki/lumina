resource "aws_sqs_queue" "transcode_dlq" {
  name = "lumina-transcode-dlq"
}

resource "aws_sqs_queue" "transcode" {
  name = "lumina-transcode"
  visibility_timeout_seconds = 900
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.transcode_dlq.arn
    maxReceiveCount = 3
  })
}

resource "aws_sqs_queue_policy" "transcode" {
  queue_url = aws_sqs_queue.transcode.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = { Service= "s3.amazonaws.com" }
        Action = "sqs:SendMessage"
        Resource = aws_sqs_queue.transcode.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_s3_bucket.raw.arn
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_notification" "raw" {
  bucket = aws_s3_bucket.raw.id
  queue {
    queue_arn = aws_sqs_queue.transcode.arn
    events = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_sqs_queue_policy.transcode]
}

output "transcode_queue_url" {
  value = aws_sqs_queue.transcode.id
}