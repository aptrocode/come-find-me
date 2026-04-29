import { Icon } from '@iconify/react'
import './AdminSidebar.css'

export type AdminTab = 'creatures' | 'spawn' | 'rarity' | 'catch' | 'physics' | 'area' | 'player' | 'style'

interface SidebarTab {
  id: AdminTab
  icon: string
  label: string
}

interface SidebarCategory {
  title: string
  tabs: SidebarTab[]
}

interface AdminSidebarProps {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  onReset: () => void
  onApply: () => void
  isSidebarOpen: boolean
  onCloseSidebar: () => void
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
  onReset,
  onApply,
  isSidebarOpen,
  onCloseSidebar
}: AdminSidebarProps) {
  const categories: SidebarCategory[] = [
    {
      title: 'Creature Management',
      tabs: [{ id: 'creatures', icon: 'ph:paw-print-duotone', label: 'Registry' }]
    },
    {
      title: 'Game Balancing',
      tabs: [
        { id: 'spawn', icon: 'ph:map-pin-area-duotone', label: 'Spawn' },
        { id: 'rarity', icon: 'ph:dice-five-duotone', label: 'Rarity' },
        { id: 'catch', icon: 'ph:target-duotone', label: 'Catch' },
        { id: 'physics', icon: 'ph:atom-duotone', label: 'Physics' },
      ]
    },
    {
      title: 'World & Map',
      tabs: [
        { id: 'area', icon: 'ph:polygon-duotone', label: 'Area & Map' },
        { id: 'style', icon: 'ph:palette-duotone', label: 'Map Style' },
        { id: 'player', icon: 'ph:user-circle-duotone', label: 'Player Model' }
      ]
    }
  ]

  return (
    <>
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={onCloseSidebar} />}
      
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            <Icon icon="ph:gear-duotone" className="sidebar-title-icon" />
            Config
          </h1>
          <a className="sidebar-back" href="/">
            <Icon icon="ph:arrow-left-bold" />
            <span>Play Game</span>
          </a>
        </div>

        <nav className="sidebar-nav">
          {categories.map(category => (
            <div key={category.title} className="sidebar-group">
              <h3 className="sidebar-category-title">{category.title}</h3>
              {category.tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    onTabChange(tab.id)
                    onCloseSidebar()
                  }}
                >
                  <Icon icon={tab.icon} className="sidebar-link-icon" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn-secondary sidebar-btn" onClick={onReset}>
            <Icon icon="ph:arrows-counter-clockwise-bold" />
            Factory Reset
          </button>
          <button className="btn-primary sidebar-btn" onClick={onApply}>
            <Icon icon="ph:floppy-disk-back-duotone" />
            Save Changes
          </button>
        </div>
      </aside>
    </>
  )
}
