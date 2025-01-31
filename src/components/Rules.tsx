import React from 'react'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Text,
  Box,
  UnorderedList,
  ListItem,
  Heading,
  Divider,
} from '@chakra-ui/react'

interface RulesProps {
  isOpen: boolean
  onClose: () => void
}

const Rules = ({ isOpen, onClose }: RulesProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
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

            <Divider />

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

            <Divider />

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

            <Divider />

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
  )
}

export default Rules 