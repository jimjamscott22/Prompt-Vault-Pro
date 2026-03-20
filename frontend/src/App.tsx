import { BrowserRouter, Routes, Route } from 'react-router-dom'
import EntriesPage from './pages/EntriesPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <header className="border-b border-gray-800 px-6 py-4">
          <h1 className="text-xl font-bold">PromptVaultPro</h1>
        </header>
        <main className="px-6 py-8">
          <Routes>
            <Route path="/" element={<EntriesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
