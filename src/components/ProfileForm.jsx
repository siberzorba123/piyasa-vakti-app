export default function ProfileForm({ profile, onChange }) {
  const initials = profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="panel profile-panel">
      <div className="section-title">
        <h2>Profilim</h2>
        <p>Adın ve IBAN bilgin burada düzenlenir. Gruplardaki tüm ekranlarda bu isim görünür.</p>
      </div>

      <div className="profile-editor-head">
        <div className="avatar huge">{initials || '?'}</div>
        <div>
          <strong>{profile.name}</strong>
          <span>Demo profil · Sonraki sürümde giriş yapan kullanıcıya bağlanacak.</span>
        </div>
      </div>

      <label className="field-label">Adın</label>
      <input
        className="input"
        value={profile.name}
        onChange={(event) => onChange({ ...profile, name: event.target.value })}
        placeholder="Örn: Alperen"
      />

      <label className="field-label">IBAN</label>
      <input
        className="input iban-input"
        value={profile.iban ?? ''}
        onChange={(event) => onChange({ ...profile, iban: event.target.value })}
        placeholder="TR00 0000 0000 0000 0000 0000 00"
      />

      <label className="field-label">Kısa profil notu</label>
      <textarea
        className="textarea"
        value={profile.profileNote ?? ''}
        onChange={(event) => onChange({ ...profile, profileNote: event.target.value })}
        placeholder="Örn: Genelde hafta sonu daha rahatım."
      />
    </section>
  )
}
