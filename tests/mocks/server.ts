import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup mock server for testing with comprehensive endpoint coverage
// Total: 46 API endpoints with MSW v2 compatibility
export const server = setupServer(...handlers);

// Export handlers for individual test customization
export { handlers } from './handlers';
export { errorHandlers } from './other-handlers';