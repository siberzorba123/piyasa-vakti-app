import React from 'react'
import { Users } from 'lucide-react'

export default function GroupCard({ group, active, onClick }) {
  return (
    <button className={`group-card ${active ? 'active' : ''}`} onClick={() => onClick(group.id)}>
      <div>
        <h3>{group.name}</h3>
        <p>Davet kodu: {group.inviteCode}</p>
      </div>
      <span className="member-pill"><Users size={16} /> {group.memberCount}</span>
    </button>
  )
}
