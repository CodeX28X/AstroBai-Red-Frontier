import { useEffect, useState } from 'react'

const settingsKey = 'astrobai.developerA.ui-settings.v1'
interface UiSettings { readonly largeText: boolean; readonly reducedMotion: boolean; readonly readAloud: boolean; readonly sound: boolean }
const defaults: UiSettings = {largeText:false,reducedMotion:false,readAloud:true,sound:false}
function readSettings(): UiSettings {
  if (typeof window === 'undefined') return defaults
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(settingsKey) ?? 'null')
    if (typeof value !== 'object' || value === null) return defaults
    return {...defaults,...Object.fromEntries(Object.entries(value).filter(([key,item]) => key in defaults && typeof item === 'boolean'))}
  } catch { return defaults }
}
// Only UI preferences. No game save, identifiers, decisions, or resource fields.
export function useUiSettings() {
  const [settings,setSettings]=useState<UiSettings>(readSettings)
  useEffect(() => {try {window.localStorage.setItem(settingsKey,JSON.stringify(settings))} catch {/* Storage may be unavailable; in-memory settings still work. */}},[settings])
  function change(key: keyof UiSettings,value: boolean) {setSettings(previous=>({...previous,[key]:value}))}
  return {settings,change}
}
