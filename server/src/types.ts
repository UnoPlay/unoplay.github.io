export interface Card {
  color: 'red' | 'blue' | 'green' | 'yellow' | 'black'
  value: string | number
  type?: 'number' | 'action' | 'wild'
  selectedColor?: string
}

export interface Player {
  id: string
  name: string
  isHost: boolean
  cards: Card[]
  score: number
  isBot: boolean
  status: 'online' | 'offline'
  joinedAt: number
  cardsCount: number
  saidUno: boolean
  canBePenalized: boolean
  lastAction?: string
}

export interface GameState {
  players: Player[]
  currentCard: Card | null
  currentPlayer: string
  gameStarted: boolean
  direction: 1 | -1
  lastAction?: string
  settings: {
    maxPlayers: number
    allowSpectators: boolean
    isPrivate: boolean
  }
  isHost: boolean
}

export interface ChatMessage {
  id: string
  sender: string
  text: string
  timestamp: number
} 