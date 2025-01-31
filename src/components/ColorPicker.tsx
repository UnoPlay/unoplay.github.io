import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  SimpleGrid,
  Box,
} from '@chakra-ui/react'
import { COLORS } from '../types'

interface ColorPickerProps {
  isOpen: boolean
  onClose: () => void
  onColorSelect: (color: string) => void
}

const ColorPicker = ({ isOpen, onClose, onColorSelect }: ColorPickerProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Выберите цвет</ModalHeader>
        <ModalBody>
          <SimpleGrid columns={2} spacing={4} pb={4}>
            {COLORS.map((color) => (
              <Box
                key={color}
                bg={`${color}.500`}
                w="100%"
                h="100px"
                borderRadius="lg"
                cursor="pointer"
                onClick={() => {
                  onColorSelect(color)
                  onClose()
                }}
                _hover={{
                  transform: 'scale(1.05)',
                }}
                transition="transform 0.2s"
              />
            ))}
          </SimpleGrid>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default ColorPicker 