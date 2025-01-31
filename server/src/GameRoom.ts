import { Card, Player, GameState } from './types'

export class GameRoom {
  private id: string
  private players: Player[]
  private cards: Card[]
  private currentCard: Card | null
  private currentPlayerIndex: number
  private gameStarted: boolean
  private direction: 1 | -1
  private settings: {
    maxPlayers: number
    allowSpectators: boolean
    isPrivate: boolean
  }
  private bannedPlayers: Set<string>
  private mutedPlayers: Set<string>

  constructor(id: string, playerLimit: number = 4) {
    this.id = id
    this.players = []
    this.cards = this.generateDeck()
    this.currentCard = null
    this.currentPlayerIndex = 0
    this.gameStarted = false
    this.direction = 1
    this.settings = {
      maxPlayers: Math.min(Math.max(playerLimit, 2), 10), // Ограничиваем от 2 до 10 игроков
      allowSpectators: false,
      isPrivate: false
    }
    this.bannedPlayers = new Set()
    this.mutedPlayers = new Set()
  }

  private generateDeck(): Card[] {
    const colors: ('red' | 'blue' | 'green' | 'yellow')[] = ['red', 'blue', 'green', 'yellow']
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const actions = ['skip', 'reverse', '+2']
    const deck: Card[] = []

    // Добавляем цветные карты с цифрами
    colors.forEach(color => {
      numbers.forEach(number => {
        deck.push({ color, value: number, type: 'number' })
        if (number !== 0) {
          deck.push({ color, value: number, type: 'number' })
        }
      })
    })

    // Добавляем карты действий
    colors.forEach(color => {
      actions.forEach(action => {
        deck.push({ color, value: action, type: 'action' })
        deck.push({ color, value: action, type: 'action' })
      })
    })

    // Добавляем черные карты
    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'black', value: 'wild', type: 'wild' })
      deck.push({ color: 'black', value: '+4', type: 'wild' })
    }

    return this.shuffleDeck(deck)
  }

  private shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
  }

  public hasPlayer(playerId: string): boolean {
    return this.players.some(player => player.id === playerId)
  }

  public isFull(): boolean {
    return this.players.length >= this.settings.maxPlayers
  }

  public addPlayer(player: Player): boolean {
    if (this.isFull() || this.hasPlayer(player.id) || this.bannedPlayers.has(player.id)) {
      return false
    }
    this.players.push(player)
    return true
  }

  public removePlayer(id: string): void {
    this.players = this.players.filter(player => player.id !== id)
    if (this.players.length > 0 && this.isGameStarted()) {
      if (this.getCurrentPlayerId() === id) {
        this.nextTurn()
      }
    }
  }

  public banPlayer(id: string): void {
    this.bannedPlayers.add(id)
    this.removePlayer(id)
  }

  public mutePlayer(id: string): void {
    this.mutedPlayers.add(id)
  }

  public isHost(id: string): boolean {
    const player = this.players.find(player => player.id === id)
    return player ? player.isHost : false
  }

  public isCurrentPlayer(id: string): boolean {
    const playerIds = this.players.map(player => player.id)
    return playerIds[this.currentPlayerIndex] === id
  }

  public getCurrentPlayerId(): string {
    const playerIds = this.players.map(player => player.id)
    return playerIds[this.currentPlayerIndex]
  }

  public isEmpty(): boolean {
    return this.players.length === 0
  }

  public isGameStarted(): boolean {
    return this.gameStarted
  }

  public startGame(): void {
    if (this.players.length < 2) {
      throw new Error('Для начала игры нужно минимум 2 игрока')
    }

    if (this.players.length > this.settings.maxPlayers) {
      throw new Error(`Максимальное количество игроков в комнате: ${this.settings.maxPlayers}`)
    }

    this.gameStarted = true
    this.dealCards()
  }

  public updateSettings(settings: Partial<typeof this.settings>): void {
    this.settings = { ...this.settings, ...settings }
  }

  public getState(): GameState {
    const currentPlayer = this.players.find(player => player.id === this.getCurrentPlayerId())
    return {
      players: this.players.map(player => ({
        ...player,
        // Скрываем карты других игроков
        cards: [],
        cardsCount: player.cards.length
      })),
      currentCard: this.currentCard,
      currentPlayer: this.getCurrentPlayerId(),
      gameStarted: this.gameStarted,
      direction: this.direction,
      settings: this.settings,
      isHost: currentPlayer?.isHost || false
    }
  }

  // Добавляем новый метод для получения состояния для конкретного игрока
  public getStateForPlayer(playerId: string): GameState {
    const baseState = this.getState();
    const player = this.players.find(p => p.id === playerId);
    
    if (player) {
      return {
        ...baseState,
        players: baseState.players.map(p => 
          p.id === playerId 
            ? { ...p, cards: player.cards } // Показываем карты только текущему игроку
            : p // Оставляем пустые карты для других игроков
        )
      };
    }
    
    return baseState;
  }

  private dealCards(): void {
    console.log('Начинаем раздачу карт')
    // Раздаем каждому игроку по 7 карт
    this.players.forEach(player => {
      player.cards = this.cards.splice(0, 7)
      player.cardsCount = player.cards.length
      console.log(`Игрок ${player.name} получил карты:`, player.cards)
    })

    // Открываем первую карту
    this.currentCard = this.cards.pop() || null
    console.log('Текущая карта:', this.currentCard)

    // Если первая карта черная, выбираем случайный цвет
    if (this.currentCard && this.currentCard.color === 'black') {
      const colors = ['red', 'blue', 'green', 'yellow']
      this.currentCard.selectedColor = colors[Math.floor(Math.random() * colors.length)]
      console.log('Выбран цвет для черной карты:', this.currentCard.selectedColor)
    }
  }

  private nextTurn(): void {
    const playerIds = this.players.map(player => player.id)
    this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + playerIds.length) % playerIds.length
  }

  public playCard(playerId: string, card: Card): void {
    if (!this.isCurrentPlayer(playerId)) {
      throw new Error('Не ваш ход')
    }

    const player = this.players.find(player => player.id === playerId)
    if (!player) return

    // Проверяем, может ли игрок сыграть эту карту
    if (!this.canPlayCard(card)) {
      throw new Error('Эту карту нельзя сыграть')
    }

    // Проверяем, есть ли такая карта у игрока
    const hasCard = player.cards.some(c => 
      c.color === card.color && c.value === card.value
    )
    if (!hasCard) {
      throw new Error('У вас нет такой карты')
    }

    // Удаляем карту из руки игрока
    player.cards = player.cards.filter(c => 
      !(c.color === card.color && c.value === card.value)
    )
    player.cardsCount = player.cards.length

    // Обновляем текущую карту
    this.currentCard = card

    // Применяем эффект карты
    this.applyCardEffect(card)

    // Проверяем победу
    if (player.cards.length === 0) {
      this.gameStarted = false
      return
    }

    // Если у игрока осталась одна карта и он не сказал УНО,
    // он уязвим для штрафа
    if (player.cards.length === 1 && !player.saidUno) {
      player.canBePenalized = true
    }

    // Переходим к следующему игроку только если следующая карта
    // имеет другое значение или это последняя карта
    const nextCard = player.cards.find(c => c.value === card.value)
    if (!nextCard) {
      this.nextTurn()
    }
  }

  private canPlayCard(card: Card): boolean {
    if (!this.currentCard) return true
    if (card.color === 'black') return true
    if (card.color === this.currentCard.color) return true
    if (card.value === this.currentCard.value) return true
    if (this.currentCard.selectedColor && card.color === this.currentCard.selectedColor) return true
    return false
  }

  private applyCardEffect(card: Card): void {
    switch (card.value) {
      case 'reverse':
        // В игре 1 на 1 реверс работает как скип
        if (this.players.length === 2) {
          this.nextTurn()
        } else {
          this.direction *= -1
        }
        break
      case 'skip':
        this.nextTurn()
        break
      case '+2':
        this.nextTurn()
        const nextPlayer = this.players.find(player => player.id === this.getCurrentPlayerId())
        if (nextPlayer) {
          nextPlayer.cards.push(...this.cards.splice(0, 2))
          nextPlayer.cardsCount = nextPlayer.cards.length
        }
        break
      case '+4':
        this.nextTurn()
        const player = this.players.find(player => player.id === this.getCurrentPlayerId())
        if (player) {
          player.cards.push(...this.cards.splice(0, 4))
          player.cardsCount = player.cards.length
        }
        break
    }
  }

  public drawCard(playerId: string): void {
    if (!this.isCurrentPlayer(playerId)) {
      throw new Error('Не ваш ход')
    }

    const player = this.players.find(player => player.id === playerId)
    if (!player) return

    // Берем карту из колоды
    const card = this.cards.pop()
    if (card) {
      player.cards.push(card)
      player.cardsCount = player.cards.length
    }

    // Переходим к следующему игроку
    this.nextTurn()
  }

  public sayUno(playerId: string): void {
    const player = this.players.find(player => player.id === playerId)
    if (!player) return

    if (player.cards.length <= 2) {
      player.saidUno = true
      player.canBePenalized = false
    } else {
      throw new Error('Можно говорить УНО только когда у вас осталась одна или две карты')
    }
  }

  public penalizeForUno(targetPlayerId: string): void {
    const targetPlayer = this.players.find(player => player.id === targetPlayerId)
    if (!targetPlayer) return

    if (targetPlayer.cards.length === 1 && targetPlayer.canBePenalized) {
      // Даем две карты как штраф
      targetPlayer.cards.push(...this.cards.splice(0, 2))
      targetPlayer.cardsCount = targetPlayer.cards.length
      targetPlayer.canBePenalized = false
      targetPlayer.saidUno = false
    }
  }

  public hasPlayers(): boolean {
    return this.players.length > 0
  }

  public hasBannedPlayer(playerId: string): boolean {
    return this.bannedPlayers.has(playerId)
  }

  public getPlayers(): Player[] {
    return this.players
  }
} 