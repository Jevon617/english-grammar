const key = '__astro__english__grammar__'

export function getStorage() {
  let res = localStorage.getItem(key)
  try {
    res = JSON.parse(res) || {}
    return res
  } catch {
    return {}
  }
}

export function getCurrentPageStorage() {
  const id = generateBase64Id()
  const res = getStorage()
  return res[id] || []
}

export function setStorage(storage) {
  const id = generateBase64Id()
  const originStorage = getStorage()
  originStorage[id] = storage || []
  localStorage.setItem(key, JSON.stringify(originStorage))
}

function generateBase64Id() {
  const currentUrl = window.location.href
  return btoa(currentUrl)
}
