import React from 'react'
import type { FC, ChangeEvent, FormEvent } from 'react'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type AuthType = 'none' | 'bearer' | 'apiKey' | 'basic'

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

interface TestConfig {
  apiUrl: string
  httpMethod: HttpMethod
  authType: AuthType
  authCredentials: AuthCredentials
  customHeaders: CustomHeader[]
  requestBody: string
}

interface ConfigFormProps {
  config: TestConfig
  onChange: (config: TestConfig) => void
  disabled: boolean
}

interface ValidationErrors {
  apiUrl?: string
  authToken?: string
  authKey?: string
  authBasic?: string
}

const ConfigForm: FC<ConfigFormProps> = ({ config, onChange, disabled }) => {
  const [errors, setErrors] = React.useState<ValidationErrors>({})

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleFieldChange = (field: keyof TestConfig, value: string): void => {
    const newConfig = { ...config, [field]: value }
    onChange(newConfig)

    // Clear error for this field when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleAuthCredentialChange = (key: keyof AuthCredentials, value: string): void => {
    const newCredentials = { ...config.authCredentials, [key]: value }
    onChange({ ...config, authCredentials: newCredentials })
  }

  const handleCustomHeaderChange = (index: number, field: keyof CustomHeader, value: string): void => {
    const newHeaders = [...config.customHeaders]
    newHeaders[index] = { ...newHeaders[index]!, [field]: value }
    onChange({ ...config, customHeaders: newHeaders })
  }

  const addCustomHeader = (): void => {
    onChange({
      ...config,
      customHeaders: [...config.customHeaders, { key: '', value: '' }]
    })
  }

  const removeCustomHeader = (index: number): void => {
    const newHeaders = config.customHeaders.filter((_, i) => i !== index)
    onChange({ ...config, customHeaders: newHeaders })
  }


  React.useEffect(() => {
    const newErrors: ValidationErrors = {}

    if (!config.apiUrl) {
      newErrors.apiUrl = 'API Endpoint URL is required'
    } else if (!validateUrl(config.apiUrl)) {
      newErrors.apiUrl = 'Please enter a valid URL'
    }

    // Validate authentication credentials based on type
    if (config.authType === 'bearer' && !config.authCredentials.token) {
      newErrors.authToken = 'Bearer token is required'
    }
    if (config.authType === 'apiKey' && !config.authCredentials.key) {
      newErrors.authKey = 'API key is required'
    }
    if (config.authType === 'basic' && (!config.authCredentials.username || !config.authCredentials.password)) {
      newErrors.authBasic = 'Username and password are required'
    }

    setErrors(newErrors)
  }, [config])

  const renderAuthFields = (): React.ReactElement | null => {
    switch (config.authType) {
      case 'bearer':
        return (
          <div className="conditional-field">
            <div className="form-group required">
              <label htmlFor="bearerToken">Bearer Token</label>
              <input
                id="bearerToken"
                type="password"
                value={config.authCredentials.token || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAuthCredentialChange('token', e.target.value)}
                placeholder="Enter bearer token"
                disabled={disabled}
              />
              {errors.authToken && <div className="form-error">{errors.authToken}</div>}
            </div>
          </div>
        )

      case 'apiKey':
        return (
          <div className="conditional-field">
            <div className="form-group required">
              <label htmlFor="apiKey">API Key</label>
              <input
                id="apiKey"
                type="password"
                value={config.authCredentials.key || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAuthCredentialChange('key', e.target.value)}
                placeholder="Enter API key"
                disabled={disabled}
              />
              {errors.authKey && <div className="form-error">{errors.authKey}</div>}
            </div>
            <div className="form-group">
              <label htmlFor="apiKeyHeader">Header Name (optional)</label>
              <input
                id="apiKeyHeader"
                type="text"
                value={config.authCredentials.headerName || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAuthCredentialChange('headerName', e.target.value)}
                placeholder="X-API-Key (default)"
                disabled={disabled}
              />
            </div>
          </div>
        )

      case 'basic':
        return (
          <div className="conditional-field">
            <div className="form-group required">
              <label htmlFor="basicUsername">Username</label>
              <input
                id="basicUsername"
                type="text"
                value={config.authCredentials.username || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAuthCredentialChange('username', e.target.value)}
                placeholder="Enter username"
                disabled={disabled}
              />
            </div>
            <div className="form-group required">
              <label htmlFor="basicPassword">Password</label>
              <input
                id="basicPassword"
                type="password"
                value={config.authCredentials.password || ''}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleAuthCredentialChange('password', e.target.value)}
                placeholder="Enter password"
                disabled={disabled}
              />
            </div>
            {errors.authBasic && <div className="form-error">{errors.authBasic}</div>}
          </div>
        )

      default:
        return null
    }
  }

  const showRequestBody = ['POST', 'PUT', 'PATCH'].includes(config.httpMethod)

  return (
    <form onSubmit={(e: FormEvent<HTMLFormElement>) => e.preventDefault()}>
      <div className="form-group required">
        <label htmlFor="apiUrl">API Endpoint URL</label>
        <input
          id="apiUrl"
          type="url"
          value={config.apiUrl}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFieldChange('apiUrl', e.target.value)}
          placeholder="https://api.example.com/posts"
          disabled={disabled}
        />
        {errors.apiUrl && <div className="form-error">{errors.apiUrl}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="httpMethod">HTTP Method</label>
        <select
          id="httpMethod"
          value={config.httpMethod}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFieldChange('httpMethod', e.target.value)}
          disabled={disabled}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="authType">Authentication Type</label>
        <select
          id="authType"
          value={config.authType}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => handleFieldChange('authType', e.target.value)}
          disabled={disabled}
        >
          <option value="none">None</option>
          <option value="bearer">Bearer Token</option>
          <option value="apiKey">API Key</option>
          <option value="basic">Basic Auth</option>
        </select>
      </div>

      {renderAuthFields()}

      <div className="form-group">
        <label>Custom Headers</label>
        <div className="key-value-inputs">
          {config.customHeaders.map((header, index) => (
            <div key={index} className="key-value-row">
              <input
                type="text"
                placeholder="Header name"
                value={header.key}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleCustomHeaderChange(index, 'key', e.target.value)}
                disabled={disabled}
              />
              <input
                type="text"
                placeholder="Header value"
                value={header.value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => handleCustomHeaderChange(index, 'value', e.target.value)}
                disabled={disabled}
              />
              {config.customHeaders.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCustomHeader(index)}
                  disabled={disabled}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-button"
            onClick={addCustomHeader}
            disabled={disabled}
          >
            + Add Header
          </button>
        </div>
      </div>

      {showRequestBody && (
        <div className="form-group">
          <label htmlFor="requestBody">Request Body (JSON)</label>
          <textarea
            id="requestBody"
            value={config.requestBody}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('requestBody', e.target.value)}
            placeholder='{"data": {"type": "posts", "attributes": {"title": "Example"}}}'
            disabled={disabled}
          />
        </div>
      )}
    </form>
  )
}

export default ConfigForm
