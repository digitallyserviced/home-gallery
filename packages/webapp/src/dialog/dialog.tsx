import * as React from "react";
import { useState, useReducer, useEffect } from "react";

import { useEventStore } from '../store/event-store'
import { useEntryStore } from '../store/entry-store'
import { TagInput } from "./tag-input";
import { Tag } from "../api/models";
import { RecentTags } from "./recent-tags";
import { MultiTagHelp, SingleTagHelp } from "./tag-dialog-help";
import { useDialogStore } from "./tag-dialog-store";


export const Dialog = ({visible, title, onCancel, onSubmit, children}) => {
  return (
    <div className={`modal ${visible ? '-visible' : ''}`}>
      <div className="modal__backdrop"></div>
      <div className="modal__overlay">
        <div className="dialog text">
          <div className="dialog__header">
            <h3>{title}</h3>
            <button className="button -closeable" onClick={onCancel}><i className="fas fa-times"></i></button>
          </div>
          <form autoComplete="off" onSubmit={onSubmit}>
            <div className="dialog__scroll-container">
              <div className="dialog__content">
                {children}
              </div>
            </div>
            <div className="dialog__footer -grey">
              <div className="button-group -right">
                <button className="button -primary">Submit</button>
                <a className="link button -link" onClick={onCancel}>Cancel</a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

