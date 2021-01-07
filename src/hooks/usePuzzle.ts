import { useCallback, useEffect, useState } from 'react'

import { useLocalStorage } from 'hooks/useLocalStorage'
import { PuzzleType } from 'models/Puzzle'
import { BoardState, CellState } from 'models/State'
import { decodePuzzle, encodePuzzle } from 'utils/puzzleEncoder'
import { createState } from 'utils/stateCreator'

import { STORAGE_CODE, STORAGE_STATE } from 'constants/storage.constants'

export type usePuzzleType = {
  code: string
  finished: boolean
  puzzle: PuzzleType | null
  getCellState: (c: number, r: number) => CellState
  resetState: () => void
  setFinished: () => void
  setPuzzle: (puzzle: PuzzleType) => void
  setCellState: (c: number, r: number) => (value: CellState) => void
}

export const initialPuzzleState = {
  code: '',
  finished: false,
  puzzle: null,
  getCellState: () => CellState.Empty,
  resetState: () => {},
  setFinished: () => {},
  setPuzzle: () => {},
  setCellState: () => () => {},
}

export const usePuzzle = (): usePuzzleType => {
  const [code, setCodeValue, cleanCodeStorage] = useLocalStorage<string>(
    STORAGE_CODE,
    initialPuzzleState.code
  )

  const [state, setStateValue, cleanStateStorage] = useLocalStorage<BoardState>(
    STORAGE_STATE,
    []
  )

  const [finished, setFinishedValue] = useState<boolean>(initialPuzzleState.finished)

  const [puzzle, setPuzzleValue] = useState<PuzzleType | null>(initialPuzzleState.puzzle)

  const getCellState = useCallback<(c: number, r: number) => CellState>(
    (c, r) => {
      if (state.length === 0) return CellState.Empty
      return state[c][r]
    },
    [state]
  )

  const resetState = useCallback<() => void>(() => {
    if (puzzle && !finished) setStateValue(createState(puzzle))
  }, [puzzle, finished, setStateValue])

  const setCellState = useCallback<(c: number, r: number) => (value: CellState) => void>(
    (c, r) => (value) => {
      setStateValue((state: BoardState) =>
        state.map((row, i) => {
          if (i !== c) return [...row]
          return row.map((cell, j) => (j !== r ? cell : value))
        })
      )
    },
    [setStateValue]
  )

  const setPuzzle = useCallback<(puzzle: PuzzleType) => void>(
    (puzzle) => {
      setFinishedValue(false)
      setPuzzleValue(puzzle)
      setCodeValue(encodePuzzle(puzzle))
      setStateValue(createState(puzzle))
    },
    [setCodeValue, setStateValue]
  )

  const setFinished = useCallback<() => void>(() => {
    setFinishedValue(true)
    cleanCodeStorage()
    cleanStateStorage()
  }, [cleanCodeStorage, cleanStateStorage])

  useEffect(() => {
    if (!code) return
    let puzzle
    if (finished || (puzzle = decodePuzzle(code)).size !== state.length) {
      cleanCodeStorage()
      cleanStateStorage()
    } else {
      setPuzzleValue(puzzle)
    }
  }, [code, finished, state, cleanCodeStorage, cleanStateStorage])

  return {
    code,
    finished,
    puzzle,
    getCellState,
    resetState,
    setFinished,
    setPuzzle,
    setCellState,
  }
}
