import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || '')
    console.log(`MongoDB подключена: ${conn.connection.host}`)
  } catch (error) {
    console.error('Ошибка подключения к MongoDB:', error)
    process.exit(1)
  }
}

// Схема для сохранения статистики игроков
const PlayerStatsSchema = new mongoose.Schema({
  playerId: String,
  playerName: String,
  gamesPlayed: Number,
  gamesWon: Number,
  totalScore: Number,
  lastPlayed: Date
})

export const PlayerStats = mongoose.model('PlayerStats', PlayerStatsSchema)

export default connectDB 