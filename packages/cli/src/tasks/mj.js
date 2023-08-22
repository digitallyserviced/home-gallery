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
const { parse, basename } = require("path");
const { json } = require("stream/consumers");
const { syncMissingImages } = require("./fetch");
const readOrCreateDatabaseAsync = promisify(readOrCreateDatabase);

const updateImages = async (options) => {
  const {
    type, // = "upscaled",
    amount, // = 35,
    userId, // = "24a5b571-f522-46d2-a576-03de40895dbc",
    cookieFile, // = "",
    toDate, // = null,
    pages, // = null,
    jsonDir,
    jobFile,
  } = options;
  // if (!fs.existsSync(options.config.storage.json_dir)) {
  //   log.error(new Error("No json dir"), "Error looking up jsons:");
  // }
  const localDb = await readOrCreateDatabaseAsync(options.config.database.file).then((x) => {
    return x;
  });
  // const jsons = fs.readdirSync(options.config.storage.json_dir, { withFileTypes: true });
  // jsons.filter((v, i, a) => v.isFile() && v.name.substring(-4) === "json");
  // console.log(jsons);
  const gridSource = options.config.sources.find((v, i, a) => v.type === "upscale");
  const upscalesSource = options.config.sources.find((v, i, a) => v.type === "upscale");
  const localFiles = localDb.data.reduce((fileMap, entry) => {
    (entry.files || []).forEach((file) => (fileMap[file.filename] = true));
    return fileMap;
  });
  pipeline(
    fs.createReadStream(options.jobFile),
    parseJson(),
    flatten(),
    filter((entry) => entry.type.indexOf("upscale") > -1 && entry.current_status === "completed"),
    makeGridItem(gridSource, upscalesSource, options.config.storage.json_dir),
    filter((entry) => {
      const fn = entry.imgDests[Object.keys(entry.imgDests)[0]][0];
      // const fn = `${entry.parent_id}.png`
      const have = localFiles[fn];
      if (have) {
        log.info(Date.now(), `Already have ${fn}`);
      }
      return !have;
    }),
    each((x) => {
      preparePath(gridSource.dir, x.promptPath, x.jsonFileName);
      writeJobJson(options.config.storage.json_dir, x);
    }),
    toImageUrls(gridSource.dir),
    each((x) => {
      syncMissingImages(x);
    }),
    // syncMissingImages(gridSource.dir),
    // each(x => console.log(x)),
    purge(),
    (err) => err && console.log(err)
  );
};

const toImageUrls = (sourceDir) => {
  const urls = [];
  return new Transform({
    objectMode: true,
    transform(ch, _, cb) {
      for (const url in ch.imgDests) {
        if (ch.imgDests.hasOwnProperty(url)) {
          const img = ch.imgDests[url];
          const dst = path.join(img[1], img[0]);
          const item = {
            url,
            sourceDir,
            promptPath: ch.promptPath,
            fileName: img[0],
          };
          urls.push(item);
        }
      }
      cb(null);
    },
    flush(cb) {
      cb(null, urls);
    },
  });
};

const preparePath = (sourceDir, promptPath, fileName) => {
  const targetFilename = path.join(sourceDir, promptPath, fileName);
  const dir = path.dirname(targetFilename);
  try {
    fs.accessSync(dir);
  } catch (error) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const writeJobJson = (sourceDir, jsons) => {
  const { promptPath, jsonFileName } = jsons;
  const targetFilename = path.join(sourceDir, jsonFileName);
  const dir = path.dirname(targetFilename);
  try {
    fs.accessSync(dir);
  } catch (error) {
    fs.mkdirSync(dir, { recursive: true });
  }
  try {
    fs.writeFileSync(targetFilename, JSON.stringify(jsons));
  } catch (err) {
    log.error(err, `Error looking up jsons: ${err}`);
  }
};
const runUpdateImages = async (options, jobFile) => {
  const {
    type, // = "upscaled",
    userId, // = "24a5b571-f522-46d2-a576-03de40895dbc",
    jsonDir,
  } = options;
  const args = ["mj", "images"];
  args.push("--jsonDir", jsonDir);
  args.push("--jobFile", jobFile);

  await pm.runCli(args, 5 * (60 * 1000));
};

const getJsonFiles = (options) => {
  fs.readdirSync2;
};

const getMissingFiles = (remoteDatabase, localDatabase) => {
  const t0 = Date.now();
  log.trace(`Collecting local preview files`);
  const localFileMap = localDatabase.data.reduce((fileMap, entry) => {
    (entry.previews || []).forEach((file) => (fileMap[file] = true));
    return fileMap;
  }, {});

  log.trace(`Collecting missing remote preview files`);
  const missingRemoteFiles = remoteDatabase.data.reduce((files, entry) => {
    (entry.previews || []).forEach((file) => {
      if (!localFileMap[file]) {
        files.push(file);
      }
    });
    return files;
  }, []);

  log.debug(t0, `Found ${missingRemoteFiles.length} missing remote preview files`);
  return missingRemoteFiles;
};
const downloadMissingFiles = async (serverUrl, missingFiles, storageDir, { insecure }) => {
  if (!missingFiles.length) {
    log.info(`No missing files to download`);
    return;
  }

  const test = (file, cb) =>
    fs
      .access(path.join(storageDir, file))
      .then(() => {
        log.trace(`Skip downloading existing file ${file}`);
        cb(false);
      })
      .catch(() => cb(true));

  const task = (file, cb) =>
    fetchFile(serverUrl, file, storageDir, { insecure })
      .then(() => cb())
      .catch((err) => {
        log.error(err, `Could not fetch ${file} from remote: ${err}`);
        cb(err);
      });

  log.info(`Fetch ${missingFiles.length} files from ${serverUrl}`);
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    pipeline(Readable.from(missingFiles), parallel({ test, task, concurrent: 10 }), purge(), (err) =>
      err ? reject(err) : resolve()
    );
  }).then(() => {
    log.info(t0, `Fetched ${missingFiles.length} files from ${serverUrl}`);
  });
};

module.exports = {
  getMissingFiles,
  downloadMissingFiles,
  updateImages,
  runUpdateImages,
};
// const { Readable, pipeline } = require('stream')
// const getJobsFromJson = async () => {
//   return through(function (entry, _, cb) {
//     if (Array.isArray(entry)) {
//       for (let i = 0; i < entry.length; i++) {
//         this.push(entry[i]);
//       }
//     } else {
//       this.push(entry);
//     }
//     cb();
//   },x => {x()});
// }
// const dir = path.join(jsonDir);
// fs.mkdirSync(dir,{recursive:true})
// processIndicator({name:"job data"}).on('data',x => console.log(x)),
// const jfile = readJsonFile(options.jobFile, (err, data)=>{
//   // console.log(err,data)
// })
// pipeline(
//   Readable.from(localFiles),
//
// )
//           process.exit(0)
// if (!cookieFile || !fs.existsSync(cookieFile)) {
//   const err = new Error("No cookie file accessible");
//   log.error(err, `Failed to start server: ${err}`);
// }
// const cdata = fs.readFileSync(cookieFile, "utf8");
