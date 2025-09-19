// Integration test setup
import { beforeAll, afterAll } from 'vitest'
import { spawn } from 'child_process'
import fetch from 'node-fetch'

let mockServerProcess = null

beforeAll(async () => {
  // Start mock server for integration tests
  console.log('Starting mock server for integration tests...')
  mockServerProcess = spawn('node', ['mock-server/server.js'], {
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'pipe'
  })

  // Wait for server to be ready
  let serverReady = false
  const maxAttempts = 30
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch('http://localhost:3001/health')
      if (response.ok) {
        serverReady = true
        break
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  if (!serverReady) {
    throw new Error('Mock server failed to start within timeout period')
  }
  
  console.log('Mock server is ready for integration tests')
})

afterAll(async () => {
  if (mockServerProcess) {
    console.log('Stopping mock server...')
    mockServerProcess.kill()
    mockServerProcess = null
  }
})

// Make fetch available globally for tests
global.fetch = fetch