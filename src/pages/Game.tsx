import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import {
  Box,
  Container,
  Grid,
  HStack,
  VStack,
  Text,
  Button,
  useToast,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
} from '@chakra-ui/react'
import { Card as CardComponent } from '../components/Card'
import { ColorPicker } from '../components/ColorPicker'
import { Card as CardType, Player } from '../types'

const Game = () => {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const playerName = searchParams.get('name')
  const navigate = useNavigate()
  const toast = useToast()

  const [socket, setSocket] = useState<Socket | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [cards, setCards] = useState<CardType[]>([])
  const [currentCard, setCurrentCard] = useState<CardType | null>(null)
  const [currentPlayer, setCurrentPlayer] = useState<string>('')
  const [gameStarted, setGameStarted] = useState(false)
  const [isHost, setIsHost] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [gameDirection, setGameDirection] = useState<1 | -1>(1)
  const [lastAction, setLastAction] = useState<string>('')

  useEffect(() => {
    if (!playerName) {
      navigate('/')
      return
    }

    const newSocket = io('https://your-backend-url.onrender.com', {
      query: { roomId, playerName },
    })

    setSocket(newSocket)

    newSocket.on('gameState', (state: any) => {
      setPlayers(state.players)
      setCards(state.cards)
      setCurrentCard(state.currentCard)
      setCurrentPlayer(state.currentPlayer)
      setGameStarted(state.gameStarted)
      setIsHost(state.isHost)
      setGameDirection(state.direction)
      setLastAction(state.lastAction || '')
    })

    newSocket.on('error', (error: string) => {
      toast({
        title: 'Ошибка',
        description: error,
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    })

    return () => {
      newSocket.disconnect()
    }
  }, [roomId, playerName])

  const addBot = () => {
    if (socket) {
      socket.emit('addBot')
    }
  }

  const removeBot = (botId: string) => {
    if (socket) {
      socket.emit('removeBot', botId)
    }
  }

  const playCard = (card: CardType) => {
    if (socket) {
      if (card.color === 'black') {
        setSelectedCard(card)
        setIsColorPickerOpen(true)
      } else {
        socket.emit('playCard', card)
      }
    }
  }

  const handleColorSelect = (color: string) => {
    if (socket && selectedCard) {
      socket.emit('playCard', { ...selectedCard, selectedColor: color })
      setSelectedCard(null)
    }
  }

  const drawCard = () => {
    if (socket) {
      socket.emit('drawCard')
    }
  }

  const startGame = () => {
    if (socket && players.length >= 2) {
      socket.emit('startGame')
    } else {
      toast({
        title: 'Недостаточно игроков',
        description: 'Для начала игры нужно минимум 2 игрока',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const isCurrentPlayer = currentPlayer === socket?.id

  return (
    <Container maxW="container.xl" py={5}>
      <VStack spacing={8}>
        <HStack justify="space-between" width="100%">
          <VStack align="flex-start" spacing={2}>
            <Text fontSize="2xl">Комната: {roomId}</Text>
            <Badge colorScheme={gameDirection === 1 ? 'green' : 'red'}>
              {gameDirection === 1 ? '⟳ По часовой' : '⟲ Против часовой'}
            </Badge>
          </VStack>
          
          <HStack>
            {!gameStarted && isHost && (
              <>
                <Button
                  colorScheme="purple"
                  onClick={addBot}
                  isDisabled={players.length >= 4}
                >
                  Добавить бота
                </Button>
                <Button
                  colorScheme="green"
                  onClick={startGame}
                  isDisabled={players.length < 2}
                >
                  Начать игру
                </Button>
              </>
            )}
          </HStack>
        </HStack>

        {lastAction && (
          <Text fontSize="lg" color="gray.600">
            {lastAction}
          </Text>
        )}

        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} width="100%">
          {players.map((player) => (
            <Box
              key={player.id}
              p={4}
              borderWidth={2}
              borderRadius="lg"
              bg={currentPlayer === player.id ? 'green.100' : 'white'}
              borderColor={currentPlayer === player.id ? 'green.500' : 'gray.200'}
              position="relative"
            >
              <HStack justify="space-between">
                <VStack align="flex-start" spacing={1}>
                  <Text fontWeight="bold">
                    {player.name} {player.isBot && '🤖'}
                  </Text>
                  <Text>Карт: {player.cardsCount}</Text>
                </VStack>
                {isHost && player.isBot && !gameStarted && (
                  <IconButton
                    aria-label="Удалить бота"
                    icon={<Text>✕</Text>}
                    size="sm"
                    onClick={() => removeBot(player.id)}
                  />
                )}
              </HStack>
            </Box>
          ))}
        </Grid>

        {gameStarted && (
          <VStack spacing={6} width="100%">
            {currentCard && (
              <Box
                p={6}
                borderWidth={2}
                borderRadius="xl"
                bg="gray.50"
                boxShadow="md"
              >
                <VStack spacing={2}>
                  <Text fontSize="lg" fontWeight="semibold">Текущая карта:</Text>
                  <CardComponent card={currentCard} isPlayable={false} />
                </VStack>
              </Box>
            )}

            <Button
              colorScheme="blue"
              onClick={drawCard}
              isDisabled={!isCurrentPlayer}
              size="lg"
            >
              Взять карту
            </Button>

            <Box width="100%" overflowX="auto" p={4}>
              <HStack spacing={4} wrap="nowrap">
                {cards.map((card, index) => (
                  <CardComponent
                    key={index}
                    card={card}
                    onClick={() => playCard(card)}
                    isPlayable={isCurrentPlayer}
                  />
                ))}
              </HStack>
            </Box>
          </VStack>
        )}
      </VStack>

      <ColorPicker
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        onColorSelect={handleColorSelect}
      />
    </Container>
  )
}

export default Game 