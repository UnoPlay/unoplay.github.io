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
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  useDisclosure,
  Flex,
  Heading,
  Slide,
  Fade,
  Input,
  Progress,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import Card from '../components/Card'
import ColorPicker from '../components/ColorPicker'
import Chat from '../components/Chat'
import Rules from '../components/Rules'
import Lobby from '../components/Lobby'
import { Card as CardType, Player } from '../types'
import { keyframes } from '@emotion/react'

const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`

const Game = () => {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const playerName = searchParams.get('name')
  const navigate = useNavigate()
  const toast = useToast()
  const { isOpen: isRulesOpen, onOpen: onRulesOpen, onClose: onRulesClose } = useDisclosure()
  const { isOpen: isChatOpen, onToggle: onChatToggle } = useDisclosure()

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
  const [canSayUno, setCanSayUno] = useState(false)
  const [name, setName] = useState<string>('')
  const [isNameModalOpen, setIsNameModalOpen] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [selectedCards, setSelectedCards] = useState<CardType[]>([])

  useEffect(() => {
    const storedName = localStorage.getItem('playerName')
    if (storedName) {
      setName(storedName)
      setIsNameModalOpen(false)
    }
  }, [])

  useEffect(() => {
    if (!roomId) {
      navigate('/')
      return
    }

    if (!name || isNameModalOpen) return

    setIsConnecting(true)
    setConnectionError(null)

    try {
      const newSocket = io('http://localhost:3001', {
        query: { 
          roomId, 
          playerName: name,
          isHost: localStorage.getItem(`host_${roomId}`) === 'true'
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })

      newSocket.on('connect', () => {
        console.log('Подключено к серверу')
        setIsConnecting(false)
        setConnectionError(null)
        toast({
          title: 'Подключено',
          description: 'Успешное подключение к серверу',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      })

      newSocket.on('connect_error', (error) => {
        console.error('Ошибка подключения:', error)
        setIsConnecting(false)
        setConnectionError('Не удалось подключиться к серверу. Убедитесь, что сервер запущен.')
        toast({
          title: 'Ошибка подключения',
          description: 'Не удалось подключиться к серверу. Убедитесь, что сервер запущен.',
          status: 'error',
          duration: null,
          isClosable: true,
        })
      })

      setSocket(newSocket)

      newSocket.on('gameState', (state: any) => {
        console.log('Получено состояние игры:', state)
        console.log('isHost до обновления:', isHost)
        setPlayers(state.players || [])
        
        // Находим текущего игрока и его карты
        const currentPlayer = state.players?.find((p: Player) => p.id === newSocket.id)
        console.log('Текущий игрок:', currentPlayer)
        console.log('ID сокета:', newSocket.id)
        console.log('Карты игрока:', currentPlayer?.cards)
        
        setCards(currentPlayer?.cards || [])
        console.log('Установленные карты:', currentPlayer?.cards || [])
        
        setCurrentCard(state.currentCard)
        setCurrentPlayer(state.currentPlayer)
        setGameStarted(state.gameStarted)
        
        // Проверяем, является ли текущий игрок хостом
        const isCurrentPlayerHost = currentPlayer?.isHost || false
        setIsHost(isCurrentPlayerHost)
        
        console.log('isHost после обновления:', isCurrentPlayerHost)
        setGameDirection(state.direction)
        setLastAction(state.lastAction || '')
        setCanSayUno(currentPlayer?.cards?.length === 2)
      })

      newSocket.on('playerJoined', (player: Player) => {
        setPlayers(currentPlayers => {
          const playerExists = currentPlayers.some(p => p.id === player.id)
          if (!playerExists) {
            return [...currentPlayers, player]
          }
          return currentPlayers
        })
        setLastAction(`Игрок ${player.name} присоединился к игре`)
      })

      newSocket.on('playerLeft', (playerId: string) => {
        setPlayers(currentPlayers => {
          const player = currentPlayers.find(p => p.id === playerId)
          const newPlayers = currentPlayers.filter(p => p.id !== playerId)
          if (player) {
            setLastAction(`Игрок ${player.name} покинул игру`)
            
            // Если игрок был хостом, передаем хоста следующему игроку
            if (player.isHost && newPlayers.length > 0) {
              const newHost = newPlayers[0]
              if (newHost.id === socket?.id) {
                setIsHost(true)
                localStorage.setItem(`host_${roomId}`, 'true')
                socket.emit('transferHost', { newHostId: newHost.id })
              }
            }
          }
          return newPlayers
        })
      })

      newSocket.on('hostTransferred', (newHostId: string) => {
        setPlayers(currentPlayers =>
          currentPlayers.map(player => ({
            ...player,
            isHost: player.id === newHostId
          }))
        )
        if (newHostId === socket?.id) {
          setIsHost(true)
          localStorage.setItem(`host_${roomId}`, 'true')
        }
      })

      newSocket.on('nameTaken', () => {
        toast({
          title: 'Ошибка',
          description: 'Это имя уже занято в комнате',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        setIsNameModalOpen(true)
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

      newSocket.on('gameOver', ({ winnerId, winnerName }) => {
        toast({
          title: winnerId === socket?.id ? 'Поздравляем!' : 'Игра окончена',
          description: winnerId === socket?.id 
            ? 'Вы победили!' 
            : `Игрок ${winnerName} победил!`,
          status: winnerId === socket?.id ? 'success' : 'info',
          duration: null,
          isClosable: true,
        })
        setGameStarted(false)
      })

      newSocket.on('unoSaid', ({ playerId }) => {
        const playerName = players.find(p => p.id === playerId)?.name
        toast({
          title: 'УНО!',
          description: `Игрок ${playerName} сказал УНО!`,
          status: 'warning',
          duration: 2000,
          isClosable: true,
        })
      })

      newSocket.on('unoPenalized', ({ targetPlayerId }) => {
        const playerName = players.find(p => p.id === targetPlayerId)?.name
        toast({
          title: 'Штраф за УНО!',
          description: `Игрок ${playerName} получает +2 карты за не сказанное УНО`,
          status: 'error',
          duration: 2000,
          isClosable: true,
        })
      })

      window.addEventListener('beforeunload', () => {
        newSocket.disconnect()
      })

      return () => {
        newSocket.disconnect()
      }
    } catch (error) {
      console.error('Ошибка при создании сокета:', error)
      setIsConnecting(false)
      setConnectionError('Произошла ошибка при подключении к серверу')
    }
  }, [roomId, name, isNameModalOpen, navigate, toast])

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
      setIsColorPickerOpen(false)
    }
  }

  const drawCard = () => {
    if (socket) {
      socket.emit('drawCard')
    }
  }

  const sayUno = () => {
    if (socket) {
      socket.emit('sayUno')
      toast({
        title: 'УНО!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
  }

  const handleStartGame = () => {
    if (socket && players.length >= 2) {
      console.log('Отправляю запрос на начало игры')
      socket.emit('startGame')
      toast({
        title: 'Начинаем игру',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } else {
      toast({
        title: 'Ошибка',
        description: 'Недостаточно игроков для начала игры',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const penalizeUno = (playerId: string) => {
    if (socket) {
      socket.emit('penalizeUno', playerId)
    }
  }

  const isCurrentPlayer = currentPlayer === socket?.id

  const canPlaySelectedCards = () => {
    if (selectedCards.length === 0) return false
    
    // Проверяем, все ли выбранные карты одинакового значения
    const firstValue = selectedCards[0].value
    const allSameValue = selectedCards.every(card => card.value === firstValue)

    // Проверяем, можно ли сыграть хотя бы одну карту
    const canPlayAny = selectedCards.some(card => {
      if (!currentCard) return true
      if (card.color === 'black') return true
      if (card.color === currentCard.color) return true
      if (card.value === currentCard.value) return true
      if (currentCard.selectedColor && card.color === currentCard.selectedColor) return true
      return false
    })

    return allSameValue && canPlayAny
  }

  const toggleCardSelection = (card: CardType) => {
    if (!isCurrentPlayer) return

    setSelectedCards(prev => {
      // Если карта уже выбрана, убираем её
      if (prev.some(c => c.color === card.color && c.value === card.value)) {
        return prev.filter(c => !(c.color === card.color && c.value === card.value))
      }
      
      // Если выбираем новую карту
      const newSelection = [...prev, card]
      
      // Проверяем, что все карты имеют одинаковое значение
      const firstValue = newSelection[0].value
      if (newSelection.every(c => c.value === firstValue)) {
        return newSelection
      }
      
      return prev
    })
  }

  const playSelectedCards = () => {
    if (!socket || !canPlaySelectedCards()) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя сыграть эти карты',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    // Находим карту, которую можно сыграть первой
    const playableCard = selectedCards.find(card => {
      if (!currentCard) return true
      if (card.color === 'black') return true
      if (card.color === currentCard.color) return true
      if (card.value === currentCard.value) return true
      if (currentCard.selectedColor && card.color === currentCard.selectedColor) return true
      return false
    })

    if (playableCard) {
      // Сначала играем карту, которая подходит
      if (playableCard.color === 'black') {
        setSelectedCard(playableCard)
        setIsColorPickerOpen(true)
      } else {
        socket.emit('playCard', playableCard)
      }

      // Затем играем остальные карты того же значения
      selectedCards
        .filter(card => card !== playableCard)
        .forEach(card => {
          socket.emit('playCard', card)
        })
    }
    
    setSelectedCards([])
  }

  return (
    <Box
      w="100vw"
      h="100vh"
      bgGradient="linear(to-b, gray.900, purple.900)"
      position="fixed"
      top="0"
      left="0"
      overflow="hidden"
    >
      {isConnecting ? (
        <VStack justify="center" h="100vh" spacing={4}>
          <Text color="white" fontSize="xl">Подключение к серверу...</Text>
          <Progress size="xs" isIndeterminate w="200px" colorScheme="blue" />
        </VStack>
      ) : connectionError ? (
        <VStack justify="center" h="100vh" spacing={4}>
          <Text color="red.400" fontSize="xl">{connectionError}</Text>
          <Button 
            colorScheme="blue" 
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </Button>
        </VStack>
      ) : isNameModalOpen ? (
        <VStack
          position="fixed"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          bg="rgba(0, 0, 0, 0.8)"
          p={8}
          borderRadius="xl"
          spacing={4}
          boxShadow="xl"
          border="1px solid"
          borderColor="whiteAlpha.300"
          zIndex={1000}
        >
          <Heading color="white" size="lg">
            Введите ваше имя
          </Heading>
          <Input
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/\s+/g, ''))}
            bg="whiteAlpha.200"
            color="white"
            _placeholder={{ color: "whiteAlpha.500" }}
          />
          <Button
            colorScheme="blue"
            onClick={() => {
              if (name.trim().length >= 2 && name.trim().length <= 15) {
                localStorage.setItem('playerName', name)
                setIsNameModalOpen(false)
              } else {
                toast({
                  title: 'Ошибка',
                  description: 'Имя должно быть от 2 до 15 символов',
                  status: 'error',
                  duration: 3000,
                  isClosable: true,
                })
              }
            }}
          >
            Продолжить
          </Button>
        </VStack>
      ) : (
        <>
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bgGradient="radial(circle at 50% 0%, whiteAlpha.200 0%, transparent 70%)"
            pointerEvents="none"
          />

          {/* Меню-гамбургер */}
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<HamburgerIcon />}
              position="fixed"
              top={4}
              right={4}
              colorScheme="whiteAlpha"
              variant="solid"
              size="lg"
              zIndex={1000}
            />
            <MenuList bg="rgba(0, 0, 0, 0.8)" borderColor="whiteAlpha.200">
              <MenuItem
                onClick={onRulesOpen}
                bg="transparent"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                Правила игры
              </MenuItem>
              <MenuItem
                onClick={() => {
                  socket?.disconnect()
                  navigate('/')
                }}
                bg="transparent"
                color="red.300"
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                Покинуть комнату
              </MenuItem>
            </MenuList>
          </Menu>

          <Grid
            templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
            gap={6}
            h="100vh"
            p={4}
          >
            <Box
              bg="rgba(0, 0, 0, 0.3)"
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              p={6}
              border="1px solid"
              borderColor="whiteAlpha.300"
              height="100%"
              overflow="auto"
              boxShadow="xl"
            >
              {!gameStarted ? (
                <VStack spacing={6} align="stretch">
                  <Heading 
                    color="white" 
                    size="lg"
                    bgGradient="linear(to-r, blue.400, purple.500)"
                    bgClip="text"
                  >
                    Лобби
                  </Heading>
                  <Box
                    bg="whiteAlpha.100"
                    p={4}
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Text color="white" fontSize="xl" mb={2}>
                      Код комнаты: <Text as="span" fontWeight="bold" color="blue.300">{roomId}</Text>
                    </Text>
                    <Text color="white" fontSize="lg">
                      {players.length} / {searchParams.get('playerLimit') || '4'} игроков в комнате
                    </Text>
                    <Text color="white" fontSize="sm" mt={2}>
                      Вы {isHost ? 'хост' : 'игрок'} | ID: {socket?.id}
                    </Text>
                  </Box>
                  <Box>
                    {players.map((player) => (
                      <HStack
                        key={player.id}
                        bg="whiteAlpha.200"
                        p={4}
                        borderRadius="xl"
                        justify="space-between"
                        mb={2}
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-2px)', bg: 'whiteAlpha.300' }}
                      >
                        <Text color="white" fontSize="lg">
                          {player.name} {player.id === socket?.id ? '(Вы)' : ''}
                        </Text>
                        {player.isHost && (
                          <Badge 
                            colorScheme="yellow" 
                            p={2} 
                            fontSize="md"
                            variant="solid"
                          >
                            👑 Хост
                          </Badge>
                        )}
                      </HStack>
                    ))}
                  </Box>
                  {isHost && players.length >= 2 ? (
                    <Button
                      colorScheme="green"
                      onClick={handleStartGame}
                      size="lg"
                      w="100%"
                      mt={4}
                      height="60px"
                      fontSize="xl"
                      bgGradient="linear(to-r, green.400, teal.500)"
                      _hover={{
                        bgGradient: "linear(to-r, green.500, teal.600)",
                        transform: "translateY(-2px)",
                        boxShadow: "xl",
                      }}
                      leftIcon={<Text fontSize="2xl">🎮</Text>}
                    >
                      Начать игру
                    </Button>
                  ) : isHost ? (
                    <Text color="white" textAlign="center" mt={4}>
                      Ожидаем ещё игроков для начала игры...
                    </Text>
                  ) : (
                    <Text color="white" textAlign="center" mt={4}>
                      Ожидаем, пока хост начнёт игру...
                    </Text>
                  )}
                </VStack>
              ) : (
                <VStack spacing={8} height="100%" overflow="auto">
                  <HStack justify="space-between" width="100%">
                    <VStack align="flex-start" spacing={2}>
                      <Heading color="white" size="lg">
                        Комната: {roomId}
                      </Heading>
                      <Badge
                        colorScheme={gameDirection === 1 ? "green" : "red"}
                        p={2}
                        borderRadius="md"
                        fontSize="md"
                      >
                        {gameDirection === 1 ? '⟳ По часовой' : '⟲ Против часовой'}
                      </Badge>
                    </VStack>
                  </HStack>

                  {lastAction && (
                    <Text
                      fontSize="lg"
                      color="white"
                      p={3}
                      bg="whiteAlpha.200"
                      borderRadius="lg"
                      width="100%"
                      textAlign="center"
                    >
                      {lastAction}
                    </Text>
                  )}

                  <Grid
                    templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                    gap={4}
                    width="100%"
                  >
                    {players.map((player) => (
                      <Box
                        key={player.id}
                        p={4}
                        borderWidth={2}
                        borderRadius="xl"
                        bg={currentPlayer === player.id ? 'green.400' : 'whiteAlpha.200'}
                        borderColor={currentPlayer === player.id ? 'green.200' : 'whiteAlpha.300'}
                        position="relative"
                        backdropFilter="blur(10px)"
                        transition="all 0.3s"
                        _hover={{ transform: 'translateY(-2px)' }}
                      >
                        <HStack justify="space-between">
                          <VStack align="flex-start" spacing={1}>
                            <Text
                              fontWeight="bold"
                              color={currentPlayer === player.id ? 'white' : 'whiteAlpha.900'}
                              fontSize="lg"
                            >
                              {player.name} {player.isBot && '🤖'}
                            </Text>
                            <Text color={currentPlayer === player.id ? 'white' : 'whiteAlpha.700'}>
                              Карт: {player.cardsCount}
                            </Text>
                            {player.score && (
                              <Badge colorScheme="yellow">
                                Очки: {player.score}
                              </Badge>
                            )}
                          </VStack>
                          {player.cardsCount === 1 && player.id !== socket?.id && (
                            <Button
                              size="sm"
                              colorScheme="red"
                              onClick={() => penalizeUno(player.id)}
                            >
                              Не сказал УНО!
                            </Button>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </Grid>

                  {currentCard && (
                    <Box
                      p={6}
                      borderWidth={2}
                      borderRadius="xl"
                      bg="whiteAlpha.100"
                      boxShadow="xl"
                      backdropFilter="blur(10px)"
                      position="relative"
                      overflow="hidden"
                    >
                      <VStack spacing={3}>
                        <Text fontSize="lg" fontWeight="semibold" color="white">
                          Текущая карта:
                        </Text>
                        <Card card={currentCard} isPlayable={false} isHighlighted={true} />
                      </VStack>
                    </Box>
                  )}

                  <HStack spacing={4}>
                    <Button
                      colorScheme="blue"
                      onClick={drawCard}
                      isDisabled={!isCurrentPlayer}
                      size="lg"
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'xl',
                      }}
                    >
                      Взять карту
                    </Button>
                    {canSayUno && (
                      <Button
                        colorScheme="red"
                        onClick={sayUno}
                        size="lg"
                        animation={`${pulseAnimation} 1s infinite`}
                      >
                        УНО!
                      </Button>
                    )}
                  </HStack>

                  <Box width="100%" overflowX="auto" p={4}>
                    <HStack spacing={4} wrap="nowrap">
                      {cards.map((card, index) => (
                        <Box
                          key={index}
                          transform={selectedCards.some(
                            c => c.color === card.color && c.value === card.value
                          ) ? 'translateY(-20px)' : 'none'}
                          transition="transform 0.2s"
                          cursor={isCurrentPlayer ? 'pointer' : 'default'}
                        >
                          <Card
                            card={card}
                            onClick={() => isCurrentPlayer && toggleCardSelection(card)}
                            isPlayable={isCurrentPlayer}
                            isHighlighted={isCurrentPlayer && selectedCards.some(
                              c => c.color === card.color && c.value === card.value
                            )}
                          />
                        </Box>
                      ))}
                    </HStack>
                    {selectedCards.length > 0 && (
                      <Button
                        colorScheme="green"
                        size="lg"
                        mt={4}
                        onClick={playSelectedCards}
                        isDisabled={!canPlaySelectedCards()}
                      >
                        Сбросить выбранные карты ({selectedCards.length})
                      </Button>
                    )}
                  </Box>
                </VStack>
              )}
            </Box>
            
            {/* Чат */}
            <Box
              display={{ base: isChatOpen ? 'block' : 'none', lg: 'block' }}
              bg="rgba(0, 0, 0, 0.3)"
              backdropFilter="blur(10px)"
              borderRadius="2xl"
              p={6}
              border="1px solid"
              borderColor="whiteAlpha.300"
              height="calc(100vh - 2rem)"
              position="relative"
              boxShadow="xl"
            >
              <VStack h="100%" spacing={4}>
                <Heading 
                  color="white" 
                  size="lg"
                  bgGradient="linear(to-r, blue.400, purple.500)"
                  bgClip="text"
                >
                  Чат комнаты
                </Heading>
                <Box flex="1" w="100%" overflow="hidden">
                  <Chat socket={socket} playerName={name} />
                </Box>
              </VStack>
            </Box>
          </Grid>

          <Rules isOpen={isRulesOpen} onClose={onRulesClose} />
          <ColorPicker
            isOpen={isColorPickerOpen}
            onClose={() => setIsColorPickerOpen(false)}
            onColorSelect={handleColorSelect}
          />
        </>
      )}
    </Box>
  )
}

export default Game 