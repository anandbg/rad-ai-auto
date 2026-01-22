import Stripe from 'stripe';

export type StripeErrorType =
  | 'card_error'
  | 'invalid_request_error'
  | 'api_error'
  | 'authentication_error'
  | 'rate_limit_error'
  | 'idempotency_error'
  | 'unknown';

export interface StripeErrorInfo {
  type: StripeErrorType;
  message: string;
  code?: string;
  decline_code?: string;
  retryable: boolean;
}

/**
 * Handle Stripe errors and extract useful information
 *
 * @param error - The error from a Stripe operation
 * @returns Structured error information with type, message, and retry guidance
 */
export function handleStripeError(error: unknown): StripeErrorInfo {
  if (error instanceof Stripe.errors.StripeError) {
    const stripeError = error as Stripe.errors.StripeError;

    return {
      type: (stripeError.type as StripeErrorType) || 'unknown',
      message: stripeError.message,
      code: stripeError.code,
      decline_code: (stripeError as Stripe.errors.StripeCardError).decline_code,
      retryable: ['rate_limit_error', 'api_error'].includes(stripeError.type),
    };
  }

  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'Unknown error',
    retryable: false,
  };
}
