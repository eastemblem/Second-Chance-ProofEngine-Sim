# Test Suite Documentation

## Directory Structure

### `/api/` - API Testing Scripts
Contains scripts for testing various API endpoints and functionality.
- `dashboard-tests.js` - Dashboard API integration tests
- `activity-tests.js` - Activity tracking tests
- `auth-tests.js` - Authentication flow tests

### `/fixtures/` - Test Data and Files
Static test data and files used across test suites.
- `documents/` - Test PDFs and documents for upload testing
- `data/` - Test data files and configuration

### `/reports/` - Test Reports and Analysis
Generated reports from test runs and performance analysis.
- `performance/` - Performance test results and reports
- `analysis/` - Analysis reports from external systems

### `/temp/` - Temporary Test Artifacts
Temporary files generated during testing (excluded from git).
- `cookies/` - Authentication cookies from test sessions
- `uploads/` - Temporary upload test files
- `mappings/` - Folder mapping test data

### `/examples/` - Code Examples and Demos
Example implementations and integration demos.

### `/scripts/` - Test Utility Scripts
Helper scripts for test setup, cleanup, and maintenance.

## Running Tests

### API Tests
```bash
node tests/api/dashboard-tests.js
node tests/api/activity-tests.js
```

### Performance Tests
Access the performance test UI at `/performance-test` in the application.

## Guidelines

1. Keep test data realistic but not containing sensitive information
2. Clean up temporary files after test runs
3. Document any new test files or significant changes
4. Use the fixtures directory for reusable test data