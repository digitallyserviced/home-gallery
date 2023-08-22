const fs = require("fs");
const { createWriteStream } = require("fs");
const path = require("path");
const { Readable, pipeline } = require("stream");
const { yargs } = require("yargs");

const log = require("@home-gallery/logger")("cli.mjfetch");
const { load, mapArgs } = require("./config");
const {mj}=require('@home-gallery/fetch')
const {getJobs}=require('./tasks/jobs')
const { updateImages}=require('./tasks/mj')
const command = {
  command: "mj",
  describe: "Fetch and merge from Midjourney",
  builder: (yargs) => {
    return yargs
      .option({
        jsonDir: {
          alias: ["j", "json"],
          describe: "Path to store json data with MJ jobs",
        },
        cookieFile: {
          alias: ["k"],
          required: true,
          describe: "File containing the cookie data from MJ",
        },
        type: {
          alias: "t",
          string: true,
          default: "all",
          describe: "Type of images to get jobs or download images for < grid | upscaled | all >",
        },
        userId: {
          alias: "u",
          string: true,
          required: true,
          describe: "user id",
        },
        force: {
          alias: "f",
          boolean: true,
          default: false,
          describe: "reset jsons to initial state to force re-downloads",
        },
      })
      .command(
        "jobs",
        "Initialize the gallery configuration",
        (yargs) =>
          yargs.option({
            source: {
              alias: "s",
              // array: true,
              // required: true,
              description: "Initial source directory or directories",
            },
          }),
        (argv) => {
const l = getJobs(argv)
            l.then(res =>{console.log(res)}).catch(err => log.error(err, `failed to getjobs ${err}`))
        }
        // getMjRecentJobs(argv).catch((err) => log.error(err, `Error: ${err}`))
  // createConfig(argv).catch((err) => log.error(err, `Error: ${err}`))
      )
      .command(
        "images",
        "Download images from jobs data",
        (yargs) =>
          yargs.option({
            jobFile: {
              // alias: ["f"],
              string:true,
              required:true,
              describe: "Job file to sync with",
            },
          }),
        (argv) => {
load(argv.config, true).then((options => {
            const params = Object.assign({},argv,options)
            console.log(params)
updateImages(params)
          }))
            .then(() => log.info(`Have a good day...`))
            .catch((err) => log.error(err, `Error: ${err}`))
        }
      )
      .command(
        "import",
        "Import and update new files from sources",
        (yargs) =>
          yargs.option({
            initial: {
              alias: "i",
              boolean: true,
              describe: "Run initial incremental import",
            },
            update: {
              alias: "u",
              boolean: true,
              describe: "Check and import new files",
            },
          }),
        (argv) => () => {}
      )
  },
  handler: () => false,
};

// const command = {
//   command: "mj",
//   describe: "Fetch and merge from Midjourney",
//   builder: (yargs) => {
//     return yargs
//       .option().command().command(
//         "sync",
//         "Sync images from a MJ job json",
//         (yargs) =>
//           yargs.option({
//             force: {
//               alias: "f",
//               boolean: true,
//               description: "Force, overwrite existing images",
//             },
//             jobFile: {
//               alias:["j"],
//               describe: "Job file to sync with"
//             },
//           }),
//         (argv) => createConfig(argv).catch((err) => log.error(err, `Error: ${err}`))
//       )
//       .demandOption(["cookieFile"]);
//   },
//   handler: ,
// };



const updateIndices = async (sources, options) => {
  for (const source of sources) {
    await updateIndex(source, options);
  }
};

module.exports = command;
// import { existsSync } from "fs";
// const fs = require('fs/promises')
// const path = require("path");
//{type="all",jobType="upscaled", amount=35,userId="24a5b571-f522-46d2-a576-03de40895dbc",cookie=""}
// defaultValue:'/tmp',
// database: {
//   alias: 'd',
//   describe: 'Database filename'
// },
// events: {
//   alias: 'e',
//   describe: 'Events filename'
// },
// const { fetch } = require('@home-gallery/fetch');
// console.log(cliargs);
// return new Promise((resolve,reject)=>{
//   esolve("FUCK")
//   process.exit(0)
// })
// fetch(options)
//   .then(() => {
//     log.info(t0, `Fetched remote from ${options.serverUrl}`)
//   })
//   .catch(err => {
//     log.error(err, `Fetch failed from ${options.serverUrl}: ${err}`)
//     process.exit(1)
//   })
// process.exit(0);
// process.exit(1);
// console.log(params);
// console.log(params);
// await fs.access(dir) || fs.mkdir(dir, { recursive: true });
// console.log(res);
// console.log(err);
// console.log(res);
// console.log(err);
// const fetch = fetches[i];
// console.log(fetches);
// const fetchRecentJobs = async (serverUrl, file, storageDir, { insecure } = {}) => {
//   log.trace(`Fetching ${file} from remote ${serverUrl}...`);
//   const targetFilename = path.join(storageDir, file);
//   const dir = path.dirname(targetFilename);
//   await fs.access(dir, (err) => {
//     fs.mkdir(dir, { recursive: true });
//   });
//
//   const url = `${serverUrl}/files/${file}`;
//   const t0 = Date.now();
//   return fetch(url, options(url, insecure))
//     .then((res) => {
//       if (!res.ok) {
//         throw new Error(`HTTP status code is ${res.status}`);
//       }
//       return res;
//     }) .catch((err) => {
//           console.log(err);
//           reject(err);
//           log.warn(err, `Failed to fetch ${file} from remote ${url}: ${err}. Continue`);
//         }) .then((res) => {
//       return new Promise((resolve, reject) => {
//         pipeline(res.body, createWriteStream(targetFilename), (err) =>
//           err ? reject(err) : resolve()
//         );
//       });
//     })
//     .then(() => log.debug(t0, `Fetched file ${file} from remote ${serverUrl}`))
//     .catch((err) => log.warn(err, `Failed to fetch ${file} from remote ${url}: ${err}. Continue`));
// };
