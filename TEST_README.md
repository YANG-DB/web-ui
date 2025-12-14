# Server API Tests

This document describes the test suite for the Express server API endpoints.

## Test Setup

The test suite uses:
- **Jest** - Testing framework
- **Supertest** - HTTP assertion library for testing Express applications

## Running Tests

```bash
# Run all tests with coverage
yarn test

# Run tests in watch mode
yarn test:watch
```

## Test Coverage

Current coverage: **93.33%**
- Statements: 93.33%
- Branches: 80%
- Functions: 88.88%
- Lines: 95.45%

## Test Structure

The test suite is organized into the following sections:

### GET /api/ontology
- ✓ Returns ontology data with correct structure
- ✓ Includes CORS headers
- ✓ Returns Dragons ontology

### GET /api/structure
- ✓ Returns structure data
- ✓ Includes primitives array
- ✓ Includes operators object

### POST /api/results
- ✓ Returns results for normal query
- ✓ Returns results for collapsed query
- ✓ Accepts JSON request body

### POST /api/update
- ✓ Returns update data

### GET /api/schema
- ✓ Returns list of schemas
- ✓ Returns schemas with id and label
- ✓ Includes Schema A in the list

### GET /api/schema/:id
- ✓ Returns specific schema by id
- ✓ Returns schema with GraphQL query

### POST /api/schema
- ✓ Successfully saves schema with label
- ✓ Returns 400 when label is missing
- ✓ Returns 400 when label is empty string

### CORS Headers
- ✓ Includes CORS headers on all endpoints

### Content-Type Headers
- ✓ Returns JSON for all API endpoints

## What the Tests Verify

1. **Response Status Codes**: Ensures endpoints return correct HTTP status codes (200, 400, etc.)
2. **Response Structure**: Validates the shape and structure of JSON responses
3. **CORS Configuration**: Verifies CORS headers are present on all endpoints
4. **Content-Type**: Confirms all responses are JSON
5. **Data Validation**: Checks that required data fields are present and correct
6. **Error Handling**: Tests error scenarios (missing parameters, invalid requests)

## Test Files

- `server.test.js` - Main test file with all API endpoint tests
- `jest.config.js` - Jest configuration
- `server.js` - Server code (modified to export app for testing)

## Coverage Report

After running tests, a coverage report is generated in the `coverage/` directory. You can view the HTML report by opening `coverage/lcov-report/index.html` in a browser.

## CI/CD Integration

The test suite is designed to work in CI/CD pipelines. The coverage thresholds are set to:
- 70% for branches, functions, lines, and statements

If coverage falls below these thresholds, the test command will fail.
