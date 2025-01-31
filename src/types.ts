export interface Card {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'black'
  value: number | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wildDraw4'
  selectedColor?: string // для диких карт
}

export interface Player {
  id: string
  name: string
  cardsCount: number
  isBot?: boolean
  isHost?: boolean
  score?: number
  isReady?: boolean
  avatar?: string
  status?: 'online' | 'offline' | 'away'
  lastAction?: string
  joinedAt?: number
}

export interface GameState {
  players: Player[]
  currentPlayer: string
  currentCard: Card | null
  direction: 1 | -1
  gameStarted: boolean
  lastAction?: string
  winner?: string
  roundNumber?: number
  phase: 'lobby' | 'starting' | 'playing' | 'finished'
  countdown?: number
  scores: Record<string, number>
}

export const COLORS = ['red', 'blue', 'green', 'yellow'] as const
export const SPECIAL_CARDS = ['skip', 'reverse', 'draw2'] as const
export const WILD_CARDS = ['wild', 'wildDraw4'] as const

export const CARD_VALUES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  ...SPECIAL_CARDS,
  ...WILD_CARDS,
] as const

export const BOT_NAMES = [
  'Робот Вася',
  'Железяка',
  'Терминатор',
  'R2D2',
  'C-3PO',
  'ВАЛЛ-И',
  'HAL 9000',
  'GLaDOS',
] as const

export const PLAYER_STATUSES = {
  online: { color: 'green', text: 'В сети' },
  offline: { color: 'gray', text: 'Не в сети' },
  away: { color: 'yellow', text: 'Отошёл' },
} as const 