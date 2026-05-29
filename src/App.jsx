import React, { useEffect, useMemo, useState } from 'react'
import { Crown, LogOut, Plus, RefreshCw, Search, UsersRound } from 'lucide-react'
import GroupCard from './components/GroupCard'
import MemberCard from './components/MemberCard'
import AvailabilityForm from './components/AvailabilityForm'
import ProfileForm from './components/ProfileForm'
import CommonAvailability from './components/CommonAvailability'
import GroupAdmin from './components/GroupAdmin'
import GroupChat from './components/GroupChat'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import './styles.css'

const tabs = [
  { key: 'summary', label: 'Özet' },
  { key: 'members', label: 'Üyeler' },
  { key: 'mine', label: 'Müsaitliğim' },
  { key: 'profile', label: 'Profilim' },
  { key: 'admin', label: 'Yönetim' },
]

const dayKeyToNumber = {
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
  sun: 7,
}

const dayNumberToKey = Object.fromEntries(Object.entries(dayKeyToNumber).map(([key, value]) => [value, key]))

const emptyAvailability = {
  mon: [],
  tue: [],
  wed: [],
  thu: [],
  fri: [],
  sat: [],
  sun: [],
}

function buildAvailability(rows = []) {
  const availability = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    sat: [],
    sun: [],
  }

  rows.forEach((row) => {
    const key = dayNumberToKey[row.day_of_week]
    if (!key) return
    availability[key].push({
      start: String(row.start_time).slice(0, 5),
      end: String(row.end_time).slice(0, 5),
    })
  })

  return availability
}

function makeInviteCode(name) {
  const cleanName = (name || 'PV')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 3)
    .toUpperCase()

  return `${cleanName || 'PV'}-${Math.floor(1000 + Math.random() * 9000)}`
}

function profileToMember(profile, groupId, activityRows, availabilityRows, vehicleRows) {
  const activitiesForUser = activityRows.filter((row) => row.user_id === profile.id)
  const vehicle = vehicleRows.find((row) => row.user_id === profile.id)

  return {
    id: profile.id,
    name: profile.name || 'İsimsiz',
    avatar: profile.avatar_initial || (profile.name ? profile.name.slice(0, 1).toUpperCase() : 'P'),
    iban: profile.iban || '',
    profileNote: profile.profile_note || '',
    availability: buildAvailability(availabilityRows.filter((row) => row.user_id === profile.id)),
    activities: activitiesForUser.map((row) => row.activity),
    activityDetails: Object.fromEntries(activitiesForUser.map((row) => [
      row.activity,
      {
        mode: row.detail_mode || 'any',
        value: row.detail_value || '',
      },
    ])),
    vehicle: {
      hasCar: Boolean(vehicle?.has_car),
      hasMotorcycle: Boolean(vehicle?.has_motorcycle),
      note: vehicle?.note || '',
    },
    budget: vehicle?.budget || 'Baya zenginim',
    note: vehicle?.note || '',
  }
}

