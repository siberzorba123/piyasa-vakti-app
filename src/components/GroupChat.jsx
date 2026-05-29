import React, { useState } from 'react'
import { MessageCircle, Send, Trash2 } from 'lucide-react'

function formatTime(value) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

export default function GroupChat({ messages, currentUserId, isOwner, loading, error, onSendMessage, onDeleteMessage }) {
  const [text, setText] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    const clean = text.trim()
    if (!clean) return
    await onSendMessage(clean)
    setText('')
  }

  return (
    <article className="panel chat-panel">
      <div className="section-title inline-title">
        <MessageCircle />
        <div>
          <h2>Grup mesajları</h2>
          <p>Bu gruba özel hızlı mesajlaşma alanı.</p>
        </div>
      </div>

      {error ? <div className="chat-error">{error}</div> : null}

      <div className="message-list">
        {loading ? <div className="muted-text">Mesajlar yükleniyor...</div> : null}
        {!loading && !messages.length ? <div className="muted-text">Henüz mesaj yok. İlk mesajı sen yaz.</div> : null}
        {messages.map((message) => {
          const canDelete = message.userId === currentUserId || isOwner
          return (
            <div className={`message-bubble ${message.userId === currentUserId ? 'mine' : ''}`} key={message.id}>
              <div className="message-meta">
                <strong>{message.authorName}</strong>
                <span>{formatTime(message.createdAt)}</span>
              </div>
              <p>{message.body}</p>
              {canDelete ? (
                <button type="button" className="message-delete" onClick={() => onDeleteMessage(message.id)}>
                  <Trash2 size={14} /> Sil
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <form className="message-form" onSubmit={submit}>
        <input
          className="input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Gruba mesaj yaz..."
        />
        <button className="primary-button" type="submit">
          <Send size={16} /> Gönder
        </button>
      </form>
    </article>
  )
}
