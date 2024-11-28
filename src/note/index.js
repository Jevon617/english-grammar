/* eslint-disable no-undef */
import Mark from './mark/index'
import { restoreSelection, saveSelection } from './selection'
import { getCurrentPageStorage, removeStorage, setStorage } from './storage'
import { computePosition, flip, shift, offset, autoUpdate } from '@floating-ui/dom'
import { detectDevice } from './utlis'

const tooltipEl = document.querySelector('#tooltip')
const anchorEl = document.querySelector('#anchor')
const mainEl = document.querySelector('main')
const noteEl = document.querySelector('#note')
const colorElList = document.querySelectorAll('.color-btn')
const modalEl = document.querySelector('.modal')
const commentEl = document.querySelector('.comment')
const inputEl = document.querySelector('.comment-input')
const referenceText = document.querySelector('.reference-text')
const isPc = detectDevice() === 'Desktop'
const noteModalEl = document.querySelector('.note-modal')
const listEl = document.querySelector('.note-modal .list')
const closeEl = document.querySelector('.note-modal .close')

modalEl.addEventListener('click', hideModal)
closeEl.addEventListener('click', hideNoteModal)

commentEl.addEventListener('click', (e) => {
  e.stopPropagation()
})

inputEl.addEventListener('blur', () => {
  window.scroll(0, 0)
  if (inputEl.value) {
    record(inputEl.value)
  }
  hideModal()
})

function hideModal() {
  inputEl.value = ''
  modalEl.style.display = 'none'
}

function showModal() {
  modalEl.style.display = 'block'
}

const tag = 'mark-el'
const dataList = getCurrentPageStorage()
const instance = new Mark(document.querySelector('main'), {
  tagName: 'mark-el'
})

let cleanup

instance.automark(dataList)

;['touchstart', 'mousedown'].forEach(event => {
  noteEl.addEventListener(event, showInput)
  mainEl.addEventListener(event, hideTooltip)

  colorElList.forEach(el => {
    el.addEventListener(event, () => {
      const type = el.getAttribute('data-type')
      record('', type)
    })
  })
})

;['touchend', 'mouseup'].forEach(event => {
  noteEl.addEventListener(event, (e) => {
    e.stopPropagation()
  })
  colorElList.forEach(el => {
    el.addEventListener(event, (e) => {
      e.stopPropagation()
    })
  })
  mainEl.addEventListener(event, onSelectEnd)
})

mainEl.addEventListener('click', (e) => {
  const target = e.target.closest(tag)
  if (!target) return
  showNoteModal(target.getAttribute('markkey'))
})

function showInput(e) {
  e.stopPropagation()
  const text = window.getSelection().toString()
  showModal()
  referenceText.innerHTML = text
  hideTooltip(0)
  if (isPc) {
    setTimeout(() => {
      inputEl.focus()
    })
  } else {
    inputEl.focus()
  }
}

function record(note, type = 'modify') {
  restoreSelection()
  const data = instance.mark(type)
  if (data) {
    data.note = note
    dataList.push(data)
  }
  setStorage(dataList)
  hideTooltip(0)
}

function onSelectEnd() {
  const selection = window.getSelection()
  if (selection.rangeCount > 0 && selection.toString().length !== 0) {
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    anchorEl.style.cssText = `
      left: ${rect.left - mainEl.offsetLeft}px;
      top: ${rect.top + mainEl.scrollTop}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      position: absolute;
    `
    saveSelection(range)
    showTooltip()
  }
}

function update() {
  computePosition(anchorEl, tooltipEl, {
    placement: 'bottom',
    middleware: [
      offset(8),
      flip(),
      shift({ padding: 5 })
    ]
  }).then(({ x, y }) => {
    Object.assign(tooltipEl.style, {
      left: `${x}px`,
      top: `${y}px`
    })
  })
}

function showTooltip() {
  tooltipEl.style.display = 'block'
  cleanup = autoUpdate(anchorEl, tooltipEl, update)
}

function hideTooltip(delay = 0) {
  setTimeout(() => {
    if (tooltipEl.style.display === 'block') {
      tooltipEl.style.display = ''
      cleanup && cleanup()
    }
  }, delay)
}

