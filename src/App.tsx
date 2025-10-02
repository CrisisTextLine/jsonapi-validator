import { useState } from 'react'
import type { FC } from 'react'
import ConfigForm from './components/ConfigForm'
import TestRunner from './components/TestRunner'
import EnhancedResultsPanel from './components/EnhancedResultsPanel'
import { runValidation } from './utils/ValidationService.js'
import type { ValidationReport, TestConfig as ValidationTestConfig } from './types/validation'

interface CustomHeader {
  key: string
  value: string
}

interface AuthCredentials {
  token?: string
  key?: string
  headerName?: string
  username?: string
  password?: string
}

// App's internal TestConfig with customHeaders as array (for ConfigForm compatibility)
interface AppTestConfig {
  apiUrl: string
  httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  authType: 'none' | 'bearer' | 'apiKey' | 'basic'
  authCredentials: AuthCredentials
  customHeaders: CustomHeader[]
  requestBody: string
}

interface ValidationState {
  isRunning: boolean
  results: ValidationReport | null
  error: string | null
  timestamp: string | null
}

const App: FC = () => {
  const [testConfig, setTestConfig] = useState<AppTestConfig>({
    apiUrl: '',
    httpMethod: 'GET',
    authType: 'none',
    authCredentials: {},
    customHeaders: [{ key: '', value: '' }],
    requestBody: ''
  })

  const [validationState, setValidationState] = useState<ValidationState>({
    isRunning: false,
    results: null,
    error: null,
    timestamp: null
  })

  const handleConfigChange = (newConfig: AppTestConfig): void => {
    setTestConfig(newConfig)
  }

  const handleStartValidation = async (): Promise<void> => {
    setValidationState({
      isRunning: true,
      results: null,
      error: null,
      timestamp: null
    })

    try {
      const results = await runValidation(testConfig)

      if (results.metadata?.status === 'error') {
        // Extract error message from the first failed test
        const firstError = Object.values(results.sections || {})
          .flatMap(section => section.tests)
          .find(test => test.status === 'failed')

        setValidationState({
          isRunning: false,
          results: null,
          error: firstError?.message || 'Request failed',
          timestamp: results.metadata.timestamp
        })
      } else {
        setValidationState({
          isRunning: false,
          results: results,
          error: null,
          timestamp: results.metadata.timestamp
        })
      }
    } catch (error) {
      setValidationState({
        isRunning: false,
        results: null,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
    }
  }

  const handleReset = (): void => {
    setTestConfig({
      apiUrl: '',
      httpMethod: 'GET',
      authType: 'none',
      authCredentials: {},
      customHeaders: [{ key: '', value: '' }],
      requestBody: ''
    })
    setValidationState({
      isRunning: false,
      results: null,
      error: null,
      timestamp: null
    })
  }

  // Convert customHeaders array to Record for TestRunner compatibility
  const testConfigForRunner: ValidationTestConfig = {
    ...testConfig,
    customHeaders: testConfig.customHeaders.reduce((acc, header) => {
      if (header.key && header.value) {
        acc[header.key] = header.value
      }
      return acc
    }, {} as Record<string, string>)
  }

  return (
    <div className="container">
      <header className="header">
        <h1>JSON:API Validator</h1>
        <p>Validate JSON:API v1.1 specification compliance for any API endpoint</p>
      </header>

      <div className="main-content">
        <div className="card">
          <h2>Configuration</h2>
          <ConfigForm
            config={testConfig}
            onChange={handleConfigChange}
            disabled={validationState.isRunning}
          />
          <TestRunner
            config={testConfigForRunner}
            validationState={validationState}
            onStartValidation={handleStartValidation}
            onReset={handleReset}
          />
        </div>

        <div className="card">
          <h2>Results</h2>
          <EnhancedResultsPanel
            validationState={validationState}
          />
        </div>
      </div>
    </div>
  )
}

export default App
