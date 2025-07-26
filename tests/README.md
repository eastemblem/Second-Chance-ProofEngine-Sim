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
## Server Test Files (Recently Moved)

### Monitoring and Testing Routes
- `tests/server/routes/monitoring/cache-monitor.ts` - Cache performance monitoring
- `tests/server/routes/monitoring/performance.ts` - LRU cache performance testing  
- `tests/server/routes/sentry-test.ts` - Sentry error tracking testing
- `tests/server/routes/v1/test.ts` - V1 API test endpoints

### Monitoring Services
- `tests/server/monitoring/newrelic-test.ts` - NewRelic connectivity testing

### Backup Files
- `tests/server/backup/routes.ts.backup` - Backup of main routes file
- `tests/server/backup/dashboard.ts.backup` - Backup of dashboard routes

### Templates
- `tests/server/templates/certificate-template-OLD.pdf` - Legacy certificate template

All test files moved from server/ to tests/ directory for better organization.
