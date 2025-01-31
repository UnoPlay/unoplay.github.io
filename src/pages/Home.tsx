import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  VStack,
  Text,
  useToast,
} from '@chakra-ui/react'

const Home = () => {
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  const createGame = () => {
    if (!playerName) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите ваше имя',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    const newRoomId = Math.random().toString(36).substring(2, 8)
    navigate(`/game/${newRoomId}?name=${encodeURIComponent(playerName)}`)
  }

  const joinGame = () => {
    if (!playerName || !roomId) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите ваше имя и код комнаты',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }
    navigate(`/game/${roomId}?name=${encodeURIComponent(playerName)}`)
  }

  return (
    <Container maxW="container.md" centerContent py={10}>
      <VStack spacing={8} width="100%">
        <Heading size="2xl" color="blue.500">
          UnoPlay
        </Heading>
        <Text fontSize="xl">Играйте в УНО онлайн с друзьями бесплатно!</Text>
        
        <Box width="100%" maxW="400px">
          <VStack spacing={4}>
            <Input
              placeholder="Ваше имя"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <Button
              colorScheme="green"
              width="100%"
              onClick={createGame}
            >
              Создать новую игру
            </Button>
            
            <Text>или</Text>
            
            <Input
              placeholder="Код комнаты"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <Button
              colorScheme="blue"
              width="100%"
              onClick={joinGame}
            >
              Присоединиться к игре
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  )
}

export default Home 