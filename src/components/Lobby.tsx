import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  Text,
  Button,
  HStack,
  Avatar,
  Badge,
  Heading,
  Flex,
  ScaleFade,
  SlideFade,
  useToast,
  Progress,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { Player } from '../types'
import { Socket } from 'socket.io-client'

const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(66, 153, 225, 0.6); }
  50% { box-shadow: 0 0 20px rgba(66, 153, 225, 0.8); }
  100% { box-shadow: 0 0 5px rgba(66, 153, 225, 0.6); }
`

interface LobbyProps {
  players: Player[]
  isHost: boolean
  onStartGame: () => void
  roomId: string
  socket: Socket | null
  maxPlayers?: number
}

const Lobby = ({ players, isHost, onStartGame, roomId, socket, maxPlayers = 4 }: LobbyProps) => {
  const [isStarting, setIsStarting] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [isPlayerMenuOpen, setIsPlayerMenuOpen] = useState(false)
  const [roomSettings, setRoomSettings] = useState({
    maxPlayers: maxPlayers,
    allowSpectators: false,
    isPrivate: false,
  })
  const toast = useToast()
  const { isOpen: isRulesOpen, onOpen: onRulesOpen, onClose: onRulesClose } = useDisclosure()

  useEffect(() => {
    console.log('Игроки в лобби:', players) // Для отладки
  }, [players])

  const startGameWithCountdown = () => {
    if (players.length < 2) {
      toast({
        title: 'Недостаточно игроков',
        description: 'Для начала игры нужно минимум 2 игрока',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsStarting(true)
    let count = 3
    setCountdown(count)

    const interval = setInterval(() => {
      count--
      setCountdown(count)
      
      if (count === 0) {
        clearInterval(interval)
        setTimeout(() => {
          onStartGame()
        }, 1000)
      }
    }, 1000)
  }

  const handlePlayerAction = (action: 'kick' | 'ban' | 'mute', playerId: string) => {
    if (!socket) return

    socket.emit('playerAction', { action, playerId })
    setSelectedPlayer(null)
    setIsPlayerMenuOpen(false)

    const actionMessages = {
      kick: 'Игрок исключен из комнаты',
      ban: 'Игрок заблокирован',
      mute: 'Игрок заглушен',
    }

    toast({
      title: 'Действие выполнено',
      description: actionMessages[action],
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleLeaveRoom = () => {
    if (!socket) return
    socket.emit('leaveRoom')
    window.location.href = '/'
  }

  const updateRoomSettings = (settings: Partial<typeof roomSettings>) => {
    if (!socket) return
    const newSettings = { ...roomSettings, ...settings }
    setRoomSettings(newSettings)
    socket.emit('updateRoomSettings', newSettings)
  }

  return (
    <Box
      minH="100vh"
      w="100%"
      bg="whiteAlpha.100"
      backdropFilter="blur(10px)"
      borderRadius="xl"
      p={8}
      position="relative"
      overflow="hidden"
      bgGradient="linear(to-b, purple.900, blue.900)"
    >
      {/* Декоративные элементы */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="radial(circle at 50% 0%, whiteAlpha.200 0%, transparent 70%)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        width="200%"
        height="200%"
        bgGradient="radial(circle at center, whiteAlpha.100 0%, transparent 50%)"
        pointerEvents="none"
      />

      <VStack spacing={8} position="relative" align="stretch" maxW="1200px" mx="auto">
        <ScaleFade in={true} initialScale={0.9}>
          <VStack spacing={6} align="center" mb={8}>
            <Heading 
              color="white" 
              size="2xl"
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Лобби
            </Heading>
            <Box
              bg="whiteAlpha.200"
              p={4}
              borderRadius="2xl"
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              boxShadow="lg"
            >
              <VStack spacing={4}>
                <HStack spacing={4}>
                  <Text color="whiteAlpha.900" fontSize="xl">
                    Код комнаты:
                  </Text>
                  <Text 
                    fontWeight="bold" 
                    color="blue.300" 
                    fontSize="2xl"
                    letterSpacing="wider"
                  >
                    {roomId}
                  </Text>
                </HStack>
                <Badge
                  colorScheme={players.length >= 2 ? "green" : "yellow"}
                  p={3}
                  borderRadius="xl"
                  fontSize="lg"
                  variant="solid"
                  boxShadow="lg"
                >
                  {players.length}/4 игроков в комнате
                </Badge>
              </VStack>
            </Box>

            {isHost && (
              <Box
                bg="whiteAlpha.200"
                p={4}
                borderRadius="xl"
                w="100%"
              >
                <VStack spacing={4}>
                  <Text color="white" fontSize="lg" fontWeight="bold">
                    Настройки комнаты
                  </Text>
                  <HStack spacing={4} w="100%">
                    <NumberInput
                      min={2}
                      max={10}
                      value={roomSettings.maxPlayers}
                      onChange={(_, value) => updateRoomSettings({ maxPlayers: value })}
                      color="white"
                    >
                      <NumberInputField placeholder="Макс. игроков" />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Switch
                      isChecked={roomSettings.allowSpectators}
                      onChange={(e) => updateRoomSettings({ allowSpectators: e.target.checked })}
                      colorScheme="blue"
                    >
                      Наблюдатели
                    </Switch>
                    <Switch
                      isChecked={roomSettings.isPrivate}
                      onChange={(e) => updateRoomSettings({ isPrivate: e.target.checked })}
                      colorScheme="red"
                    >
                      Приватная
                    </Switch>
                  </HStack>
                </VStack>
              </Box>
            )}
          </VStack>
        </ScaleFade>

        {isStarting && (
          <Box
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={10}
            textAlign="center"
            bgGradient="radial(circle at center, blackAlpha.600, transparent)"
            p={20}
            borderRadius="full"
          >
            <Text
              fontSize="9xl"
              fontWeight="extrabold"
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
              animation={`${floatAnimation} 0.5s ease-in-out`}
              textShadow="0 0 30px rgba(66, 153, 225, 0.8)"
            >
              {countdown}
            </Text>
          </Box>
        )}

        <Box
          opacity={isStarting ? 0.3 : 1}
          transition="opacity 0.3s"
          backdropFilter="blur(10px)"
          borderRadius="2xl"
          p={6}
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <VStack spacing={6} align="stretch">
            <Text
              color="white"
              fontSize="2xl"
              fontWeight="bold"
              bgGradient="linear(to-r, blue.400, purple.500)"
              bgClip="text"
              textAlign="center"
              mb={4}
            >
              Игроки в лобби
            </Text>

            {players.length === 0 ? (
              <Text
                color="whiteAlpha.700"
                fontSize="lg"
                textAlign="center"
                p={8}
              >
                Ожидание игроков...
              </Text>
            ) : (
              <VStack spacing={4} align="stretch">
                {players.map((player, index) => (
                  <SlideFade
                    key={player.id}
                    in={true}
                    offsetY={20}
                    delay={index * 0.1}
                  >
                    <Flex
                      bg="whiteAlpha.200"
                      p={6}
                      borderRadius="2xl"
                      align="center"
                      justify="space-between"
                      transition="all 0.3s"
                      border="1px solid"
                      borderColor="whiteAlpha.300"
                      _hover={{
                        transform: 'translateX(10px)',
                        bg: 'whiteAlpha.300',
                        boxShadow: 'xl',
                      }}
                      onClick={() => {
                        if (isHost && player.id !== socket?.id) {
                          setSelectedPlayer(player.id)
                          setIsPlayerMenuOpen(true)
                        }
                      }}
                      cursor={isHost && player.id !== socket?.id ? 'pointer' : 'default'}
                    >
                      <HStack spacing={6}>
                        <Avatar
                          name={player.name}
                          size="lg"
                          bg="blue.500"
                          css={{
                            animation: `${floatAnimation} 3s ease-in-out infinite`,
                            animationDelay: `${index * 0.5}s`,
                          }}
                          boxShadow="lg"
                        />
                        <VStack align="start" spacing={2}>
                          <Text 
                            color="white" 
                            fontSize="xl" 
                            fontWeight="bold"
                            bgGradient="linear(to-r, blue.400, purple.500)"
                            bgClip="text"
                          >
                            {player.name}
                          </Text>
                          <Badge 
                            colorScheme="green"
                            variant="subtle"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            🟢 В игре
                          </Badge>
                        </VStack>
                      </HStack>
                      <HStack spacing={3}>
                        {player.isHost && (
                          <Badge 
                            colorScheme="yellow" 
                            fontSize="md" 
                            p={2}
                            borderRadius="xl"
                            boxShadow="lg"
                          >
                            👑 Хост
                          </Badge>
                        )}
                        {player.isBot && (
                          <Badge 
                            colorScheme="purple" 
                            fontSize="md" 
                            p={2}
                            borderRadius="xl"
                            boxShadow="lg"
                          >
                            🤖 Бот
                          </Badge>
                        )}
                      </HStack>
                    </Flex>
                  </SlideFade>
                ))}
              </VStack>
            )}

            {isHost && (
              <VStack spacing={6} pt={6}>
                <Progress
                  value={players.length * 25}
                  max={100}
                  width="100%"
                  height="10px"
                  borderRadius="full"
                  colorScheme="blue"
                  bg="whiteAlpha.200"
                  hasStripe
                  isAnimated
                  boxShadow="lg"
                />
                <Button
                  colorScheme="blue"
                  size="lg"
                  width="100%"
                  height="70px"
                  fontSize="2xl"
                  onClick={startGameWithCountdown}
                  isDisabled={isStarting || players.length < 2}
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: '0 0 20px rgba(66, 153, 225, 0.6)',
                  }}
                  bgGradient="linear(to-r, blue.400, purple.500)"
                  css={{
                    animation: players.length >= 2 ? `${glowAnimation} 2s infinite` : 'none',
                  }}
                >
                  {isStarting ? '🎮 Игра начинается...' : '🎮 Начать игру'}
                </Button>
              </VStack>
            )}
          </VStack>
        </Box>

        <HStack justify="space-between" mt={4}>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={handleLeaveRoom}
          >
            Покинуть комнату
          </Button>
          <Button
            colorScheme="blue"
            onClick={onRulesOpen}
          >
            Правила игры
          </Button>
        </HStack>
      </VStack>

      {/* Меню действий с игроком */}
      <Modal
        isOpen={isPlayerMenuOpen}
        onClose={() => {
          setIsPlayerMenuOpen(false)
          setSelectedPlayer(null)
        }}
      >
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="rgba(0, 0, 0, 0.8)"
          border="1px solid"
          borderColor="whiteAlpha.300"
          borderRadius="xl"
        >
          <ModalHeader color="white">Действия с игроком</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <VStack spacing={4}>
              <Button
                w="100%"
                colorScheme="yellow"
                onClick={() => handlePlayerAction('kick', selectedPlayer!)}
              >
                Выгнать из комнаты
              </Button>
              <Button
                w="100%"
                colorScheme="red"
                onClick={() => handlePlayerAction('ban', selectedPlayer!)}
              >
                Заблокировать
              </Button>
              <Button
                w="100%"
                colorScheme="purple"
                onClick={() => handlePlayerAction('mute', selectedPlayer!)}
              >
                Заглушить в чате
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={isRulesOpen} onClose={onRulesClose} size="xl">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent
          bg="rgba(0, 0, 0, 0.8)"
          border="1px solid"
          borderColor="whiteAlpha.300"
          borderRadius="xl"
        >
          <ModalHeader color="white">Правила игры</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <VStack spacing={4} align="stretch" color="white">
              <Box>
                <Heading size="md" mb={2}>Цель игры</Heading>
                <Text>
                  Первым избавиться от всех карт на руках, набрав при этом наибольшее количество очков.
                </Text>
              </Box>

              <Box>
                <Heading size="md" mb={2}>Ход игры</Heading>
                <UnorderedList spacing={2}>
                  <ListItem>
                    Каждому игроку раздается по 7 карт.
                  </ListItem>
                  <ListItem>
                    Первая карта из колоды открывается и кладется в центр стола.
                  </ListItem>
                  <ListItem>
                    Игроки по очереди кладут карты, совпадающие по цвету или значению с картой на столе.
                  </ListItem>
                  <ListItem>
                    Если у игрока нет подходящей карты, он должен взять карту из колоды.
                  </ListItem>
                </UnorderedList>
              </Box>

              <Box>
                <Heading size="md" mb={2}>Специальные карты</Heading>
                <UnorderedList spacing={2}>
                  <ListItem>
                    <Text fontWeight="bold">+2</Text> - следующий игрок берет 2 карты и пропускает ход
                  </ListItem>
                  <ListItem>
                    <Text fontWeight="bold">Пропуск хода</Text> - следующий игрок пропускает свой ход
                  </ListItem>
                  <ListItem>
                    <Text fontWeight="bold">Смена направления</Text> - меняет направление игры
                  </ListItem>
                  <ListItem>
                    <Text fontWeight="bold">Смена цвета</Text> - позволяет изменить текущий цвет
                  </ListItem>
                  <ListItem>
                    <Text fontWeight="bold">+4</Text> - следующий игрок берет 4 карты, пропускает ход, и вы выбираете новый цвет
                  </ListItem>
                </UnorderedList>
              </Box>

              <Box>
                <Heading size="md" mb={2}>Важные правила</Heading>
                <UnorderedList spacing={2}>
                  <ListItem>
                    Когда у вас остается одна карта, вы должны сказать "УНО"!
                  </ListItem>
                  <ListItem>
                    Если вы забыли сказать "УНО" и другой игрок заметил это, вы должны взять 2 карты.
                  </ListItem>
                  <ListItem>
                    Игра заканчивается, когда один из игроков избавляется от всех карт.
                  </ListItem>
                </UnorderedList>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default Lobby 