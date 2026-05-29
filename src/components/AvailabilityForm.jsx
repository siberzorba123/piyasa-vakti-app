import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { activityTypes, days } from '../data/mockData'

const budgetOptions = ['250 TL altı', '250-400 TL', '300-500 TL', '500-750 TL', '750+ TL', 'Baya zenginim']

const detailedActivityFields = {
  Sinema: {
    title: 'Film tercihi',
    placeholder: 'Film adı yaz: Dune, Interstellar, Oppenheimer...',
    anyLabel: 'Film fark etmez',
    specificLabel: 'İlle benim dediğim film olsun',
  },
  Konser: {
    title: 'Sanatçı tercihi',
    placeholder: 'Sanatçı/grup adı yaz: Mor ve Ötesi, Mabel Matiz...',
    anyLabel: 'Sanatçı fark etmez',
    specificLabel: 'İlle benim dediğim sanatçı olsun',
  },
  Gezi: {
    title: 'Yer tercihi',
    placeholder: 'Yer yaz: Kabak, Kayaköy, Göcek, sahil...',
    anyLabel: 'Yer fark etmez',
    specificLabel: 'İlle benim dediğim yer olsun',
  },
}

export default function AvailabilityForm({ profile, onChange }) {
  const [newActivity, setNewActivity] = useState('')

  const allActivities = useMemo(() => (
    Array.from(new Set([...activityTypes, ...(profile.activities ?? [])]))
  ), [profile.activities])

  const updateInterval = (dayKey, field, value) => {
    const current = profile.availability[dayKey]?.[0] ?? { start: '18:00', end: '23:00' }
    onChange({
      ...profile,
      availability: {
        ...profile.availability,
        [dayKey]: [{ ...current, [field]: value }],
      },
    })
  }

  const toggleDay = (dayKey) => {
    const isActive = profile.availability[dayKey]?.length > 0
    onChange({
      ...profile,
      availability: {
        ...profile.availability,
        [dayKey]: isActive ? [] : [{ start: '18:00', end: '23:00' }],
      },
    })
  }

  const toggleActivity = (activity) => {
    const exists = profile.activities.includes(activity)
    const nextActivities = exists
      ? profile.activities.filter((item) => item !== activity)
      : [...profile.activities, activity]

    const nextDetails = { ...(profile.activityDetails ?? {}) }
    if (exists) {
      delete nextDetails[activity]
    } else if (detailedActivityFields[activity] && !nextDetails[activity]) {
      nextDetails[activity] = { mode: 'any', value: '' }
    }

    onChange({
      ...profile,
      activities: nextActivities,
      activityDetails: nextDetails,
    })
  }

  const addActivity = () => {
    const clean = newActivity.trim()
    if (!clean) return
    if (!profile.activities.includes(clean)) {
      onChange({ ...profile, activities: [...profile.activities, clean] })
    }
    setNewActivity('')
  }

  const updateActivityDetail = (activity, patch) => {
    const current = profile.activityDetails?.[activity] ?? { mode: 'any', value: '' }
    onChange({
      ...profile,
      activityDetails: {
        ...(profile.activityDetails ?? {}),
        [activity]: { ...current, ...patch },
      },
    })
  }

  const selectedDetailedActivities = profile.activities.filter((activity) => detailedActivityFields[activity])

  return (
    <section className="panel">
      <div className="section-title">
        <h2>Müsaitliğim</h2>
        <p>Burada sadece bu gruba özel saat, aktivite, ulaşım, bütçe ve not bilgilerini düzenlersin. Adını Profilim sekmesinden değiştirebilirsin.</p>
      </div>
      <div className="availability-list">
        {days.map((day) => {
          const interval = profile.availability[day.key]?.[0]
          return (
            <div className="availability-row" key={day.key}>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={Boolean(interval)}
                  onChange={() => toggleDay(day.key)}
                />
                {day.label}
              </label>
              <div className="time-inputs">
                <input
                  type="time"
                  value={interval?.start ?? '18:00'}
                  disabled={!interval}
                  onChange={(event) => updateInterval(day.key, 'start', event.target.value)}
                />
                <span>-</span>
                <input
                  type="time"
                  value={interval?.end ?? '23:00'}
                  disabled={!interval}
                  onChange={(event) => updateInterval(day.key, 'end', event.target.value)}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="section-subtitle">Aktivite tercihleri</div>
      <div className="chip-row selectable">
        {allActivities.map((activity) => (
          <button
            type="button"
            className={`chip button-chip ${profile.activities.includes(activity) ? 'selected' : ''}`}
            key={activity}
            onClick={() => toggleActivity(activity)}
          >
            {activity}
          </button>
        ))}
      </div>

      {selectedDetailedActivities.length ? (
        <div className="activity-detail-list">
          {selectedDetailedActivities.map((activity) => {
            const config = detailedActivityFields[activity]
            const detail = profile.activityDetails?.[activity] ?? { mode: 'any', value: '' }
            return (
              <div className="activity-detail-card" key={activity}>
                <div>
                  <strong>{activity}</strong>
                  <span>{config.title}</span>
                </div>
                <div className="preference-toggle">
                  <label className="radio-card">
                    <input
                      type="radio"
                      name={`${activity}-preference`}
                      checked={detail.mode !== 'specific'}
                      onChange={() => updateActivityDetail(activity, { mode: 'any' })}
                    />
                    {config.anyLabel}
                  </label>
                  <label className="radio-card">
                    <input
                      type="radio"
                      name={`${activity}-preference`}
                      checked={detail.mode === 'specific'}
                      onChange={() => updateActivityDetail(activity, { mode: 'specific' })}
                    />
                    {config.specificLabel}
                  </label>
                </div>
                <input
                  className="input"
                  value={detail.value ?? ''}
                  disabled={detail.mode !== 'specific'}
                  onChange={(event) => updateActivityDetail(activity, { value: event.target.value })}
                  placeholder={config.placeholder}
                />
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="add-activity-row">
        <input
          className="input"
          value={newActivity}
          onChange={(event) => setNewActivity(event.target.value)}
          placeholder="Yeni aktivite ekle: bowling, mangal, beach..."
          onKeyDown={(event) => {
            if (event.key === 'Enter') addActivity()
          }}
        />
        <button className="secondary-button" type="button" onClick={addActivity}>
          <Plus size={16} /> Ekle
        </button>
      </div>

      <div className="section-subtitle">Ulaşım</div>
      <div className="vehicle-grid clean-vehicle-grid">
        <label className="check-label">
          <input
            type="checkbox"
            checked={profile.vehicle.hasCar}
            onChange={(event) => onChange({
              ...profile,
              vehicle: { ...profile.vehicle, hasCar: event.target.checked },
            })}
          />
          Arabam var
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={profile.vehicle.hasMotorcycle}
            onChange={(event) => onChange({
              ...profile,
              vehicle: { ...profile.vehicle, hasMotorcycle: event.target.checked },
            })}
          />
          Motorum var
        </label>
      </div>

      <label className="field-label">Bütçe</label>
      <select
        className="input"
        value={profile.budget ?? 'Baya zenginim'}
        onChange={(event) => onChange({ ...profile, budget: event.target.value })}
      >
        {budgetOptions.map((option) => <option key={option}>{option}</option>)}
      </select>

      <label className="field-label">Kısıt / not</label>
      <textarea
        className="textarea"
        value={profile.note}
        onChange={(event) => onChange({ ...profile, note: event.target.value })}
        placeholder="Örn: Pazar erken kalkmam lazım, çok uzak mekan olmaz..."
      />
    </section>
  )
}
