# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**DigiTwinCare Server** is a healthcare backend API server built with Express.js, designed for on-premises deployment. It manages patient health data, digital twin interactions, AI integrations, and various health tracking features. The codebase is organized by domain features with a consistent three-layer architecture.

## Development Commands

```bash
# Install dependencies
npm install

# Development (watches for changes)
npm run dev

# Production
npm start

# Linting
npm run lint

# Testing
npm test

# Run a specific test file
node --experimental-vm-modules node_modules/jest/bin/jest.js src/path/to/test.js

# Database migrations
npm run migrate
npm run migrate:down
```

## Project Architecture

### Layered Pattern

The codebase follows a consistent three-layer architecture:

```
Routes (express routers)
  ↓
Controllers (req/res handling, parameter extraction)
  ↓
Services (business logic)
  ↓
Database Queries
```

For example, for patients:

- **Routes** ([src/routes/patients.js](src/routes/patients.js)): Thin routers that define endpoints and attach validation middleware
- **Controller** ([src/controllers/patientController.js](src/controllers/patientController.js)): Extracts request data, calls services, formats responses
- **Service** ([src/services/patientService.js](src/services/patientService.js)): Implements business logic, orchestrates queries
- **Queries** ([src/db/patientQueries.js](src/db/patientQueries.js)): Direct database interactions via Supabase

### Directory Structure

```
src/
├── digitwinServer.js              # Main entry point, Express app setup
├── config/                        # Configuration and environment
├── middleware/                    # Express middleware (auth, validation, error handling)
├── routes/                        # API route definitions (thin routers)
├── controllers/                   # Request handlers (delegation layer)
├── services/                      # Business logic (most of the work happens here)
├── db/                           # Database queries and ORM interactions
├── integrations/                 # Third-party integrations (Supabase, Twilio, etc.)
├── util/                         # Utilities (logger, encryption, validation)
├── Constants/                    # Static data (personalities, etc.)
└── prompts/                      # AI prompt templates
```

### Key Services

- **Supabase Database** ([src/services/supabaseDatabase.js](src/services/supabaseDatabase.js)): Main database connection (PostgreSQL via Supabase)
- **Redis** ([src/services/redis.js](src/services/redis.js)): Caching (currently initialized but not actively used)
- **Logger** ([src/util/logger.js](src/util/logger.js)): Pino-based logging with file rotation (15-day retention, 10MB per file)

## Core Concepts

### Authentication & Authorization

- **JWT-based**: Uses Supabase's built-in JWT system. Tokens are validated via `supabase.auth.getUser(token)`
- **Middleware**: [src/middleware/auth.js](src/middleware/auth.js) provides:
  - `authMiddleware`: Validates token and attaches user context to request
  - `requireRole(roles...)`: Guards routes to specific roles
  - `requirePermission(permissions...)`: Guards routes to specific permissions
- **User Context**: After auth, `req.user` contains: `id`, `email`, `role`, `full_name`, `is_archived`, `hospitalId`, `permissions`, `access_token`

### Request Validation

- **Zod schemas** in [src/middleware/validation.js](src/middleware/validation.js)
- Routes attach validation middleware: `validateBody(schema)`, `validateQuery(schema)`, `validateParams(schema)`
- Validation errors are caught by the error handler and return structured responses

### Request/Response Format

All endpoints follow this structure:

**Success:**

```javascript
{
  data: { /* actual response */ },
  error: null,
  pagination: { /* if applicable */ }
}
```

**Error:**

```javascript
{
  data: null,
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message'
  }
}
```

### Error Handling

[src/middleware/errorHandler.js](src/middleware/errorHandler.js) provides standardized error handling. Custom errors use the `errors` object with methods like `errors.forbidden()`, `errors.notFound()`, etc.

### Middleware Pipeline

Key middleware in [src/digitwinServer.js](src/digitwinServer.js):

1. Helmet (security headers)
2. CORS (configured per environment)
3. Compression
4. JSON/URL parsing
5. Request logging
6. Rate limiting
7. Decryption (for encrypted requests)
8. Auth (route-specific)
9. Gzip response (under `/api/v1`)
10. Error handler

## Configuration Management

- **Config file**: [src/config/index.js](src/config/index.js)
- **Env template**: [.env.example](.env.example)
- All values loaded from environment variables, validated at startup
- Key sections: Server, Database (PostgreSQL), Redis, Supabase, JWT, SAML, Email, SMS, Security, Hospital, EMR

