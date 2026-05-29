import { useState } from 'react'
import { Bike, Car, Check, CircleUserRound, Copy, Wallet, X } from 'lucide-react'
import { days } from '../data/mockData'

function getAvailabilityItems(member) {
  return days
    .map((day) => {
      const intervals = member.availability?.[day.key] ?? []
      if (!intervals.length) return null
      return {
        day: day.label,
        time: intervals.map((i) => `${i.start}-${i.end}`).join(', '),
      }
    })
    .filter(Boolean)
}

function getActivityDetailLabel(member, activity) {
  const detail = member.activityDetails?.[activity]
  if (!detail) return null
  if (detail.mode !== 'specific') return 'Fark etmez'
  return detail.value?.trim() ? detail.value.trim() : 'Özel tercih girilmemiş'
}

function getVehicleText(vehicle) {
  const options = []
  if (vehicle?.hasCar) options.push('Araba var')
  if (vehicle?.hasMotorcycle) options.push('Motor var')
  return options.length ? options.join(' · ') : 'Araç yok'
}

export default function MemberCard({ member }) {
  const [copyStatus, setCopyStatus] = useState('')
  const [showIban, setShowIban] = useState(false)
  const availabilityItems = getAvailabilityItems(member)
  const iban = member.iban?.trim()

  const copyIban = async () => {
    if (!iban) {
      setCopyStatus('IBAN girilmemiş')
      return
    }

    try {
      await navigator.clipboard.writeText(iban)
      setCopyStatus('IBAN kopyalandı')
    } catch {
      setCopyStatus('Kopyalanamadı, elle seçebilirsin')
    }

    window.setTimeout(() => setCopyStatus(''), 2200)
  }

  return (
    <article className="member-card compact-member-card">
      <div className="member-topline">
        <button
          type="button"
          className="avatar avatar-button"
          onClick={() => setShowIban((current) => !current)}
          title="IBAN bilgisini göster"
          aria-label={`${member.name} IBAN bilgisini göster`}
        >
          <CircleUserRound size={22} />
        </button>
        <div>
          <h3>{member.name}</h3>
          <p>{member.note || 'Not yok'}</p>
        </div>
      </div>

      {showIban ? (
        <div className="mini-section iban-popover">
          <div className="iban-popover-head">
            <strong>IBAN bilgisi</strong>
            <button type="button" className="icon-button" onClick={() => setShowIban(false)} aria-label="IBAN bilgisini kapat">
              <X size={15} />
            </button>
          </div>
          <div className="iban-copy-row">
            <code>{iban || 'IBAN girilmemiş'}</code>
            <button type="button" className="copy-button" onClick={copyIban} disabled={!iban}>
              {copyStatus === 'IBAN kopyalandı' ? <Check size={15} /> : <Copy size={15} />}
              Kopyala
            </button>
          </div>
          {copyStatus ? <small className="copy-status">{copyStatus}</small> : null}
        </div>
      ) : null}

      <div className="mini-section">
        <strong>Uygun olduğu zamanlar</strong>
        {availabilityItems.length ? (
          <div className="availability-chips all-days-grid">
            {availabilityItems.map((item) => (
              <span className="availability-chip" key={`${member.id}-${item.day}`}>
                <b>{item.day}</b>
                <small>{item.time}</small>
              </span>
            ))}
          </div>
        ) : (
          <p className="muted-text">Müsaitlik girilmemiş</p>
        )}
      </div>

      <div className="mini-section">
        <strong>Aktivite</strong>
        <div className="activity-member-list">
          {member.activities?.map((activity) => {
            const detail = getActivityDetailLabel(member, activity)
            return (
              <div className="activity-member-pill" key={activity}>
                <span>{activity}</span>
                {detail ? <small>{detail}</small> : null}
              </div>
            )
          })}
        </div>
      </div>

      <div className="member-meta-grid">
        <div className="vehicle-row">
          {member.vehicle?.hasMotorcycle && !member.vehicle?.hasCar ? <Bike size={18} /> : <Car size={18} />}
          {getVehicleText(member.vehicle)}
        </div>
        <div className="vehicle-row">
          <Wallet size={18} />
          {member.budget ?? 'Bütçe girilmemiş'}
        </div>
      </div>
    </article>
  )
}
