const KEY = '__astro__english__grammar__'

export function getStorage() {
  let res = localStorage.getItem(KEY)
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
  localStorage.setItem(KEY, JSON.stringify(originStorage))
}

export function getSingleStorage(key) {
  const id = generateBase64Id()
  const originStorage = getStorage()
  const data = originStorage[id] || []
  const index = data.findIndex(item => item.key === key)
  if (index > -1) {
    return { data: data[index], index }
  } else {
    return null
  }
}

function generateBase64Id() {
  const currentUrl = window.location.href
  return btoa(currentUrl)
}

export function removeStorage(key) {
  const id = generateBase64Id()
  const originStorage = getStorage()
  const data = originStorage[id] || []
  const index = data.findIndex(item => item.key === key)
  if (index > -1) {
    data.splice(index, 1)
  }
  localStorage.setItem(KEY, JSON.stringify(originStorage))
}
