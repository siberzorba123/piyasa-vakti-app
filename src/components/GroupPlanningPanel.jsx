import React, { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Megaphone, PartyPopper, Send, ThumbsUp, Vote } from 'lucide-react'
import { calculateActivityMatches, calculateCommonAvailability } from '../utils/calculateCommonAvailability'

const responseLabels = {
  joining: 'Katılıyorum',
  maybe: 'Belki',
  not_joining: 'Gelemiyorum',
}

function getResponseCounts(responses = []) {
  return {
    joining: responses.filter((item) => item.status === 'joining').length,
    maybe: responses.filter((item) => item.status === 'maybe').length,
    not_joining: responses.filter((item) => item.status === 'not_joining').length,
  }
}

export default function GroupPlanningPanel({
  group,
  members,
  currentUserId,
  isOwner,
  planningData,
  onSaveAnnouncement,
  onFinalizePlan,
  onRespondPlan,
  onCreatePoll,
  onVotePoll,
}) {
  const [announcementText, setAnnouncementText] = useState(planningData?.announcement?.body || '')
  const [planNote, setPlanNote] = useState('')
  const [pollQuestion, setPollQuestion] = useState('Nereye / neye karar verelim?')
  const [pollOptionsText, setPollOptionsText] = useState('')

  useEffect(() => {
    setAnnouncementText(planningData?.announcement?.body || '')
  }, [planningData?.announcement?.body, group?.id])

  const slots = useMemo(() => calculateCommonAvailability(members), [members])
  const activities = useMemo(() => calculateActivityMatches(members, slots), [members, slots])
  const bestSlot = slots[0]
  const bestActivity = activities[0]

  const recommendation = useMemo(() => {
    if (!bestSlot && !bestActivity) return null
    if (bestSlot && bestActivity) {
      const samePeople = bestSlot.memberIds?.every((memberId) => bestActivity.memberIds?.includes(memberId))
      return {
        title: `${bestSlot.day} ${bestSlot.start}-${bestSlot.end}`,
        subtitle: `${bestSlot.count} kişi uygun · En güçlü etkinlik: ${bestActivity.activity}`,
        activity: bestActivity.activity,
        slot: bestSlot,
        isPerfect: Boolean(samePeople),
      }
    }
    if (bestSlot) {
      return {
        title: `${bestSlot.day} ${bestSlot.start}-${bestSlot.end}`,
        subtitle: `${bestSlot.count} kişi uygun`,
        activity: '',
        slot: bestSlot,
        isPerfect: false,
      }
    }
    return {
      title: bestActivity.activity,
      subtitle: `${bestActivity.count} kişi seçmiş`,
      activity: bestActivity.activity,
      slot: null,
      isPerfect: false,
    }
  }, [bestSlot, bestActivity])

  const plan = planningData?.plan
  const responses = planningData?.responses || []
  const myResponse = responses.find((item) => item.userId === currentUserId)?.status
  const responseCounts = getResponseCounts(responses)
  const poll = planningData?.poll

  const submitPoll = () => {
    const options = pollOptionsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    if (!pollQuestion.trim() || options.length < 2) {
      window.alert('Oylama için soru ve en az 2 seçenek yazmalısın.')
      return
    }

    onCreatePoll(pollQuestion.trim(), options)
    setPollOptionsText('')
  }

  return (
    <section className="planning-grid">
      <article className="panel announcement-panel">
        <div className="section-title inline-title">
          <Megaphone />
          <div>
            <h2>Grup duyurusu</h2>
            <p>Planla ilgili kısa bilgi grubun üstünde sabit dursun.</p>
          </div>
        </div>
        {isOwner ? (
          <div className="announcement-editor">
            <textarea
              className="textarea compact-textarea"
              value={announcementText}
              onChange={(event) => setAnnouncementText(event.target.value)}
              placeholder="Örn: Bu hafta cumartesi akşamı plan yapıyoruz, herkes müsaitliğini girsin."
            />
            <button className="primary-button" type="button" onClick={() => onSaveAnnouncement(announcementText)}>
              <Send size={15} /> Duyuruyu kaydet
            </button>
          </div>
        ) : (
          <div className="announcement-view">
            {planningData?.announcement?.body || 'Henüz duyuru yok.'}
          </div>
        )}
      </article>

      <article className="panel smart-suggestion-panel">
        <div className="section-title inline-title">
          <PartyPopper />
          <div>
            <h2>Akıllı öneri</h2>
            <p>En uygun gün ve en güçlü etkinlik otomatik öne çıkar.</p>
          </div>
        </div>
        {recommendation ? (
          <div className={`smart-suggestion-card ${recommendation.isPerfect ? 'green' : ''}`}>
            <strong>{recommendation.title}</strong>
            <span>{recommendation.subtitle}</span>
            {recommendation.isPerfect ? <em>Bu saat aralığındaki herkes bu etkinliği de seçmiş.</em> : null}
            {isOwner && recommendation.slot ? (
              <div className="finalize-box">
                <input
                  className="input"
                  value={planNote}
                  onChange={(event) => setPlanNote(event.target.value)}
                  placeholder="Kesin plan notu / mekan: örn. Marina Kafe"
                />
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => onFinalizePlan({
                    dayLabel: recommendation.slot.day,
                    startTime: recommendation.slot.start,
                    endTime: recommendation.slot.end,
                    activity: recommendation.activity || 'Belirlenecek',
                    note: planNote,
                  })}
                >
                  <CheckCircle2 size={16} /> Planı kesinleştir
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="muted-text">Öneri çıkması için en az birkaç kişi müsaitlik ve aktivite girmeli.</p>
        )}
      </article>

      <article className="panel final-plan-panel">
        <div className="section-title inline-title">
          <CheckCircle2 />
          <div>
            <h2>Kesinleşen plan</h2>
            <p>Plan kesinleşince herkes son kararını buradan verir.</p>
          </div>
        </div>
        {plan ? (
          <div className="final-plan-card">
            <strong>{plan.dayLabel} · {plan.startTime} - {plan.endTime}</strong>
            <span>Etkinlik: {plan.activity}</span>
            {plan.note ? <em>{plan.note}</em> : null}
            <div className="response-buttons">
              {Object.entries(responseLabels).map(([status, label]) => (
                <button
                  type="button"
                  key={status}
                  className={myResponse === status ? 'selected' : ''}
                  onClick={() => onRespondPlan(status)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="response-summary">
              <span>{responseLabels.joining}: {responseCounts.joining}</span>
              <span>{responseLabels.maybe}: {responseCounts.maybe}</span>
              <span>{responseLabels.not_joining}: {responseCounts.not_joining}</span>
            </div>
          </div>
        ) : (
          <p className="muted-text">Henüz kesinleşen plan yok. Yönetici akıllı öneriden planı kesinleştirebilir.</p>
        )}
      </article>

      <article className="panel poll-panel">
        <div className="section-title inline-title">
          <Vote />
          <div>
            <h2>Oylama</h2>
            <p>Yer, aktivite veya saat seçeneklerini hızlıca oylayın.</p>
          </div>
        </div>

        {poll ? (
          <div className="poll-view">
            <strong>{poll.question}</strong>
            <div className="poll-options">
              {(poll.options || []).map((option) => {
                const voteCount = (poll.votes || []).filter((vote) => vote.optionId === option.id).length
                const selected = (poll.votes || []).some((vote) => vote.userId === currentUserId && vote.optionId === option.id)
                return (
                  <button
                    type="button"
                    className={selected ? 'selected' : ''}
                    key={option.id}
                    onClick={() => onVotePoll(option.id)}
                  >
                    <span>{option.label}</span>
                    <b>{voteCount}</b>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {isOwner ? (
          <div className="poll-create">
            <input
              className="input"
              value={pollQuestion}
              onChange={(event) => setPollQuestion(event.target.value)}
              placeholder="Oylama sorusu"
            />
            <textarea
              className="textarea compact-textarea"
              value={pollOptionsText}
              onChange={(event) => setPollOptionsText(event.target.value)}
              placeholder="Seçenekleri alt alta yaz:&#10;Marina&#10;Çalış&#10;Göcek"
            />
            <button className="secondary-button" type="button" onClick={submitPoll}>
              <ThumbsUp size={16} /> Yeni oylama başlat
            </button>
          </div>
        ) : !poll ? <p className="muted-text">Henüz oylama yok.</p> : null}
      </article>
    </section>
  )
}
