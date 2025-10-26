import { reactive, ref } from 'vue'
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useBoardManager = defineStore('boardManager', () => {
  const boards = reactive({
    personal: [],
    collab: [],
    pending: []
  })
  let currentBoard = reactive({})
  const getBoards = function () {
    return boards
  }

  const setBoards = function (boardsList = {}) {
    Object.keys(boards).forEach((key) => delete boards[key])
    Object.keys(boardsList).forEach((key) => {
      boards[key] = Array.isArray(boardsList[key])
        ? [...boardsList[key]]
        : boardsList[key]
    })
  }

  const addBoard = function (newBoard, addTo) {
    boards[addTo].push(newBoard)
  }
  const findIndexById = function (id, findOn) {
    return boards[findOn].findIndex((el) => el.id === id)
  }
  const setCurrentBoard = function (board) {
    currentBoard = board
  }
  const getCurrentBoard = function () {
    return currentBoard
  }
  const deleteBoard = function (id, findOn) {
    const index = boards[findOn].findIndex((el) => {
      return el.id == id
    })
    boards[findOn].splice(index, 1)
  }

  return {
    setCurrentBoard,
    getBoards,
    setBoards,
    addBoard,
    findIndexById,
    getCurrentBoard,
    deleteBoard
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBoardManager, import.meta.hot))
}
