import * as React from "react";

import {
  useParams,
  useLocation
} from "react-router-dom";

import { List } from './List';
import { useSearchStore } from '../store/search-store'
import { NavBar } from "../navbar/NavBar";
const overlayTextFn = (overlayText) => {
  return (
    <>
        {overlayText && <span className={"overlay"}>
          <i className="fas fa-ruler pr-4"></i>
          {`${overlayText}`}
        </span>}
        </>
  )
}

export const VibranceView = () => {
  const params = useParams();
  const location = useLocation();
  const search = useSearchStore(state => state.search);
  let locationQuery = new URLSearchParams(location.search && location.search.substring(1) || '');
  search({type: 'vibrance', value: params.id, query: locationQuery.get('q') || ''});

  return ( 
  <>

      <NavBar />
    <List overlayTextFn={overlayTextFn}/>
  </>
  )
}
