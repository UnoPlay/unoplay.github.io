import { useState, useRef, useEffect } from 'react'
import {
  VStack,
  Input,
  Button,
  Box,
  Text,
  HStack,
  IconButton,
  useToast,
} from '@chakra-ui/react'
import { Socket } from 'socket.io-client'

interface ChatProps {
  socket: Socket | null
  playerName: string
}

interface Message {
  id: string
  sender: string
  text: string
  timestamp: number
}

const Chat = ({ socket, playerName }: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    if (!socket) return

    socket.on('chatMessage', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      socket.off('chatMessage')
    }
  }, [socket])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = () => {
    if (!socket || !newMessage.trim()) return

    const message = {
      id: Date.now().toString(),
      sender: playerName,
      text: newMessage.trim(),
      timestamp: Date.now(),
    }

    socket.emit('chatMessage', message)
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <VStack h="100%" spacing={4}>
      <Box
        flex="1"
        w="100%"
        overflowY="auto"
        bg="whiteAlpha.100"
        borderRadius="xl"
        p={4}
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'whiteAlpha.100',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'whiteAlpha.300',
            borderRadius: '4px',
          },
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            bg={message.sender === playerName ? 'blue.500' : 'whiteAlpha.200'}
            color="white"
            p={3}
            borderRadius="xl"
            maxW="80%"
            mb={3}
            alignSelf={message.sender === playerName ? 'flex-end' : 'flex-start'}
            ml={message.sender === playerName ? 'auto' : '0'}
          >
            <Text fontSize="sm" color="whiteAlpha.800" mb={1}>
              {message.sender}
            </Text>
            <Text>{message.text}</Text>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      <HStack w="100%" spacing={2}>
        <Input
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          bg="whiteAlpha.200"
          color="white"
          border="1px solid"
          borderColor="whiteAlpha.300"
          _hover={{ borderColor: "whiteAlpha.400" }}
          _focus={{ borderColor: "blue.400", boxShadow: "0 0 0 1px #4299E1" }}
          _placeholder={{ color: "whiteAlpha.600" }}
        />
        <Button
          colorScheme="blue"
          onClick={sendMessage}
          isDisabled={!newMessage.trim()}
          bgGradient="linear(to-r, blue.400, purple.500)"
          _hover={{
            bgGradient: "linear(to-r, blue.500, purple.600)",
            transform: "translateY(-2px)",
          }}
        >
          Отправить
        </Button>
      </HStack>
    </VStack>
  )
}

export default Chat 