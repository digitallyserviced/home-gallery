const fs = require("fs");
const path = require("path");

const log = require("@home-gallery/logger")("storage.entryFile");

// const { readDir } = require("@home-gallery/common");
const crypto = require("crypto");
const { map } = require("@home-gallery/stream");

const toSha1 = (buffer) => {
  var shasum = crypto.createHash("sha1");
  shasum.update(buffer);
  return shasum.digest("hex");
};

function readJsonFile(filename, cb) {
  fs.readFile(filename, { encoding: "utf8" }, (err, buf) => {
    if (err) {
      return cb(err);
    }
    let json;
    try {
      json = JSON.parse(buf.toString());
    } catch (e) {
      return cb(e);
    }
    cb(null, json);
  });
}

function readJsonFiles(storageDir, filenames, cb) {
  const meta = {};
  let remaining = filenames.length;

  if (!remaining) {
    return cb(null, meta);
  }

  filenames.forEach((filename) => {
    readJsonFile(path.join(storageDir, filename), (err, json) => {
      if (err) {
        log.error(`Could not parse ${filename}: Error: ${err}. Continue`);
      } else {
        const name = getMetaKeyName(filename);
        meta[name] = json;
      }

      remaining--;
      if (!remaining) {
        cb(null, meta);
      }
    });
  });
}

const fromJobsJson = (jobFile, _, cb) => {
  log.info(`Reading jobs from from ${jobFile}`);
  const stream = fs.createReadStream(jobFile);
  cb(null, stream);
};

// const readStream = (indexFilename, journal, cb) => {
//   const journalFilename = getJournalFilename(indexFilename, journal)
//   const asStream = ifThen(cb => exists(indexFilename, cb), cb => fromIndex(indexFilename, cb))
//   const asJournalOrStream = ifThenElse(cb => exists(journalFilename, cb), cb => fromJournal(indexFilename, journal, cb), asStream)
//
//   return journal ? asJournalOrStream(cb) : asStream(cb)
// }

const appendStream = (nextStream) => {
  const output = new PassThrough({ objectMode: true });

  output.setMaxListeners(0);

  const append = (stream) => {
    if (!stream) {
      return output.readable && output.end();
    }
    stream.once("end", () => nextStream(append));
    stream.once("error", output.emit.bind(output, "error"));
    stream.pipe(output, { end: false });
  };

  nextStream(append);
  return output;
};

const readStreams = (indexFilenames, journal, cb) => {
  let i = 0;
  const nextStream = (cb) => {
    if (i == indexFilenames.length) {
      return cb();
    }
    const filename = indexFilenames[i++];
    fromJobsJson(filename, journal, (err, stream) => {
      if (err && err.code === "ENOENT") {
        log.warn(`File '${filename}' does not exist. Continue`);
      } else if (err) {
        log.warn(`Could not read job file index '${filename}': ${err}. Continue`);
      } else {
        return cb(stream);
      }

      if (i < indexFilenames.length) {
        return nextStream(cb);
      } else {
        return cb();
      }
    });
  };

  const stream = appendStream(nextStream);
  cb(null, stream);
};

const makeGridItem = (gridSource, upscalerSource,jsonDir) =>
  map(
    ({
      id,
      image_paths,
      type,
      grid_id,
      grid_num,
      parent_id,
      event,
      current_status,
      enqueue_time,
      full_command,
      ...rest
    }) => {
      const { _parsed_params: params, _job_type: job_type } = rest;
      // const grid_image = `https://cdn.midjourney.com/${id}/grid_0.png`;
      // const trimPrompt = Array.isArray(event.textPrompt) ? event.textPrompt.join(",") : event.textPrompt;
      // const promptPath = event.textPrompt
      //   .map((item) => {
      //     return toSha1(item).substring(0, 3);
      //   })
      //   .join("/");
      const promptPath = parent_id || 'parentless'
      // image_paths.push(grid_image);
      const imgDests = {};

      const pathTpl = `${gridSource.dir}/${promptPath}`;
      const jsonJobDir = `${jsonDir}/${promptPath}`
      // for (let index = 0; index < image_paths.length; index++) {
        const img = image_paths[0];
        const gridPos = img.substring(img.lastIndexOf("/") + 1);
        const jsonFileName = `${id}_${gridPos}.json`
        imgDests[img] = [`${id}/${gridPos}`, `${pathTpl}`];
      // }
      const gridItem = {
        jsonJobDir,
        jsonFileName,
        imgDests,
        pathTpl,
        promptPath,
        id,
        type,
        grid_id,
        grid_num,
        current_status,
        enqueue_time,
        full_command,
        parent_id,
        event,
        params,
        job_type,
        children: [],
      };
      return gridItem;
    }
  );

module.exports = {
  readJsonFile,
  readJsonFiles,
  makeGridItem,
  readStreams,
  appendStream,
};
