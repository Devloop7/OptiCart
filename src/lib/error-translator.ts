/**
 * Error Translator: Converts technical failures into human-readable instructions.
 *
 * Instead of "Error 500" or "ECONNREFUSED", users see actionable messages like:
 * - "Supplier site changed its layout - update required"
 * - "User's credit card was declined"
 * - "Database is temporarily unavailable, retrying..."
 */

interface ErrorPattern {
  /** Regex or string to match against error message */
  match: RegExp | string;
  /** Human-readable translation */
  translation: string;
  /** Severity: info, warning, error, critical */
  severity: "info" | "warning" | "error" | "critical";
}

const ERROR_PATTERNS: ErrorPattern[] = [
  // Database errors
  {
    match: /ECONNREFUSED.*5432/,
    translation: "The database is temporarily unavailable. This usually resolves itself within a few minutes. If it persists, check that PostgreSQL is running.",
    severity: "critical",
  },
  {
    match: /P2002/,
    translation: "This record already exists. A duplicate entry was detected — no action needed if this was a retry.",
    severity: "warning",
  },
  {
    match: /P2025/,
    translation: "The record you're looking for was not found. It may have been deleted or the ID is incorrect.",
    severity: "warning",
  },
  {
    match: /P2003/,
    translation: "A required linked record is missing. For example, a product's store may have been deleted.",
    severity: "error",
  },

  // Redis / Queue errors
  {
    match: /ECONNREFUSED.*6379/,
    translation: "The background job system (Redis) is offline. Price monitoring and auto-ordering are paused. Check that Redis is running.",
    severity: "critical",
  },
  {
    match: /NOAUTH/,
    translation: "Redis authentication failed. Check the REDIS_URL in your environment variables.",
    severity: "critical",
  },

  // Network / Supplier errors
  {
    match: /ECONNREFUSED/,
    translation: "Could not connect to the external service. The supplier's website may be down or blocking requests.",
    severity: "error",
  },
  {
    match: /ETIMEDOUT|ESOCKETTIMEDOUT/,
    translation: "The request timed out. The supplier site is responding slowly — will retry automatically.",
    severity: "warning",
  },
  {
    match: /ERR_TLS|UNABLE_TO_VERIFY/i,
    translation: "SSL/TLS certificate issue with the supplier site. This might indicate a security problem — do not proceed until verified.",
    severity: "critical",
  },
  {
    match: /403|Forbidden/,
    translation: "Access denied by the supplier site. Your IP may be temporarily blocked. Consider enabling proxy rotation.",
    severity: "error",
  },
  {
    match: /429|Too Many Requests|rate.?limit/i,
    translation: "Too many requests to the supplier. The system will automatically slow down and retry.",
    severity: "warning",
  },
  {
    match: /404.*product|product.*404/i,
    translation: "The product page was not found on the supplier site. It may have been removed or the URL changed.",
    severity: "error",
  },
  {
    match: /503|Service Unavailable/,
    translation: "The supplier website is temporarily down for maintenance. Will retry automatically.",
    severity: "warning",
  },
  {
    match: /captcha|challenge/i,
    translation: "The supplier site is showing a CAPTCHA. Proxy rotation or manual intervention may be needed.",
    severity: "error",
  },

  // Supplier-specific scraping
  {
    match: /selector.*not found|element.*null|querySelectorAll.*empty/i,
    translation: "Supplier site changed its layout — the scraper needs an update. Price monitoring for this supplier is paused.",
    severity: "critical",
  },
  {
    match: /price.*parse|NaN.*price|invalid.*price/i,
    translation: "Could not read the price from the supplier page. The page format may have changed.",
    severity: "error",
  },

  // Payment / Order errors
  {
    match: /card.*declined|payment.*failed|insufficient.*funds/i,
    translation: "Payment was declined. Please check your payment method or contact your card issuer.",
    severity: "error",
  },
  {
    match: /out.?of.?stock|sold.?out|unavailable/i,
    translation: "This product is out of stock at the supplier. The order has been paused until stock is replenished.",
    severity: "warning",
  },

  // Auth errors
  {
    match: /unauthorized|invalid.*token|expired.*session/i,
    translation: "Your session has expired or your API credentials are invalid. Please reconnect your store.",
    severity: "error",
  },
  {
    match: /VAULT_ENCRYPTION_KEY/,
    translation: "The credential encryption key is not configured. Set VAULT_ENCRYPTION_KEY in your environment variables.",
    severity: "critical",
  },

  // Marketplace API errors
  {
    match: /shopify.*api|api.*shopify/i,
    translation: "Shopify API returned an error. Check your store connection and API credentials in Settings.",
    severity: "error",
  },
  {
    match: /woocommerce.*api|api.*woocommerce/i,
    translation: "WooCommerce API returned an error. Verify your store URL and REST API keys.",
    severity: "error",
  },
  {
    match: /ebay.*api|api.*ebay/i,
    translation: "eBay API returned an error. Your OAuth token may need refreshing in Settings.",
    severity: "error",
  },

  // Order state machine
  {
    match: /Invalid order transition/,
    translation: "This order cannot be moved to the requested status. Check the order's current state and try a valid action.",
    severity: "warning",
  },

  // Generic
  {
    match: /ENOMEM|heap|out of memory/i,
    translation: "The system is running low on memory. Some background tasks may be delayed.",
    severity: "critical",
  },
];

/**
 * Translate a technical error into a human-readable message.
 * Falls back to a generic message if no pattern matches.
 */
export function translateError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack || "" : "";
  const fullText = `${message} ${stack}`;

  for (const pattern of ERROR_PATTERNS) {
    const regex = pattern.match instanceof RegExp
      ? pattern.match
      : new RegExp(pattern.match, "i");

    if (regex.test(fullText)) {
      return pattern.translation;
    }
  }

  // Fallback: extract meaningful info from the error
  if (message.length < 200) {
    return `Something unexpected happened: "${message}". If this keeps occurring, export the Panic Log and send it to support.`;
  }

  return "An unexpected error occurred. Export the Panic Log from Settings for diagnostic details.";
}

/**
 * Get the severity level for an error
 */
export function getErrorSeverity(err: unknown): "info" | "warning" | "error" | "critical" {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack || "" : "";
  const fullText = `${message} ${stack}`;

  for (const pattern of ERROR_PATTERNS) {
    const regex = pattern.match instanceof RegExp
      ? pattern.match
      : new RegExp(pattern.match, "i");

    if (regex.test(fullText)) {
      return pattern.severity;
    }
  }

  return "error";
}
