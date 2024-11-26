import { hasNodeName, getKey, hasOnlyLinefeed, removeExtraSpace } from './utils'
import { addClass } from './utils/jq'
import Create from './create'

export default class Mark extends Create {
  constructor(textareaElem, options) {
    super(options)
    if (textareaElem === null) {
      throw (new Error('TextareaElem does not exist'))
    }
    const defaultOpt = {
      tagName: 'mark',
      debug: false
    }
    this.options = Object.assign(defaultOpt, this.options)
    this.textareaElem = textareaElem
    this.innerData = { points: [] }
  }

  mark(type, options) {
    if (type === 'exchange') {
      if (options && options.points && options.points.length > 0) {
        this.innerData.points = options.points.sort((a, b) => (a - b))
      } else {
        throw (new Error('Required parameter options.points'))
      }
    }
    return this._mark(type)
  }

  automark(list, options) {
    if (list && list.length > 0) {
      let index = 0
      const draw = () => {
        const data = list[index]
        const rangeData = this._getRangeData(data.startOffset, data.endOffset)
        const selection = window.getSelection()
        const range = window.document.createRange()
        const sr = rangeData.startRange
        const er = rangeData.endRange
        try {
          range.setStart(sr.node, sr.offset)
          range.setEnd(er.node, er.offset)
          selection.addRange(range)
        } catch (error) {
          console.error(error)
          console.error(`${JSON.stringify(data)}`)
        }
        const newdata = this._mark(data.type, data)
        if (options && options.afterEach) {
          options.afterEach(newdata)
        }
        if ((++index) <= list.length - 1) {
          draw()
        } else {
          options && options.after && options.after()
        }
      }
      // 开始标记前，清除所有选中状态（按钮和输入框被点击后也是选中状态）
      window.getSelection().removeAllRanges()
      draw()
    }
  }

  getContent() {
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)
    let text = ''
    if (range) {
      text = range.toString()
    }
    return text.replace(/\n/g, '').trim()
  }

  innerText() {
    let content = ''
    const count = nodes => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.nodeType === 3 && !hasOnlyLinefeed(node.nodeValue)) {
          content += node.nodeValue
        } else if (node.nodeType === 1) {
          count(node.childNodes)
          if (hasNodeName(node, 'p')) {
            content += '\n'
          }
        }
      }
    }
    count(this.textareaElem.childNodes)
    return removeExtraSpace(content)
  }

  _mark(type, extendData) {
    const selection = window.getSelection()
    let data
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const hasOneOffset = range.startContainer === range.endContainer && range.startOffset === range.endOffset
      const targetElems = this.create(this.options.tagName, selection)
      if (targetElems.length > 0) {
        if (extendData) {
          data = extendData
        } else {
          data = this._getData(targetElems[0], targetElems[targetElems.length - 1])
          data.content = hasOneOffset ? '缺漏' : data.content
          data.points = type === 'exchange' ? this.innerData.points : []
          data.key = getKey()
          data.type = hasOneOffset ? 'missing' : type
        }
        this._setElems(targetElems, data)
      }
    }
    return data
  }

  _setElems(elems, data) {
    if (elems && elems.length > 0) {
      const draw = data.type === 'exchange' ? this._drawExchange(data) : null
      elems.forEach(elem => {
        elem.setAttribute('markkey', data.key)
        elem.setAttribute('marktype', data.type)
        addClass(elem, `mark-error mark-${data.type}`)
        draw && draw(elem)
      })
    }
  }

  _drawExchange(data) {
    let index = 0
    const points = data && data.points || this.innerData.points
    const text = data && data.content.replace(/\n/g, '')
    return function fn(elem) {
      const nodes = Array.prototype.slice.call(elem.childNodes)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (node.nodeType === 3 && !hasOnlyLinefeed(node.nodeValue)) {
          const value = node.nodeValue
          const fNode = document.createDocumentFragment()
          for (let i = 0; i < value.length; i++) {
            let className = ''
            const iElem = document.createElement('i')
            iElem.innerHTML = value.charAt(i)
            if (index === 0) {
              className = 'left'
            } else if (index === text.length - 1) {
              className = 'right'
            }
            addClass(iElem, className)
            if (index === points[0]) {
              className = 'focus focus1'
            } else if (points[1] && index === points[1] + 1) {
              className = 'focus focus2'
            } else if (index < points[0] || (points[1] && index > points[1] + 1)) {
              className = 'top'
            } else {
              className = 'bottom'
            }
            addClass(iElem, className)
            iElem.setAttribute('marktype', data.type)
            fNode.appendChild(iElem)
            index++
          }
          node.parentNode.replaceChild(fNode, node)
        } else if (node.nodeType === 1) {
          fn(node)
        }
      }
    }
  }

  _getData(startElem, endElem) {
    let sum = 0
    let content = ''
    let startOffset = null
    let endOffset = null
    let length = null

    const count = nodes => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (endOffset !== null) {
          break
        }
        if (node.nodeType === 3 && !hasOnlyLinefeed(node.nodeValue)) {
          const text = removeExtraSpace(node.nodeValue)
          sum += text.length
          content += startOffset !== null ? text : ''
        } else if (node.nodeType === 1) {
          if (node === startElem) {
            startOffset = sum
          }
          if (node === endElem) {
            const t = node.innerText
            endOffset = sum + t.length
            length = endOffset - startOffset
            content += t
          }
          count(node.childNodes)
          if (!endOffset && hasNodeName(node, 'p')) {
            sum++
            content += '\n'
          }
        }
      }
    }

    count(this.textareaElem.childNodes)

    return {
      content: content.trim(),
      startOffset,
      endOffset,
      length
    }
  }

  _getRangeData(startOffset, endOffset) {
    let sum = 0
    let startRange = null
    let endRange = null

    const count = nodes => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (endRange !== null) {
          break
        }
        if (node.nodeType === 3 && !hasOnlyLinefeed(node.nodeValue)) {
          const sum2 = sum
          const text = removeExtraSpace(node.nodeValue)
          sum += text.length
          if (!startRange && sum >= startOffset) {
            const offset = startOffset - sum2
            startRange = { node, offset: offset < 0 ? 0 : offset }
          }
          if (!endRange && sum >= endOffset) {
            const offset = endOffset - sum2
            endRange = { node, offset: offset < 0 ? 0 : offset }
          }
        } else if (node.nodeType === 1) {
          count(node.childNodes)
          if (!endRange && hasNodeName(node, 'p')) {
            sum++
          }
        }
      }
    }

    count(this.textareaElem.childNodes)

    return {
      startRange,
      endRange
    }
  }
}
