import React, { useEffect, useState } from 'react'

const cloneProfile = (profile) => ({
  ...profile,
  name: profile.name ?? '',
  iban: profile.iban ?? '',
  profileNote: profile.profileNote ?? '',
})

export default function ProfileForm({ profile, onChange }) {
  const [draft, setDraft] = useState(() => cloneProfile(profile))
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDraft(cloneProfile(profile))
    setDirty(false)
  }, [profile.id])

  const updateDraft = (patch) => {
    setDraft((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  const initials = (draft.name || '?')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const saveProfile = () => {
    onChange(draft)
    setDirty(false)
  }

  return (
    <section className="panel profile-panel">
      <div className="section-title">
        <h2>Profilim</h2>
        <p>Adını, IBAN bilgisini ve profil notunu düzenle. Veritabanına yazmak için en alttaki kaydet butonuna bas.</p>
      </div>

      <div className="draft-warning">
        {dirty ? 'Kaydedilmemiş profil değişikliklerin var.' : 'Profil bilgileri kaydedildi.'}
      </div>

      <div className="profile-editor-head">
        <div className="avatar huge">{initials || '?'}</div>
        <div>
          <strong>{draft.name || 'İsimsiz'}</strong>
          <span>Bu bilgiler tüm gruplarda görünür.</span>
        </div>
      </div>

      <label className="field-label">Adın</label>
      <input
        className="input"
        value={draft.name}
        onChange={(event) => updateDraft({ name: event.target.value })}
        placeholder="Örn: Alperen"
      />

      <label className="field-label">IBAN</label>
      <input
        className="input iban-input"
        value={draft.iban}
        onChange={(event) => updateDraft({ iban: event.target.value })}
        placeholder="TR00 0000 0000 0000 0000 0000 00"
      />

      <label className="field-label">Kısa profil notu</label>
      <textarea
        className="textarea"
        value={draft.profileNote}
        onChange={(event) => updateDraft({ profileNote: event.target.value })}
        placeholder="Örn: Genelde hafta sonu daha rahatım."
      />

      <div className="save-row">
        <button className="primary-button" type="button" onClick={saveProfile} disabled={!dirty}>
          Profili kaydet
        </button>
      </div>
    </section>
  )
}
