
const fs = require("fs");
const { createWriteStream } = require("fs");
const path = require("path");
const { Readable, pipeline, Transform } = require("stream");

const {
  parallel,
  purge,
  through,
  parseJson,
  processIndicator,
  toList,
  flatten,
  map,
  filter,
} = require("@home-gallery/stream");

const log = require("@home-gallery/logger")("cli.mjfetch");
const { load, mapArgs } = require("./../config");
const { CliProcessManager } = require("../utils/cli-process-manager");
const { readDatabase } = require("@home-gallery/database");
const pm = new CliProcessManager();

const { readOrCreateDatabase, writeDatabase, mergeEntries } = require("@home-gallery/database");
const { promisify } = require("@home-gallery/common");
const { readJsonFile, makeGridItem } = require("./stream");
const { parse } = require("path");
const { updateImages } = require("./mj");
const readOrCreateDatabaseAsync = promisify(readOrCreateDatabase);
const hdrs = (cdata) => ({
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Google Chrome\";v=\"111\", \"Not(A:Brand\";v=\"8\", \"Chromium\";v=\"111\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Linux\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "cookie":cdata,
    "Referer": "https://www.midjourney.com/app/jobs/4009438e-510e-4026-99de-dd97c7bf87fb/",
    "Referrer-Policy": "origin-when-cross-origin"
  })
const getMjRecentJob = async (params, options) => {
  const params = {
    cookieFile:'/home/chris/.config/home-gallery/cookie.txt', // = "",
    jsonDir,
  } // = params;
  const dir = path.join(jsonDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!cookieFile || !fs.existsSync(cookieFile)) {
    const err = new Error("No cookie file accessible");
    log.error(err, `Failed to start server: ${err}`);
  }
  const cdata = fs.readFileSync(cookieFile, "utf8");
    cookieFile:'/home/chris/.config/home-gallery/cookie.txt', // = "",
  fetch("https://www.midjourney.com/api/app/job-status/", {
  "headers": hdrs,
  "body": "{\"jobIds\":[\"4009438e-510e-4026-99de-dd97c7bf87fb\"]}",
  "method": "POST"
});const dateTo = `${toDate ? "&toDate=" + new Date("-2 min").toTimeString() : ""}`;
  if (!pages) {
    pages = { from: 1, to: 300 };
  }
  const getFetch = (url, idx, targetFilename) => {
    const getHeaders = function (cdata) {
      return {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Linux"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        cookie: cdata,
        Referer: "https://www.midjourney.com/app/",
        "Referrer-Policy": "origin-when-cross-origin",
      };
    };
    const getFetched = function (url, headers) {
      return fetch(url, {
        headers: headers,
        body: null,
        method: "GET",
      })
        .then((res) => {
          if (!res.ok) {
            const err = new Error(`HTTP status code is ${res.status}`);
            log.error(err, `Failed to start server: ${err}`);
          }
          return res.json();
        })
        .catch((err) => {
          log.warn(err, `Failed to fetch ${file} from remote ${url}: ${err}. Continue`);
        })
        .then((res) => {
          if (!res.length) {
            return;
          }
          if (res.length) {
            res.status = "jsons";
          }
          return new Promise((resolve, reject) => {
            pipeline(JSON.stringify(res), createWriteStream(targetFilename,{flags:"w+"}), (err) => {
              return err ? reject(err) : resolve(targetFilename);
            });
          });
        }).catch((err)=>{
          log.error(err, `Failed to write file ${err}`);
          
        });
    };
    return getFetched(url, getHeaders(cdata));
  };

  const getUrl = function (i) {
    return `https://www.midjourney.com/api/app/recent-jobs/?amount=${amount}&dedupe=true&page=${i}&jobStatus=completed&orderBy=new&prompt=undefined&refreshApi=0&searchType=advanced&service=null&type=all&userId=${userId}&user_id_ranked_score=null&_ql=todo&_qurl=https%3A%2F%2Fwww.midjourney.com%2Fapp%2F${dateTo}`;
  };
  const fetches = [];
  const jobsTpl = `jobs_${userId}_${type}_${amount}`;
  for (let i = pages.from; i < pages.to; i++) {
    const file = path.join(jsonDir, `${jobsTpl}_${i}.json`);
    const url = getUrl(i);
    const getter = (resolve, reject) => {
      return function () {
        return getFetch(url, i, file)
          .then((res) => {
            log.debug(Date.now(), `Fetched file ${file} from remote #${i} * 35`);
            resolve(res);
          })
          .catch((err) => {
            log.warn(err, `Failed to fetch ${file} from remote ${url}: ${err}. Continuing`);
            reject(err);
          });
      };
    };
    fetches[i] = new Promise((resolve, reject) => {
      const to = 700 * i + Math.random() * 500;
      log.info(Date.now(), `started page #${i} fetcher queued for ${(to / 1000).toFixed(2)}s from now`);
      // setImmediate(function () {
        setTimeout(getter(resolve, reject), to);
      // });
    });
  }

  return Promise.all(fetches)
  // const shits = await Promise.all(fetches);
  // return shits;
};
