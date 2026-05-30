import React, { useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { activityTypes, days } from '../data/mockData'

const budgetOptions = ['250 TL altı', '250-400 TL', '300-500 TL', '500-750 TL', '750+ TL', 'Baya zenginim']

const suggestionPlaceholders = {
  Yemek: 'Öneri yaz: Burger, kebap, balık, mekân adı...',
  Kafe: 'Öneri yaz: Kahve Dünyası, sahil kafe, tatlıcı...',
  Sinema: 'Film önerisi yaz: Dune, komedi, korku...',
  Konser: 'Sanatçı/grup önerisi yaz: Mor ve Ötesi, Mabel Matiz...',
  'Halı saha': 'Saha / saat / ekip önerisi yaz...',
  Gezi: 'Yer önerisi yaz: Kabak, Kayaköy, Göcek, sahil...',
  'Ev buluşması': 'Öneri yaz: oyun gecesi, film gecesi, mangal...',
  Spor: 'Öneri yaz: gym, yürüyüş, basketbol...',
  Pub: 'Mekân veya konsept önerisi yaz...',
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

export default function AvailabilityForm({ profile, availableActivities = [], onChange }) {
  const [draft, setDraft] = useState(() => cloneProfile(profile))
  const [newActivity, setNewActivity] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setDraft(cloneProfile(profile))
    setDirty(false)
  }, [profile])

  const updateDraft = (updater) => {
    setDraft((current) => (typeof updater === 'function' ? updater(current) : updater))
    setDirty(true)
  }

  const allActivities = useMemo(() => (
    Array.from(new Set([
      ...activityTypes,
      ...(availableActivities ?? []),
      ...(draft.activities ?? []),
    ])).sort((a, b) => {
      const defaultA = activityTypes.includes(a)
      const defaultB = activityTypes.includes(b)
      if (defaultA && !defaultB) return -1
      if (!defaultA && defaultB) return 1
      return a.localeCompare(b, 'tr')
    })
  ), [availableActivities, draft.activities])

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

  const removeActivity = (activity) => {
    updateDraft((currentProfile) => {
      const nextDetails = { ...(currentProfile.activityDetails ?? {}) }
      delete nextDetails[activity]
      return {
        ...currentProfile,
        activities: currentProfile.activities.filter((item) => item !== activity),
        activityDetails: nextDetails,
      }
    })
  }

  const toggleActivity = (activity) => {
    const exists = draft.activities.includes(activity)
    if (exists) {
      removeActivity(activity)
      return
    }

    updateDraft((currentProfile) => ({
      ...currentProfile,
      activities: [...currentProfile.activities, activity],
      activityDetails: {
        ...(currentProfile.activityDetails ?? {}),
        [activity]: currentProfile.activityDetails?.[activity] ?? { mode: 'any', value: '' },
      },
    }))
  }

  const addActivity = () => {
    const clean = newActivity.trim()
    if (!clean) return

    updateDraft((currentProfile) => {
      if (currentProfile.activities.includes(clean)) return currentProfile
      return {
        ...currentProfile,
        activities: [...currentProfile.activities, clean],
        activityDetails: {
          ...(currentProfile.activityDetails ?? {}),
          [clean]: { mode: 'any', value: '' },
        },
      }
    })
    setNewActivity('')
  }

  const updateActivitySuggestion = (activity, value) => {
    updateDraft((currentProfile) => ({
      ...currentProfile,
      activityDetails: {
        ...(currentProfile.activityDetails ?? {}),
        [activity]: {
          mode: value.trim() ? 'specific' : 'any',
          value,
        },
      },
    }))
  }

  const saveChanges = () => {
    onChange({
      ...draft,
      activityDetails: Object.fromEntries((draft.activities ?? []).map((activity) => {
        const value = draft.activityDetails?.[activity]?.value ?? ''
        return [activity, { mode: value.trim() ? 'specific' : 'any', value }]
      })),
    })
    setDirty(false)
  }

  return (
    <section className="panel">
      <div className="section-title">
        <h2>Müsaitliğim</h2>
        <p>Bu gruba ait aktiviteleri seç, her aktivitenin altına istersen öneri/mekân/not yaz. Grupta biri yeni aktivite ekleyip kaydederse burada seçenek olarak görünür.</p>
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
      <div className="chip-row selectable activity-chip-row">
        {allActivities.map((activity) => {
          const selected = draft.activities.includes(activity)
          return (
            <button
              type="button"
              className={`chip button-chip activity-chip ${selected ? 'selected' : ''}`}
              key={activity}
              onClick={() => toggleActivity(activity)}
            >
              <span>{activity}</span>
              {selected ? <X size={14} className="chip-x" /> : null}
            </button>
          )
        })}
      </div>

      {draft.activities.length ? (
        <div className="activity-detail-list suggestion-detail-list">
          {draft.activities.map((activity) => {
            const detail = draft.activityDetails?.[activity] ?? { mode: 'any', value: '' }
            return (
              <div className="activity-detail-card suggestion-card" key={activity}>
                <div className="suggestion-card-head">
                  <div>
                    <strong>{activity}</strong>
                    <span>{detail.value?.trim() ? 'Önerin kaydedilecek' : 'Öneri yoksa Fark etmez olarak görünür'}</span>
                  </div>
                  <button type="button" className="mini-danger-button" onClick={() => removeActivity(activity)}>
                    <X size={14} /> Sil
                  </button>
                </div>
                <input
                  className="input"
                  value={detail.value ?? ''}
                  onChange={(event) => updateActivitySuggestion(activity, event.target.value)}
                  placeholder={suggestionPlaceholders[activity] || 'Öneri / mekân / not yaz. Boş bırakırsan Fark etmez görünür.'}
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
          placeholder="Bu gruba yeni etkinlik ekle: bowling, mangal, beach..."
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
