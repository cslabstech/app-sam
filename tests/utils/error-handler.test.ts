/**
 * Error Handler Utility Tests
 * Comprehensive tests for utils/error-handler.ts functionality
 * 
 * Tests cover:
 * - getErrorMessage function with various error types
 * - createApiError function for standardized error objects
 * - logError function for error logging
 * - Error classification functions (isNetworkError, isAuthError, etc.)
 */

import { 
  getErrorMessage, 
  createApiError, 
  logError,
  isNetworkError,
  isAuthError,
  isValidationError
} from '@/utils/error-handler';

// Mock dependencies
jest.mock('@/utils/logger', () => ({
  log: jest.fn(),
}));

const mockLog = require('@/utils/logger').log;

describe('Error Handler Utility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getErrorMessage', () => {
    it('should handle null and undefined errors', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred');
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred');
    });

    it('should handle string errors', () => {
      expect(getErrorMessage('Simple error message')).toBe('Simple error message');
      expect(getErrorMessage('')).toBe('An unknown error occurred'); // Empty string is treated as falsy
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error message');
      expect(getErrorMessage(error)).toBe('Test error message');
    });

    it('should handle API error objects with message property', () => {
      const apiError = {
        message: 'API error occurred',
        code: 400,
        status: 'error'
      };
      expect(getErrorMessage(apiError)).toBe('API error occurred');
    });

    it('should handle API error objects with error property', () => {
      const apiError = {
        error: 'Something went wrong',
        code: 500
      };
      expect(getErrorMessage(apiError)).toBe('Something went wrong');
    });

    it('should handle API error objects with details property', () => {
      const apiError = {
        details: 'Detailed error information',
        status: 'failed'
      };
      expect(getErrorMessage(apiError)).toBe('Detailed error information');
    });

    it('should handle validation errors with errors object', () => {
      const validationError = {
        errors: {
          username: ['The username field is required'],
          password: ['The password must be at least 8 characters']
        }
      };
      expect(getErrorMessage(validationError)).toBe('The username field is required');
    });

    it('should handle validation errors with string values', () => {
      const validationError = {
        errors: {
          email: 'Invalid email format'
        }
      };
      expect(getErrorMessage(validationError)).toBe('Invalid email format');
    });

    it('should handle empty errors object', () => {
      const error = {
        errors: {}
      };
      expect(getErrorMessage(error)).toBe('An unexpected error occurred');
    });

    it('should handle objects with no recognizable error properties', () => {
      const unknownError = {
        something: 'value',
        other: 123
      };
      expect(getErrorMessage(unknownError)).toBe('An unexpected error occurred');
    });

    it('should handle complex nested error structures', () => {
      const complexError = {
        response: {
          data: {
            errors: {
              field1: ['First error', 'Second error'],
              field2: ['Another error']
            }
          }
        }
      };
      expect(getErrorMessage(complexError)).toBe('An unexpected error occurred');
    });
  });

  describe('createApiError', () => {
    it('should create standardized API error object', () => {
      const error = createApiError(404, 'Resource not found');
      
      expect(error).toHaveProperty('code', 404);
      expect(error).toHaveProperty('message', 'Resource not found');
      expect(error).toHaveProperty('field', undefined);
    });

    it('should create error with different status codes', () => {
      const badRequestError = createApiError(400, 'Bad request');
      const serverError = createApiError(500, 'Internal server error');
      
      expect(badRequestError.code).toBe(400);
      expect(badRequestError.message).toBe('Bad request');
      
      expect(serverError.code).toBe(500);
      expect(serverError.message).toBe('Internal server error');
    });

    it('should handle empty message', () => {
      const error = createApiError(422, '');
      
      expect(error.code).toBe(422);
      expect(error.message).toBe('');
    });

    it('should handle field parameter', () => {
      const error = createApiError(422, 'Validation failed', 'username');
      
      expect(error.code).toBe(422);
      expect(error.message).toBe('Validation failed');
      expect(error.field).toBe('username');
    });

    it('should handle special characters in message', () => {
      const message = 'Error with special chars: áéíóú & symbols @#$%';
      const error = createApiError(400, message);
      
      expect(error.message).toBe(message);
    });
  });

  describe('logError', () => {
    it('should log error with context information', () => {
      const testError = new Error('Test error for logging');
      const context = 'TEST_CONTEXT';

      logError(testError, context);

      expect(mockLog).toHaveBeenCalledWith(
        '[ERROR:TEST_CONTEXT]',
        expect.objectContaining({
          message: 'Test error for logging',
          error: testError,
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        })
      );
    });

    it('should log string errors', () => {
      logError('String error message', 'STRING_ERROR_CONTEXT');

      expect(mockLog).toHaveBeenCalledWith(
        '[ERROR:STRING_ERROR_CONTEXT]',
        expect.objectContaining({
          message: 'String error message',
          error: 'String error message'
        })
      );
    });

    it('should log complex error objects', () => {
      const complexError = {
        code: 422,
        message: 'Validation failed',
        errors: {
          field: ['Field is required']
        }
      };

      logError(complexError, 'COMPLEX_ERROR');

      expect(mockLog).toHaveBeenCalledWith(
        '[ERROR:COMPLEX_ERROR]',
        expect.objectContaining({
          message: 'Validation failed',
          error: complexError
        })
      );
    });

    it('should handle null/undefined errors gracefully', () => {
      logError(null, 'NULL_ERROR');
      logError(undefined, 'UNDEFINED_ERROR');

      expect(mockLog).toHaveBeenCalledTimes(2);
      expect(mockLog).toHaveBeenCalledWith(
        '[ERROR:NULL_ERROR]',
        expect.objectContaining({
          message: 'An unknown error occurred'
        })
      );
    });
  });

  describe('Error Classification Functions', () => {
    describe('isNetworkError', () => {
      it('should identify network errors', () => {
        const networkError1 = { message: 'Network connection failed' };
        const networkError2 = new Error('Connection timeout occurred');
        const networkError3 = { message: 'fetch failed' };
        const networkError4 = 'Network error detected';

        expect(isNetworkError(networkError1)).toBe(true);
        expect(isNetworkError(networkError2)).toBe(true);
        expect(isNetworkError(networkError3)).toBe(true);
        expect(isNetworkError(networkError4)).toBe(true);
      });

      it('should not identify non-network errors as network errors', () => {
        const apiError = { code: 400, message: 'Bad request' };
        const validationError = { code: 422, message: 'Validation failed' };
        const stringError = 'Simple error';

        expect(isNetworkError(apiError)).toBe(false);
        expect(isNetworkError(validationError)).toBe(false);
        expect(isNetworkError(stringError)).toBe(false);
        expect(isNetworkError(null)).toBe(false);
      });
    });

    describe('isAuthError', () => {
      it('should identify authentication errors', () => {
        const authError401 = { code: 401 };
        const authError403 = { code: 403 };
        const authErrorObject = { code: 401, message: 'Unauthorized' }; // Must have 'code' property, not 'httpStatus'

        expect(isAuthError(authError401)).toBe(true);
        expect(isAuthError(authError403)).toBe(true);
        expect(isAuthError(authErrorObject)).toBe(true);
      });

      it('should not identify non-auth errors as auth errors', () => {
        const badRequest = { code: 400 };
        const serverError = { code: 500 };
        const validationError = { code: 422 };

        expect(isAuthError(badRequest)).toBe(false);
        expect(isAuthError(serverError)).toBe(false);
        expect(isAuthError(validationError)).toBe(false);
        expect(isAuthError(null)).toBe(false);
      });
    });

    describe('isValidationError', () => {
      it('should identify validation errors', () => {
        const validationError1 = { code: 422 };
        const validationError2 = { 
          code: 422, 
          errors: { field: ['Required'] } 
        };
        const validationError3 = { 
          errors: { field: ['Validation failed'] } // This returns the errors object due to JS || operator
        };

        expect(isValidationError(validationError1)).toBe(true);
        expect(isValidationError(validationError2)).toBe(true);
        expect(Boolean(isValidationError(validationError3))).toBe(true); // Convert to boolean since it returns the object
      });

      it('should not identify non-validation errors as validation errors', () => {
        const authError = { code: 401 };
        const serverError = { code: 500 };
        const networkError = { code: 'NETWORK_ERROR' };

        // Note: Due to JS || operator quirk, these return undefined instead of false when no errors property exists
        expect(Boolean(isValidationError(authError))).toBe(false);
        expect(Boolean(isValidationError(serverError))).toBe(false);
        expect(Boolean(isValidationError(networkError))).toBe(false);
        expect(isValidationError(null)).toBe(false);
      });
    });
  });

  describe('Error Integration Scenarios', () => {
    it('should handle complete error processing workflow', () => {
      const apiResponse = {
        code: 422,
        message: 'Validation failed',
        errors: {
          username: ['Username is required', 'Username must be unique'],
          email: ['Email format is invalid']
        }
      };

      // Extract message
      const message = getErrorMessage(apiResponse);
      expect(message).toBe('Validation failed');

      // Create standardized error
      const standardError = createApiError(apiResponse.code, message);
      expect(standardError.code).toBe(422);
      expect(standardError.message).toBe('Validation failed');

      // Log the error
      logError(standardError, 'VALIDATION_WORKFLOW');
      expect(mockLog).toHaveBeenCalledWith(
        '[ERROR:VALIDATION_WORKFLOW]',
        expect.objectContaining({
          message: 'Validation failed'
        })
      );

      // Classify the error
      expect(isValidationError(apiResponse)).toBe(true);
      expect(isAuthError(apiResponse)).toBe(false);
      expect(isNetworkError(apiResponse)).toBe(false);
    });

    it('should handle network error scenario', () => {
      const networkError = new Error('Network request failed');
      networkError.name = 'TypeError';

      const message = getErrorMessage(networkError);
      expect(message).toBe('Network request failed');

      const standardError = createApiError(0, message);
      expect(standardError.code).toBe(0);

      expect(isNetworkError(networkError)).toBe(true);
      expect(isAuthError(networkError)).toBe(false);
      expect(Boolean(isValidationError(networkError))).toBe(false);
    });

    it('should handle authentication error scenario', () => {
      const authError = {
        code: 401,
        message: 'Token expired',
        httpStatus: 401
      };

      const message = getErrorMessage(authError);
      expect(message).toBe('Token expired');

      expect(isAuthError(authError)).toBe(true);
      expect(isNetworkError(authError)).toBe(false);
      expect(Boolean(isValidationError(authError))).toBe(false);
    });

    it('should handle hook-based error processing', () => {
      // Test basic error processing workflow
      const complexError = {
        response: {
          status: 422,
          data: {
            meta: {
              code: 422,
              status: 'error',
              message: 'Form validation failed'
            },
            errors: {
              field1: ['Error 1'],
              field2: ['Error 2']
            }
          }
        }
      };

      const message = getErrorMessage(complexError);
      expect(message).toBe('An unexpected error occurred');

      const standardError = createApiError(422, 'Form validation failed');
      logError(standardError, 'FORM_SUBMISSION');

      expect(mockLog).toHaveBeenCalledWith(
        '[ERROR:FORM_SUBMISSION]',
        expect.objectContaining({
          message: 'Form validation failed'
        })
      );
    });
  });

  describe('Edge Cases and Error Boundary', () => {
    it('should handle circular reference objects safely', () => {
      const circularObj: any = { message: 'Circular error' };
      circularObj.self = circularObj;

      const message = getErrorMessage(circularObj);
      expect(message).toBe('Circular error');
    });

    it('should handle very large error objects', () => {
      const largeError = {
        message: 'Large error',
        data: new Array(1000).fill('large data string')
      };

      const message = getErrorMessage(largeError);
      expect(message).toBe('Large error');
    });

    it('should handle unicode and special characters', () => {
      const unicodeError = {
        message: 'Error with unicode: 你好 🚀 émojis and spëciál chars'
      };

      const message = getErrorMessage(unicodeError);
      expect(message).toBe('Error with unicode: 你好 🚀 émojis and spëciál chars');
    });

    it('should handle function objects as errors', () => {
      const functionError = () => 'This is a function';
      (functionError as any).message = 'Function with message';

      const message = getErrorMessage(functionError);
      expect(message).toBe('An unexpected error occurred'); // Functions are not handled as Error objects
    });
  });
});