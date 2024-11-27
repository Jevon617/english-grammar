/* eslint-disable no-undef */
import Mark from './mark/index'
import { restoreSelection, saveSelection } from './selection'
import { getCurrentPageStorage, setStorage } from './storage'
import { computePosition, flip, shift, offset, arrow, autoUpdate } from '@floating-ui/dom'
import { detectDevice } from './utlis'

const tooltipEl = document.querySelector('#tooltip')
const arrowEl = document.querySelector('#arrow')
const anchorEl = document.querySelector('#anchor')
const mainEl = document.querySelector('main')
const noteEl = document.querySelector('#note')
const decorationEl = document.querySelector('#decoration')
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

// const decorationEl = document.querySelector('#decoration')
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
  decorationEl.addEventListener(event, () => {
    record('', 'decoration')
  })
})

;['touchend', 'mouseup'].forEach(event => {
  noteEl.addEventListener(event, (e) => {
    e.stopPropagation()
  })
  decorationEl.addEventListener(event, (e) => {
    e.stopPropagation()
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
      offset(16),
      flip(),
      shift({ padding: 5 }),
      arrow({ element: arrowEl })
    ]
  }).then(({ x, y, placement, middlewareData }) => {
    Object.assign(tooltipEl.style, {
      left: `${x}px`,
      top: `${y}px`
    })

    const { x: arrowX, y: arrowY } = middlewareData.arrow

    const staticSide = {
      top: 'bottom',
      right: 'left',
      bottom: 'top',
      left: 'right'
    }[placement.split('-')[0]]

    Object.assign(arrowEl.style, {
      left: arrowX != null ? `${arrowX}px` : '',
      top: arrowY != null ? `${arrowY}px` : '',
      right: '',
      bottom: '',
      [staticSide]: '-4px'
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

    listItem.innerHTML = `
        <div class="header">
          <div class="name">Zoey</div>
          <div class="all-note">上下文</div>
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
  const parent = target.closest('.list-item')

  if (e.target.closest('.all-note') && parent) {
    const key = parent.getAttribute('key')
    hideNoteModal()
    const markEl = mainEl.querySelector(`mark-el[markkey="${key}"]`)
    markEl && (mainEl.scrollTop = markEl.offsetTop)
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

