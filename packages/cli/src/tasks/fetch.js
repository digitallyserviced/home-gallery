const fs = require("fs/promises");
const { createWriteStream } = require("fs");
const path = require("path");
const { Readable, pipeline, Transform } = require("stream");
const fetch = require("node-fetch");

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
  each,
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
const { json } = require("stream/consumers");

const syncMissingImages = (missingFiles) => {
  const test = (file, cb) =>{
    const {sourceDir,promptPath,fileName} = file
    return fs
      .access(path.join(sourceDir, promptPath,fileName))
      .then(() => {
        log.trace(`Skip downloading existing file ${fileName}`);
        cb(false);
      })
      .catch(() => cb(true));
  }

  const task = (file, cb) =>{

    const {sourceDir,promptPath,fileName,url} = file
    return fetchFile({sourceDir,promptPath,fileName,url})
      .then(() => cb())
      .catch((err) => {
        log.error(err, `Could not fetch ${file} from remote: ${err}`);
        cb(err);
      });
  }

  log.info(`Fetch ${missingFiles.length} files `);
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    pipeline(Readable.from(missingFiles), parallel({ test, task, concurrent: 10 }), purge(), (err) =>
      err ? reject(err) : resolve()
    );
  }).then(() => {
    log.info(t0, `Fetched ${missingFiles.length} files`);
  });
}


const fetchFile = async ({url, fileName, sourceDir,promptPath}) => {
  log.trace(`Fetching ${fileName} from remote ${url}...`);
  const targetFilename = path.join(sourceDir, promptPath,fileName);
  const dir = path.dirname(targetFilename);
  await fs
    .access(dir)
    .then(() => true)
    .catch(() => fs.mkdir(dir, { recursive: true }));

  // const url = `${url}`;
  const t0 = Date.now();
  return fetch(url)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP status code is ${res.status}`);
      }
      return res;
    })
    .then((res) => {
      return new Promise((resolve, reject) => {
        // console.log(res.type);resolve(true)
        pipeline(res.body, createWriteStream(targetFilename), (err) => (err ? reject(err) : resolve()));
      });
    })
    .then(() => log.info(t0, `Fetched file ${fileName} from remote ${url}`))
    .catch((err) => log.warn(err, `Failed to fetch ${fileName} from remote ${url}: ${err}. Continue`));
};

module.exports={
  fetchFile,syncMissingImages
}
