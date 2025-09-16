import { useState } from 'react'
import ConfigForm from './components/ConfigForm'
import TestRunner from './components/TestRunner'
import ResultsPanel from './components/ResultsPanel'

function App() {
  const [testConfig, setTestConfig] = useState({
    apiUrl: '',
    httpMethod: 'GET',
    authType: 'none',
    authCredentials: {},
    customHeaders: [{ key: '', value: '' }],
    requestBody: ''
  })
  
  const [validationState, setValidationState] = useState({
    isRunning: false,
    results: null,
    error: null
  })

  const handleConfigChange = (newConfig) => {
    setTestConfig(newConfig)
  }

  const handleStartValidation = () => {
    setValidationState({
      isRunning: true,
      results: null,
      error: null
    })
    
    // TODO: Implement actual validation logic
    // For now, simulate validation process
    setTimeout(() => {
      setValidationState({
        isRunning: false,
        results: {
          timestamp: new Date().toISOString(),
          endpoint: testConfig.apiUrl,
          method: testConfig.httpMethod,
          status: 'completed',
          summary: {
            total: 5,
            passed: 4,
            failed: 1,
            warnings: 0
          },
          details: [
            {
              test: 'Content-Type Header',
              status: 'passed',
              message: 'Content-Type is application/vnd.api+json'
            },
            {
              test: 'Response Structure',
              status: 'passed',
              message: 'Response has valid JSON:API document structure'
            },
            {
              test: 'Resource Object',
              status: 'passed',
              message: 'Resource objects contain required id and type fields'
            },
            {
              test: 'Meta Information',
              status: 'passed',
              message: 'Meta object is properly formatted'
            },
            {
              test: 'Error Handling',
              status: 'failed',
              message: 'Error responses do not follow JSON:API error format'
            }
          ]
        },
        error: null
      })
    }, 2000)
  }

  const handleReset = () => {
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
      error: null
    })
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
            config={testConfig}
            validationState={validationState}
            onStartValidation={handleStartValidation}
            onReset={handleReset}
          />
        </div>
        
        <div className="card">
          <h2>Results</h2>
          <ResultsPanel 
            validationState={validationState}
          />
        </div>
      </div>
    </div>
  )
}

export default App