// 创建笔记元素
function generateNoteList(key) {
  listEl.innerHTML = ''
  const noteList = dataList.map(note => {
    const listItem = document.createElement('div')
    listItem.className = 'list-item'
    listItem.setAttribute('key', note.key)
    listItem.setAttribute('data-type', note.type)

    listItem.innerHTML = `
        <div class="header">
          <div class="name">Zoey</div>
          <div class="all-note">
            <div class="delete">
              <svg class="icon" width="200px" height="200.00px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="rgb(237 215 215)" d="M202.666667 256h-42.666667a32 32 0 0 1 0-64h704a32 32 0 0 1 0 64H266.666667v565.333333a53.333333 53.333333 0 0 0 53.333333 53.333334h384a53.333333 53.333333 0 0 0 53.333333-53.333334V352a32 32 0 0 1 64 0v469.333333c0 64.8-52.533333 117.333333-117.333333 117.333334H320c-64.8 0-117.333333-52.533333-117.333333-117.333334V256z m224-106.666667a32 32 0 0 1 0-64h170.666666a32 32 0 0 1 0 64H426.666667z m-32 288a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V437.333333z m170.666666 0a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V437.333333z" /></svg>
            </div>
            <div class="context">
              <svg class="icon" width="200px" height="200.00px" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path fill="rgb(237 215 215)" d="M905.051942 837.81301c0 99.208711-79.753791 180.384645-179.92956 185.845676l-10.808288 0.341314H190.737848C89.083051 1023.943114 5.916116 946.237209 0.284429 848.393756L0 837.81301V186.357647C0 87.148936 79.696906 5.802344 179.929559 0.341314L190.737848 0h523.633131c105.067941 0 190.624076 83.622021 190.624077 186.414533a47.385812 47.385812 0 0 1-47.784012 46.816954 47.442698 47.442698 0 0 1-47.897784-46.87384c0-48.409755-38.170324-88.286651-86.750736-92.382423l-8.134659-0.341315H190.737848c-49.661241 0-90.505194 37.373924-94.714738 84.759736l-0.341315 7.964002v651.455363c0 48.352869 38.284095 88.286651 86.864508 92.325538l8.191545 0.341314h523.690017c52.33487 0 94.885395-41.526582 94.885395-92.666852 0-25.769235 21.502805-46.816955 47.840898-46.816954a47.442698 47.442698 0 0 1 47.385812 40.900839l0.455086 5.916115zM1023.943114 512.028443c0 19.113605-6.826287 37.487695-18.942947 51.766013l-108.53797 116.957058a47.670241 47.670241 0 0 1-33.733237 13.766346 47.897783 47.897783 0 0 1-33.847009-13.766346 46.07744 46.07744 0 0 1-4.26643-61.493473l4.095773-4.550858 53.472585-55.8049h-486.37298A47.385812 47.385812 0 0 1 347.913116 511.971557a47.385812 47.385812 0 0 1 41.981668-46.418754l5.916115-0.341315 484.097551 4.66463-50.969613-62.744959a45.963669 45.963669 0 0 1 0-66.271873 48.466641 48.466641 0 0 1 62.744958-4.095773l4.949059 4.26643 102.735626 113.2026C1015.068941 469.307261 1023.943114 490.127437 1023.943114 511.971557z" /></svg>
            </div>
          </div>
        </div>
        <div class="original">
          <span>原文:</span>
          <span class="original-content">${note.content}</span>
        </div>
        ${note.note ? `<div class="note-content">${note.note}</div>` : ''}
      `
    return listItem
  })

  listEl.append(...noteList)
  const curEl = listEl.querySelector(`div[key="${key}"]`)
  noteModalEl.scrollTop = curEl ? curEl.offsetTop : 0
}

listEl.addEventListener('click', (e) => {
  const target = e.target
  const deleteTarget = e.target.closest('.delete')
  const contextTarget = e.target.closest('.context')
  const parent = target.closest('.list-item')

  if (contextTarget && parent) {
    const key = parent.getAttribute('key')
    hideNoteModal()
    const markEl = mainEl.querySelector(`mark-el[markkey="${key}"]`)
    markEl && (mainEl.scrollTop = markEl.offsetTop)
  }

  if (deleteTarget && parent) {
    const key = parent.getAttribute('key')
    const markEl = mainEl.querySelector(`mark-el[markkey="${key}"]`)
    markEl.removeAttribute('marktype')
    parent.remove()
    removeStorage(key)
  }
})

function showNoteModal(key) {
  mainEl.style.overflowY = 'hidden'
  noteModalEl.style.display = 'block'
  generateNoteList(key)
}

function hideNoteModal() {
  mainEl.style.overflowY = 'scroll'
  noteModalEl.style.display = 'none'
}

