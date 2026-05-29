import React, { useEffect, useMemo, useState } from 'react'
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

const cloneProfile = (profile) => ({
  ...profile,
  availability: Object.fromEntries(Object.entries(profile.availability ?? {}).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.map((item) => ({ ...item })) : [],
  ])),
  activities: [...(profile.activities ?? [])],
  activityDetails: Object.fromEntries(Object.entries(profile.activityDetails ?? {}).map(([key, value]) => [
    key,
    { ...value },
  ])),
  vehicle: { ...(profile.vehicle ?? { hasCar: false, hasMotorcycle: false, note: '' }) },
})

export default function AvailabilityForm({ profile, onChange }) {
  const [draft, setDraft] = useState(() => cloneProfile(profile))
  const [newActivity, setNewActivity] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDraft(cloneProfile(profile))
    setDirty(false)
  }, [profile.id])

  const updateDraft = (updater) => {
    setDraft((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      return next
    })
    setDirty(true)
  }

  const allActivities = useMemo(() => (
    Array.from(new Set([...activityTypes, ...(draft.activities ?? [])]))
  ), [draft.activities])

  const updateInterval = (dayKey, field, value) => {
    updateDraft((currentProfile) => {
      const current = currentProfile.availability[dayKey]?.[0] ?? { start: '18:00', end: '23:00' }
      return {
        ...currentProfile,
        availability: {
          ...currentProfile.availability,
          [dayKey]: [{ ...current, [field]: value }],
        },
      }
    })
  }

  const toggleDay = (dayKey) => {
    updateDraft((currentProfile) => {
      const isActive = currentProfile.availability[dayKey]?.length > 0
      return {
        ...currentProfile,
        availability: {
          ...currentProfile.availability,
          [dayKey]: isActive ? [] : [{ start: '18:00', end: '23:00' }],
        },
      }
    })
  }

  const toggleActivity = (activity) => {
    updateDraft((currentProfile) => {
      const exists = currentProfile.activities.includes(activity)
      const nextActivities = exists
        ? currentProfile.activities.filter((item) => item !== activity)
        : [...currentProfile.activities, activity]

      const nextDetails = { ...(currentProfile.activityDetails ?? {}) }
      if (exists) {
        delete nextDetails[activity]
      } else if (detailedActivityFields[activity] && !nextDetails[activity]) {
        nextDetails[activity] = { mode: 'any', value: '' }
      }

      return {
        ...currentProfile,
        activities: nextActivities,
        activityDetails: nextDetails,
      }
    })
  }

  const addActivity = () => {
    const clean = newActivity.trim()
    if (!clean) return

    updateDraft((currentProfile) => {
      if (currentProfile.activities.includes(clean)) return currentProfile
      return { ...currentProfile, activities: [...currentProfile.activities, clean] }
    })
    setNewActivity('')
  }

  const updateActivityDetail = (activity, patch) => {
    updateDraft((currentProfile) => {
      const current = currentProfile.activityDetails?.[activity] ?? { mode: 'any', value: '' }
      return {
        ...currentProfile,
        activityDetails: {
          ...(currentProfile.activityDetails ?? {}),
          [activity]: { ...current, ...patch },
        },
      }
    })
  }

  const saveChanges = () => {
    onChange(draft)
    setDirty(false)
  }

  const selectedDetailedActivities = draft.activities.filter((activity) => detailedActivityFields[activity])

  return (
    <section className="panel">
      <div className="section-title">
        <h2>Müsaitliğim</h2>
        <p>Bilgileri rahatça düzenle; veritabanına yazmak için en alttaki “Değişiklikleri kaydet” butonuna bas.</p>
      </div>

      <div className="draft-warning">
        {dirty ? 'Kaydedilmemiş değişikliklerin var.' : 'Tüm değişiklikler kaydedildi.'}
      </div>

      <div className="availability-list">
        {days.map((day) => {
          const interval = draft.availability[day.key]?.[0]
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
            className={`chip button-chip ${draft.activities.includes(activity) ? 'selected' : ''}`}
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
            const detail = draft.activityDetails?.[activity] ?? { mode: 'any', value: '' }
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
            checked={draft.vehicle.hasCar}
            onChange={(event) => updateDraft({
              ...draft,
              vehicle: { ...draft.vehicle, hasCar: event.target.checked },
            })}
          />
          Arabam var
        </label>
        <label className="check-label">
          <input
            type="checkbox"
            checked={draft.vehicle.hasMotorcycle}
            onChange={(event) => updateDraft({
              ...draft,
              vehicle: { ...draft.vehicle, hasMotorcycle: event.target.checked },
            })}
          />
          Motorum var
        </label>
      </div>

      <label className="field-label">Bütçe</label>
      <select
        className="input"
        value={draft.budget ?? 'Baya zenginim'}
        onChange={(event) => updateDraft({ ...draft, budget: event.target.value })}
      >
        {budgetOptions.map((option) => <option key={option}>{option}</option>)}
      </select>

      <label className="field-label">Kısıt / not</label>
      <textarea
        className="textarea"
        value={draft.note}
        onChange={(event) => updateDraft({ ...draft, note: event.target.value })}
        placeholder="Örn: Pazar erken kalkmam lazım, çok uzak mekan olmaz..."
      />

      <div className="save-row">
        <button className="primary-button" type="button" onClick={saveChanges} disabled={!dirty}>
          Değişiklikleri kaydet
        </button>
      </div>
    </section>
  )
}
