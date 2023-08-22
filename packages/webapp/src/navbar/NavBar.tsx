import * as React from "react";
import { useEditModeStore, ViewMode  } from '../store/edit-mode-store'

import { ViewNavBar } from './ViewNavBar';
import { EditNavBar } from './EditNavBar';

export const NavBar = ({disableEdit = false,comparing=undefined}:{[keys:string]:any}) => {
  const viewMode = useEditModeStore(state => state.viewMode);

  return (
    <>
      { viewMode === ViewMode.VIEW &&
        <ViewNavBar disableEdit={disableEdit} comparing={comparing}/>
      }
      { viewMode === ViewMode.EDIT &&
        <EditNavBar  comparing={comparing}/>
      }
    </>
  )
}
