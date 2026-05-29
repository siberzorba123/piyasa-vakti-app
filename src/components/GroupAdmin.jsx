import React from 'react'
import { Crown, ShieldCheck, UserMinus, UsersRound } from 'lucide-react'

export default function GroupAdmin({ group, members, currentUserId, onRemoveMember }) {
  const owner = members.find((member) => member.id === group.ownerId)
  const isOwner = group.ownerId === currentUserId

  if (!isOwner) {
    return (
      <section className="panel admin-panel">
        <div className="section-title inline-title">
          <ShieldCheck />
          <div>
            <h2>Grup yönetimi</h2>
            <p>Bu alan sadece grup yöneticisi tarafından kullanılabilir.</p>
          </div>
        </div>
        <div className="owner-box">
          <Crown size={18} />
          <span>Yönetici: <strong>{owner?.name ?? 'Bilinmiyor'}</strong></span>
        </div>
      </section>
    )
  }

  return (
    <section className="panel admin-panel">
      <div className="section-title inline-title">
        <ShieldCheck />
        <div>
          <h2>Grup yönetimi</h2>
          <p>Grubu kuran kişi yöneticidir. Yönetici istediği üyeyi gruptan çıkarabilir.</p>
        </div>
      </div>

      <div className="owner-box">
        <Crown size={18} />
        <span>Yönetici: <strong>{owner?.name ?? 'Bilinmiyor'}</strong></span>
      </div>

      <div className="admin-member-list">
        <div className="admin-list-title">
          <UsersRound size={18} />
          <strong>Üyeler</strong>
        </div>
        {members.map((member) => {
          const memberIsOwner = member.id === group.ownerId
          return (
            <div className="admin-member-row" key={member.id}>
              <div>
                <strong>{member.name}</strong>
                <span>{memberIsOwner ? 'Yönetici' : 'Üye'}</span>
              </div>
              <button
                type="button"
                className="danger-button"
                disabled={memberIsOwner}
                onClick={() => onRemoveMember(member.id)}
              >
                <UserMinus size={16} />
                At
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