function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!isSupabaseConfigured) {
        setMessage('Supabase environment variables eksik.')
        return
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || email.split('@')[0],
            },
          },
        })

        if (error) throw error
        setMessage('Kayıt denendi. Mail doğrulaması açıksa e-postanı kontrol et; kapalıysa direkt giriş yapabilirsin.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      setMessage(error.message || 'Bir hata oldu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand auth-brand">
          <div className="brand-icon">PV</div>
          <div>
            <h1>Piyasa Vakti</h1>
            <p>Piyasanın Hakkı Verilecek</p>
          </div>
        </div>

        <h2>{mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}</h2>
        <p className="muted-text">Gerçek grup, profil ve müsaitlik verileri Supabase’e kaydedilecek.</p>

        {mode === 'signup' ? (
          <>
            <label className="field-label" htmlFor="name">Ad</label>
            <input id="name" className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alperen" />
          </>
        ) : null}

        <label className="field-label" htmlFor="email">E-posta</label>
        <input id="email" type="email" className="input" value={email} onChange={(event) => setEmail(event.target.value)} required />

        <label className="field-label" htmlFor="password">Şifre</label>
        <input id="password" type="password" className="input" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />

        <button className="primary-button auth-submit" disabled={loading}>
          {loading ? 'Bekle...' : mode === 'login' ? 'Giriş yap' : 'Hesap oluştur'}
        </button>

        <button
          className="link-button"
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setMessage('')
          }}
        >
          {mode === 'login' ? 'Hesabın yoksa kayıt ol' : 'Zaten hesabın varsa giriş yap'}
        </button>

        {message ? <div className="auth-message">{message}</div> : null}
      </form>
    </main>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [appLoading, setAppLoading] = useState(false)
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')
  const [membersByGroup, setMembersByGroup] = useState({})
  const [userProfile, setUserProfile] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [messagesByGroup, setMessagesByGroup] = useState({})
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')

  const user = session?.user
  const selectedGroup = groups.find((group) => group.id === selectedGroupId)
  const members = membersByGroup[selectedGroupId] ?? []
  const messages = messagesByGroup[selectedGroupId] ?? []
  const isCurrentUserOwner = selectedGroup?.ownerId === user?.id

  const showFeedback = (message) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 4500)
  }

  const loadAppData = async () => {
    if (!user || !supabase) return

    setAppLoading(true)

    try {
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) throw profileError

      if (!profile) {
        const initialName = user.user_metadata?.name || user.email?.split('@')[0] || 'İsimsiz'
        const { data: createdProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: initialName,
            avatar_initial: initialName.slice(0, 1).toUpperCase(),
          })
          .select()
          .single()

        if (createProfileError) throw createProfileError
        profile = createdProfile
      }

      setUserProfile({
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar_initial || 'P',
        iban: profile.iban || '',
        profileNote: profile.profile_note || '',
      })

      const { data: membershipRows, error: membershipError } = await supabase
        .from('group_members')
        .select('role, friend_groups(id, name, invite_code, owner_id, created_at)')
        .eq('user_id', user.id)

      if (membershipError) throw membershipError

      const loadedGroups = (membershipRows || [])
        .map((row) => row.friend_groups)
        .filter(Boolean)
        .map((group) => ({
          id: group.id,
          name: group.name,
          inviteCode: group.invite_code,
          ownerId: group.owner_id,
          memberCount: 0,
        }))

      const membersMap = {}

      for (const group of loadedGroups) {
        const { data: groupMemberRows, error: groupMemberError } = await supabase
          .from('group_members')
          .select('user_id, role')
          .eq('group_id', group.id)

        if (groupMemberError) throw groupMemberError

        const userIds = (groupMemberRows || []).map((row) => row.user_id)
        group.memberCount = userIds.length

        if (!userIds.length) {
          membersMap[group.id] = []
          continue
        }

        const [
          profilesResult,
          availabilityResult,
          activitiesResult,
          vehicleResult,
        ] = await Promise.all([
          supabase.from('profiles').select('*').in('id', userIds),
          supabase.from('availability').select('*').eq('group_id', group.id),
          supabase.from('activity_preferences').select('*').eq('group_id', group.id),
          supabase.from('vehicle_status').select('*').eq('group_id', group.id),
        ])

        if (profilesResult.error) throw profilesResult.error
        if (availabilityResult.error) throw availabilityResult.error
        if (activitiesResult.error) throw activitiesResult.error
        if (vehicleResult.error) throw vehicleResult.error

        membersMap[group.id] = (profilesResult.data || []).map((memberProfile) => (
          profileToMember(
            memberProfile,
            group.id,
            activitiesResult.data || [],
            availabilityResult.data || [],
            vehicleResult.data || [],
          )
        ))
      }

      setGroups(loadedGroups)
      setMembersByGroup(membersMap)

      if (loadedGroups.length && (!selectedGroupId || !loadedGroups.some((group) => group.id === selectedGroupId))) {
        setSelectedGroupId(loadedGroups[0].id)
      }

      if (!loadedGroups.length) {
        setSelectedGroupId(null)
      }
    } catch (error) {
      console.error(error)
      showFeedback(error.message || 'Veriler yüklenemedi.')
    } finally {
      setAppLoading(false)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      loadAppData()
    } else {
      setGroups([])
      setSelectedGroupId(null)
      setMembersByGroup({})
      setUserProfile(null)
      setMessagesByGroup({})
      setChatError('')
    }
  }, [user?.id])

  const handleCreateGroup = async () => {
    const name = window.prompt('Yeni grup adı ne olsun? Örn: Fethiye Tayfa')
    if (name === null) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      window.alert('Grup adı boş olamaz.')
      return
    }

    try {
      const inviteCode = makeInviteCode(trimmedName)

      const { data: group, error: groupError } = await supabase
        .from('friend_groups')
        .insert({
          name: trimmedName,
          invite_code: inviteCode,
          owner_id: user.id,
        })
        .select()
        .single()

      if (groupError) throw groupError

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'owner',
        })

      if (memberError) throw memberError

      showFeedback(`${trimmedName} grubu oluşturuldu. Davet kodu: ${inviteCode}`)
      await loadAppData()
      setSelectedGroupId(group.id)
      setActiveTab('summary')
    } catch (error) {
      window.alert(error.message || 'Grup oluşturulamadı.')
    }
  }

  const handleJoinGroup = async () => {
    const codeInput = window.prompt('Davet kodunu yaz.')
    if (codeInput === null) return

    const code = codeInput.trim().toUpperCase()
    if (!code) {
      window.alert('Davet kodu boş olamaz.')
      return
    }

    try {
      const { data: groupId, error } = await supabase.rpc('join_group_by_invite', {
        invite: code,
      })

      if (error) throw error

      await loadAppData()
      setSelectedGroupId(groupId)
      setActiveTab('summary')
      showFeedback('Gruba katıldın.')
    } catch (error) {
      window.alert(error.message || 'Gruba katılınamadı.')
    }
  }

  const loadMessages = async (groupId = selectedGroupId) => {
    if (!groupId || !supabase || !user) return

    setChatLoading(true)
    setChatError('')

    try {
      const { data: messageRows, error: messageError } = await supabase
        .from('group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (messageError) throw messageError

      const userIds = Array.from(new Set((messageRows || []).map((message) => message.user_id)))
      let profiles = []

      if (userIds.length) {
        const { data: profileRows, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, avatar_initial')
          .in('id', userIds)

        if (profileError) throw profileError
        profiles = profileRows || []
      }

      const profileMap = Object.fromEntries(profiles.map((profile) => [profile.id, profile]))
      const nextMessages = (messageRows || []).map((message) => {
        const author = profileMap[message.user_id]
        return {
          id: message.id,
          groupId: message.group_id,
          userId: message.user_id,
          body: message.body,
          createdAt: message.created_at,
          authorName: author?.name || 'İsimsiz',
          authorAvatar: author?.avatar_initial || 'P',
        }
      })

      setMessagesByGroup((current) => ({ ...current, [groupId]: nextMessages }))
    } catch (error) {
      console.error(error)
      setChatError('Mesajlar yüklenemedi. v20 SQL patch Supabase SQL Editor içinde çalıştırılmış olmalı.')
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    if (selectedGroupId && user) {
      loadMessages(selectedGroupId)
    }
  }, [selectedGroupId, user?.id])

  const sendGroupMessage = async (body) => {
    if (!selectedGroupId || !body.trim()) return

    try {
      const { error } = await supabase
        .from('group_messages')
        .insert({
          group_id: selectedGroupId,
          user_id: user.id,
          body: body.trim(),
        })

      if (error) throw error
      await loadMessages(selectedGroupId)
    } catch (error) {
      window.alert(error.message || 'Mesaj gönderilemedi. v20 SQL patch çalıştırılmış mı kontrol et.')
    }
  }

  const deleteGroupMessage = async (messageId) => {
    try {
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error
      await loadMessages(selectedGroupId)
    } catch (error) {
      window.alert(error.message || 'Mesaj silinemedi.')
    }
  }

  const shareGroupOnWhatsApp = async () => {
    if (!selectedGroup) return

    const appLink = window.location.origin
    const plainMessage = `Piyasa Vakti - ${selectedGroup.name}
Davet kodu: ${selectedGroup.inviteCode}
${appLink}`

    try {
      await navigator.clipboard.writeText(plainMessage)
      showFeedback('Davet linki kopyalandı.')
    } catch {
      window.prompt('Davet linkini kopyala:', plainMessage)
      showFeedback('Davet linki hazır.')
    }
  }

  const removeMemberFromGroup = async (memberId) => {
    if (!isCurrentUserOwner || memberId === selectedGroup.ownerId) return

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', selectedGroupId)
        .eq('user_id', memberId)

      if (error) throw error
      await loadAppData()
    } catch (error) {
      window.alert(error.message || 'Üye atılamadı.')
    }
  }

  const deleteSelectedGroup = async () => {
    if (!selectedGroup || !isCurrentUserOwner) return

    const confirmed = window.confirm(`${selectedGroup.name} grubunu tamamen silmek istediğine emin misin? Bu işlem geri alınamaz.`)
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('friend_groups')
        .delete()
        .eq('id', selectedGroup.id)

      if (error) throw error

      showFeedback('Grup silindi.')
      setSelectedGroupId(null)
      setActiveTab('summary')
      await loadAppData()
    } catch (error) {
      window.alert(error.message || 'Grup silinemedi. v20 SQL patch içinde grup silme yetkisi eklenmiş olmalı.')
    }
  }

  const myProfile = useMemo(() => {
    const memberProfile = members.find((member) => member.id === user?.id)
    return memberProfile || (userProfile ? {
      id: user.id,
      name: userProfile.name,
      avatar: userProfile.avatar,
      iban: userProfile.iban,
      profileNote: userProfile.profileNote,
      availability: emptyAvailability,
      activities: [],
      activityDetails: {},
      vehicle: { hasCar: false, hasMotorcycle: false, note: '' },
      budget: 'Baya zenginim',
      note: '',
    } : null)
  }, [members, user?.id, userProfile])

  const updateUserProfile = async (profile) => {
    try {
      const name = profile.name || 'İsimsiz'

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name,
          avatar_initial: name.slice(0, 1).toUpperCase(),
          iban: profile.iban || '',
          profile_note: profile.profileNote || '',
        })

      if (error) throw error
      setUserProfile({
        id: user.id,
        name,
        avatar: name.slice(0, 1).toUpperCase(),
        iban: profile.iban || '',
        profileNote: profile.profileNote || '',
      })
      await loadAppData()
      showFeedback('Profil kaydedildi.')
    } catch (error) {
      window.alert(error.message || 'Profil kaydedilemedi.')
    }
  }

  const updateMyProfile = async (profile) => {
    if (!selectedGroupId) return

    try {
      await supabase
        .from('availability')
        .delete()
        .eq('group_id', selectedGroupId)
        .eq('user_id', user.id)

      const availabilityRows = Object.entries(profile.availability || {})
        .flatMap(([dayKey, ranges]) => (ranges || []).map((range) => ({
          group_id: selectedGroupId,
          user_id: user.id,
          day_of_week: dayKeyToNumber[dayKey],
          start_time: range.start,
          end_time: range.end,
        })))
        .filter((row) => row.day_of_week && row.start_time && row.end_time)

      if (availabilityRows.length) {
        const { error } = await supabase.from('availability').insert(availabilityRows)
        if (error) throw error
      }

      await supabase
        .from('activity_preferences')
        .delete()
        .eq('group_id', selectedGroupId)
        .eq('user_id', user.id)

      const activityRows = (profile.activities || []).map((activity) => ({
        group_id: selectedGroupId,
        user_id: user.id,
        activity,
        detail_mode: profile.activityDetails?.[activity]?.mode || 'any',
        detail_value: profile.activityDetails?.[activity]?.value || '',
      }))

      if (activityRows.length) {
        const { error } = await supabase.from('activity_preferences').insert(activityRows)
        if (error) throw error
      }

      const { error: vehicleError } = await supabase
        .from('vehicle_status')
        .upsert({
          group_id: selectedGroupId,
          user_id: user.id,
          has_car: Boolean(profile.vehicle?.hasCar),
          has_motorcycle: Boolean(profile.vehicle?.hasMotorcycle),
          budget: profile.budget || 'Baya zenginim',
          note: profile.note || profile.vehicle?.note || '',
        })

      if (vehicleError) throw vehicleError

      await loadAppData()
      showFeedback('Müsaitliğin kaydedildi.')
    } catch (error) {
      window.alert(error.message || 'Müsaitlik kaydedilemedi.')
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setGroups([])
    setSelectedGroupId(null)
    setMembersByGroup({})
    setMessagesByGroup({})
    setUserProfile(null)
    setActiveTab('summary')
    window.history.replaceState(null, '', window.location.origin)
  }

  if (authLoading) {
    return <main className="loading-screen">Yükleniyor...</main>
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="loading-screen">
        Supabase bağlantısı yok. Vercel Environment Variables içinde VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekli olmalı.
      </main>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">PV</div>
          <div>
            <h1>Piyasa Vakti</h1>
            <p>Piyasanın Hakkı Verilecek</p>
            <small className="version-tag">v22 force update</small>
          </div>
        </div>

        <div className="profile-box">
          <div className="avatar large">{userProfile?.avatar || 'P'}</div>
          <div>
            <strong>{userProfile?.name || user.email}</strong>
            <span>Supabase bağlı</span>
          </div>
        </div>

        <div className="side-actions">
          <button type="button" onClick={handleCreateGroup}><Plus size={17} /> Grup oluştur</button>
          <button type="button" onClick={handleJoinGroup}><Search size={17} /> Kodla katıl</button>
        </div>

        <button className="logout-button" type="button" onClick={signOut}><LogOut size={16} /> Çıkış yap</button>

        {feedback ? <div className="feedback-box">{feedback}</div> : null}

        <h2 className="side-title">Gruplarım</h2>
        <div className="group-list">
          {groups.length ? groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              active={group.id === selectedGroupId}
              onClick={(groupId) => {
                setSelectedGroupId(groupId)
                setActiveTab('summary')
              }}
            />
          )) : (
            <div className="empty-mini">
              Henüz grubun yok. Grup oluştur veya kodla katıl.
            </div>
          )}
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Seçili grup</p>
            <h1>{selectedGroup?.name || 'Grup seçilmedi'}</h1>
            {selectedGroup ? (
              <span>{members.length} üye · davet kodu {selectedGroup.inviteCode} · yönetici {members.find((member) => member.id === selectedGroup.ownerId)?.name ?? 'Bilinmiyor'}</span>
            ) : (
              <span>Başlamak için grup oluştur veya davet koduyla katıl.</span>
            )}
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" type="button" onClick={loadAppData}><RefreshCw size={16} /> Yenile</button>
            {isCurrentUserOwner ? <span className="owner-badge"><Crown size={15} /> Yönetici</span> : null}
            {selectedGroup ? <button type="button" className="primary-button" onClick={shareGroupOnWhatsApp}>WhatsApp'a link at</button> : null}
          </div>
        </header>

        {selectedGroup ? (
          <>
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

            {appLoading ? <div className="panel">Veriler yükleniyor...</div> : null}

            {members.length === 0 ? (
              <section className="empty-state">
                <UsersRound size={44} />
                <h2>Bu grupta henüz üye yok</h2>
                <p>Bir şey ters gittiyse Yenile butonuna bas.</p>
              </section>
            ) : null}

            {members.length > 0 && activeTab === 'summary' && (
              <>
                <CommonAvailability members={members} />
                <GroupChat
                  messages={messages}
                  currentUserId={user.id}
                  isOwner={isCurrentUserOwner}
                  loading={chatLoading}
                  error={chatError}
                  onSendMessage={sendGroupMessage}
                  onDeleteMessage={deleteGroupMessage}
                />
              </>
            )}

            {activeTab === 'profile' && userProfile && (
              <ProfileForm profile={{ ...userProfile, id: user.id }} onChange={updateUserProfile} />
            )}

            {members.length > 0 && activeTab === 'members' && (
              <section className="member-grid">
                {members.map((member) => <MemberCard key={member.id} member={member} />)}
              </section>
            )}

            {activeTab === 'mine' && myProfile && (
              <AvailabilityForm profile={myProfile} onChange={updateMyProfile} />
            )}

            {members.length > 0 && activeTab === 'admin' && (
              <GroupAdmin
                group={selectedGroup}
                members={members}
                currentUserId={user.id}
                onRemoveMember={removeMemberFromGroup}
                onDeleteGroup={deleteSelectedGroup}
              />
            )}
          </>
        ) : (
          <section className="empty-state">
            <UsersRound size={44} />
            <h2>Henüz grup yok</h2>
            <p>Sol taraftan grup oluştur veya davet koduyla katıl.</p>
          </section>
        )}
      </section>
    </main>
  )
}
