import * as React from "react";
import { useMemo, useEffect } from "react";

import {
  useParams,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";

import { NavBar } from '../navbar/NavBar';
import { List } from '../list/List';
import { useEntryStore } from '../store/entry-store'
import { useSearchStore } from '../store/search-store'

interface SortInfo {
  sortKey:number,
  value: number,
  count: number,
  images: number,
  videos: number
}
const sortFns = {
  "width": {
    reduce: (result, {type, width}) => {
      if (!result[width]){
        result[width]={sortKey:"width",width, count:0,images:0,videos:0}
      }
      const info=result[width]
      info.count++
      switch (type) {
        case 'image':
        case 'rawImage': info.images++; break;
        case 'video': info.videos++
      }
      return result;
    },
    sort: (a,b) => b.width > a.width
  }
}
export const Sorts = () => {
  const params = useParams();
  const sortKey = params.sortKey||"width";
  // const value = +params.value||"width";

  const allEntries = useEntryStore(state => state.allEntries);
  const navigate = useNavigate();

  const sortInfos: SortInfo[] = useMemo(() => {
    const fns = sortFns[sortKey]
    const sort2info = allEntries.reduce(fns.reduce,[])

    return Object.values(sort2info).sort(fns.sort)
  }, [allEntries]);

  return (
    <>
      <NavBar disableEdit={true} />
      <h2 style={{marginTop: '40px'}}>Sorts</h2>
      <ul className="menu">
        {sortInfos.map(({sortKey,value, count, images, videos}) => {
          return <li className="-list" key={value}>
            <Link to={`/sorts/${sortKey}/${value}`}>{value} - {count} media</Link>
            { images > 0 &&
              <a onClick={() => navigate(`/sorts/${sortKey}/${value}?q=image`)}><i className="fas fa-image"></i> <span className="hide-sm">{images} images</span></a>
            }
            { videos > 0 &&
              <a onClick={() => navigate(`/sorts/${sortKey}/${value}?q=video`)}><i className="fas fa-play"></i> <span className="hide-sm">{videos} videos</span></a>
            }
          </li>
        })}
      </ul>
    </>
  )
}

export const SortsView = () => {
  const params = useParams();
  const location = useLocation();
  const search = useSearchStore(state => state.search);
  const sortKey = params.sortKey||"width";
  const value = params.value;

  useEffect(() => {
    let locationQuery = new URLSearchParams(location.search && location.search.substring(1) || '');
    search({type: 'query', value: `${sortKey}:${value}`, query: locationQuery.get('q') || '',sort:{key:sortKey,dir:'desc'}});
  }, [params, location])

  return (
  <>

      <NavBar />
    <List />
  </>
  )
}
