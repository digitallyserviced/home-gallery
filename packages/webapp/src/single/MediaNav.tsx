import * as React from "react";
import { useEffect } from "react";

import useBodyDimensions from "../utils/useBodyDimensions";
import { useSearchStore } from "../store/search-store";

import { getLowerPreviewUrl } from "../utils/preview";
import { Link } from "react-router-dom";

export const MediaNav = ({ current, prev, next, listLocation, showNavigation, dispatch }) => {
  const { width } = useBodyDimensions();
  const query = useSearchStore((state) => state.query);

  const loadImage = async (url: string | false) => {
    return new Promise((resolve) => {
      if (!url) {
        return resolve(true);
      }
      const img = new Image();
      img.addEventListener("load", resolve);
      img.addEventListener("error", resolve);
      img.src = url;
    });
  };

  useEffect(() => {
    let abort = false;
    const large = width <= 1280 ? 1280 : 1920;

    const preloadPrevNext = async () => {
      if (!abort) {
        await Promise.all([
          loadImage(getLowerPreviewUrl(next?.previews, 320)),
          loadImage(getLowerPreviewUrl(prev?.previews, 320)),
        ]);
      }
      if (!abort) {
        await Promise.all([
          loadImage(getLowerPreviewUrl(next?.previews, large)),
          loadImage(getLowerPreviewUrl(prev?.previews, large)),
        ]);
      }
    };

    const timerId = setTimeout(preloadPrevNext, 100);

    return () => {
      clearTimeout(timerId);
      abort = true;
    };
  }, [prev, next]);

  const buttonClass = `mediaNav__button ${showNavigation ? "" : "-transparent"}`;

  const hasGeo = current?.latitude && current?.longitude && current.latitude != 0 && current.longitude != 0;

  return (
    <>
      {prev && (
        <div className="mediaNav -left">
          <a
            onClick={() => dispatch({ type: "prev" })}
            className={buttonClass}
            title="Show previous media (left arrow)"
          >
            <i className="fas fa-chevron-left fa-2x"></i>
          </a>
        </div>
      )}
      {next && (
        <div className="mediaNav -right">
          <a onClick={() => dispatch({ type: "next" })} className={buttonClass} title="Show next media (right arrow)">
            <i className="fas fa-chevron-right fa-2x"></i>
          </a>
        </div>
      )}
      <div className="mediaNav -bottom">
        {listLocation && (
          <a onClick={() => dispatch({ type: "list" })} className={buttonClass} title="Show media stream (ESC)">
            <i className="fas fa-th fa-2x"></i>
          </a>
        )}
        {hasGeo && (
          <a onClick={() => dispatch({ type: "map" })} className={buttonClass} title="Show map of entry (m)">
            <i className="fas fa-map fa-2x"></i>
          </a>
        )}
        {current?.similarityHash && (
          <Link
            to={`/similar/${current.shortId}?q=similarity>0.9 order by similarity desc`}
            className={buttonClass}
            reloadDocument
            title="Show similar images  > 0.90 (s)"
          >
            <i className="fas fa-crosshairs fa-2x"></i>
            <span className="fas">90% Similar</span>
          </Link>
        )}
        {current?.similarityHash && (
          <Link
            to={`/similar/${current.shortId}?q=similarity>0.70 order by similarity desc`}
            className={buttonClass}
            reloadDocument
            title="Show similar images  > 0.70 (s)"
          >
            <i className="fas fa-copy fa-2x"></i>
            <span className="fas">75% Similar</span>
          </Link>
        )}
        {current?.vibrance.length && (
          <Link
            to={`/vibrance/${current.shortId}?q=vibrance<100 order by vibrance asc`}
            className={buttonClass}
            reloadDocument
            title="Color distance < 100"
          >
            <i className="fas fa-fill fa-2x"></i> 
            <span className="fas">&lt;100 Color Dist.</span>
          </Link>
        )}
        {query.type != "none" && (
          <a onClick={() => dispatch({ type: "chronology" })} className={buttonClass} title="Show chronology (c)">
            <i className="fas fa-clock fa-2x"></i>
          </a>
        )}
        {current && (
          <a onClick={() => dispatch({ type: "toggleDetails" })} className={buttonClass} title="Show detail info (i)">
            <i className="fas fa-info fa-2x"></i>
          </a>
        )}
      </div>
    </>
  );
};
