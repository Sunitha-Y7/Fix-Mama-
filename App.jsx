import { useApp } from './context/AppContext.jsx'
import NavBar from './components/NavBar.jsx'
import Welcome from './pages/Welcome.jsx'
import Otp from './pages/Otp.jsx'
import Home from './pages/Home.jsx'
import Camera from './pages/Camera.jsx'
import Language from './pages/Language.jsx'
import Voice from './pages/Voice.jsx'
import Analysis from './pages/Analysis.jsx'
import Complaint from './pages/Complaint.jsx'
import Context from './pages/Context.jsx'
import Send from './pages/Send.jsx'
import Complaints from './pages/Complaints.jsx'
import ComplaintDetail from './pages/ComplaintDetail.jsx'
import Profile from './pages/Profile.jsx'

const NAV_SCREENS = new Set(['home', 'complaints', 'profile', 'complaintDetail'])

export default function App() {
  const { screen, setScreen } = useApp()

  const page = {
    welcome: <Welcome />,
    otp: <Otp />,
    home: <Home />,
    camera: <Camera />,
    language: <Language />,
    voice: <Voice />,
    analysis: <Analysis />,
    context: <Context />,
    complaint: <Complaint />,
    send: <Send />,
    complaints: <Complaints />,
    complaintDetail: <ComplaintDetail />,
    profile: <Profile />,
  }[screen] || <Welcome />

  return (
    <div className="app-shell">
      <div className="app-frame">
        {page}
        {NAV_SCREENS.has(screen) && (
          <NavBar current={screen === 'complaintDetail' ? 'complaints' : screen} onNavigate={setScreen} />
        )}
      </div>
    </div>
  )
}
