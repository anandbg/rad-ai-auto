/**
 * OpenAI error detection and handling utilities
 */

export interface OpenAIErrorInfo {
  isRetryable: boolean;
  statusCode: number | null;
  message: string;
  type: "rate_limit" | "server_error" | "client_error" | "unknown";
  retryAfter?: number; // Seconds to wait before retry (from header)
}

/**
 * Parse error from OpenAI API responses or AI SDK errors
 */
export function parseOpenAIError(error: unknown): OpenAIErrorInfo {
  // Handle standard Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Rate limit (429)
    if (message.includes("429") || message.includes("rate limit") || message.includes("rate_limit")) {
      // Try to extract retry-after from message if present
      const retryMatch = message.match(/retry.?after[:\s]+(\d+)/i);
      const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : undefined;

      return {
        isRetryable: true,
        statusCode: 429,
        message: error.message,
        type: "rate_limit",
        retryAfter,
      };
    }

    // Server errors (500, 502, 503, 504)
    if (message.includes("500") || message.includes("502") || message.includes("503") || message.includes("504") ||
        message.includes("internal server error") || message.includes("service unavailable")) {
      return {
        isRetryable: true,
        statusCode: 500,
        message: error.message,
        type: "server_error",
      };
    }

    // Timeout errors
    if (message.includes("timeout") || message.includes("timed out") || message.includes("ETIMEDOUT")) {
      return {
        isRetryable: true,
        statusCode: 408,
        message: error.message,
        type: "server_error",
      };
    }

    // Client errors (400, 401, 403) - not retryable
    if (message.includes("400") || message.includes("401") || message.includes("403") ||
        message.includes("invalid") || message.includes("unauthorized") || message.includes("forbidden")) {
      return {
        isRetryable: false,
        statusCode: 400,
        message: error.message,
        type: "client_error",
      };
    }
  }

  // Handle objects with status/statusCode property (fetch Response-like)
  if (typeof error === "object" && error !== null) {
    const obj = error as Record<string, unknown>;
    const statusCode = (obj.status || obj.statusCode) as number | undefined;

    if (typeof statusCode === "number") {
      if (statusCode === 429) {
        return {
          isRetryable: true,
          statusCode: 429,
          message: String(obj.message || "Rate limit exceeded"),
          type: "rate_limit",
        };
      }
      if (statusCode >= 500) {
        return {
          isRetryable: true,
          statusCode,
          message: String(obj.message || "Server error"),
          type: "server_error",
        };
      }
      if (statusCode >= 400) {
        return {
          isRetryable: false,
          statusCode,
          message: String(obj.message || "Client error"),
          type: "client_error",
        };
      }
    }
  }

  // Unknown error - don't retry by default
  return {
    isRetryable: false,
    statusCode: null,
    message: String(error),
    type: "unknown",
  };
}

/**
 * Quick check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  return parseOpenAIError(error).isRetryable;
}

/**
 * Format error for user-facing response
 */
export function formatErrorResponse(error: unknown): {
  error: string;
  message: string;
  statusCode: number;
} {
  const errorInfo = parseOpenAIError(error);

  switch (errorInfo.type) {
    case "rate_limit":
      return {
        error: "Service Busy",
        message: "The AI service is currently experiencing high demand. Please try again in a moment.",
        statusCode: 429,
      };
    case "server_error":
      return {
        error: "Service Temporarily Unavailable",
        message: "The AI service is temporarily unavailable. Please try again shortly.",
        statusCode: 503,
      };
    case "client_error":
      return {
        error: "Request Error",
        message: errorInfo.message,
        statusCode: errorInfo.statusCode || 400,
      };
    default:
      return {
        error: "Internal Server Error",
        message: "An unexpected error occurred. Please try again.",
        statusCode: 500,
      };
  }
}
