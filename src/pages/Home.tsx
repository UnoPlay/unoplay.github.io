import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  VStack,
  Input,
  Button,
  Text,
  Heading,
  Container,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
} from '@chakra-ui/react'

const Home = () => {
  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [playerLimit, setPlayerLimit] = useState(4)
  const navigate = useNavigate()
  const toast = useToast()

  const validateName = (name: string) => {
    if (name.includes(' ')) {
      toast({
        title: 'Ошибка',
        description: 'Имя не должно содержать пробелы',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    }
    if (name.length < 2 || name.length > 15) {
      toast({
        title: 'Ошибка',
        description: 'Имя должно быть от 2 до 15 символов',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return false
    }
    return true
  }

  const createGame = () => {
    if (!name.trim() || !validateName(name)) return
    const newRoomId = Math.random().toString(36).substring(2, 8)
    navigate(`/game/${newRoomId}?playerLimit=${playerLimit}`)
    localStorage.setItem('playerName', name)
    localStorage.setItem(`host_${newRoomId}`, 'true')
  }

  const joinGame = () => {
    if (!name.trim() || !validateName(name) || !roomId.trim()) return
    navigate(`/game/${roomId}`)
    localStorage.setItem('playerName', name)
  }

  return (
    <Box
      w="100vw"
      h="100vh"
      bgGradient="linear(to-b, blue.500, purple.600)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      position="fixed"
      top="0"
      left="0"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="radial(circle at 50% 0%, whiteAlpha.200 0%, transparent 70%)"
        pointerEvents="none"
      />

      <Container maxW="container.sm" position="relative" zIndex={1}>
        <VStack
          spacing={8}
          bg="rgba(0, 0, 0, 0.3)"
          backdropFilter="blur(10px)"
          p={8}
          borderRadius="2xl"
          border="1px solid"
          borderColor="whiteAlpha.300"
          boxShadow="xl"
        >
          <Box
            bg="rgba(0, 0, 0, 0.4)"
            p={6}
            borderRadius="xl"
            boxShadow="lg"
            width="100%"
            textAlign="center"
          >
            <Heading
              size="2xl"
              bgGradient="linear(to-r, white, blue.200)"
              bgClip="text"
              fontWeight="extrabold"
              filter="drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))"
            >
              UnoPlay
            </Heading>
            
            <Text
              fontSize="xl"
              color="white"
              mt={4}
              textShadow="0 0 10px rgba(0, 0, 0, 0.5)"
            >
              Играйте в УНО онлайн с друзьями бесплатно!
            </Text>
          </Box>

          <Input
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/\s+/g, ''))}
            size="lg"
            bg="whiteAlpha.200"
            color="white"
            border="2px solid"
            borderColor="whiteAlpha.400"
            _hover={{ borderColor: "whiteAlpha.500" }}
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
            _placeholder={{ color: "whiteAlpha.700" }}
          />

          <FormControl>
            <FormLabel color="white">Количество игроков (2-10)</FormLabel>
            <NumberInput
              min={2}
              max={10}
              value={playerLimit}
              onChange={(value) => setPlayerLimit(Number(value))}
              size="lg"
              bg="whiteAlpha.200"
              borderRadius="md"
            >
              <NumberInputField
                color="white"
                border="2px solid"
                borderColor="whiteAlpha.400"
                _hover={{ borderColor: "whiteAlpha.500" }}
                _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
              />
              <NumberInputStepper>
                <NumberIncrementStepper color="white" borderColor="whiteAlpha.400" />
                <NumberDecrementStepper color="white" borderColor="whiteAlpha.400" />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <Button
            colorScheme="green"
            size="lg"
            width="100%"
            onClick={createGame}
            bgGradient="linear(to-r, green.400, teal.500)"
            _hover={{
              bgGradient: "linear(to-r, green.500, teal.600)",
              transform: "translateY(-2px)",
              boxShadow: "xl",
            }}
          >
            Создать новую игру
          </Button>

          <Text color="white" fontSize="lg" textShadow="0 0 10px rgba(0, 0, 0, 0.5)">или</Text>

          <Input
            placeholder="Код комнаты"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.trim())}
            size="lg"
            bg="whiteAlpha.200"
            color="white"
            border="2px solid"
            borderColor="whiteAlpha.400"
            _hover={{ borderColor: "whiteAlpha.500" }}
            _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
            _placeholder={{ color: "whiteAlpha.700" }}
          />

          <Button
            colorScheme="blue"
            size="lg"
            width="100%"
            onClick={joinGame}
            bgGradient="linear(to-r, blue.400, purple.500)"
            _hover={{
              bgGradient: "linear(to-r, blue.500, purple.600)",
              transform: "translateY(-2px)",
              boxShadow: "xl",
            }}
          >
            Присоединиться к игре
          </Button>
        </VStack>
      </Container>
    </Box>
  )
}

export default Home 