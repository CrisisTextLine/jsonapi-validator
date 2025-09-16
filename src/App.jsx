import { useState } from 'react'
import ConfigForm from './components/ConfigForm'
import TestRunner from './components/TestRunner'
import ResultsPanel from './components/ResultsPanel'
import { runValidation } from './utils/ValidationService.js'

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

  const handleStartValidation = async () => {
    setValidationState({
      isRunning: true,
      results: null,
      error: null
    })
    
    try {
      const results = await runValidation(testConfig)
      
      if (results.status === 'error') {
        setValidationState({
          isRunning: false,
          results: null,
          error: results.error
        })
      } else {
        setValidationState({
          isRunning: false,
          results: results,
          error: null
        })
      }
    } catch (error) {
      setValidationState({
        isRunning: false,
        results: null,
        error: `Validation failed: ${error.message}`
      })
    }
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