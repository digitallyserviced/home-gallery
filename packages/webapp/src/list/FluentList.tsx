import * as React from "react";
import { Ref, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSingleViewStore } from '../store/single-view-store'
import { useEditModeStore, ViewMode } from '../store/edit-mode-store'
import Hammer from 'hammerjs';

import { useLastLocation } from '../utils/lastLocation/useLastLocation'
import useBodyDimensions from '../utils/useBodyDimensions';
import { VirtualScroll } from "./VirtualScroll";
import { humanizeDuration } from "../utils/format";
import { getHigherPreviewUrl, getWidthFactor } from '../utils/preview';
import { defaultOverlayTextFn } from "./List";

export const Cell = ({height, width, index, item, items,url,overlayTextFn}) => {
  const ref = useRef();
  const location = useLocation();
  const viewMode = useEditModeStore(state => state.viewMode);

  const selectedIdMap = useEditModeStore(state => state.selectedIds);
  const toggleId = useEditModeStore(store => store.toggleId);
  const toggleRange = useEditModeStore(store => store.toggleRange);
  const {id, shortId, previews, vibrantColors, type, duration, similarity,overlayText } = item;
  const style = { height, width, backgroundColor: (vibrantColors && vibrantColors[1]) || 'inherited' }
  const navigate = useNavigate();

  const widthFactor = getWidthFactor(width, height);
  const previewUrl = url || getHigherPreviewUrl(previews, width * widthFactor);

  const showImage = () => {
    navigate(`/view/${shortId}`, {state: {listLocation: location, index}});
  }

  const onClick = (selectRange) => {
    if (viewMode === ViewMode.EDIT) {
      if (selectRange) {
        toggleRange(id);
      } else {
        toggleId(id);
      }
    } else {
      showImage();
    }
  }

  const isSelected = () => {
    return viewMode === ViewMode.EDIT && selectedIdMap[id];
  }

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }
    const element = ref.current;
    const hammer = new Hammer(element);
    let scrollYStart = 0;

    hammer.on('hammer.input', (e) => {
      if (e.isFirst) {
        scrollYStart = window.scrollY;
      }
    })
    hammer.on('tap press', (e) => {
      const scrollYDiff = Math.abs(scrollYStart - window.scrollY);
      if (scrollYDiff < 10) {
        const selectRange = (e.pointerType === "mouse" && e.srcEvent.shiftKey) || e.type === 'press';
        onClick(selectRange);
      }
    });

    return () => {
      if (!hammer) {
        return;
      }
      hammer.stop(false);
      hammer.destroy();
    }
  });

  if(!overlayTextFn) overlayTextFn=defaultOverlayTextFn
  return (
    <div ref={ref} key={id} className={`fluent__cell ${isSelected() ? '-selected' : ''}`} style={style} onMouseOver={(e) => {}}>
      {overlayTextFn(overlayText)}
      <img style={style} src={previewUrl} loading="lazy" />
      {type == 'video' &&
      }
    </div>
  )
}

const VideoCell = (props) => {
    const ref:Ref<HTMLVideoElement> = useRef(null);
  const [focus, setFocus] = useState(false);

  const loop = () => {
    if (ref.current)
    ref.current.play();
  };

  const onEndedLoop = () => {
    if (focus) loop(); // when ended check if its focused then loop
  };

  useEffect(() => {
    if (focus) loop(); // when focused then loop
  }, [focus]);

  return (
    <>
      <video
        id="video"
        ref={ref}
        style={{ width: "300px" }}
        autoPlay
        onMouseOver={() => setFocus(true)}
        onMouseOut={() => setFocus(false)}
        muted={true}
        src={testVideo}
        onEnded={onEndedLoop}
      ></video>
        <span className="_detail">
          <i className="fas fa-play pr-4"></i>
          {humanizeDuration(duration)}
        </span>
    </>
  );
}

const Row = (props) => {
  const style = {
    height: props.height
  }
  const columns = props.columns;
  const {overlayTextFn} = props
  return (
    <div className='fluent__row' style={style}>
      {columns.map((cell, index) => <Cell key={index} width={cell.width} height={cell.height} item={cell.item} index={cell.index} items={cell.items}  overlayTextFn={overlayTextFn}/>)}
    </div>
  )
}

const findCellById = (rows, id) => {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const cell = rows[rowIndex]?.columns?.find(cell => cell.item.id.startsWith(id));
    if (cell) {
      return [cell, rowIndex]
    }
  }
  return [null, -1]
}

export const FluentList = ({rows, padding,overlayTextFn}) => {
  const { width } = useBodyDimensions();

  const lastViewId = useSingleViewStore(state => state.lastId);
  const [lastRowIndex, setLastRowIndex] = useState(-1)

  const virtualScrollRef = useRef(null);

  useLayoutEffect(() => {
    if (!lastViewId) {
      return
    }
    const [cell, rowIndex] = findCellById(rows, lastViewId)
    if (cell && lastRowIndex != rowIndex) {
      console.log(`MediaFluent:useLayoutEffect scroll to ${lastViewId} in row ${rowIndex}`)
      virtualScrollRef.current.scrollToRow({rowIndex});
      setLastRowIndex(rowIndex)
    } else if (!cell) {
      console.log(`MediaFluent:useLayoutEffect could not find entry with ${lastViewId}`)
    }
  }, [virtualScrollRef, rows, lastViewId])

  return (
    <div className="fluent" style={{width}}>
      <VirtualScroll ref={virtualScrollRef} items={rows} padding={padding} >
        {({row}) => <Row height={row.height} columns={row.columns} overlayTextFn={overlayTextFn}></Row>}
      </VirtualScroll>
    </div>
  )
}
