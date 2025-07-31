# Development vs Production Environment Separation

## Environment Strategy

### 1. Environment Variables
- **Development**: Uses local `.env` file and Replit secrets
- **Production**: Uses Replit deployment secrets (separate from dev secrets)
- **Key Variables**:
  - `NODE_ENV`: `development` vs `production`
  - `DATABASE_URL`: Separate dev and prod databases
  - `FRONTEND_URL`: Different domains for dev/prod
  - API keys and secrets isolated per environment

### 2. Database Separation
- **Development**: Development database instance
- **Production**: Production database with backups and monitoring
- **Migration Strategy**: Use `npm run db:push` for dev, proper migrations for prod

### 3. Replit Configuration

#### Development Repl
- Main development workspace
- Hot reloading enabled
- Debug logging active
- Development database connections
- Test data and fixtures

#### Production Deployment
- Separate Replit deployment
- Optimized build configuration
- Production logging levels
- Production database
- Real user data

### 4. Build Configuration

#### Development Build
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build:dev": "vite build --mode development"
  }
}
```

#### Production Build
```json
{
  "scripts": {
    "start": "NODE_ENV=production node dist/index.js",
    "build:prod": "vite build --mode production"
  }
}
```

### 5. Deployment Checklist

#### Before Deployment
- [ ] All tests passing
- [ ] Production environment variables configured
- [ ] Database migrations ready
- [ ] Build optimizations enabled
- [ ] Error monitoring configured (Sentry, NewRelic)
- [ ] Security headers configured

#### Environment Isolation
- [ ] Development secrets separate from production
- [ ] Database connections isolated
- [ ] API endpoints configured per environment
- [ ] Logging levels appropriate per environment
- [ ] File uploads isolated per environment

### 6. Replit Deployment Best Practices

#### Secrets Management
- Development secrets in main Repl
- Production secrets in deployment Repl
- Never share secrets between environments

#### Domain Configuration
- Development: `*.replit.dev` or `*.replit-user.repl.co`
- Production: Custom domain or `*.replit.app`

#### Resource Allocation
- Development: Standard resources for testing
- Production: Autoscale with proper resource limits

### 7. Monitoring Separation

#### Development Monitoring
- Console logging
- Debug level logs
- Development Sentry project
- Local performance monitoring

#### Production Monitoring
- Structured logging with Winston
- Info/Error level logs only
- Production Sentry project
- NewRelic performance monitoring
- Uptime monitoring

### 8. Data Isolation

#### Development Data
- Test data and fixtures
- Safe to reset/modify
- Mock external API responses when possible

#### Production Data
- Real user data
- Backup strategies
- Data retention policies
- GDPR/privacy compliance

### 9. Deployment Commands

#### Deploy to Production
```bash
# Build production assets
npm run build:prod

# Deploy to Replit
# (Use Replit's deployment interface)
```

#### Rollback Strategy
- Keep previous deployment available
- Database backup before migrations
- Quick rollback procedures documented

### 10. Environment Testing

#### Development Testing
- Unit tests
- Integration tests
- Local API testing
- UI component testing

#### Production Testing
- Smoke tests after deployment
- Health check endpoints
- Performance benchmarks
- User acceptance testing

## Implementation Status

- ✅ Environment variables configured
- ✅ Development logging with Winston
- ✅ Sentry error tracking configured
- ✅ NewRelic monitoring configured
- ✅ Database separation ready
- ⏳ Production deployment configuration
- ⏳ Automated deployment pipeline