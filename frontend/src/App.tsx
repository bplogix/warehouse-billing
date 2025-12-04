// import ConfirmDialog from './components/ConfirmDialog'
import { ToastProvider } from './components/UI/toastContext'
import AppRouter from './router'

function App() {
  return (
    <ToastProvider>
      <AppRouter />
      {/* <ConfirmDialog /> */}
    </ToastProvider>
  )
}

export default App
