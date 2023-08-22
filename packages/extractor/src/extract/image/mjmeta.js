const { readFileSync } = require("fs");
const Vibrant = require("node-vibrant");

const log = require("@home-gallery/logger")("extractor.vibrant");

const { toPipe, conditionalTask } = require("../../stream/task");

const imageSuffix = "image-preview-128.jpg";
const mjSuffix = "mjmeta.json";
const hdrs = (cdata) => ({
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
  "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
  "sec-ch-ua-mobile": "?0",
  "content-type": "application/json",
  "sec-ch-ua-platform": '"Linux"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  cookie:
    "__Host-next-auth.csrf-token=0006a8384384b7043fe82bf5b7dd1daf17201dd3fa112ccc27bd8db0621bfc7c%7C205f076d900c04b47ba8280794914a4d5cb2d88728e610b9fe7d6114ea6529f9; imageSize=medium; imageLayout_2=hover; getImageAspect=2; fullWidth=false; showHoverIcons=true; menuOpen_v3=false; __stripe_mid=48928f9e-8afc-4775-8dfc-35955bd5dbf082e437; __Secure-next-auth.callback-url=https%3A%2F%2Fwww.midjourney.com%2Fapp%2F; cf_chl_2=cf403f80a8e9395; cf_clearance=ZFTjJtnM8jeo0iZM5_J2w3qVYKok35w.3.CUt9SMyCM-1685603884-0-160; __Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..CByLLkZXBYn_iomy.58jTmFjyR1HfiXTxDFryiHHKmfy4geHLftsu6z9aBmchvn3yFkIQzxbPfLb4m__XiEjFvbwk8r26PJk4myoFXSMFHy8nLlMymUn-mrAohgF8jh-7QCFhqUfqjGw0xLc4OlHHmImHRcM_qJODzGUBsGSQtrjkIo6-M1HR4zBZ4Fo8-NZx1zGggigcPUEDVG8k-FCqCVXDkMlZZn4XJil5EyE0O5OAyRqUaFvqpQLT031Oefziph8hDrF0zF9L_pBUxjHtGu3-phae-Er4uX3chNejzvzbK4Kvhu8gbY28QBMy5wPmjcnrLhcALlt4JrVY9FQH7xdI9SWYNTzZ7rLeS5wX2T8bKGrggeO9RPQpGVgaVv25Rft96LMZHHa7dLOsi1bkTSFk5vOE9S79isrFW9eCRWNQ7mIYpA6QpKpnOiJQqJtxAx_oLTSV6SEGxvdsKrCFYtwJHST1K1PRZZVj4OQr90a5odSgCSY_h6XbKsx6o4tjyYN0FcafAwViOkI2-xN8TT_-dxL0pe5BZpFvuju-yNI1ANelqBEIUIHp6fMmETPRpXbU5s6oocyctijRXsrCl-pRsCsiUiTXfIAg74YKJ7ZRGN92SG-qw1IbbOpIAtT-zziwMJzqP3e8heZSi_wY7wOz9LD_fSNXyM2_adolzDnIRepfWQJJ_hvNcJmPLh4U7cN6dec4Ng74caZPf5IeTIVoEqSxNgYLBIggoF6HGYqcvnIKVrELvCrHG6dpKRatF6NkwiJZ9bn09SpXaaz1csAATKeMgc-RUSLqJP0eieyG3lbOMJ33SiDH7qIr9TyTNH-kjtoDNoassJTXf0F1Exx6r6rT87xucOlWC0MlPoPv4uZMuM0czM2dUi_XS-jnzcYXEAasmX0zY5Zzwa36GR6uevFyuCnSGAwtR717sEp6n_8yY60dT4J4rR27Own1wZ3Rn8UQSPl-EJg57LYSb6i7VI6VIpp1wA3Po3paGwbmQ-VEMSrFSpYABYrA_y7q5QYMkQJ3nghvNYfkL0VFAxdbFL15xP6KuAaCKf8Fit9oJiyRaVXfPpUdDq0YgIYuqOses2Cjlwbq-8viA2-D3DKK5wXQm0ht6-ZTQlOtP9IBJkvFNPrpx9K4z_Q0_0L5xnrt2Hl6BX4aIsLbjv8Ek-z2iY5AbIZuIYbr78tlqpyoRFpPHmHBOuDer3BOSjx-ZFR5nOuByuu-jSkhPeOZ0YZ26HWLCdXaT9iebgqIcRnXndFRbks2Odk8uKvq8vK3tNz3qq6NMKw4c2Sh3AYNPvM9j11zDDtufKujZGKsrksDuxUxsVAqJ1ohTVRj-N526wfICMO9Uyh5pfMeuRTUDKgKN-Mpwr0LL6kmv5tatwb00HtlnH2o4gFhoEG3xPLXTRYQH_it4uvyvx4nUMpXfLyaCbeMOIMYgA7GqbS3ej8s0Ikowf7pcWf0GBtlpagDXQYNAGbgRiGJ0dw3j_0ho5uwx2ea8eQ4sJeNg9khgm9xyiRmaum1N20-KPAif829r3ibWWvOyki4I3ufvbNtfj3plptt89u3EYy6ZUkOAgP7uIWnBN6oabdZyu8jAJ0eFqfpNFJ0QeahrAldlxlJuBxb5gVG5UXB8MMvweXrcZWaiPie9BnIw6YxNvnuYfW_sZPEXqXGiKmWruOBmKsC_pXHg1bHjlyojpfkLTdaakTmwFf9RfvOMx-ITDrPbQigE6VhbeyrEjvUZ9vcsFEvFU7k7aIcKDtJcQm-Prmqt8ndEvOvCkPiU62g1XE_F-IScEFkb4cSQtIidpHx6BjkkIfMuzJ-sSfPswSQE7iRZLT1heYMzrRKpAv77gmndmxPKbOUJZL9sdFZqvFu2w_6IonRMEPLPcCm4GjpIQu-C0f2-xL4jaENRAf9464SC3YbJpUvSQFDV8NJOo5ILlCG9xVtcmaK1I_IBKjOfBlsewb32dwGO8eoMrVvFQ60Z7Az1KfbGegq7rqMMFifBVVsNiXA-yym0Nxwb1aes5mh7-XcLP7eMA-mA9hmFJd3R9p_fB6_9ox-Ck4kdGHu-rNvlHQlzUTPOeLGk_-DvUUtrZYVwEqrLBfU1talFf-i3V-Twy5UqvxxOJUOzbID-E_AtUu1fgqW4W2obVoUJM8UfKJ-S8IIzW3G8y7S5Yr1qbQsIo54phypLX-Fr76oRMoip8ficMsBZZ3FiORKa8Xmjh4_cv76a2hMUv7hSUYlHJ4BB8Tk7WuiH-mct0gr4aZX3O3MPboXOuQuOojeITEX01IoEVtx81b0DrrS4o6jCnFMkCZMRo7hcQEmDwhcJNkLOE41pX7FAXzGNULvBm5NX-0K9Gz-WaImz4rg2_nZjoVHEks6uaKM_g4DobtHLXwYPPx6TPS64SL858yYCvh6tXaxpz0FL1YGyZHHOrKE5tVWmufDkHn2qSE9_AHm9XSe1Kmx-ThKPFr_FMGLkVYs4zv4smtLAcNJ2qQ9t6fLmWH1o2_rgZHQ3nib-YAZIXpirxXhroD9WUDqkm3R9GEy-msKdCVW1-RrJiGVY2moC3S1DJr5SA599ah1jYDimxmpuodkXX4Cp6efTDY5KeEmgyK0FjYt5ETkhosqc7xyrcSv_Cwnc-8nkVKehBjemVpk6YMg7bSyAaxNaFr5w_MMHCHYZ_2gGsynMP2_KqVNDGvVeA.qR4yGKE9yspu1GivZDlxXg; __stripe_sid=5ab4d460-34ea-493d-9c3f-e14d35a50cd8078bc1; _dd_s=rum=0&expire=1685604792641",
  Referer: "https://www.midjourney.com/app/",
  "Referrer-Policy": "origin-when-cross-origin",
});
String.prototype.escapeSpecialChars = function () {
  return this.replace(/[\\]/g, "\\\\")
    .replace(/[\"]/g, '\\"')
    .replace(/[\/]/g, "\\/")
    .replace(/[\b]/g, "\\b")
    .replace(/[\f]/g, "\\f")
    .replace(/[\n]/g, "\\n")
    .replace(/[\r]/g, "\\r")
    .replace(/[\t]/g, "\\t");
};

const mjJobStatus = ({ batch, cb,storage }) => {
  const opts = {
    headers: hdrs(""),
    body: JSON.stringify({ jobIds: batch.map((e) => e.filename.slice(0, 36)) }),
    method: "POST",
  };
  return fetch("https://www.midjourney.com/api/app/job-status/", opts).then((res) => {
    res
      .json()
      .then((j) => {
        if (!j || !j.length) return cb()
        console.log(j);
        const jobs = batch.map(
          (entry, i, a) =>
            new Promise((resolve, reject) => {
              storage.writeEntryFile(
                entry,
                mjSuffix,
                JSON.stringify(
                  j.find((e) => {
                    const id = entry.filename.slice(0, 36)
                    const match = e.id === id
                    console.log(e.id, id)
                    return match
                  })),
                  (err) => {
                    const t0 = Date.now();
                    if (err) {
                      log.warn(err, `Could not write midjourney meta json of ${entry}: ${err}`);
                      reject(err);
                    } else {
                      log.info(t0, `Extracted midjourney job data for ${entry}`);
                      resolve(entry);
                    }
                  }
              );
            })
        );
        return Promise.all(jobs)
          .then((x) => {
                    const t0 = Date.now();
            log.info(t0, `Extracted midjourney job data for ${x.length} jobs`);
            cb();
          })
          .catch((err) => {
            log.error(err, `error fetching job-status json: ${err}`);
            cb();
          });
      })
      .catch((err) => {
        log.error(err, `error fetching job-status json: ${err}`);
        cb();
      });
  });
};

function mjMeta(storage) {
  const batch = [];
  const test = (entry) => {
    const has = !storage.hasEntryFile(entry, mjSuffix);
    return !has;
  };

  const task = (entry, cb) => {
    const metaJson = storage.getEntryFilename(entry, mjSuffix);
    if (batch.length === 10) {
      mjJobStatus({batch:batch.splice(0,batch.length), cb,storage})
      batch.splice(0, batch.length)
    } else {
      batch.push(entry);
      cb()
    }
  };
  return toPipe(conditionalTask(test, task), (cb) => {
    if(batch.length){
      mjJobStatus({batch:batch.splice(0,batch.length),cb,storage})
    }
    cb()
  });
}

module.exports = mjMeta;
// const fetch = require("node-fetch");
// const cdata = readFileSync(cookieFile);
// const bdy = `'{"jobIds":["${entry.filename.slice(0, -8)}"]}'`;
// const cookieFile = "/home/chris/.config/home-gallery/cookie.txt";
