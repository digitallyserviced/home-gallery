import { ScrollbarOverviewItem } from "./state"

import { formatDate } from '../../utils/format'

const isInDateOrder = items => {
  const isDesc = items[0].date > items[items.length - 1].date
  const outOfOrderItem = items.find((item, i, a) => {
    if (i == 0) {
      return false
    }
    const prevItem = a[i - 1]
    return prevItem.date != item.date && isDesc != prevItem.date > item.date
  })
  return !outOfOrderItem
}

const HOUR_MS = 1000 * 60 * 60
const DAY_MS = HOUR_MS * 24

const setDateValue = items => {
  const firstDate = new Date(items[0].date)
  const lastDate = new Date(items[items.length - 1].date)
  const diff = Math.abs(lastDate.getTime() - firstDate.getTime())
  const hourDiff = Math.ceil(diff / HOUR_MS)
  const dayDiff = Math.ceil(diff / DAY_MS)

  let dateValueFn
  if (hourDiff < 6) {
    dateValueFn = date => formatDate('%H:%M:%S', date)
  } else if (hourDiff <= 24) {
    dateValueFn = date => formatDate('%H:%M', date)
  } else if (dayDiff < 90) {
    dateValueFn = date => formatDate('%d.%m.%y', date)
  } else if (dayDiff < 700) {
    dateValueFn = date => formatDate('%b %Y', date)
  } else {
    dateValueFn = date => formatDate('%Y', date)
  }

  items.forEach(item => item.dateValue = dateValueFn(item.date))
}

export interface TopItem {
  top: number,
  height: number,
  value?: string,
  date?: string,
  dateValue?: string,
  sortKey?: string
}

export const overviewItemMapper = (topItems: TopItem[], viewHeight: number, padding: number, params: any): [ScrollbarOverviewItem[], (number) => string] => {
  if (!topItems.length) {
    return [[], () => '']
  }

  // if (!isInDateOrder(topItems)) {
  //   return [[], () => '']
  // }
  setDateValue(topItems)

  const lastItem = topItems[topItems.length - 1]
  const maxTop = (lastItem.top + lastItem.height) - viewHeight

  const itemTopToOverviewTop = top => padding + (viewHeight - 2 * padding) * top / maxTop

  const isNextOverviewItem = (lastOverviewItem, item) => {
    if (!lastOverviewItem) {
      return true
    }
    // Skip on same date value
    if (lastOverviewItem.text == item.value) {
      return false
    }
    // Skip if distance is to low
    const overviewTop = itemTopToOverviewTop(item.top)
    if (overviewTop - lastOverviewItem.top < 30) {
      return false
    }

    return true
  }

  const overviewItems: ScrollbarOverviewItem[] = []
  let lastOverviewItem: ScrollbarOverviewItem
  for (let i = 0; i < topItems.length; i++) {
    const item = topItems[i]
    if (isNextOverviewItem(lastOverviewItem, item)) {
      lastOverviewItem = {type: 'text', top: itemTopToOverviewTop(item.top), text: item.value}
      overviewItems.push(lastOverviewItem)
    }
  }

  const detailTextFn = (scrollTop) => {
    const lastItem = topItems.filter(item => item.top <= scrollTop).pop()
    return `${lastItem?.value ? lastItem?.value : formatDate('%d.%m.%y', lastItem?.value)}`
  }

  return [overviewItems, detailTextFn]
}
