import * as React from "react";
import { useState, useMemo, useEffect, useRef } from "react";

import { useEntryStore } from "../store/entry-store";
import { useEditModeStore } from '../store/edit-mode-store';

import { FluentList } from "./FluentList";
import { NavBar } from "../navbar/NavBar";
import { Scrollbar } from "./scrollbar";

import useBodyDimensions from '../utils/useBodyDimensions';
import { useDeviceType, DeviceType } from "../utils/useDeviceType";
import { fluent } from "./fluent";
import { useParams } from "react-router-dom";

const NAV_HEIGHT = 44
const BOTTOM_MARGIN = 4

const useViewHeight = (offset) => {
  const getHeight = () => (document.documentElement.clientHeight)+ offset
  const [height, setHeight] = useState(getHeight())

  const onResize = () => setHeight(getHeight())

  useEffect(() => {
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return height
}

const mobileRowHeights = {minHeight: 75, maxHeight: 110, maxPotraitHeight: 185}
const desktopRowHeights = {minHeight: 120, maxHeight: 200, maxPotraitHeight: 280}
export const defaultOverlayTextFn = (overlayText) => {
  return (
  <>
  </>
  )
}
export const List = (props) => {
  const params = useParams()
  const entries = useEntryStore(state => state.entries)

  const showSelected = useEditModeStore(state => state.showSelected);
  const selectedIds = useEditModeStore(state => state.selectedIds);

  const containerRef = useRef(window)

  const { width, height } = useBodyDimensions();
  const [ deviceType ] = useDeviceType();

  const viewHeight = height - NAV_HEIGHT - BOTTOM_MARGIN
  const padding = 8

  const visibleEntries = useMemo(() => {
    if (!showSelected) {
      return entries
    }
    return entries.filter(entry => selectedIds[entry.id])
  }, [showSelected, selectedIds, entries])

  const rows = useMemo(() => {
    const rowHeights = deviceType === DeviceType.MOBILE ? mobileRowHeights : desktopRowHeights
    // const result = 
    return fluent(visibleEntries, {padding, width, ...rowHeights});
    // const minHeight = 168
 //    const result = fluent(visibleEntries, {padding, width, ...rowHeights});
 //    const sk = params.sortKey || 'similarity'
 //    const flitems = result.map(x => {
 //      x.columns = x.columns.sort((a,b)=>a[sk]-b[sk])
 //      return x
 //    }).sort((a,b) => a.columns[0][sk]-b.columns[0][sk])
 //    // flitems.sort()
	// let lastTop = 0
	// flitems.forEach(row => {
	// 	row.top = lastTop
	// 	lastTop += row.height + padding
	// })
 //    return flitems
  }, [width, visibleEntries, deviceType])

  const topItems = useMemo(() => {
    let sk = params.sortKey?params.sortKey:'date'
    return rows.map(({top, height, columns}) => {
      const item = columns[0].item
      if (item.colorDistance > 0){
        sk="colorDistance"
      }
      if (item.similarity > 0){
        sk="similarity"
      }
      let val = item[sk]
      if (val > 0){
        val=val.toFixed(2)
      }
      return {top, height ,date: item.date || 0, dateValue: '1970',value:val}
    })
  }, [rows])

  const overlayTextFn=props.overlayTextFn ? props.overlayTextFn:  defaultOverlayTextFn

  return (
    <>
      <div style={{paddingTop: NAV_HEIGHT}}>
        <Scrollbar containerRef={containerRef}
          style={{marginTop: NAV_HEIGHT, marginBottom: BOTTOM_MARGIN}}
          pageHeight={viewHeight}
          topItems={topItems} />
        <FluentList rows={rows} padding={padding}  overlayTextFn={overlayTextFn}/>
      </div>
    </>
  )
}
