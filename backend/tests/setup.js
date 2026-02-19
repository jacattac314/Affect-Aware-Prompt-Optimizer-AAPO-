'use strict';

/**
 * Jest global setup — suppress console.error during tests.
 *
 * Error-path integration tests intentionally trigger 4xx responses; the
 * global error handler logs these. Silencing them keeps test output clean.
 * Tests that assert on error messages should use response bodies, not stdout.
 */
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});
