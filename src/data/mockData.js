export const days = [
  { key: 'mon', label: 'Pazartesi' },
  { key: 'tue', label: 'Salı' },
  { key: 'wed', label: 'Çarşamba' },
  { key: 'thu', label: 'Perşembe' },
  { key: 'fri', label: 'Cuma' },
  { key: 'sat', label: 'Cumartesi' },
  { key: 'sun', label: 'Pazar' },
]

export const activityTypes = ['Yemek', 'Kafe', 'Sinema', 'Konser', 'Halı saha', 'Gezi', 'Ev buluşması', 'Spor', 'Pub']

export const currentUser = {
  id: 'u1',
  name: 'Alperen',
  avatar: 'A',
  iban: 'TR00 0000 0000 0000 0000 0000 00',
}

export const initialGroups = [
  { id: 'g1', name: 'Üniversite Tayfa', memberCount: 6, inviteCode: 'ITU-2026', ownerId: 'u1' },
  { id: 'g2', name: 'Fethiye Tayfa', memberCount: 5, inviteCode: 'FTH-48', ownerId: 'u1' },
  { id: 'g3', name: 'Halı Saha Ekibi', memberCount: 10, inviteCode: 'MAC-1907', ownerId: 'u1' },
]

export const initialMembers = {
  g1: [
    {
      id: 'u1',
      name: 'Alperen',
      iban: 'TR00 0000 0000 0000 0000 0000 00',
      availability: {
        mon: [{ start: '18:00', end: '23:00' }],
        tue: [],
        wed: [{ start: '20:00', end: '23:30' }],
        thu: [{ start: '19:00', end: '22:00' }],
        fri: [{ start: '21:00', end: '02:00' }],
        sat: [{ start: '14:00', end: '23:30' }],
        sun: [{ start: '12:00', end: '20:00' }],
      },
      activities: ['Yemek', 'Kafe', 'Sinema', 'Gezi', 'Konser'],
      activityDetails: {
        Sinema: { mode: 'specific', value: 'Dune: Part Two' },
        Gezi: { mode: 'any', value: '' },
        Konser: { mode: 'specific', value: 'Mor ve Ötesi' },
      },
      vehicle: { hasCar: true, hasMotorcycle: false, note: 'Yakın mesafe daha iyi' },
      budget: '500-750 TL',
      note: '23.30 sonrası zor olabilir.',
    },
    {
      id: 'u2',
      name: 'Mert',
      iban: 'TR11 1111 1111 1111 1111 1111 11',
      availability: {
        mon: [{ start: '19:00', end: '22:00' }],
        tue: [{ start: '18:00', end: '21:00' }],
        wed: [{ start: '20:30', end: '00:00' }],
        thu: [],
        fri: [{ start: '20:00', end: '01:00' }],
        sat: [{ start: '18:00', end: '02:00' }],
        sun: [],
      },
      activities: ['Yemek', 'Pub', 'Kafe', 'Sinema', 'Konser'],
      activityDetails: {
        Sinema: { mode: 'any', value: '' },
        Konser: { mode: 'any', value: '' },
      },
      vehicle: { hasCar: false, hasMotorcycle: true, note: 'Motorla gelirim' },
      budget: '300-500 TL',
      note: 'Hafta içi geç çıkamam.',
    },
    {
      id: 'u3',
      name: 'Can',
      iban: 'TR22 2222 2222 2222 2222 2222 22',
      availability: {
        mon: [],
        tue: [{ start: '20:00', end: '23:00' }],
        wed: [{ start: '19:00', end: '22:30' }],
        thu: [{ start: '19:00', end: '23:30' }],
        fri: [{ start: '21:00', end: '02:00' }],
        sat: [{ start: '16:00', end: '23:00' }],
        sun: [{ start: '13:00', end: '18:00' }],
      },
      activities: ['Yemek', 'Kafe', 'Halı saha', 'Spor'],
      activityDetails: {},
      vehicle: { hasCar: true, hasMotorcycle: false, note: 'Arabam var' },
      budget: '500-750 TL',
      note: 'Çok uzak mekan istemem.',
    },
    {
      id: 'u4',
      name: 'Ege',
      iban: 'TR33 3333 3333 3333 3333 3333 33',
      availability: {
        mon: [{ start: '18:00', end: '22:00' }],
        tue: [],
        wed: [],
        thu: [{ start: '18:30', end: '22:00' }],
        fri: [{ start: '20:00', end: '00:00' }],
        sat: [{ start: '15:00', end: '23:00' }],
        sun: [{ start: '15:00', end: '20:00' }],
      },
      activities: ['Sinema', 'Kafe', 'Ev buluşması'],
      activityDetails: {
        Sinema: { mode: 'specific', value: 'Komedi olsun' },
      },
      vehicle: { hasCar: false, hasMotorcycle: false, note: '' },
      budget: '300-500 TL',
      note: 'Pazar erken dönmem lazım.',
    },
    {
      id: 'u5',
      name: 'Deniz',
      iban: 'TR44 4444 4444 4444 4444 4444 44',
      availability: {
        mon: [],
        tue: [{ start: '18:00', end: '23:00' }],
        wed: [{ start: '20:00', end: '23:00' }],
        thu: [{ start: '20:00', end: '23:00' }],
        fri: [],
        sat: [{ start: '19:00', end: '01:00' }],
        sun: [{ start: '12:00', end: '19:00' }],
      },
      activities: ['Yemek', 'Gezi', 'Kafe'],
      activityDetails: {
        Gezi: { mode: 'specific', value: 'Göcek' },
      },
      vehicle: { hasCar: false, hasMotorcycle: false, note: 'Toplu taşıma' },
      budget: '250-400 TL',
      note: 'Alkollü mekan istemem.',
    },
    {
      id: 'u6',
      name: 'Bora',
      iban: 'TR55 5555 5555 5555 5555 5555 55',
      availability: {
        mon: [{ start: '20:00', end: '23:00' }],
        tue: [{ start: '20:00', end: '22:00' }],
        wed: [{ start: '21:00', end: '00:00' }],
        thu: [],
        fri: [{ start: '20:00', end: '02:00' }],
        sat: [{ start: '18:00', end: '23:30' }],
        sun: [{ start: '16:00', end: '21:00' }],
      },
      activities: ['Yemek', 'Pub', 'Ev buluşması', 'Sinema'],
      activityDetails: {
        Sinema: { mode: 'any', value: '' },
      },
      vehicle: { hasCar: true, hasMotorcycle: true, note: 'Araba da motor da olabilir' },
      budget: '750+ TL',
      note: 'Cuma en rahat günüm.',
    },
  ],
  g2: [],
  g3: [],
}
