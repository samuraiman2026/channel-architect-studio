"use client"

import * as React from 'react'
import { Page, PageBody } from '@open-mercato/ui/backend/Page'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import { SCENARIO_LIST } from '../../lib/scenarios'
import type { AxisSettings, Scenario, Sections } from '../../lib/types'

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

const API = '/api/channel_architect/programs'
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

  const selectedVersion = detail?.versions.find((version) => version.id === selectedVersionId) ?? detail?.versions[0]
  const selectedReview = detail?.reviews.find((review) => review.programVersionId === selectedVersion?.id)

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
                    {detail.versions.map((version) => <button key={version.id} className={`rounded border px-3 py-1.5 text-sm ${selectedVersion.id === version.id ? 'border-primary bg-muted' : ''}`} onClick={() => setSelectedVersionId(version.id)}>
                      v{version.versionNumber}{detail.reviews.find((review) => review.programVersionId === version.id) ? ` · ${detail.reviews.find((review) => review.programVersionId === version.id)?.decision}` : ' · pending review'}
                    </button>)}
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
        </div>
      </PageBody>
    </Page>
  )
}
