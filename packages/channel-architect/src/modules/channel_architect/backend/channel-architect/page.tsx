"use client"

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { SCENARIO_LIST } from '../../lib/scenarios'
import type { AxisSettings, Scenario, Sections } from '../../lib/types'
import { getProgramVersionStateLabel } from '../../lib/programVersionState'

type Program = {
  id: string
  name: string
  ownerUserId: string
  status: string
  currentVersionNumber: number
  updatedAt: string
}
type ProgramVersion = {
  id: string
  versionNumber: number
  scenarioSnapshot: Scenario
  settingsSnapshot: AxisSettings
  outputSnapshot: Sections
  engineVersion: string
  createdBy: string
  createdAt: string
}
type ProgramReview = {
  id: string
  programVersionId: string
  decision: 'approved' | 'rejected'
  rationale: string
  reviewerUserId: string
  createdAt: string
}
type ProgramDetail = { program: Program; versions: ProgramVersion[]; reviews: ProgramReview[] }
type PilotCheckpoint = { id: string; title: string; dueDate: string; status: 'planned' | 'completed' | 'skipped' }
type Pilot = {
  id: string
  name: string
  cohortLabel: string
  ownerUserId: string
  programVersionId: string
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
  outcome: 'continue' | 'revise' | 'stop' | null
  targetStartDate: string
  targetEndDate: string | null
  checkpoints: PilotCheckpoint[]
}

const API = '/api/channel_architect/programs'
const PILOT_API = '/api/channel_architect/pilots'
const initialPreset = SCENARIO_LIST[0]

function messageFrom(result: unknown, fallback: string) {
  if (result && typeof result === 'object' && 'error' in result && typeof result.error === 'string') {
    return result.error
  }
  return fallback
}

