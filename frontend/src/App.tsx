import { Toaster } from 'sonner'

import AppRouter from './router'

function App() {
  return (
    <>
      <AppRouter />
      <Toaster position="top-center" richColors />
    </>
  )
}

export default App
