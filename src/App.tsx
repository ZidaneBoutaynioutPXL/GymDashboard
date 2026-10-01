import { lazy, Suspense, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDownToLine, ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, Dumbbell, Flame, HeartPulse, LayoutDashboard, Menu, MoreHorizontal, Pencil, Plus, Settings2, Shield, Sparkles, Target, Trophy, Upload, UserRound, UsersRound, Weight, X, Zap } from 'lucide-react'
import { db, defaultProfile, ensureStarterData, exportData, importData, LIFT_IDS, type LiftId, type Note, type NoteCategory, type ProgramDay } from './data'
import { displayWeight, liftInfo, liftStats, totalStats } from './strength'
import { StatCard } from './ui'
import { CharacterArt, RankReveal, UltimatePanel } from './RankUI'
import { bodyStats, ultimateStats, rankName, type RankDomain } from './ranks'
import { unlockAudio } from './sound'
import './App.css'
import './ranks.css'
import './experience.css'
import './characterExperience.css'
import { playLogSound } from './sound'
import { Onboarding } from './Onboarding'
import { newGame } from './gameTypes'
import { equipment } from './progression'
import { ProgressionSummary, SagaPage, RoomPage } from './ProgressionPages'
import './progression.css'

const LiftsPage = lazy(() => import('./Pages').then(module => ({ default: module.LiftsPage })))
const BodyPage = lazy(() => import('./Pages').then(module => ({ default: module.BodyPage })))
const NotesPage = lazy(() => import('./Pages').then(module => ({ default: module.NotesPage })))
const ProgramPage = lazy(() => import('./Pages').then(module => ({ default: module.ProgramPage })))
const ComparePage = lazy(() => import('./Comparisons').then(module => ({ default: module.ComparePage })))
const LogModal = lazy(() => import('./Modals').then(module => ({ default: module.LogModal })))
const MeasurementModal = lazy(() => import('./Modals').then(module => ({ default: module.MeasurementModal })))
const NoteModal = lazy(() => import('./Modals').then(module => ({ default: module.NoteModal })))
const ProfileModal = lazy(() => import('./Modals').then(module => ({ default: module.ProfileModal })))
const ProgramModal = lazy(() => import('./Modals').then(module => ({ default: module.ProgramModal })))

