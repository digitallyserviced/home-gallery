import * as React from "react";

import {
  useParams,
  useLocation
} from "react-router-dom";

import { List } from './List';
import { useSearchStore } from '../store/search-store'
import { NavBar } from "../navbar/NavBar";
import { useEntryStore } from "../store/entry-store";

const overlayTextFn = (overlayText) => {
  return (
    <>
        {overlayText && <span className={"overlay"}>
          <i className="fas fa-copy pr-4"></i>
          {`${overlayText}`}
        </span>}
        </>
  )
}
export const SimilarView = () => {
  const params = useParams();
  const allEntries = useEntryStore.getState().allEntries
    const seedEntry = allEntries.find(entry => entry.id.startsWith(params.id))
  const location = useLocation();
  const search = useSearchStore(state => state.search);
  let locationQuery = new URLSearchParams(location.search && location.search.substring(1) || '');
  search({type: 'similar', value: params.id, query: locationQuery.get('q') || ''});

  return ( 
  <>

      <NavBar comparing={seedEntry}/>
    <List overlayTextFn={overlayTextFn}/>
  </>
  )
}
