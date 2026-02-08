export function formatDuration(seconds: number): string {
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`
  }
  return `${seconds.toFixed(1)}s`
}

export function formatLUFS(lufs: number): string {
  return `${lufs.toFixed(1)} LUFS`
}

export function formatSampleRate(sr: number): string {
  if (sr >= 1000) {
    return `${(sr / 1000).toFixed(1)}kHz`
  }
  return `${sr}Hz`
}

export function downloadJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getContrastColor(bgColor: string): string {
  // Simple contrast calculation for red theme
  return bgColor.includes('red') || bgColor.includes('primary') ? 'white' : 'black'
}

export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
