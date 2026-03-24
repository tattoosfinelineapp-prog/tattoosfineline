'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type SearchContextType = {
  busqueda: string
  setBusqueda: (v: string) => void
}

const SearchContext = createContext<SearchContextType>({
  busqueda: '',
  setBusqueda: () => {},
})

export const useSearch = () => useContext(SearchContext)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [busqueda, setBusqueda] = useState('')
  return (
    <SearchContext.Provider value={{ busqueda, setBusqueda }}>
      {children}
    </SearchContext.Provider>
  )
}
