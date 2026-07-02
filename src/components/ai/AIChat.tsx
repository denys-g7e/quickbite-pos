import React, { useState } from 'react'
import { Bot, Send, Sparkles } from 'lucide-react'
import { Button } from '../ui/Button'

export function AIChat() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: '¡Hola! Soy el asistente IA de QuickBite. ¿En qué puedo ayudarte?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg = { role: 'user' as const, content: input }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await window.api.ai.ask(input)
      setMessages((prev) => [...prev, { role: 'assistant', content: response }])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message || 'No se pudo conectar'}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-accent" />
        <span className="text-body-sm font-medium text-text-primary">Asistente IA</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 mb-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-accent-muted flex items-center justify-center flex-shrink-0">
                <Bot size={12} className="text-accent" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-accent text-white'
                  : 'bg-bg-tertiary border border-border-subtle text-text-primary'
              }`}
            >
              <p className="text-caption whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-md bg-accent-muted flex items-center justify-center">
              <Bot size={12} className="text-accent" />
            </div>
            <div className="bg-bg-tertiary border border-border-subtle rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Pregunta a la IA..."
          className="flex-1 bg-bg-tertiary border border-border-light rounded-lg px-3 py-2 text-caption text-text-primary placeholder:text-text-hint focus:outline-none focus:border-accent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button size="sm" onClick={handleSend} disabled={loading || !input.trim()}>
          <Send size={14} />
        </Button>
      </div>
    </div>
  )
}