**Critical for development**: Copy `.env.example` to `.env` and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`.

## Feature Domains

The routes are organized by domain features (not technical layers). Each domain typically has:

- **Patient Management**: vitals, weight, glucose, food, meals
- **User Features**: users, permissions, profiles, admin
- **AI/Digital Twin**: twin, tts, conversations, analysis
- **Health Tracking**: glucose, weight, daily_nutrition, steps, exercises
- **Social Features**: rewards, quests, challenges, skills
- **Integrations**: restaurants, instacart, clinic, support chat
- **Utility**: analytics, household, notifications, transcription

Routing is mounted at [src/digitwinServer.js:175-267](src/digitwinServer.js#L175-L267).

## Important Patterns

### Service Pattern

Services encapsulate business logic and call database queries. Example from patientService:

```javascript
export async function listPatients(user, queryParams) {
  // Business logic: filter by user permissions, build query
  // Returns: { items: [...], pagination: {...} }
}
```

### Database Query Pattern

Queries are direct Supabase calls. Example pattern:

```javascript
export async function getPatientById(id) {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  return { data, error };
}
```

### Logging

Use the logger from [src/util/logger.js](src/util/logger.js):

```javascript
import logger from "../util/logger.js";
logger.info("Message");
logger.error(error, "Message");
logger.debug("Message");
```

Logs are written to files in a logs directory with automatic rotation and cleanup (runs hourly).

## Testing

Tests use **Jest** with Node.js ESM support. Test files are colocated with source in `__tests__` folders:

- [src/config/**tests**/goLiveThresholds.test.js](src/config/__tests__/goLiveThresholds.test.js)
- [src/lib/**tests**/hl7ObservedTimeExtractor.test.js](src/lib/__tests__/hl7ObservedTimeExtractor.test.js)

Run tests with `npm test`.

## Performance & Security Considerations

- **Rate Limiting**: Configured per operation type (auth: 10, read: 100, write: 30, pdf: 5 req/min)
- **Encryption**: Middleware supports request decryption and response encryption ([src/middleware/cryptoEncryptionMiddleware.js](src/middleware/cryptoEncryptionMiddleware.js))
- **CORS**: Origins configured via `CORS_ORIGINS` environment variable
- **Helmet**: Security headers enabled
- **Request Logging**: Every request logged via requestLogger middleware
- **Database Pool**: Configured with min/max connections

## Common Tasks

### Adding a New Feature Endpoint

1. Create route file in `src/routes/`
2. Define Zod schema in validation middleware
3. Create controller in `src/controllers/`
4. Create service in `src/services/`
5. Create queries in `src/db/`
6. Mount route in `src/digitwinServer.js`

### Querying Database

Use Supabase client from [src/integrations/supabase/client.js](src/integrations/supabase/client.js):

```javascript
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("column", value);
```

### Adding Middleware

Create in `src/middleware/`, then attach to specific routes or globally in digitwinServer.js.

### Environment-Specific Configuration

Use `config.nodeEnv` to conditionally apply behavior, or set environment variables for different deployments.

## Dependencies Overview

- **Express**: Web framework
- **Supabase JS SDK**: Database and auth
- **PostgreSQL (pg)**: Database driver (via Supabase)
- **Redis**: Caching (configured but optional)
- **JWT (jsonwebtoken)**: Token generation
- **Zod**: Schema validation
- **Pino**: Logging
- **Helmet**: Security headers
- **CORS**: Cross-origin requests
- **Twilio**: SMS (optional)
- **Nodemailer**: Email (optional)

## Debugging Tips

- **Logs**: Check logs in the logs directory (rotated hourly)
- **Config**: Verify all required environment variables are set in `.env`
- **Routes**: All routes logged in console and files
- **Errors**: Stack traces in error handler output and logs
- **Health Check**: `GET /health` returns status regardless of auth

## Known Limitations & TODOs

- Redis client initialized but usage is commented out in server startup
- Some endpoints documented in routes have minimal implementation
- SAML SSO is available but requires configuration
- Email/SMS services need SMTP and Twilio configuration for full functionality
- Log cleanup runs every hour (hardcoded schedule in digitwinServer.js:135)
