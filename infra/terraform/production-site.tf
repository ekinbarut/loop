locals {
  production_site_aliases = var.enable_production_site ? [
    var.production_domain_name,
    "www.${var.production_domain_name}",
  ] : []
}

resource "aws_s3_bucket" "production_site" {
  count = var.enable_production_site ? 1 : 0

  bucket = var.production_bucket_name

  tags = merge(local.tags, {
    Name = var.production_bucket_name
  })
}

resource "aws_s3_bucket_ownership_controls" "production_site" {
  count = var.enable_production_site ? 1 : 0

  bucket = aws_s3_bucket.production_site[0].id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "production_site" {
  count = var.enable_production_site ? 1 : 0

  bucket = aws_s3_bucket.production_site[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "production_site" {
  count = var.enable_production_site ? 1 : 0

  bucket = aws_s3_bucket.production_site[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "production_site" {
  count = var.enable_production_site ? 1 : 0

  bucket = aws_s3_bucket.production_site[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_cloudfront_origin_access_control" "production_site" {
  count = var.enable_production_site ? 1 : 0

  name                              = "${var.project_name}-production-site"
  description                       = "Private access from CloudFront to the Loop production S3 bucket."
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_acm_certificate" "production_site" {
  count    = var.enable_production_site ? 1 : 0
  provider = aws.us_east_1

  domain_name               = var.production_domain_name
  subject_alternative_names = ["www.${var.production_domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.tags
}

resource "aws_route53_record" "production_site_certificate_validation" {
  for_each = var.enable_production_site ? {
    for option in aws_acm_certificate.production_site[0].domain_validation_options :
    option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  } : {}

  zone_id = var.production_hosted_zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 300
}

resource "aws_acm_certificate_validation" "production_site" {
  count    = var.enable_production_site ? 1 : 0
  provider = aws.us_east_1

  certificate_arn = aws_acm_certificate.production_site[0].arn
  validation_record_fqdns = [
    for record in aws_route53_record.production_site_certificate_validation : record.fqdn
  ]
}

resource "aws_cloudfront_response_headers_policy" "production_site" {
  count = var.enable_production_site ? 1 : 0

  name = "${var.project_name}-production-security-headers"

  security_headers_config {
    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = true
      override                   = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

resource "aws_cloudfront_distribution" "production_site" {
  count = var.enable_production_site ? 1 : 0

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Loop production site"
  default_root_object = "index.html"
  aliases             = local.production_site_aliases
  price_class         = "PriceClass_100"
  http_version        = "http2and3"

  origin {
    domain_name              = aws_s3_bucket.production_site[0].bucket_regional_domain_name
    origin_id                = "production-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.production_site[0].id
  }

  default_cache_behavior {
    target_origin_id       = "production-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    compress               = true

    cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    response_headers_policy_id = aws_cloudfront_response_headers_policy.production_site[0].id
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.production_site[0].certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = local.tags
}

resource "aws_s3_bucket_policy" "production_site" {
  count = var.enable_production_site ? 1 : 0

  bucket = aws_s3_bucket.production_site[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontReadOnly"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.production_site[0].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.production_site[0].arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.production_site]
}

resource "aws_route53_record" "production_site_alias" {
  for_each = toset(local.production_site_aliases)

  zone_id = var.production_hosted_zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.production_site[0].domain_name
    zone_id                = aws_cloudfront_distribution.production_site[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "production_site_alias_ipv6" {
  for_each = toset(local.production_site_aliases)

  zone_id = var.production_hosted_zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.production_site[0].domain_name
    zone_id                = aws_cloudfront_distribution.production_site[0].hosted_zone_id
    evaluate_target_health = false
  }
}
