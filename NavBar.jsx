import { useApp } from '../context/AppContext.jsx'

export default function NavBar({ current, onNavigate }) {
  const { t } = useApp()
  const items = [
    { id: 'home', label: t('navHome') },
    { id: 'complaints', label: t('navComplaints') },
    { id: 'profile', label: t('navProfile') },
  ]
  return (
    <nav className="nav" aria-label="Main">
      {items.map((item) => (
        <button
          key={item.id}
          className={current === item.id ? 'active' : ''}
          aria-current={current === item.id ? 'page' : undefined}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}
