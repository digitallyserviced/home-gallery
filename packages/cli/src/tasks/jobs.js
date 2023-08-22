
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
const getMjRecentJobs = async (params, options) => {
  const {
    type, // = "upscaled",
    amount, // = 35,
    userId, // = "24a5b571-f522-46d2-a576-03de40895dbc",
    cookieFile, // = "",
    toDate, // = null,
    pages, // = null,
    jsonDir,
  } = params;
  const dir = path.join(jsonDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!cookieFile || !fs.existsSync(cookieFile)) {
    const err = new Error("No cookie file accessible");
    log.error(err, `Failed to start server: ${err}`);
  }
  const cdata = fs.readFileSync(cookieFile, "utf8");
  const dateTo = `${toDate ? "&toDate=" + new Date("-2 min").toTimeString() : ""}`;
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

async function getJobs(argv) {
  const { cookieFile, sourcePath, userId, type, all } = argv;
    const options = await load(argv.config, true);
      const args = {
        jsonDir: options.config.storage.json_dir,
        cookieFile,
        amount: 35,
        type,
        pages: { from: 1, to: 12 },
        toDate: null,
        userId,
    config:options.config,
      };
  const run = (argv) => {
    const sources = options.config.sources
      .find((x) => /(?:all|grids|upscales)/.test(x.type))
      // .filter((x) => (!sourcePath ? true : sourcePath === x.dir));
    const srcFetches = [sources].map((x, i, a) => {
      return getMjRecentJobs(args)
        .then((rres) => {
          const t0 = Date.now();
          log.info(
            t0,
            `Fetched pages ${args.pages.from} to ${args.pages.to} with ${args.amount}  ${args.type} types of jobs`
          );
          return rres.filter(x => !!x)
        })
        .catch((err) => {
          log.error(err, `Fetch failed from ${options.serverUrl}: ${err}`);
        });
    });
    return Promise.all(srcFetches).then((res) => {
      console.log(res);
      log.info(`Fetched ${res.length} sources for ${userId} successfully finished with `);
      return res
    }).catch(err => log.error(err, `WtF ${err}`));
  };

  return run(argv)
    .then((res) => {
      log.info(`Jobs retrieval complete`);
      return res.reduce((acc,v) => {
if (!acc){
          acc=[]
        }
        return acc.concat(...v);
        
      })
      return res
    })
    .catch((err) => {
      log.error(err, `Jobs retrieval failed with error: ${err}`);
    }).then((res)=>{
      return res.map((v,i,a) => {
      const opts = {...args,jobFile:v}
        return updateImages(opts)
      })
      console.trace(res)
      return res
    });
}
module.exports={getJobs,getMjRecentJobs}
