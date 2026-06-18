import LandingScreen from './components/LandingScreen'
import ChatScreen from './components/ChatScreen'
import useSessionStore from './store/sessionStore'

export default function App() {
  const screen = useSessionStore((s) => s.screen)
  return screen === 'landing' ? <LandingScreen /> : <ChatScreen />
}
