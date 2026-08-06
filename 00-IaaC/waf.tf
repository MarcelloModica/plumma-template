# ---------------------------------------------------------------------------
# WAF: creato solo per ambienti bilanciati (prod), dove esiste un ALB a cui
# associarlo. Negli ambienti SingleInstance (dev) non c'e' load balancer,
# quindi tutte queste risorse hanno count = 0.
# ---------------------------------------------------------------------------

resource "aws_wafv2_regex_pattern_set" "valid_http_methods" {
  count       = local.is_lb ? 1 : 0
  name        = "allowed-http-methods-${var.project_tag}"
  description = "Permette solo i metodi HTTP standard"
  scope       = "REGIONAL"

  regular_expression {
    regex_string = "^GET$"
  }
  regular_expression {
    regex_string = "^POST$"
  }
  regular_expression {
    regex_string = "^PUT$"
  }
  regular_expression {
    regex_string = "^DELETE$"
  }
  regular_expression {
    regex_string = "^PATCH$"
  }
}

resource "aws_wafv2_regex_pattern_set" "blocked_http_methods" {
  count = local.is_lb ? 1 : 0
  name  = "http-methods-blocked-${var.project_tag}"
  scope = "REGIONAL"

  regular_expression {
    regex_string = "^PROPFIND$"
  }
  regular_expression {
    regex_string = "^TRACE$"
  }
  regular_expression {
    regex_string = "^TRACK$"
  }
  regular_expression {
    regex_string = "^CONNECT$"
  }
  regular_expression {
    regex_string = "^OPTIONS$"
  }
}

# Load Balancer EB come data source (esiste solo in ambienti bilanciati).
data "aws_lb" "eb_alb" {
  count = local.is_lb ? 1 : 0
  arn   = tolist(aws_elastic_beanstalk_environment.env.load_balancers)[0]
}

resource "aws_wafv2_web_acl" "waf" {
  count       = local.is_lb ? 1 : 0
  name        = "eb-waf-${var.project_tag}"
  description = "WAF per Elastic Beanstalk ${var.project_tag}"
  scope       = "REGIONAL"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "eb-waf-${var.project_tag}"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AllowValidHttpMethods"
    priority = 6

    action {
      allow {}
    }

    statement {
      regex_pattern_set_reference_statement {
        arn = aws_wafv2_regex_pattern_set.valid_http_methods[0].arn

        field_to_match {
          method {}
        }

        text_transformation {
          priority = 0
          type     = "NONE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AllowValidHttpMethods"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-CommonRules"
    priority = 1
    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSCommonRules"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "BlockInvalidHttpMethods"
    priority = 2

    action {
      block {}
    }

    statement {
      regex_pattern_set_reference_statement {
        arn = aws_wafv2_regex_pattern_set.blocked_http_methods[0].arn

        field_to_match {
          method {}
        }

        text_transformation {
          priority = 0
          type     = "NONE"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BlockInvalidHttpMethods"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    PROJECT = var.project_tag
  }
}

resource "aws_wafv2_web_acl_association" "waf" {
  count        = local.is_lb ? 1 : 0
  resource_arn = data.aws_lb.eb_alb[0].arn
  web_acl_arn  = aws_wafv2_web_acl.waf[0].arn
}
