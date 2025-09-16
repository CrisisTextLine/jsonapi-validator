# GitHub Copilot Instructions for JSON:API Validator

## Repository Overview

**What this repository does**: A single-page application (SPA) that validates JSON:API v1.1 specification compliance by acting as a client to test any JSON:API implementation. It generates conformant requests and validates responses through multi-step CRUD workflows (GET collection → GET individual → POST create → PATCH update → DELETE cleanup).

**Repository details**:
- **Size**: Very small repository in early development stage
- **Type**: Web-based single-page application project  
- **Primary languages**: JavaScript/TypeScript (planned)
- **Framework**: React or Vue.js (to be determined)
- **Target runtime**: Modern web browsers
- **Backend compatibility**: Any JSON:API implementation (Go, Node.js, Python, etc.)

## Build and Validation Instructions

### Current Development Stage
This repository is in early planning phase with only documentation files. No build system, dependencies, or source code exist yet.

**Current files**:
- `README.md` - Project documentation and planned approach
- `LICENSE` - MIT license from Crisis Text Line
- `.github/copilot-instructions.md` - This file

### Expected Build Setup (When Implementation Begins)

**Bootstrap sequence** (anticipated):
1. `npm init` - Initialize package.json for Node.js project
2. `npm install` - Install dependencies (React/Vue, webpack, etc.)
3. Create `src/` directory structure for components and validators

**Build commands** (planned):
- `npm run build` - Build production bundle (estimated: 30-60 seconds)
- `npm run dev` - Start development server with hot reload
- `npm run test` - Run test suite (Jest + testing library)
- `npm run lint` - ESLint code quality checks
- `npm run start` - Serve production build locally

**Runtime requirements** (expected):
- Node.js 18+ for build tools
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)

### Testing Strategy
No tests exist yet. Expected test structure:
- Unit tests for validation logic in `tests/unit/`
- Integration tests for API client in `tests/integration/`  
- E2E tests for SPA workflows in `tests/e2e/`

### Environment Setup
No special environment setup currently required. Standard web development environment expected.

## Project Layout and Architecture

### Current Repository Structure
```
/
├── .git/                    # Git repository data
├── .github/                 # GitHub configuration
│   └── copilot-instructions.md  # This file
├── LICENSE                  # MIT license
└── README.md               # Project documentation
```

### Planned Architecture (from README)
```
src/
├── components/             # React/Vue UI components
│   ├── TestRunner.js       # Main test execution component
│   ├── ConfigForm.js       # API endpoint configuration  
│   ├── ResultsPanel.js     # Validation results display
│   └── WorkflowSteps.js    # Multi-step test workflow UI
├── validators/             # JSON:API validation logic
│   ├── DocumentValidator.js # Document structure validation
│   ├── ResourceValidator.js # Resource object validation
│   ├── ErrorValidator.js   # Error response validation
│   └── QueryValidator.js   # Query parameter validation
├── client/                 # HTTP client for API requests
│   ├── RequestGenerator.js # Generate JSON:API compliant requests
│   ├── ResponseHandler.js  # Process API responses
│   └── WorkflowEngine.js   # Multi-step test execution
├── utils/                  # Shared utilities
│   ├── JsonApiHelper.js    # JSON:API structure helpers
│   └── ValidationReporter.js # Format validation results
└── app.js                  # Main application entry point
```

### Key Implementation Requirements
- **Single-Page Application**: Web-based UI, not middleware or CLI tool
- **Client-side testing**: Generate HTTP requests to test any JSON:API backend
- **Multi-step workflows**: Chain CRUD operations for comprehensive validation
- **JSON:API v1.1 compliance**: Full specification validation including document structure, content-types, query parameters, and error handling

### Configuration Files (Expected)
- `package.json` - Dependencies and scripts (not yet created)
- `webpack.config.js` or `vite.config.js` - Build configuration (TBD)
- `.eslintrc.js` - Code linting rules (TBD)
- `jest.config.js` - Test configuration (TBD)

### Dependencies (Not Yet Determined)
Expected key dependencies:
- React or Vue.js for UI framework
- Axios or Fetch API for HTTP requests  
- JSON Schema validation library
- CSS framework (TailwindCSS or similar)
- Build tools (Webpack/Vite)

### Current Git Workflow
- Main branch: Uses `copilot/fix-*` feature branches
- No CI/CD pipelines exist yet
- No automated testing or validation

### Validation Steps for Changes
Since no build system exists:
1. Validate markdown syntax in documentation files
2. Check that planned architecture aligns with JSON:API v1.1 spec requirements
3. Ensure documentation accuracy and completeness

### README Contents Summary
The README describes a comprehensive JSON:API validator SPA with:
- Client-side testing approach for any JSON:API implementation
- Multi-step CRUD workflow validation (GET → POST → PATCH → DELETE)
- Web-based UI for configuration and results
- Support for relationship testing and query parameter validation
- Real-time validation with detailed error reporting

## Agent Instructions
**Trust these instructions** - this repository is in early development with minimal files. Only perform additional searches if the information above is incomplete or found to be incorrect. The planned architecture and approach are documented in the README and should be used as the source of truth for implementation decisions.