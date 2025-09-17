# GitHub Copilot Instructions for JSON:API Validator

## Repository Overview

**What this repository does**: A single-page application (SPA) that validates JSON:API v1.1 specification compliance by acting as a client to test any JSON:API implementation. It generates conformant requests and validates responses through comprehensive validation workflows.

**Repository details**:
- **Size**: Medium-sized repository with full implementation
- **Type**: React-based single-page application with integrated mock server
- **Primary languages**: JavaScript (ES modules), JSX for React components  
- **Framework**: React 19.1.1 with Vite 7.1.5 build system
- **Target runtime**: Modern web browsers (requires Node.js 20+ for development)
- **Backend compatibility**: Any JSON:API implementation (Go, Node.js, Python, etc.)

## Build and Validation Instructions

### Development Environment Setup
**ALWAYS run these commands in this exact order:**

1. **Install dependencies**: `npm ci` (ALWAYS use `npm ci` not `npm install` for consistent builds)
2. **Lint check**: `npm run lint` (runs instantly, must pass with 0 warnings)
3. **Build verification**: `npm run build` (takes ~1.5 seconds)

### Build Commands and Timings

**Core build commands** (all tested and working):
- `npm run lint` - ESLint validation (instant, 0 warnings required)
- `npm run build` - Vite production build (1.5s, outputs to `dist/`)  
- `npm run dev` - Vite dev server on http://localhost:3000 (starts in ~200ms)
- `npm run preview` - Preview production build on http://localhost:4173
- `npm run mock-server` - Start JSON:API mock server on http://localhost:3001
- `npm run dev:full` - Run both dev server and mock server concurrently
- `npm start` - Alias for `npm run dev:full` (recommended for development)

**Runtime requirements**:
- Node.js 20+ (confirmed working, uses ES modules)
- Modern browser for SPA (tested with latest versions)
- No additional global tools required

### Testing and Validation Strategy

**Current testing approach** (no npm test suite yet):
- `./test-endpoints.sh` - Bash script to test mock server endpoints (requires jq)
- Manual validation through web UI at http://localhost:3000
- Mock server provides both valid and invalid JSON:API endpoints for testing

**To run endpoint tests:**
1. `npm run mock-server` (start server)
2. `./test-endpoints.sh` (run endpoint tests, requires server running)

### Known Issues and Workarounds
- **No npm test command**: Repository doesn't have Jest/testing framework setup yet
- **Mock server dependency**: Some testing requires mock server to be running first
- **Manual testing**: Primary validation is through web interface, not automated tests

## Project Layout and Architecture

### Current Repository Structure (Implemented)
```
/
├── .git/                          # Git repository data
├── .github/                       # GitHub configuration
│   ├── workflows/
│   │   └── copilot-setup-steps.yml # GitHub Actions workflow
│   └── copilot-instructions.md    # This file
├── mock-server/                   # JSON:API mock server implementation
│   ├── data/
│   │   └── sampleData.js         # Test data for mock endpoints
│   ├── routes/                   # Express route handlers
│   │   ├── articles.js          # Articles resource endpoints
│   │   ├── people.js            # People resource endpoints  
│   │   ├── comments.js          # Comments resource endpoints
│   │   └── invalid.js           # Invalid endpoints for testing
│   ├── server.js                # Express server setup
│   └── README.md                # Mock server documentation
├── src/                         # React application source
│   ├── components/              # React UI components
│   │   ├── ConfigForm.jsx       # API endpoint configuration form
│   │   ├── TestRunner.jsx       # Test execution controller
│   │   ├── ResultsPanel.jsx     # Basic validation results display
│   │   └── EnhancedResultsPanel.jsx # Advanced results with export
│   ├── validators/              # JSON:API validation logic (IMPLEMENTED)
│   │   ├── DocumentValidator.js # Document structure validation
│   │   ├── ResourceValidator.js # Resource object validation
│   │   ├── ErrorValidator.js    # Error response validation
│   │   ├── QueryValidator.js    # Query parameter validation
│   │   ├── QueryParameterValidator.js # Query param specific logic
│   │   └── PaginationValidator.js # Pagination validation
│   ├── utils/                   # Core utilities (IMPLEMENTED)
│   │   ├── ValidationService.js # Main validation orchestration
│   │   ├── ValidationReporter.js # Report formatting and export
│   │   ├── ApiClient.js         # HTTP request client
│   │   └── UrlValidator.js      # URL validation utilities
│   ├── App.jsx                  # Main React application component
│   ├── main.jsx                 # React application entry point
│   └── index.css                # Application styles
├── package.json                 # Dependencies and npm scripts
├── package-lock.json            # Locked dependency versions
├── vite.config.js              # Vite build configuration
├── eslint.config.js            # ESLint configuration
├── index.html                   # HTML template for SPA
├── test-endpoints.sh           # Mock server endpoint testing script
├── LICENSE                     # MIT license
└── README.md                   # Project documentation
```

### Key Implementation Status
- **✅ IMPLEMENTED**: Full React SPA with comprehensive validator logic
- **✅ IMPLEMENTED**: Mock JSON:API server with test endpoints  
- **✅ IMPLEMENTED**: Build system with Vite + ESLint
- **✅ IMPLEMENTED**: All core validation components and utilities
- **❌ MISSING**: Automated test suite (Jest/Vitest)
- **❌ MISSING**: CI/CD pipeline beyond basic GitHub Actions

### Configuration Files (All Present)
- `package.json` - Dependencies and scripts (React 19.1.1, Vite 7.1.5, Express 5.1.0)
- `vite.config.js` - Vite build configuration (React plugin, dev server on :3000)
- `eslint.config.js` - ESLint rules (React + hooks plugins, modern config format)
- `.gitignore` - Build outputs, dependencies, IDE files excluded

### Dependencies (Confirmed Working)
**Production dependencies:**
- `react@19.1.1` + `react-dom@19.1.1` - UI framework
- `express@5.1.0` + `cors@2.8.5` - Mock server backend

**Development dependencies:**  
- `vite@7.1.5` + `@vitejs/plugin-react@5.0.2` - Build system
- `eslint@9.35.0` + React plugins - Code linting
- `concurrently@9.2.1` - Run dev server + mock server together

### Development Workflow
1. **ALWAYS**: `npm ci` to install exact dependencies
2. **Check code**: `npm run lint` (must have 0 warnings)  
3. **Development**: `npm start` (runs both React app and mock server)
4. **Production build**: `npm run build` (outputs to `dist/`)
5. **Test endpoints**: `./test-endpoints.sh` (requires mock server running)

### GitHub Actions Workflow
- `copilot-setup-steps.yml` - Runs dependency installation and basic validation
- Validates on Node.js 20, runs `npm ci` 
- No automated testing yet, focuses on setup verification

### Validation Steps for Code Changes
**ALWAYS perform these steps in order:**
1. `npm run lint` - Must pass with 0 warnings
2. `npm run build` - Must complete successfully (~1.5s)
3. `npm start` - Start development environment, verify UI loads
4. Start mock server, test API endpoints with `./test-endpoints.sh`
5. Manual testing through web UI at http://localhost:3000

### Mock Server Integration
**Critical for development and testing:**
- Runs on http://localhost:3001 with JSON:API v1.1 compliant endpoints
- Provides both valid and invalid endpoints for validator testing  
- Required for comprehensive validation workflow testing
- Test script validates server responses and error handling

## Agent Instructions
**Trust these instructions** - this repository has a complete, working implementation contrary to outdated documentation. The React SPA and mock server are fully functional. Focus on enhancing existing components rather than creating new architecture. Always test changes against the mock server endpoints.