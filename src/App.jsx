import React, { useMemo, useState } from 'react'
import { Crown, Plus, Search, UsersRound } from 'lucide-react'
import GroupCard from './components/GroupCard'
import MemberCard from './components/MemberCard'
import AvailabilityForm from './components/AvailabilityForm'
import ProfileForm from './components/ProfileForm'
import CommonAvailability from './components/CommonAvailability'
import GroupAdmin from './components/GroupAdmin'
import { currentUser, initialGroups, initialMembers } from './data/mockData'
import { isSupabaseConfigured } from './lib/supabase'
import './styles.css'

const tabs = [
  { key: 'summary', label: 'Özet' },
  { key: 'profile', label: 'Profilim' },
  { key: 'members', label: 'Üyeler' },
  { key: 'mine', label: 'Müsaitliğim' },
  { key: 'admin', label: 'Yönetim' },
]

const emptyAvailability = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
}

function makeInviteCode(name) {
  const cleanName = (name || 'PV')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase()

  const prefix = cleanName || 'PV'
  const number = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${number}`
}

function makeCurrentUserMember(profile) {
  return {
    id: currentUser.id,
    name: profile.name,
    avatar: profile.avatar ?? currentUser.avatar,
    iban: profile.iban,
    availability: emptyAvailability,
    activities: [],
    activityDetails: {},
    vehicle: { hasCar: false, hasMotorcycle: false, note: '' },
    budget: 'Baya zenginim',
    note: '',
  }
}

export default function App() {
  const [groups, setGroups] = useState(initialGroups)
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroups[0].id)
  const [activeTab, setActiveTab] = useState('summary')
  const [membersByGroup, setMembersByGroup] = useState(initialMembers)
  const [userProfile, setUserProfile] = useState(currentUser)

  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [joinGroupOpen, setJoinGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [feedback, setFeedback] = useState('')

  const selectedGroup = groups.find((group) => group.id === selectedGroupId)
  const members = membersByGroup[selectedGroupId] ?? []
  const isCurrentUserOwner = selectedGroup?.ownerId === currentUser.id

  const showFeedback = (message) => {
    setFeedback(message)
    setTimeout(() => setFeedback(''), 3500)
  }

  const createGroup = (event) => {
    event.preventDefault()

    const name = newGroupName.trim()
    if (!name) {
      showFeedback('Grup adı yazman lazım.')
      return
    }

    const groupId = `g-${Date.now()}`
    const inviteCode = makeInviteCode(name)
    const group = {
      id: groupId,
      name,
      memberCount: 1,
      inviteCode,
      ownerId: currentUser.id,
    }

    setGroups((oldGroups) => [group, ...oldGroups])
    setMembersByGroup((oldMembers) => ({
      ...oldMembers,
      [groupId]: [makeCurrentUserMember(userProfile)],
    }))
    setSelectedGroupId(groupId)
    setActiveTab('summary')
    setNewGroupName('')
    setCreateGroupOpen(false)
    showFeedback(`${name} grubu oluşturuldu. Davet kodu: ${inviteCode}`)
  }

  const joinGroup = (event) => {
    event.preventDefault()

    const code = joinCode.trim().toUpperCase()
    if (!code) {
      showFeedback('Davet kodu yazman lazım.')
      return
    }

    const group = groups.find((item) => item.inviteCode.toUpperCase() === code)

    if (!group) {
      showFeedback('Bu demo sürümde sadece mevcut grup kodları çalışır: ITU-2026, FTH-48, MAC-1907')
      return
    }

    const isAlreadyMember = (membersByGroup[group.id] ?? []).some((member) => member.id === currentUser.id)

    if (!isAlreadyMember) {
      setMembersByGroup((oldMembers) => ({
        ...oldMembers,
        [group.id]: [makeCurrentUserMember(userProfile), ...(oldMembers[group.id] ?? [])],
      }))
      setGroups((oldGroups) => oldGroups.map((item) => (
        item.id === group.id ? { ...item, memberCount: item.memberCount + 1 } : item
      )))
    }

    setSelectedGroupId(group.id)
    setActiveTab('summary')
    setJoinCode('')
    setJoinGroupOpen(false)
    showFeedback(`${group.name} grubuna geçildi.`)
  }

  const shareGroupOnWhatsApp = () => {
    if (!selectedGroup) return

    const appLink = window.location.origin
    const plainMessage = `Piyasa Vakti - ${selectedGroup.name}\nDavet kodu: ${selectedGroup.inviteCode}\n${appLink}`
    const encodedMessage = encodeURIComponent(plainMessage)

    try {
      navigator.clipboard?.writeText(plainMessage)
    } catch {
      // Clipboard may be blocked on some browsers.
    }

    window.location.href = `https://wa.me/?text=${encodedMessage}`
  }

  const removeMemberFromGroup = (memberId) => {
    if (!isCurrentUserOwner || memberId === selectedGroup.ownerId) return

    setMembersByGroup((current) => {
      const updatedMembers = (current[selectedGroupId] ?? []).filter((member) => member.id !== memberId)
      setGroups((currentGroups) => currentGroups.map((group) => (
        group.id === selectedGroupId ? { ...group, memberCount: updatedMembers.length } : group
      )))
      return {
        ...current,
        [selectedGroupId]: updatedMembers,
      }
    })
  }

  const myProfile = useMemo(() => {
    const memberProfile = members.find((member) => member.id === currentUser.id) ?? members[0]
    return memberProfile ? { ...memberProfile, name: userProfile.name, iban: userProfile.iban, profileNote: userProfile.profileNote } : memberProfile
  }, [members, userProfile])

  const updateMyProfile = (profile) => {
    setMembersByGroup((current) => ({
      ...current,
      [selectedGroupId]: current[selectedGroupId].map((member) => (
        member.id === profile.id ? { ...profile, name: userProfile.name, iban: userProfile.iban } : member
      )),
    }))
  }

  const updateUserProfile = (profile) => {
    setUserProfile(profile)
    setMembersByGroup((current) => Object.fromEntries(
      Object.entries(current).map(([groupId, groupMembers]) => [
        groupId,
        groupMembers.map((member) => (
          member.id === currentUser.id ? { ...member, name: profile.name, iban: profile.iban, profileNote: profile.profileNote } : member
        )),
      ]),
    ))
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">PV</div>
          <div>
            <h1>Piyasa Vakti</h1>
            <p>Piyasanın Hakkı Verilecek</p>
            <small className="version-tag">v15 action fix</small>
          </div>
        </div>

        <div className="profile-box">
          <div className="avatar large">{currentUser.avatar}</div>
          <div>
            <strong>{userProfile.name}</strong>
            <span>{isSupabaseConfigured ? 'Supabase bağlı' : 'Demo veri modu'}</span>
          </div>
        </div>

        <div className="side-actions">
          <button type="button" onClick={() => setCreateGroupOpen(true)}><Plus size={17} /> Grup oluştur</button>
          <button type="button" onClick={() => setJoinGroupOpen(true)}><Search size={17} /> Kodla katıl</button>
        </div>

        {feedback ? <div className="feedback-box">{feedback}</div> : null}

        <h2 className="side-title">Gruplarım</h2>
        <div className="group-list">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              active={group.id === selectedGroupId}
              onClick={(groupId) => {
                setSelectedGroupId(groupId)
                setActiveTab('summary')
              }}
            />
          ))}
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Seçili grup</p>
            <h1>{selectedGroup?.name}</h1>
            <span>{members.length} üye · davet kodu {selectedGroup?.inviteCode} · yönetici {members.find((member) => member.id === selectedGroup?.ownerId)?.name ?? 'Bilinmiyor'}</span>
          </div>
          <div className="topbar-actions">
            {isCurrentUserOwner ? <span className="owner-badge"><Crown size={15} /> Yönetici</span> : null}
            <button type="button" className="primary-button" onClick={shareGroupOnWhatsApp}>WhatsApp'a link at</button>
          </div>
        </header>

        <nav className="tabs">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {members.length === 0 ? (
          <section className="empty-state">
            <UsersRound size={44} />
            <h2>Bu grup için demo üye yok</h2>
            <p>Sonraki adımda davet kodu ile gerçek üyeleri Supabase'e bağlayacağız.</p>
          </section>
        ) : null}

        {members.length > 0 && activeTab === 'summary' && <CommonAvailability members={members} />}

        {members.length > 0 && activeTab === 'profile' && myProfile && (
          <ProfileForm profile={{ ...userProfile, id: currentUser.id }} onChange={updateUserProfile} />
        )}

        {members.length > 0 && activeTab === 'members' && (
          <section className="member-grid">
            {members.map((member) => <MemberCard key={member.id} member={member} />)}
          </section>
        )}

        {members.length > 0 && activeTab === 'mine' && myProfile && (
          <AvailabilityForm profile={myProfile} onChange={updateMyProfile} />
        )}

        {members.length > 0 && activeTab === 'admin' && (
          <GroupAdmin
            group={selectedGroup}
            members={members}
            currentUserId={currentUser.id}
            onRemoveMember={removeMemberFromGroup}
          />
        )}
      </section>

      {createGroupOpen ? (
        <div className="modal-backdrop" onClick={() => setCreateGroupOpen(false)}>
          <form className="modal-card" onSubmit={createGroup} onClick={(event) => event.stopPropagation()}>
            <h2>Yeni grup oluştur</h2>
            <p>Grubu oluşturan kişi otomatik yönetici olur.</p>
            <label className="field-label" htmlFor="group-name">Grup adı</label>
            <input
              id="group-name"
              className="input"
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="Örn. Fethiye Tayfa"
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setCreateGroupOpen(false)}>Vazgeç</button>
              <button type="submit" className="primary-button">Oluştur</button>
            </div>
          </form>
        </div>
      ) : null}

      {joinGroupOpen ? (
        <div className="modal-backdrop" onClick={() => setJoinGroupOpen(false)}>
          <form className="modal-card" onSubmit={joinGroup} onClick={(event) => event.stopPropagation()}>
            <h2>Kodla gruba katıl</h2>
            <p>Demo kodları: ITU-2026, FTH-48, MAC-1907</p>
            <label className="field-label" htmlFor="join-code">Davet kodu</label>
            <input
              id="join-code"
              className="input"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Örn. FTH-48"
              autoFocus
            />
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setJoinGroupOpen(false)}>Vazgeç</button>
              <button type="submit" className="primary-button">Katıl</button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  )
}
