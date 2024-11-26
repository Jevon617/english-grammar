let currentRange = null

export function saveSelection(range) {
  currentRange = range
}

export function restoreSelection() {
  if (currentRange) {
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(currentRange)
    currentRange = null
  }
}