export default function ChannelArchitectProgramsPage() {
  const [programs, setPrograms] = React.useState<Program[]>([])
  const [detail, setDetail] = React.useState<ProgramDetail | null>(null)
  const [selectedVersionId, setSelectedVersionId] = React.useState('')
  const [mode, setMode] = React.useState<'create' | 'revise' | null>(null)
  const [editingProgramId, setEditingProgramId] = React.useState('')
  const [presetId, setPresetId] = React.useState<Scenario['id']>(initialPreset.id)
  const [programName, setProgramName] = React.useState(`${initialPreset.label} Partner Program`)
  const [companyName, setCompanyName] = React.useState(initialPreset.label)
  const [arr, setArr] = React.useState(initialPreset.arr)
  const [motion, setMotion] = React.useState(initialPreset.motion)
  const [icp, setIcp] = React.useState(initialPreset.icp)
  const [ask, setAsk] = React.useState(initialPreset.ask)
  const [settings, setSettings] = React.useState<AxisSettings>(initialPreset.defaults)
  const [rationale, setRationale] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [pilots, setPilots] = React.useState<Pilot[]>([])
  const [pilotName, setPilotName] = React.useState('')
  const [cohortLabel, setCohortLabel] = React.useState('')
  const [pilotStartDate, setPilotStartDate] = React.useState('')
  const [pilotEndDate, setPilotEndDate] = React.useState('')
  const [checkpointDrafts, setCheckpointDrafts] = React.useState([{ title: '', dueDate: '' }])
  const [savingPilot, setSavingPilot] = React.useState(false)

  const selectedVersion = detail?.versions.find((version) => version.id === selectedVersionId) ?? detail?.versions[0]
  const selectedReview = detail?.reviews.find((review) => review.programVersionId === selectedVersion?.id)
  const canStartPilot = Boolean(selectedVersion && selectedReview?.decision === 'approved' && selectedVersion.versionNumber === detail?.program.currentVersionNumber)

  const refreshPrograms = React.useCallback(async () => {
    setLoading(true)
    const response = await apiCall(API, undefined, {})
    if (!response.ok || !response.result) {
      setNotice(messageFrom(response.result, 'Unable to load partner programs.'))
      setLoading(false)
      return
    }
    setPrograms(((response.result as { items?: Program[] }).items ?? []))
    setLoading(false)
  }, [])

  React.useEffect(() => { void refreshPrograms() }, [refreshPrograms])

  const refreshPilots = React.useCallback(async () => {
    const response = await apiCall(PILOT_API, undefined, {})
    if (response.ok && response.result) {
      setPilots(((response.result as { items?: Pilot[] }).items ?? []))
    }
  }, [])

  React.useEffect(() => { void refreshPilots() }, [refreshPilots])

  async function openProgram(program: Program) {
    setNotice('')
    const response = await apiCall(`${API}?id=${encodeURIComponent(program.id)}`, undefined, {})
    if (!response.ok || !response.result) {
      setNotice(messageFrom(response.result, 'Unable to load this program.'))
      return
    }
    const next = response.result as ProgramDetail
    setDetail(next)
    setSelectedVersionId(next.versions[0]?.id ?? '')
    setMode(null)
  }

  function beginCreate() {
    const seed = SCENARIO_LIST.find((item) => item.id === presetId) ?? initialPreset
    setEditingProgramId('')
    setCompanyName(seed.label)
    setArr(seed.arr)
    setMotion(seed.motion)
    setIcp(seed.icp)
    setAsk(seed.ask)
    setSettings(seed.defaults)
    setProgramName(`${seed.label} Partner Program`)
    setDetail(null)
    setNotice('')
    setMode('create')
  }

  function beginRevision() {
    if (!detail || !selectedVersion) return
    setEditingProgramId(detail.program.id)
    setCompanyName(selectedVersion.scenarioSnapshot.label)
    setArr(selectedVersion.scenarioSnapshot.arr)
    setMotion(selectedVersion.scenarioSnapshot.motion)
    setIcp(selectedVersion.scenarioSnapshot.icp)
    setAsk(selectedVersion.scenarioSnapshot.ask)
    setSettings(selectedVersion.settingsSnapshot)
    setProgramName(detail.program.name)
    setNotice('')
    setMode('revise')
  }

  function buildScenario(): Scenario {
    const seed = SCENARIO_LIST.find((item) => item.id === presetId) ?? initialPreset
    return { ...seed, id: 'custom', label: companyName.trim(), arr: arr.trim(), motion: motion.trim(), icp: icp.trim(), ask: ask.trim(), defaults: settings }
  }

  async function saveProgram() {
    setSaving(true)
    const scenario = buildScenario()
    const body = mode === 'create'
      ? { name: programName.trim(), scenario, settings }
      : { programId: editingProgramId, expectedVersion: detail?.program.currentVersionNumber, scenario, settings }
    const response = await apiCall(API, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }, {})
    if (!response.ok || !response.result) {
      setNotice(messageFrom(response.result, 'Could not save the program. Check your access and try again.'))
      setSaving(false)
      return
    }
    setNotice(mode === 'create' ? 'Program and version 1 created.' : 'A new immutable version was added.')
    setMode(null)
    setSaving(false)
    await refreshPrograms()
    if (mode === 'revise' && detail) await openProgram(detail.program)
  }

  async function decide(decision: 'approved' | 'rejected') {
    if (!selectedVersion) return
    const response = await apiCall(`${API}/${encodeURIComponent(selectedVersion.id)}/review`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ decision, rationale: rationale.trim() }),
    }, {})
    if (!response.ok || !response.result) {
      setNotice(messageFrom(response.result, 'Could not record the review. Confirm you have reviewer access.'))
      return
    }
    setRationale('')
    setNotice(`Version ${selectedVersion.versionNumber} was ${decision}.`)
    if (detail) await openProgram(detail.program)
    await refreshPrograms()
  }

  async function createPilot() {
    if (!selectedVersion || !pilotName.trim() || !cohortLabel.trim() || !pilotStartDate || checkpointDrafts.length === 0 || checkpointDrafts.some((checkpoint) => !checkpoint.title.trim() || !checkpoint.dueDate)) return
    setSavingPilot(true)
    const response = await apiCall(PILOT_API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        programVersionId: selectedVersion.id,
        name: pilotName.trim(),
        cohortLabel: cohortLabel.trim(),
        targetStartDate: pilotStartDate,
        targetEndDate: pilotEndDate || null,
        checkpoints: checkpointDrafts.map((checkpoint) => ({ title: checkpoint.title.trim(), dueDate: checkpoint.dueDate })),
      }),
    }, {})
    setSavingPilot(false)
    if (!response.ok || !response.result) {
      setNotice(messageFrom(response.result, 'Could not start the pilot. Confirm the selected version is approved.'))
      return
    }
    setPilotName('')
    setCohortLabel('')
    setPilotStartDate('')
    setPilotEndDate('')
    setCheckpointDrafts([{ title: '', dueDate: '' }])
    setNotice('Pilot and checkpoints created from the approved version.')
    await refreshPilots()
  }

  async function updatePilot(pilot: Pilot, status: 'active' | 'paused' | 'completed' | 'cancelled', outcome?: 'continue' | 'revise' | 'stop') {
    const response = await apiCall(`${PILOT_API}/${encodeURIComponent(pilot.id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, ...(outcome ? { outcome } : {}) }),
    }, {})
    if (!response.ok || !response.result) {
      setNotice(messageFrom(response.result, 'Could not update the pilot. Reload and try again.'))
      return
    }
    setNotice(`Pilot ${pilot.name} is now ${status}${outcome ? `, outcome: ${outcome}` : ''}.`)
    await refreshPilots()
  }

  async function updateCheckpoint(pilot: Pilot, checkpoint: PilotCheckpoint, status: 'completed' | 'skipped') {
    const response = await apiCall(`${PILOT_API}/${encodeURIComponent(pilot.id)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ checkpointId: checkpoint.id, status }),
    }, {})
    if (!response.ok || !response.result) {
      setNotice(messageFrom(response.result, 'Could not update this checkpoint.'))
      return
    }
    setNotice(`Checkpoint “${checkpoint.title}” marked ${status}.`)
    await refreshPilots()
  }

  return (
    <Page>
      <PageBody>
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Partner programs</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Draft, revise, and review partner-program designs. Generated guidance is a planning hypothesis, not a benchmark or commercial offer.
              </p>
            </div>
            {!mode && <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground" onClick={beginCreate}>New program</button>}
          </header>

          {notice && <p role="status" className="rounded-md border px-4 py-3 text-sm">{notice}</p>}

          {mode && (
            <section className="space-y-4 rounded-lg border bg-card p-5">
              <h2 className="text-lg font-medium">{mode === 'create' ? 'Create a partner program' : 'Create a new version'}</h2>
              {mode === 'create' && (
                <label className="block text-sm">Program name
                  <input className="mt-1 w-full rounded border bg-background px-3 py-2" value={programName} onChange={(event) => setProgramName(event.target.value)} maxLength={240} />
                </label>
              )}
              <label className="block text-sm">Starting scenario
                <select className="mt-1 w-full rounded border bg-background px-3 py-2" value={presetId} onChange={(event) => {
                  setPresetId(event.target.value as Scenario['id'])
                  const seed = SCENARIO_LIST.find((item) => item.id === event.target.value) ?? initialPreset
                  setCompanyName(seed.label); setArr(seed.arr); setMotion(seed.motion); setIcp(seed.icp); setAsk(seed.ask); setSettings(seed.defaults)
                }}>
                  {SCENARIO_LIST.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
                </select>
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                {([
                  ['Company / project', companyName, setCompanyName], ['ARR context', arr, setArr], ['Current sales motion', motion, setMotion], ['Ideal customer', icp, setIcp], ['Strategic partner goal', ask, setAsk],
                ] as const).map(([label, value, setValue]) => (
                  <label className="block text-sm" key={label}>{label}
                    <input className="mt-1 w-full rounded border bg-background px-3 py-2" value={value} onChange={(event) => setValue(event.target.value)} maxLength={240} />
                  </label>
                ))}
              </div>
              <label className="block text-sm">Program stage
                <select className="mt-1 w-full rounded border bg-background px-3 py-2" value={settings.stage} onChange={(event) => setSettings({ ...settings, stage: event.target.value as AxisSettings['stage'] })}>
                  {['Pre-PMF', 'Early Scale ($1-10M ARR)', 'Scaling ($10-50M ARR)', 'Mature ($50M+ ARR)'].map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </label>
              <div className="flex gap-2">
                <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50" onClick={() => void saveProgram()} disabled={saving || !companyName.trim() || !icp.trim() || !ask.trim()}>{saving ? 'Saving…' : mode === 'create' ? 'Create program' : 'Save new version'}</button>
                <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setMode(null)}>Cancel</button>
              </div>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.6fr)]">
            <section className="rounded-lg border bg-card p-4">
              <h2 className="mb-3 font-medium">Programs</h2>
              {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : programs.length === 0 ? <p className="text-sm text-muted-foreground">No programs yet. Create one to start a shared, versioned design.</p> : (
                <ul className="space-y-2">
                  {programs.map((program) => <li key={program.id}>
                    <button className={`w-full rounded border px-3 py-2 text-left ${detail?.program.id === program.id ? 'border-primary bg-muted' : ''}`} onClick={() => void openProgram(program)}>
                      <span className="block font-medium">{program.name}</span>
                      <span className="text-xs text-muted-foreground">v{program.currentVersionNumber} · {program.status}</span>
                    </button>
                  </li>)}
                </ul>
              )}
            </section>

            <section className="min-w-0 rounded-lg border bg-card p-4">
              {!detail || !selectedVersion ? <p className="text-sm text-muted-foreground">Select a program to inspect versions and review history.</p> : (
                <div className="space-y-5">
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div><h2 className="text-xl font-semibold">{detail.program.name}</h2><p className="text-xs text-muted-foreground">Owner user ID: {detail.program.ownerUserId}</p></div>
                    <button className="rounded-md border px-3 py-2 text-sm" onClick={beginRevision}>Create revision</button>
                  </header>
                  <div className="flex flex-wrap gap-2">
                    {detail.versions.map((version) => {
                      const review = detail.reviews.find((item) => item.programVersionId === version.id)
                      const stateLabel = getProgramVersionStateLabel(version.versionNumber, detail.program.currentVersionNumber, review?.decision)
                      return <button key={version.id} className={`rounded border px-3 py-1.5 text-sm ${selectedVersion.id === version.id ? 'border-primary bg-muted' : ''}`} onClick={() => setSelectedVersionId(version.id)}>
                        v{version.versionNumber} · {stateLabel}
                      </button>
                    })}
                  </div>
                  <div className="rounded-md border p-3 text-sm">
                    <p><strong>{selectedVersion.scenarioSnapshot.label}</strong> · engine {selectedVersion.engineVersion}</p>
                    <p className="mt-1 text-muted-foreground">Goal: {selectedVersion.scenarioSnapshot.ask}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Saved {new Date(selectedVersion.createdAt).toLocaleString()} · creator {selectedVersion.createdBy}</p>
                  </div>
                  {selectedReview ? <div className="rounded-md border p-3 text-sm"><p className="font-medium">{selectedReview.decision} by {selectedReview.reviewerUserId}</p><p className="mt-1">{selectedReview.rationale}</p></div> : (
                    <div className="space-y-3 rounded-md border p-3">
                      <label className="block text-sm">Review rationale
                        <textarea className="mt-1 min-h-24 w-full rounded border bg-background px-3 py-2" value={rationale} onChange={(event) => setRationale(event.target.value)} maxLength={8000} />
                      </label>
                      <div className="flex gap-2">
                        <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={!rationale.trim()} onClick={() => void decide('approved')}>Approve version</button>
                        <button className="rounded-md border px-3 py-2 text-sm disabled:opacity-50" disabled={!rationale.trim()} onClick={() => void decide('rejected')}>Reject version</button>
                      </div>
                      <p className="text-xs text-muted-foreground">The API requires reviewer permission. A decision applies only to this version.</p>
                    </div>
                  )}
                  {canStartPilot && (
                    <section className="space-y-3 rounded-md border p-4">
                      <div><h3 className="font-medium">Start a pilot from this approved version</h3><p className="mt-1 text-xs text-muted-foreground">The pilot keeps this exact version as its governing program. Do not enter individual partner or customer details in the cohort label.</p></div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block text-sm">Pilot name<input className="mt-1 w-full rounded border bg-background px-3 py-2" value={pilotName} onChange={(event) => setPilotName(event.target.value)} maxLength={160} /></label>
                        <label className="block text-sm">Cohort label<input className="mt-1 w-full rounded border bg-background px-3 py-2" value={cohortLabel} onChange={(event) => setCohortLabel(event.target.value)} maxLength={240} /></label>
                        <label className="block text-sm">Target start<input type="date" className="mt-1 w-full rounded border bg-background px-3 py-2" value={pilotStartDate} onChange={(event) => setPilotStartDate(event.target.value)} /></label>
                        <label className="block text-sm">Target end, optional<input type="date" className="mt-1 w-full rounded border bg-background px-3 py-2" value={pilotEndDate} onChange={(event) => setPilotEndDate(event.target.value)} /></label>
                      </div>
                      <fieldset className="space-y-3"><legend className="text-sm font-medium">Pilot checkpoints</legend>
                        {checkpointDrafts.map((checkpoint, index) => <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.5fr)_auto]" key={index}>
                          <label className="block text-sm">Checkpoint {index + 1}<input className="mt-1 w-full rounded border bg-background px-3 py-2" value={checkpoint.title} onChange={(event) => setCheckpointDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} maxLength={160} /></label>
                          <label className="block text-sm">Due date<input type="date" className="mt-1 w-full rounded border bg-background px-3 py-2" value={checkpoint.dueDate} onChange={(event) => setCheckpointDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, dueDate: event.target.value } : item))} /></label>
                          {checkpointDrafts.length > 1 && <button type="button" className="self-end rounded border px-3 py-2 text-sm" onClick={() => setCheckpointDrafts((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}
                        </div>)}
                        <button type="button" className="rounded border px-3 py-2 text-sm" disabled={checkpointDrafts.length >= 30} onClick={() => setCheckpointDrafts((current) => [...current, { title: '', dueDate: '' }])}>Add checkpoint</button>
                      </fieldset>
                      <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50" disabled={savingPilot || !pilotName.trim() || !cohortLabel.trim() || !pilotStartDate || checkpointDrafts.length === 0 || checkpointDrafts.some((checkpoint) => !checkpoint.title.trim() || !checkpoint.dueDate)} onClick={() => void createPilot()}>{savingPilot ? 'Saving…' : 'Create pilot'}</button>
                    </section>
                  )}
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">Generated design sections</summary>
                    <div className="mt-3 space-y-4">
                      {Object.entries(selectedVersion.outputSnapshot).map(([key, value]) => <section key={key} className="rounded border p-3">
                        <h3 className="mb-2 text-sm font-medium">{key.replaceAll('-', ' ')}</h3>
                        <pre className="whitespace-pre-wrap font-sans text-sm leading-6">{value}</pre>
                      </section>)}
                    </div>
                  </details>
                </div>
              )}
            </section>
          </div>

          <section className="space-y-3 rounded-lg border bg-card p-4">
            <div><h2 className="font-medium">Pilots</h2><p className="mt-1 text-sm text-muted-foreground">Each pilot is tied to an approved program version. Completion requires a continue, revise, or stop decision.</p></div>
            {pilots.length === 0 ? <p className="text-sm text-muted-foreground">No pilots yet. Approve the current version of a program to start one.</p> : (
              <ul className="space-y-3">
                {pilots.map((pilot) => <li key={pilot.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-medium">{pilot.name}</h3><p className="text-sm text-muted-foreground">{pilot.cohortLabel} · owner {pilot.ownerUserId} · {pilot.targetStartDate.slice(0, 10)}{pilot.targetEndDate ? ` to ${pilot.targetEndDate.slice(0, 10)}` : ''}</p><p className="mt-1 text-xs text-muted-foreground">Program version {detail?.versions.find((version) => version.id === pilot.programVersionId)?.versionNumber ?? 'linked'} · {pilot.status}{pilot.outcome ? ` · outcome: ${pilot.outcome}` : ''}</p></div>
                    <div className="flex flex-wrap gap-2">
                      {pilot.status === 'planned' && <><button className="rounded border px-3 py-1.5 text-sm" onClick={() => void updatePilot(pilot, 'active')}>Start</button><button className="rounded border px-3 py-1.5 text-sm" onClick={() => void updatePilot(pilot, 'cancelled')}>Cancel</button></>}
                      {pilot.status === 'active' && <><button className="rounded border px-3 py-1.5 text-sm" onClick={() => void updatePilot(pilot, 'paused')}>Pause</button><button className="rounded border px-3 py-1.5 text-sm" onClick={() => void updatePilot(pilot, 'cancelled')}>Cancel</button>{(['continue', 'revise', 'stop'] as const).map((outcome) => <button key={outcome} className="rounded border px-3 py-1.5 text-sm disabled:opacity-50" disabled={pilot.checkpoints.some((checkpoint) => checkpoint.status === 'planned')} onClick={() => void updatePilot(pilot, 'completed', outcome)}>Complete: {outcome}</button>)}</>}
                      {pilot.status === 'paused' && <><button className="rounded border px-3 py-1.5 text-sm" onClick={() => void updatePilot(pilot, 'active')}>Resume</button><button className="rounded border px-3 py-1.5 text-sm" onClick={() => void updatePilot(pilot, 'cancelled')}>Cancel</button></>}
                    </div>
                  </div>
                  {pilot.status === 'active' && pilot.checkpoints.some((checkpoint) => checkpoint.status === 'planned') && <p className="mt-2 text-xs text-muted-foreground">Complete or skip all checkpoints before recording an outcome.</p>}
                  <ul className="mt-3 space-y-2">
                    {pilot.checkpoints.map((checkpoint) => <li key={checkpoint.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>{checkpoint.title} · due {checkpoint.dueDate.slice(0, 10)} · {checkpoint.status}</span>
                      {checkpoint.status === 'planned' && (pilot.status === 'active' || pilot.status === 'paused') && <span className="flex gap-2"><button className="rounded border px-2 py-1 text-xs" onClick={() => void updateCheckpoint(pilot, checkpoint, 'completed')}>Complete</button><button className="rounded border px-2 py-1 text-xs" onClick={() => void updateCheckpoint(pilot, checkpoint, 'skipped')}>Skip</button></span>}
                    </li>)}
                  </ul>
                </li>)}
              </ul>
            )}
          </section>
        </div>
      </PageBody>
    </Page>
  )
}
