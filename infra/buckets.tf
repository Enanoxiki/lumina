resource "aws_s3_bucket" "raw" {
  bucket = "lumina-raw"
}

resource "aws_s3_bucket" "processed" {
  bucket = "lumina-processed"
}