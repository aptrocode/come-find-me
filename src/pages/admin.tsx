import { useState, useCallback, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { useAdminStore } from '../store/useAdminStore'
import type { Creature } from '../types'

// Components
import CreatureEditor from '../components/organism/CreatureEditor'
import AdminSidebar, { type AdminTab } from '../components/molecules/AdminSidebar'
import AdminCreatureRegistry from '../components/organism/AdminCreatureRegistry'
import AdminSpawnSettings from '../components/organism/AdminSpawnSettings'
import AdminRaritySettings from '../components/organism/AdminRaritySettings'
import AdminCatchSettings from '../components/organism/AdminCatchSettings'
import AdminPhysicsSettings from '../components/organism/AdminPhysicsSettings'
import AdminAreaSettings from '../components/organism/AdminAreaSettings'
import AdminMapStyleSettings from '../components/organism/AdminMapStyleSettings'
import AdminPlayerSettings from '../components/organism/AdminPlayerSettings'
import AdminUserManagement from '../components/organism/AdminUserManagement'
import ConfirmModal, { type ConfirmModalProps } from '../components/molecules/ConfirmModal'

import './admin.css'

export default function AdminPage() {
  const adminStore = useAdminStore()
  const loadAdminConfig = useAdminStore(s => s.loadAdminConfig)

  useEffect(() => {
    loadAdminConfig()
    document.title = 'Admin Dashboard | First See Mie'
  }, [loadAdminConfig])

  const [activeTab, setActiveTab] = useState<AdminTab>('creatures')
  const [editingCreature, setEditingCreature] = useState<Creature | 'new' | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Confirmation state
  const [confirmState, setConfirmState] = useState<ConfirmModalProps | null>(null)

  // Local state for buffered changes (only apply when clicking 'Save Changes')
  const [localSpawnConfig, setLocalSpawnConfig] = useState(adminStore.spawnConfig)
  const [localRarityWeights, setLocalRarityWeights] = useState(adminStore.rarityWeights)
  const [localCatchConfig, setLocalCatchConfig] = useState(adminStore.catchConfig)
  const [localEncounterPhysics, setLocalEncounterPhysics] = useState(adminStore.encounterPhysics)
  const [localDebugSettings, setLocalDebugSettings] = useState(adminStore.debugSettings)
  const [localEventArea, setLocalEventArea] = useState(adminStore.eventArea)
  const [localMapConfig, setLocalMapConfig] = useState(adminStore.mapConfig)
  const [localPlayerConfig, setLocalPlayerConfig] = useState(adminStore.playerConfig)

  const [prevSyncData, setPrevSyncData] = useState({
    spawn: adminStore.spawnConfig,
    rarity: adminStore.rarityWeights,
    catch: adminStore.catchConfig,
    physics: adminStore.encounterPhysics,
    debug: adminStore.debugSettings,
    area: adminStore.eventArea,
    mapConfig: adminStore.mapConfig,
    playerConfig: adminStore.playerConfig
  })

  // Sync local buffer if store was updated externally (e.g. initial load)
  if (
    adminStore.spawnConfig !== prevSyncData.spawn ||
    adminStore.rarityWeights !== prevSyncData.rarity ||
    adminStore.catchConfig !== prevSyncData.catch ||
    adminStore.encounterPhysics !== prevSyncData.physics ||
    adminStore.debugSettings !== prevSyncData.debug ||
    adminStore.eventArea !== prevSyncData.area ||
    adminStore.mapConfig !== prevSyncData.mapConfig ||
    adminStore.playerConfig !== prevSyncData.playerConfig
  ) {
    setPrevSyncData({
      spawn: adminStore.spawnConfig,
      rarity: adminStore.rarityWeights,
      catch: adminStore.catchConfig,
      physics: adminStore.encounterPhysics,
      debug: adminStore.debugSettings,
      area: adminStore.eventArea,
      mapConfig: adminStore.mapConfig,
      playerConfig: adminStore.playerConfig
    })
    setLocalSpawnConfig(adminStore.spawnConfig)
    setLocalRarityWeights(adminStore.rarityWeights)
    setLocalCatchConfig(adminStore.catchConfig)
    setLocalEncounterPhysics(adminStore.encounterPhysics)
    setLocalDebugSettings(adminStore.debugSettings)
    setLocalEventArea(adminStore.eventArea)
    setLocalMapConfig(adminStore.mapConfig)
    setLocalPlayerConfig(adminStore.playerConfig)
  }

  const handleSaveCreature = useCallback((creature: Creature) => {
    if (editingCreature === 'new') {
      adminStore.addCreature(creature)
    } else {
      adminStore.updateCreature(creature.id, creature)
    }
    setEditingCreature(null)
  }, [editingCreature, adminStore])

  const handleDeleteCreature = useCallback((id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Creature',
      description: 'Are you sure you want to remove this creature from the database? This action cannot be undone.',
      confirmLabel: 'Delete Now',
      type: 'danger',
      onConfirm: () => adminStore.deleteCreature(id),
      onClose: () => setConfirmState(null)
    })
  }, [adminStore])

  const handleReset = useCallback(() => {
    setConfirmState({
      isOpen: true,
      title: 'Factory Reset',
      description: 'This will reset EVERYTHING to original defaults, including all custom creatures and global settings. Your work will be permanently lost.',
      confirmLabel: 'Yes, Reset Everything',
      requireStrict: true,
      strictLabel: 'I understand that all my data will be deleted',
      type: 'danger',
      onConfirm: () => adminStore.resetToDefaults(),
      onClose: () => setConfirmState(null)
    })
  }, [adminStore])

  const handleResetSection = useCallback((section: AdminTab) => {
    const sectionNames: Record<AdminTab, string> = {
      creatures: 'Creature Registry',
      spawn: 'Spawn Settings',
      rarity: 'Rarity Weights',
      catch: 'Catch Logic',
      physics: 'Encounter Physics',
      area: 'Map & Area',
      style: 'Map Style',
      player: 'Player Model',
      users: 'User Management'
    }

    setConfirmState({
      isOpen: true,
      title: `Reset ${sectionNames[section]}`,
      description: `Reset all ${sectionNames[section]} configurations to their original factory defaults? This tab's current unsaved changes will be lost.`,
      confirmLabel: 'Reset Tab',
      type: 'warning',
      onConfirm: () => {
        switch (section) {
          case 'creatures': adminStore.resetCreatures(); break;
          case 'spawn': adminStore.resetSpawnConfig(); break;
          case 'rarity': adminStore.resetRarityWeights(); break;
          case 'catch': adminStore.resetCatchConfig(); break;
          case 'physics': adminStore.resetEncounterPhysics(); break;
          case 'area': 
            adminStore.resetEventArea(); 
            adminStore.resetMapConfig(); 
            break;
          case 'style': adminStore.resetMapConfig(); break;
          case 'player': adminStore.resetPlayerConfig(); break;
        }
      },
      onClose: () => setConfirmState(null)
    })
  }, [adminStore])

  const handleApplyChanges = useCallback(() => {
    // 1. Compute changes
    const changes: { label: string; old: unknown; new: unknown }[] = []

    const compare = <T extends object>(obj1: T, obj2: T, prefix: string) => {
      const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]) as Set<keyof T>
      keys.forEach(key => {
        const val1 = obj1?.[key]
        const val2 = obj2?.[key]
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          changes.push({
            label: `${prefix}: ${String(key).replace(/([A-Z])/g, ' $1').toLowerCase()}`,
            old: val1 === undefined ? '(new setting)' : val1,
            new: val2 === undefined ? '(deleted)' : val2
          })
        }
      })
    }

    compare(adminStore.spawnConfig, localSpawnConfig, 'Spawn')
    compare(adminStore.rarityWeights, localRarityWeights, 'Rarity')
    compare(adminStore.catchConfig, localCatchConfig, 'Catch')
    compare(adminStore.encounterPhysics, localEncounterPhysics, 'Physics')
    compare(adminStore.eventArea, localEventArea, 'Area')
    compare(adminStore.mapConfig, localMapConfig, 'Map')
    compare(adminStore.playerConfig, localPlayerConfig, 'Player')

    if (changes.length === 0) {
      setConfirmState({
        isOpen: true,
        title: 'Everything Up to Date',
        description: 'No changes were detected in any of the configuration sections. Your settings are already synchronized.',
        confirmLabel: 'Understood',
        type: 'info',
        showCancel: false,
        onConfirm: () => {},
        onClose: () => setConfirmState(null)
      })
      return
    }

    // 2. Show Confirm Modal with Diff
    setConfirmState({
      isOpen: true,
      title: 'Review Changes',
      description: `You are about to apply ${changes.length} configuration updates. Please review the changes below:`,
      confirmLabel: 'Apply All Changes',
      type: 'info',
      onConfirm: () => {
        adminStore.setMultipleConfigs({
          spawnConfig: localSpawnConfig,
          rarityWeights: localRarityWeights,
          catchConfig: localCatchConfig,
          encounterPhysics: localEncounterPhysics,
          debugSettings: localDebugSettings,
          eventArea: localEventArea,
          mapConfig: localMapConfig,
          playerConfig: localPlayerConfig
        })
        alert('Changes applied & saved successfully!')
      },
      onClose: () => setConfirmState(null),
      children: (
        <div className="diff-container">
          {changes.map((c, i) => (
            <div key={i} className="diff-item">
              <span className="diff-label">{c.label}</span>
              <div className="diff-values">
                <span className="diff-old">{String(c.old)}</span>
                <span className="diff-arrow">→</span>
                <span className="diff-new">{String(c.new)}</span>
              </div>
            </div>
          ))}
        </div>
      )
    })
  }, [adminStore, localSpawnConfig, localRarityWeights, localCatchConfig, localEncounterPhysics, localDebugSettings, localEventArea, localMapConfig, localPlayerConfig])

  return (
    <div className="admin-layout">
      {/* Mobile Header (Hidden on Desktop) */}
      <div className="admin-mobile-header">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
          <Icon icon="ph:list-bold" />
        </button>
        <h1 className="admin-mobile-title">Admin Panel</h1>
        <a className="admin-mobile-play" href="/">
          <Icon icon="ph:play-circle-duotone" />
        </a>
      </div>

      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleReset}
        onApply={handleApplyChanges}
        isSidebarOpen={isSidebarOpen}
        onCloseSidebar={() => setIsSidebarOpen(false)}
      />

      <main className="admin-main">
        <div className="admin-content-wrapper">
          {activeTab === 'creatures' && (
            <AdminCreatureRegistry
              creatures={adminStore.creatures}
              onEdit={setEditingCreature}
              onDelete={handleDeleteCreature}
              onReset={() => handleResetSection('creatures')}
              onAddNew={() => setEditingCreature('new')}
              logMode={{
                checked: localDebugSettings.creatures,
                onChange: val => setLocalDebugSettings({ ...localDebugSettings, creatures: val })
              }}
            />
          )}

          {activeTab === 'spawn' && (
            <AdminSpawnSettings
              config={localSpawnConfig}
              onChange={setLocalSpawnConfig}
              onReset={() => handleResetSection('spawn')}
              logMode={{
                checked: localDebugSettings.spawn,
                onChange: val => setLocalDebugSettings({ ...localDebugSettings, spawn: val })
              }}
            />
          )}

          {activeTab === 'rarity' && (
            <AdminRaritySettings
              weights={localRarityWeights}
              onChange={setLocalRarityWeights}
              onReset={() => handleResetSection('rarity')}
              logMode={{
                checked: localDebugSettings.rarity,
                onChange: val => setLocalDebugSettings({ ...localDebugSettings, rarity: val })
              }}
            />
          )}

          {activeTab === 'catch' && (
            <AdminCatchSettings
              config={localCatchConfig}
              onChange={setLocalCatchConfig}
              onReset={() => handleResetSection('catch')}
              logMode={{
                checked: localDebugSettings.catch,
                onChange: val => setLocalDebugSettings({ ...localDebugSettings, catch: val })
              }}
            />
          )}

          {activeTab === 'physics' && (
            <AdminPhysicsSettings
              config={localEncounterPhysics}
              onChange={setLocalEncounterPhysics}
              onReset={() => handleResetSection('physics')}
              logMode={{
                checked: localDebugSettings.physics,
                onChange: val => setLocalDebugSettings({ ...localDebugSettings, physics: val })
              }}
            />
          )}

          {activeTab === 'area' && (
            <AdminAreaSettings
              areaConfig={localEventArea}
              mapConfig={localMapConfig}
              onAreaChange={setLocalEventArea}
              onMapChange={setLocalMapConfig}
              onReset={() => handleResetSection('area')}
            />
          )}

          {activeTab === 'style' && (
            <AdminMapStyleSettings
              mapConfig={localMapConfig}
              onMapChange={setLocalMapConfig}
              onReset={() => handleResetSection('style')}
            />
          )}

          {activeTab === 'player' && (
            <AdminPlayerSettings
              config={localPlayerConfig}
              onChange={setLocalPlayerConfig}
              onReset={() => handleResetSection('player')}
            />
          )}

          {activeTab === 'users' && (
            <AdminUserManagement />
          )}
        </div>
      </main>

      {editingCreature !== null && (
        <CreatureEditor
          creature={editingCreature === 'new' ? null : editingCreature}
          onSave={handleSaveCreature}
          onClose={() => setEditingCreature(null)}
        />
      )}

      {confirmState && (
        <ConfirmModal {...confirmState} />
      )}
    </div>
  )
}
