import React, { useState, useRef, useEffect } from 'react'
import { AdminLayout } from '../../components/layout/AdminLayout'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Bot, Send, Sparkles, TrendingUp, BarChart3, Clock, AlertTriangle } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente inteligente de QuickBite POS. Puedo ayudarte con análisis de ventas, recomendaciones de menú, detección de tendencias y más. ¿En qué puedo ayudarte hoy?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkApiKey()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkApiKey = async () => {
    try {
      const key = await window.api.settings.get('ai_api_key')
      if (!key) {
        setApiKeyConfigured(false)
        setMessages([
          {
            role: 'assistant',
            content: '⚠️ **API Key no configurada**\n\nPara usar el asistente IA, necesitas configurar una clave API de Groq.\n\nVe a **Configuración > Integración IA** y agrega tu API Key.\n\nSin la API Key, el asistente no podrá responder preguntas.',
          },
        ])
      }
    } catch {
      setApiKeyConfigured(false)
    }
  }

  const quickPrompts = [
    { icon: TrendingUp, label: '¿Cuál fue mi mejor día?', prompt: '¿Cuál fue el mejor día de ventas de la última semana?' },
    { icon: BarChart3, label: '¿Qué producto debo promover?', prompt: '¿Qué producto debería promover más según las ventas actuales?' },
    { icon: Clock, label: '¿Cuándo hay más clientes?', prompt: '¿Cuáles son las horas pico de atención al cliente?' },
    { icon: AlertTriangle, label: 'Análisis de stock', prompt: '¿Qué productos tienen stock bajo y debería reordenar?' },
  ]

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await window.api.ai.ask(input)
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'No se pudo conectar con la IA'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt)
  }

  return (
    <AdminLayout>
      <div className="h-full flex flex-col max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-muted flex items-center justify-center">
            <Sparkles size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-h2 font-bold text-text-primary">Asistente IA</h1>
            <p className="text-body-sm text-text-muted">Powered by Groq</p>
          </div>
        </div>

        {!apiKeyConfigured && (
          <Card className="mb-4 border-status-warning/30 bg-status-warning/5">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-status-warning" />
              <p className="text-body-sm text-text-secondary">
                API Key no configurada.{' '}
                <button onClick={() => window.location.hash = '#/admin/settings'} className="text-accent hover:underline">
                  Ir a Configuración
                </button>
              </p>
            </div>
          </Card>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot size={16} className="text-accent" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user'
                    ? 'bg-accent text-white'
                    : 'bg-bg-tertiary border border-border-subtle text-text-primary'
                }`}
              >
                <p className="text-body-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-label font-semibold text-white">U</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-muted flex items-center justify-center">
                <Bot size={16} className="text-accent" />
              </div>
              <div className="bg-bg-tertiary border border-border-subtle rounded-2xl px-5 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 flex-wrap mb-3">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPrompt(qp.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-tertiary border border-border-subtle text-label text-text-muted hover:border-accent/50 hover:text-text-primary transition-all"
            >
              <qp.icon size={12} />
              {qp.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={apiKeyConfigured ? 'Escribe tu pregunta...' : 'API Key requerida...'}
              className="w-full bg-bg-tertiary border border-border-light rounded-xl px-4 py-3 text-body-sm text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              disabled={!apiKeyConfigured || loading}
            />
          </div>
          <Button onClick={handleSend} disabled={!apiKeyConfigured || loading || !input.trim()}>
            <Send size={16} />
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
