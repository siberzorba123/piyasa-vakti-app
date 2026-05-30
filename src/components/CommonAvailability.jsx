import React, { useState } from 'react'
import { Bell, Bike, CalendarCheck, Car, Sparkles } from 'lucide-react'
import { calculateActivityMatches, calculateCommonAvailability, calculateVehicleSummary } from '../utils/calculateCommonAvailability'

export default function CommonAvailability({ members }) {
  const [notificationMessage, setNotificationMessage] = useState('')
  const slots = calculateCommonAvailability(members)
  const activities = calculateActivityMatches(members, slots)
  const topActivities = activities.slice(0, 5)
  const hiddenActivityCount = Math.max(activities.length - topActivities.length, 0)
  const vehicle = calculateVehicleSummary(members)

  const notifySlot = (slot) => {
    const text = `Piyasa Vakti bildirimi: ${slot.day} ${slot.start}-${slot.end} aralığı için uygun olanlar: ${slot.members.join(', ')}`
    setNotificationMessage(text)

    try {
      navigator.clipboard?.writeText(text)
    } catch {
      // Clipboard can be blocked by the browser.
    }

    window.alert(`${slot.members.join(', ')} kişilerine bildirim hazırlandı.\n\n${slot.day} ${slot.start}-${slot.end}`)
  }

  return (
    <section className="common-grid">
      <article className="panel highlight-panel">
        <div className="section-title inline-title">
          <CalendarCheck />
          <div>
            <h2>Bu grupta ortak uygun zamanlar</h2>
            <p>Seçili grubun üyeleri arasında en çok kişinin kesiştiği saat aralıkları.</p>
          </div>
        </div>
        <div className="slot-list">
          {slots.length ? slots.map((slot, index) => (
            <div className="slot-card notify-slot-card" key={`${slot.day}-${slot.start}-${index}`}>
              <div>
                <strong>{slot.day} · {slot.start} - {slot.end}</strong>
                <span>{slot.members.join(', ')}</span>
              </div>
              <div className="slot-actions">
                <b>{slot.count}/{members.length}</b>
                <button type="button" className="notify-button" onClick={() => notifySlot(slot)}>
                  <Bell size={15} /> Bildir
                </button>
              </div>
            </div>
          )) : <p>Henüz yeterli ortak aralık yok.</p>}
        </div>
        {notificationMessage ? <div className="notification-toast">Bildirim metni kopyalandı.</div> : null}
      </article>

      <article className="panel">
        <div className="section-title inline-title">
          <Sparkles />
          <div>
            <h2>Aktivite uyumu</h2>
            <p>Yeşil kutu, ortak uygun saatteki herkesin o aktiviteyi de seçtiğini gösterir.</p>
          </div>
        </div>
        <div className="rank-list compact-rank-list">
          {topActivities.length ? topActivities.map((item, index) => (
            <div className={`rank-row activity-rank-row ${item.isPerfectForCommonSlot ? 'perfect-fit' : ''}`} key={item.activity}>
              <span>{index + 1}</span>
              <div>
                <strong>{item.activity}</strong>
                <small>{item.names.join(', ')}</small>
                <em className="suggestion-line">
                  <span>Öneri:</span>
                  <span>{item.suggestionSummary}</span>
                </em>
                {item.isPerfectForCommonSlot ? (
                  <small className="perfect-fit-note">{item.perfectSlotLabel} ortak saatindeki herkese uygun</small>
                ) : null}
              </div>
              <b>{item.count}</b>
            </div>
          )) : <p>Henüz aktivite seçilmemiş.</p>}
        </div>
        {hiddenActivityCount > 0 ? (
          <div className="more-activities-box">+{hiddenActivityCount} aktivite daha var</div>
        ) : null}
      </article>

      <article className="panel">
        <div className="section-title inline-title">
          <Car />
          <div>
            <h2>Ulaşım durumu</h2>
            <p>Kimde araba veya motor var?</p>
          </div>
        </div>
        <div className="vehicle-summary good">
          <strong>{vehicle.carUsers.length} araba · {vehicle.motorcycleUsers.length} motor</strong>
          <span>{vehicle.noVehicle.length} kişide araç/motor yok</span>
        </div>
        <div className="driver-list">
          {vehicle.carUsers.map((driver) => (
            <div key={`car-${driver.id}`}><Car size={15} /> {driver.name}: araba var</div>
          ))}
          {vehicle.motorcycleUsers.map((driver) => (
            <div key={`motor-${driver.id}`}><Bike size={15} /> {driver.name}: motor var</div>
          ))}
          {!vehicle.carUsers.length && !vehicle.motorcycleUsers.length ? <div>Araç bilgisi girilmemiş.</div> : null}
        </div>
      </article>
    </section>
  )
}
