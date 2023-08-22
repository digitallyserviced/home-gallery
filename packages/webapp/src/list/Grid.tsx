import * as React from "react";
import {useRef, useLayoutEffect} from "react";
import { FixedSizeGrid as Grid } from 'react-window';

import useBodyDimensions from '../utils/body-dimensions';
// import {Media} from './Media';
import { useLastLocation } from '../utils/lastLocation/useLastLocation';
import { useEntryStore } from "../store/entry-store";

export interface IMediaGridProps {
  media: any[]
}
//
// export class ErrorBoundary extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { hasError: false };
//   }
//
//   static getDerivedStateFromError(error) {
//     // Update state so the next render will show the fallback UI.
//     return { hasError: true };
//   }
//
//   componentDidCatch(error, errorInfo) {
//     // You can also log the error to an error reporting service
//     console.log(error, errorInfo);
//   }
//
//   render() {
//     if (this.state.hasError) {
//       // You can render any custom fallback UI
//       return <h1>Something went wrong.</h1>;
//     }
//
//     return this.props.children; 
//   }
// }
// {height, width, index, item, items}
import {Cell as FCell} from './FluentList'
const Cell = ({ data, columnIndex, rowIndex, style ,size,width,height,defaultMediaHeight,defaultMediaWidth}) => {
  const index = columnIndex + data.columns * rowIndex;
  const item = data.media[index]
  if (!item) {
    return (<div style={style}>Empty {index} cI:{columnIndex} cc:{data.columns} r:{rowIndex}</div>)
  } else {
  const url = getOrigUrl(item.files)
    return (
      <div style={{width:defaultMediaWidth,height:defaultMediaHeight}}>
        <FCell item={data.media[index]} index={index} items={data.media} width={defaultMediaWidth} height={defaultMediaHeight} url={url} />
        </div>
    )
  }
};
// <Media media={data.media} index={index} size={data.size} style={style}/>


import {
  useParams,
  useLocation
} from "react-router-dom";

// import { List } from './List';
import { useSearchStore } from '../store/search-store'
import { getOrigUrl } from "../utils/preview";

export const MediaGrid = () => {
  // const params = useParams();
  // const location = useLocation();
  // const search = useSearchStore(state => state.search);
  // let locationQuery = new URLSearchParams(location.search && location.search.substring(1) || '');
  // search({type: 'similar', value: params.id, query: locationQuery.get('q') || ''});
  const entries = useEntryStore(state => state.entries)

  return ( 
    <Gridd media={entries} />
  )
}
export const Gridd = (props: IMediaGridProps) => {
  const { width, height } = useBodyDimensions();

  const defaultMediaWidth = width > 800 ? 240 : 120;
  const fontSize = 12;
  const lineHeight = 1.5;
  const lineCount = 3;
  const descriptionHeight = lineCount * fontSize * lineHeight;
  const defaultMediaHeight = defaultMediaWidth + (defaultMediaWidth === 240 ? descriptionHeight : 0);
  const columns = Math.floor(width / defaultMediaWidth);
  const rows = Math.ceil(props.media.length / columns);
  const data = {columns, media: props.media, size: defaultMediaWidth,width,height,defaultMediaHeight,defaultMediaWidth};

  const gridRef = useRef(null);

  const lastLocation = useLastLocation();

  useLayoutEffect(() => {
    const match = lastLocation ? lastLocation.pathname.match(/\/([a-z0-9]{40})\b/) : false;
    if (match && columns) {
      const lastIndex = props.media.map(m => m.id).indexOf(match[1]);
      const rowIndex = Math.floor(lastIndex / columns);
      // gridRef.current.scrollToItem({rowIndex, align: "center"});
    }
  }, [gridRef])

  console.log(`width: ${width}, height: ${height}, defaultMediaWidth: ${defaultMediaWidth}, columns: ${columns}`);

  const style = {
    'paddingTop': '40px'
  }

  return (
    <>
      <Grid
        ref={gridRef}
        columnCount={columns}
        columnWidth={defaultMediaWidth}
        height={height}
        width={width}
        rowCount={rows}
        rowHeight={defaultMediaHeight}

        itemData={data}
        style={style}
      >
        {Cell}
      </Grid>
    </>
  );
}
