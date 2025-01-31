import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB, { PlayerStats } from './db'
import { GameRoom } from './GameRoom'
import { ChatMessage, Player } from './types'

dotenv.config()

const app = express()
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  methods: ["GET", "POST"]
}))

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Подключаемся к MongoDB
connectDB()

const rooms = new Map<string, GameRoom>()

io.on('connection', (socket) => {
  console.log('Новое подключение:', socket.id)
  const { roomId, playerName, isHost } = socket.handshake.query

  if (!roomId || !playerName || typeof roomId !== 'string' || typeof playerName !== 'string') {
    console.error('Неверные параметры подключения:', { roomId, playerName, isHost })
    socket.emit('error', 'Неверные параметры подключения')
    socket.disconnect()
    return
  }

  let room = rooms.get(roomId)
  const playerLimit = parseInt(socket.handshake.query.playerLimit as string) || 4
  const isHostQuery = socket.handshake.query.isHost === 'true'

  if (!room) {
    console.log('Создание новой комнаты:', roomId)
    room = new GameRoom(roomId, playerLimit)
    rooms.set(roomId, room)
  }

  console.log('Подключение игрока:', {
    id: socket.id,
    name: playerName,
    isHost: isHostQuery,
    roomId
  })

  const player: Player = {
    id: socket.id,
    name: playerName as string,
    isHost: isHostQuery || (!room.hasPlayers() && !room.hasBannedPlayer(socket.id)),
    cards: [],
    score: 0,
    isBot: false,
    status: 'online',
    joinedAt: Date.now(),
    cardsCount: 0,
    saidUno: false,
    canBePenalized: false
  }

  if (!room.addPlayer(player)) {
    console.log('Комната заполнена или вы заблокированы')
    socket.emit('error', 'Комната заполнена или вы заблокированы')
    socket.disconnect()
    return
  }

  socket.join(roomId)
  
  // Отправляем состояние игры всем игрокам в комнате
  const gameState = room.getStateForPlayer(socket.id)
  console.log('Отправка состояния игры игроку:', socket.id)
  socket.emit('gameState', gameState)
  
  // Отправляем обновленное состояние всем остальным игрокам
  socket.to(roomId).emit('gameState', room.getState())
  io.to(roomId).emit('playerJoined', player)

  socket.on('startGame', () => {
    console.log('Получен запрос на начало игры от:', socket.id)
    if (room && room.isHost(socket.id)) {
      try {
        console.log('Начинаем игру в комнате:', roomId)
        room.startGame()
        // Отправляем каждому игроку его собственное состояние
        room.getPlayers().forEach(player => {
          const playerState = room.getStateForPlayer(player.id)
          console.log(`Отправка состояния игроку ${player.name}:`, {
            cardsCount: playerState.players.find(p => p.id === player.id)?.cards.length
          })
          io.to(player.id).emit('gameState', playerState)
        })
        console.log('Игра успешно начата')
      } catch (error) {
        console.error('Ошибка при начале игры:', error)
        socket.emit('error', (error as Error).message)
      }
    } else {
      console.log('Отказано в начале игры. isHost:', room?.isHost(socket.id))
      socket.emit('error', 'Только хост может начать игру')
    }
  })

  socket.on('playCard', (card) => {
    console.log('Попытка сыграть карту:', { playerId: socket.id, card })
    if (room && room.isCurrentPlayer(socket.id)) {
      try {
        room.playCard(socket.id, card)
        
        // Проверяем, закончилась ли игра
        if (!room.isGameStarted()) {
          const winner = room.getPlayers().find(p => p.cards.length === 0)
          if (winner) {
            io.to(roomId).emit('gameOver', { winnerId: winner.id, winnerName: winner.name })
          }
        }
        
        // Отправляем каждому игроку его собственное состояние
        room.getPlayers().forEach(player => {
          io.to(player.id).emit('gameState', room.getStateForPlayer(player.id))
        })
      } catch (error) {
        socket.emit('error', (error as Error).message)
      }
    }
  })

  socket.on('drawCard', () => {
    console.log('Попытка взять карту:', socket.id)
    if (room && room.isCurrentPlayer(socket.id)) {
      try {
        room.drawCard(socket.id)
        // Отправляем каждому игроку его собственное состояние
        room.getPlayers().forEach(player => {
          io.to(player.id).emit('gameState', room.getStateForPlayer(player.id))
        })
      } catch (error) {
        socket.emit('error', (error as Error).message)
      }
    }
  })

  socket.on('sayUno', () => {
    console.log('Игрок говорит УНО:', socket.id)
    if (room) {
      try {
        room.sayUno(socket.id)
        io.to(roomId).emit('unoSaid', { playerId: socket.id })
        // Отправляем обновленное состояние всем игрокам
        room.getPlayers().forEach(player => {
          io.to(player.id).emit('gameState', room.getStateForPlayer(player.id))
        })
      } catch (error) {
        socket.emit('error', (error as Error).message)
      }
    }
  })

  socket.on('penalizeUno', (targetPlayerId: string) => {
    console.log('Попытка оштрафовать игрока за не сказанное УНО:', targetPlayerId)
    if (room) {
      try {
        room.penalizeForUno(targetPlayerId)
        io.to(roomId).emit('unoPenalized', { targetPlayerId })
        // Отправляем обновленное состояние всем игрокам
        room.getPlayers().forEach(player => {
          io.to(player.id).emit('gameState', room.getStateForPlayer(player.id))
        })
      } catch (error) {
        socket.emit('error', (error as Error).message)
      }
    }
  })

  socket.on('chatMessage', (message: ChatMessage) => {
    console.log('Новое сообщение в чате:', message)
    if (room) {
      io.to(roomId).emit('chatMessage', {
        ...message,
        sender: playerName
      })
    }
  })

  socket.on('playerAction', ({ action, playerId }) => {
    console.log('Действие с игроком:', { action, playerId })
    if (room && room.isHost(socket.id)) {
      try {
        switch (action) {
          case 'kick':
            room.removePlayer(playerId)
            io.to(roomId).emit('gameState', room.getState())
            io.to(playerId).emit('kicked')
            break
          case 'ban':
            room.banPlayer(playerId)
            io.to(roomId).emit('gameState', room.getState())
            io.to(playerId).emit('banned')
            break
          case 'mute':
            room.mutePlayer(playerId)
            io.to(roomId).emit('gameState', room.getState())
            io.to(playerId).emit('muted')
            break
        }
      } catch (error) {
        socket.emit('error', (error as Error).message)
      }
    }
  })

  socket.on('updateRoomSettings', (settings) => {
    console.log('Обновление настроек комнаты:', settings)
    if (room && room.isHost(socket.id)) {
      try {
        room.updateSettings(settings)
        io.to(roomId).emit('gameState', room.getState())
      } catch (error) {
        socket.emit('error', (error as Error).message)
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('Отключение игрока:', socket.id)
    if (room) {
      room.removePlayer(socket.id)
      if (room.isEmpty()) {
        console.log('Удаление пустой комнаты:', roomId)
        rooms.delete(roomId)
      } else {
        io.to(roomId).emit('playerLeft', socket.id)
        io.to(roomId).emit('gameState', room.getState())
      }
    }
  })

  socket.on('gameOver', async ({ winnerId, winnerName }) => {
    try {
      // Обновляем статистику победителя
      await PlayerStats.findOneAndUpdate(
        { playerId: winnerId },
        {
          $inc: { gamesPlayed: 1, gamesWon: 1 },
          $set: { lastPlayed: new Date() }
        },
        { upsert: true }
      )

      // Обновляем статистику остальных игроков
      const otherPlayers = room?.getPlayers().filter(p => p.id !== winnerId) || []
      for (const player of otherPlayers) {
        await PlayerStats.findOneAndUpdate(
          { playerId: player.id },
          {
            $inc: { gamesPlayed: 1 },
            $set: { lastPlayed: new Date() }
          },
          { upsert: true }
        )
      }
    } catch (error) {
      console.error('Ошибка при обновлении статистики:', error)
    }
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`)
}) 