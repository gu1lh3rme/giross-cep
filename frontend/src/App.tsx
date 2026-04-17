import { useState } from 'react'
import './App.css'

interface CepResult {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  distanciaKm: number
}

function App() {
  const [cep, setCep] = useState('')
  const [raioKm, setRaioKm] = useState('')
  const [results, setResults] = useState<CepResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const formatCepInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length > 5) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`
    }
    return digits
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResults([])
    setSearched(false)

    const cleanCep = cep.replace('-', '')
    if (cleanCep.length !== 8) {
      setError('CEP deve ter 8 dígitos')
      return
    }
    const radius = parseFloat(raioKm)
    if (isNaN(radius) || radius <= 0) {
      setError('Raio deve ser um número positivo')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `http://localhost:3001/cep/search?cep=${cleanCep}&raioKm=${radius}`
      )
      const data = await response.json()

      if (!response.ok) {
        const message = data?.message || 'Erro ao buscar CEPs'
        setError(Array.isArray(message) ? message.join(', ') : message)
        return
      }

      setResults(data)
      setSearched(true)
    } catch (err) {
      setError('Não foi possível conectar à API. Verifique se o backend está rodando.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>🗺️ Busca de CEPs por Raio</h1>
        <p>Encontre todos os CEPs dentro de uma área geográfica</p>
      </header>

      <main>
        <section className="search-section">
          <form onSubmit={handleSubmit} className="search-form">
            <div className="form-group">
              <label htmlFor="cep">CEP de Origem</label>
              <input
                id="cep"
                type="text"
                placeholder="Ex: 01310-100"
                value={cep}
                onChange={(e) => setCep(formatCepInput(e.target.value))}
                maxLength={9}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="raioKm">Raio (km)</label>
              <input
                id="raioKm"
                type="number"
                placeholder="Ex: 5"
                value={raioKm}
                onChange={(e) => setRaioKm(e.target.value)}
                min="0.1"
                step="0.1"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="search-btn">
              {loading ? '🔍 Buscando...' : '🔍 Buscar CEPs'}
            </button>
          </form>
        </section>

        {error && (
          <div className="error-box">
            <span>⚠️ {error}</span>
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Calculando área geográfica...</p>
          </div>
        )}

        {searched && !loading && (
          <section className="results-section">
            <h2>
              Resultados{' '}
              <span className="badge">{results.length} CEPs encontrados</span>
            </h2>
            {results.length === 0 ? (
              <p className="no-results">Nenhum CEP encontrado no raio informado.</p>
            ) : (
              <div className="results-list">
                {results.map((item) => (
                  <div key={item.cep} className="result-card">
                    <div className="result-header">
                      <span className="cep-badge">{item.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}</span>
                      <span className="distance">{item.distanciaKm} km</span>
                    </div>
                    <div className="result-body">
                      {item.logradouro && <p className="logradouro">{item.logradouro}</p>}
                      <p className="location">
                        {[item.bairro, item.localidade, item.uf].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default App
