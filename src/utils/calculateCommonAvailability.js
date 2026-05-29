import { days } from '../data/mockData'

const toMinutes = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

const fromMinutes = (value) => {
  const normalized = ((value % 1440) + 1440) % 1440
  const h = Math.floor(normalized / 60).toString().padStart(2, '0')
  const m = (normalized % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}

const normalizeInterval = ({ start, end }) => {
  const startMin = toMinutes(start)
  let endMin = toMinutes(end)
  if (endMin <= startMin) endMin += 1440
  return { start: startMin, end: endMin }
}

const overlaps = (a, b) => {
  const start = Math.max(a.start, b.start)
  const end = Math.min(a.end, b.end)
  return end - start >= 60 ? { start, end } : null
}

export function calculateCommonAvailability(members) {
  const results = []

  days.forEach((day) => {
    const intervals = []

    members.forEach((member) => {
      const memberIntervals = member.availability?.[day.key] ?? []
      memberIntervals.forEach((interval) => {
        intervals.push({ ...normalizeInterval(interval), member })
      })
    })

    for (let i = 0; i < intervals.length; i += 1) {
      const base = intervals[i]
      const availableMembers = [base.member]
      let common = { start: base.start, end: base.end }

      for (let j = 0; j < intervals.length; j += 1) {
        if (i === j) continue
        const candidate = intervals[j]
        const overlap = overlaps(common, candidate)
        if (overlap) {
          common = overlap
          if (!availableMembers.find((m) => m.id === candidate.member.id)) {
            availableMembers.push(candidate.member)
          }
        }
      }

      if (availableMembers.length >= 2) {
        results.push({
          day: day.label,
          dayKey: day.key,
          start: fromMinutes(common.start),
          end: fromMinutes(common.end),
          count: availableMembers.length,
          members: availableMembers.map((m) => m.name),
        })
      }
    }
  })

  const unique = new Map()
  results.forEach((slot) => {
    const key = `${slot.dayKey}-${slot.start}-${slot.end}-${slot.members.sort().join('-')}`
    unique.set(key, slot)
  })

  return Array.from(unique.values())
    .sort((a, b) => b.count - a.count || a.dayKey.localeCompare(b.dayKey))
    .slice(0, 8)
}

export function calculateActivityMatches(members) {
  const counts = new Map()
  members.forEach((member) => {
    member.activities?.forEach((activity) => {
      if (!counts.has(activity)) counts.set(activity, [])
      const detail = member.activityDetails?.[activity]
      counts.get(activity).push({
        name: member.name,
        detail: detail?.mode === 'specific' ? detail.value?.trim() : 'Fark etmez',
      })
    })
  })

  return Array.from(counts.entries())
    .map(([activity, entries]) => ({
      activity,
      count: entries.length,
      names: entries.map((entry) => entry.name),
      details: entries
        .filter((entry) => entry.detail)
        .map((entry) => `${entry.name}: ${entry.detail}`),
    }))
    .sort((a, b) => b.count - a.count || a.activity.localeCompare(b.activity))
}

export function calculateVehicleSummary(members) {
  const carUsers = members.filter((member) => member.vehicle?.hasCar)
  const motorcycleUsers = members.filter((member) => member.vehicle?.hasMotorcycle)
  const noVehicle = members.filter((member) => !member.vehicle?.hasCar && !member.vehicle?.hasMotorcycle)

  return { carUsers, motorcycleUsers, noVehicle }
}