export type Page = 'overview' | 'lifts' | 'program' | 'notes' | 'body' | 'compare' | 'saga' | 'room'
type Modal = 'log' | 'profile' | 'note' | 'measurement' | 'program' | 'settings' | 'transform' | null
const nav: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'lifts', label: 'My lifts', icon: Dumbbell },
  { id: 'saga', label: 'Training saga', icon: Sparkles },
  { id: 'room', label: 'Training room', icon: Trophy },
  { id: 'program', label: 'Training plan', icon: CalendarDays },
  { id: 'notes', label: 'Notebook', icon: BookOpen },
  { id: 'body', label: 'Body stats', icon: HeartPulse },
  { id: 'compare', label: 'Compare', icon: UsersRound },
]
function App() {
  const profileRecord = useLiveQuery(async () => ({value:await db.profiles.get('me')}), [])
  const profile = profileRecord?.value ?? defaultProfile
  const game=useLiveQuery(()=>db.game.get('me'),[])??newGame()
  const loadout=equipment(game)
  const [bootReady,setBootReady]=useState(false)
  const [bootError,setBootError]=useState(false)
  const entries = useLiveQuery(() => db.entries.toArray(), []) ?? []
  const notes = useLiveQuery(() => db.notes.toArray(), []) ?? []
  const days = useLiveQuery(() => db.days.orderBy('dayIndex').toArray(), []) ?? []
  const measurements = useLiveQuery(async () => (await db.measurements.toArray()).sort((a,b) => a.date.localeCompare(b.date) || (a.createdAt ?? '').localeCompare(b.createdAt ?? '')), []) ?? []
  const [page, setPage] = useState<Page>('overview')
  const [modal, setModal] = useState<Modal>(null)
  const [selectedLift, setSelectedLift] = useState<LiftId>('bench')
  const [selectedDay, setSelectedDay] = useState<ProgramDay | null>(null)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [noteFilter, setNoteFilter] = useState<NoteCategory | 'All'>('All')
  const [search, setSearch] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [toast, setToast] = useState('')
  const [transformRank, setTransformRank] = useState(0)
  const [transformDomain,setTransformDomain]=useState<RankDomain>('ultimate')
  const [preview,setPreview]=useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const rankBeforeLog = useRef(0)
  const rankSnapshot = useRef({body:0,ultimate:0})
  const revealQueue = useRef<{rank:number;domain:RankDomain}[]>([])
  const overall=ultimateStats(entries,profile)
  const overview = {...totalStats(entries, profile.bodyweight),rank:overall.rank}
  const snapshotRanks=useEffectEvent(()=>{rankSnapshot.current={body:bodyStats(profile).rank,ultimate:overall.rank};revealQueue.current=[]})

  useEffect(()=>{
    function back(e:Event){
      const entrance=document.querySelector<HTMLButtonElement>('.lift-entrance button[aria-label="Cancel lift opening"]')
      const liftBack=document.querySelector<HTMLButtonElement>('.deck-back')
      if(entrance){e.preventDefault();entrance.click()}
      else if(modal){e.preventDefault();setModal(null)}
      else if(mobileMenu){e.preventDefault();setMobileMenu(false)}
      else if(liftBack){e.preventDefault();liftBack.click()}
      else if(page!=='overview'){e.preventDefault();setPage('overview')}
    }
    window.addEventListener('ascend-back',back)
    return()=>window.removeEventListener('ascend-back',back)
  },[modal,mobileMenu,page])

  useEffect(() => { ensureStarterData().then(()=>setBootReady(true)).catch(()=>setBootError(true)) }, [])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3500); return () => clearTimeout(timer) }, [toast])
  useEffect(() => {
    if (!modal) {revealQueue.current=[];return}
    if (modal !== 'transform') {
      snapshotRanks()
    }
    const previousFocus = document.activeElement as HTMLElement | null
    const focusable = () => Array.from(document.querySelectorAll<HTMLElement>('.modal-card button:not(:disabled), .modal-card input:not([hidden]), .modal-card select, .modal-card textarea, .modal-card a[href]')).filter(el => el.getClientRects().length > 0)
    const frame = requestAnimationFrame(() => { const input = document.querySelector<HTMLElement>('.modal-card input:not([hidden]), .modal-card textarea'); (input ?? focusable()[0])?.focus() })
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setModal(null) }
      if (event.key !== 'Tab') return
      const items = focusable(), first = items[0], last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown',keydown); previousFocus?.focus() }
  }, [modal])
  function navigate(next: Page) { setPage(next); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function openLog(id: LiftId = selectedLift) { unlockAudio(); rankBeforeLog.current = liftStats(entries,id,profile.bodyweight,profile.sex).rank; setSelectedLift(id); setModal('log') }
  async function finishLog() {
    const updated=await db.entries.toArray()
    const current = liftStats(updated, selectedLift,profile.bodyweight,profile.sex)
    const ultimate=ultimateStats(updated,profile)
    const reveals:{rank:number;domain:RankDomain}[]=[]
    if(current.rank>rankBeforeLog.current)reveals.push({rank:current.rank,domain:selectedLift})
    if(ultimate.rank>rankSnapshot.current.ultimate)reveals.push({rank:ultimate.rank,domain:'ultimate'})
    setToast('Lift logged. Your power is rising.')
    if(!reveals.length)playLogSound(selectedLift)
    showEarnedReveals(reveals)
  }
  function openNote(note: Note | null = null) { setEditingNote(note); setModal('note') }
  function openDay(day: ProgramDay) { setSelectedDay(day); setModal('program') }
  function revealRank(rank: number,domain:RankDomain='ultimate',isPreview=false) { unlockAudio(); setPreview(isPreview); setTransformDomain(domain); setTransformRank(rank); setModal('transform') }
  function showEarnedReveals(reveals:{rank:number;domain:RankDomain}[]) {const first=reveals.shift();revealQueue.current=reveals;if(first)revealRank(first.rank,first.domain);else setModal(null)}
  function finishReveal(){const next=revealQueue.current.shift();if(next)revealRank(next.rank,next.domain);else setModal(null)}
  async function finishBody() {
    const next=await db.profiles.get('me'),reveals:{rank:number;domain:RankDomain}[]=[]
    if(next){const body=bodyStats(next),ultimate=ultimateStats(entries,next);if(body.rank>rankSnapshot.current.body)reveals.push({rank:body.rank,domain:'body'});if(ultimate.rank>rankSnapshot.current.ultimate)reveals.push({rank:ultimate.rank,domain:'ultimate'})}
    setToast('Body profile updated.');showEarnedReveals(reveals)
  }

  if(bootError)return <main className="boot-screen"><h1>Storage could not open</h1><p>Retry to load your saved training space.</p><button className="primary-button" onClick={()=>location.reload()}>RETRY</button></main>
  if(!bootReady||!profileRecord)return <main className="boot-screen"><Zap size={40}/><span>AWAKENING YOUR TRAINING UNIVERSE…</span></main>
  if(!profile.configured)return <Onboarding profile={profile}/>
  return <div className={`app-shell cosmetic-frame-${loadout.frame}`}>
    {mobileMenu && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenu(false)}/>}
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <button className="brand" onClick={() => navigate('overview')}><div className="brand-mark"><Zap size={22} fill="currentColor" /></div><div><strong>ASCEND<span>.</span></strong><small>TRAINING COMMAND CENTER</small></div></button>
      <div className="sidebar-section-label">COMMAND CENTER</div>
      <nav className="side-nav" aria-label="Main navigation">{nav.map(item => <button key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><item.icon size={18} strokeWidth={2} /><span>{item.label}</span>{page === item.id && <span className="nav-active-dot" />}</button>)}</nav>
      <div className="sidebar-divider"/><div className="sidebar-section-label">QUICK ACTIONS</div>
      <button className="nav-item" onClick={() => openLog()}><Plus size={18}/><span>Log a lift</span></button>
      <button className="nav-item" onClick={() => openNote()}><Pencil size={18}/><span>Write a note</span></button>
      <div className="sidebar-bottom"><div className="sidebar-motivation"><div className="sidebar-motivation-icon"><Flame size={18} fill="currentColor"/></div><strong>EVERY REP COUNTS.</strong><span>Your next form is waiting.</span><div className="mini-line" /></div><button className="nav-item settings-nav" onClick={() => setModal('settings')}><Settings2 size={18}/><span>Settings & backup</span></button><button className="sidebar-profile" onClick={() => setModal('profile')}><div className="avatar">{profile.name.charAt(0).toUpperCase()}</div><div><strong>{profile.name}</strong><span>LEVEL {overview.rank + 1} · {rankName('ultimate',overview.rank)}</span></div><MoreHorizontal size={17}/></button></div>
    </aside>

    <main className="main-content"><header className="topbar"><div className="mobile-brand"><button className="icon-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu"><Menu size={20}/></button><strong>ASCEND<span>.</span></strong></div><div className="breadcrumb">PAGES <ChevronRight size={14}/> <span>{nav.find(i => i.id === page)?.label.toUpperCase()}</span></div><div className="topbar-actions"><div className="status-pill"><span className="status-dot"/> YOUR JOURNEY IS LIVE</div><button className="top-icon" aria-label="Profile" onClick={() => setModal('profile')}><UserRound size={18}/></button><button className="top-avatar" onClick={() => setModal('profile')} aria-label="Open profile">{profile.name.charAt(0).toUpperCase()}</button></div></header>
      <div className="content-wrap"><Suspense fallback={<div className="empty-inline">Loading your training space…</div>}>
        {page === 'overview' && <><div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> YOUR TRAINING UNIVERSE</div><h1>Welcome back, <em>{profile.name}.</em></h1><p>Every rep writes your story. Keep pushing your limits.</p></div><button className="primary-button" onClick={() => openLog()}><Plus size={18}/> Log a lift</button></div>
          {!profile.configured && <div className="setup-callout"><UserRound size={20}/><div><strong>Set your starting point</strong><span>Your profile currently uses starter values. Add your age, bodyweight and goals.</span></div><button className="outlined-button" onClick={() => setModal('profile')}>SET UP PROFILE</button></div>}<section className="hero-panel"><div className="hero-grid"/><div className="hero-sun"/><div className="hero-energy hero-energy-one"/><div className="hero-energy hero-energy-two"/><div className="hero-copy"><div className="hero-kicker"><Sparkles size={15}/> GOKU · ULTIMATE FORM <span>·</span> LEVEL {overview.rank + 1}</div><h2>{rankName('ultimate',overview.rank).toUpperCase()}</h2><p>{overview.logged ? 'The work is paying off. Your next evolution starts with the next session.' : 'Every legend starts somewhere. Log your first lift to begin your transformation.'}</p><div className="hero-actions"><button className="hero-button" onClick={() => revealRank(overview.rank)}><Zap size={17} fill="currentColor"/> VIEW TRANSFORMATION <ArrowRight size={17}/></button><button className="hero-text-button" onClick={() => navigate('lifts')}>VIEW YOUR LIFTS <ChevronRight size={16}/></button></div></div><div className="hero-art-wrap"><CharacterArt className="hero-character" domain="ultimate" rank={overview.rank}/></div><div className="hero-corner">POWER IS EARNED <span>//</span> NOT GIVEN</div></section>
          <ProgressionSummary game={game} onOpen={()=>navigate('saga')}/><UltimatePanel profile={profile} entries={entries} reveal={revealRank}/><div className="section-heading"><div><div className="eyebrow muted">YOUR NUMBERS</div><h2>Training snapshot</h2></div><span className="section-aside">TRACK YOUR ASCENT ↗</span></div>
          <div className="stat-grid"><StatCard icon={Zap} label="POWER LEVEL" value={overview.power.toLocaleString()} hint={overview.logged ? 'Based on your latest lifts' : 'Log lifts to build your score'} color="orange"/><StatCard icon={Trophy} label="BIG THREE TOTAL" value={overview.total !== null ? displayWeight(overview.total) : '—'} hint={overview.total === null ? 'Log squat, bench & deadlift' : 'Latest estimated 1RMs'} color="purple"/><StatCard icon={Weight} label="BODYWEIGHT" value={`${profile.bodyweight} kg`} hint={`${profile.height} cm · Age ${profile.age}`} color="blue"/><StatCard icon={Target} label="LIFTS TRACKED" value={`${overview.logged} / 6`} hint="Across your core lifts" color="green"/></div>
          <div className="overview-columns"><section className="surface-panel lift-panel"><div className="panel-heading"><div><div className="eyebrow muted">PATH TO POWER</div><h3>Your lifts</h3></div><button className="text-link" onClick={() => navigate('lifts')}>VIEW ALL <ArrowRight size={15}/></button></div><div className="overview-lifts">{LIFT_IDS.map(id => { const stats = liftStats(entries,id,profile.bodyweight,profile.sex); return <button className="overview-lift-row" key={id} onClick={() => {setSelectedLift(id); navigate('lifts')}}><div className="lift-symbol" style={{'--lift-color':liftInfo[id].color} as React.CSSProperties}>{liftInfo[id].icon}</div><div className="lift-row-main"><div className="lift-row-top"><strong>{liftInfo[id].name}</strong><span>{stats.latest ? displayWeight(stats.current,liftInfo[id].weighted) : 'No data yet'}</span></div><div className="progress-track"><span style={{width:`${stats.progress}%`,background:liftInfo[id].color}}/></div><div className="lift-row-bottom"><span>{stats.latest ? rankName(id,stats.rank) : 'Unranked'}</span><span>{stats.next ? `${displayWeight(stats.next,liftInfo[id].weighted)} to next form` : 'Maximum form'}</span></div></div><ChevronRight size={16}/></button>})}</div></section>
            <div className="overview-side"><section className="surface-panel quest-panel"><div className="panel-heading"><div><div className="eyebrow muted">THE MISSION</div><h3>Next milestones</h3></div><Target size={20} className="dim-icon"/></div><div className="milestones">{LIFT_IDS.slice(0,3).map((id,index) => { const stats = liftStats(entries,id,profile.bodyweight,profile.sex); const goal = profile.goals[id]; return <div className="milestone" key={id}><span className="milestone-index">0{index+1}</span><div><strong>{liftInfo[id].name} goal</strong><span>{stats.latest ? `${displayWeight(stats.current)} / ${displayWeight(goal)}` : `Target ${displayWeight(goal)}`}</span></div><div className="milestone-circle" style={{'--pct':`${Math.min(100,goal ? stats.current/goal*100 : 0)}%`,'--color':liftInfo[id].color} as React.CSSProperties}><Target size={15}/></div></div>})}</div><button className="panel-footer-link" onClick={() => setModal('profile')}>EDIT YOUR GOALS <ArrowRight size={15}/></button></section><section className="quote-panel"><div className="quote-mark">“</div><p>Push past the point where you think you can’t go any further.</p><span>— THE WARRIOR'S CODE</span><div className="quote-glow"/></section></div></div>
        </>}
        {page === 'saga' && <SagaPage game={game} profile={profile} entries={entries} days={days} onRoom={()=>navigate('room')} onPlan={()=>navigate('program')}/>}
        {page === 'room' && <RoomPage game={game} profile={profile} entries={entries}/>}
        {page === 'lifts' && <LiftsPage entries={entries} profile={profile} selectedLift={selectedLift} setSelectedLift={setSelectedLift} openLog={openLog} revealRank={revealRank} showToast={setToast}/>}
        {page === 'program' && <ProgramPage days={days} openDay={openDay} showToast={setToast}/>}
        {page === 'notes' && <NotesPage notes={notes} filter={noteFilter} setFilter={setNoteFilter} search={search} setSearch={setSearch} openNote={openNote}/>}
        {page === 'body' && <BodyPage revealRank={revealRank} profile={profile} measurements={measurements} openProfile={() => setModal('profile')} openMeasurement={() => setModal('measurement')}/>}
        {page === 'compare' && <ComparePage profile={profile} entries={entries} openProfile={() => setModal('profile')} openLog={openLog}/>}
      </Suspense></div>
    </main>
    <AnimatePresence>{modal && <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e => { if(e.target === e.currentTarget) setModal(null)}}><motion.div className={`modal-card ${modal === 'transform' ? 'transform-modal' : ''}`} initial={{opacity:0,scale:.94,y:24}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:.96,y:12}} transition={{type:'spring',stiffness:280,damping:25}} role="dialog" aria-label={`${modal} dialog`} aria-modal="true"><button className="modal-close" onClick={() => setModal(null)} aria-label="Close"><X size={20}/></button>
      <Suspense fallback={<div className="empty-inline">Loading editor…</div>}>
      {modal === 'log' && <LogModal key={selectedLift} liftId={selectedLift} profile={profile} onDone={finishLog}/>}
      {modal === 'profile' && <ProfileModal profile={profile} onDone={finishBody}/>}
      {modal === 'note' && <NoteModal key={editingNote?.id ?? 'new'} note={editingNote} onDone={() => {setModal(null); setToast('Note saved.')}}/>}
      {modal === 'measurement' && <MeasurementModal profile={profile} onDone={finishBody}/>}
      {modal === 'program' && selectedDay && <ProgramModal key={selectedDay.id} day={selectedDay} onDone={() => {setModal(null); setToast('Training day updated.')}}/>}
      {modal === 'settings' && <div><div className="modal-eyebrow">YOUR DATA</div><h2>Settings & backup</h2><p className="modal-subtitle">Your data is saved on this device. Export a copy regularly. Importing a backup replaces the data currently on this device.</p><div className="settings-actions"><button className="secondary-button" onClick={() => exportData().then(() => setToast('Backup exported.')).catch(() => setToast('Export cancelled or unavailable. Try again.'))}><ArrowDownToLine size={18}/> Export backup</button><button className="secondary-button" onClick={() => importRef.current?.click()}><Upload size={18}/> Import backup</button><input ref={importRef} type="file" accept=".json,application/json" hidden onChange={async e => {const file=e.target.files?.[0]; if(!file)return; try{await importData(file);setModal(null);setToast('Backup imported.')}catch(error){setToast(error instanceof Error?error.message:'Import failed.')}e.target.value=''}}/></div><div className="info-box"><Shield size={17}/><span>Data stays on this device until you export it. Clearing app data or uninstalling can remove it, so keep a backup.</span></div></div>}
      {modal === 'transform' && <RankReveal key={`${transformDomain}-${transformRank}`} domain={transformDomain} preview={preview} rank={transformRank} onDone={finishReveal}/>}
      </Suspense>
    </motion.div></motion.div>}</AnimatePresence>
    {toast && <div className="toast" role="status"><Check size={16}/>{toast}</div>}
  </div>
}

export default App
