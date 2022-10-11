const { emptyFn } = require("../utils/emptyFn");
const { fetchBlocks } = require("../chain/fetchBlocks");
const { updateSpecs } = require("../chain/specs");
const { getMetaScanHeight } = require("../chain/specs");
const { isUseMetaDb } = require("../env");
const { getScanStep } = require("../env");
const { sleep } = require("../utils/sleep");
const { getLatestHeight } = require("../chain/latestHead");
const last = require("lodash.last");
const { logger } = require("../logger");

async function oneStepScan(startHeight, handleBlock = emptyFn, needBlockAuthor = false, capHeight = null) {
  const chainHeight = getLatestHeight();
  let maxHeight = chainHeight;
  if (capHeight && capHeight < chainHeight) {
    maxHeight = capHeight;
  }

  if (startHeight > maxHeight) {
    // Just wait if the to scan height greater than current chain height
    await sleep(3000);
    return startHeight;
  }

  let targetHeight = maxHeight;
  const step = getScanStep();
  if (startHeight + step < maxHeight) {
    targetHeight = startHeight + step;
  }

  if (isUseMetaDb()) {
    if (targetHeight > getMetaScanHeight()) {
      await updateSpecs();
    }
  }

  const heights = [];
  for (let i = startHeight; i <= targetHeight; i++) {
    heights.push(i);
  }
  const blocks = await fetchBlocks(heights, needBlockAuthor);
  if ((blocks || []).length <= 0) {
    await sleep(1000);
    return startHeight;
  }

  for (const block of blocks) {
    await handleBlock(block);
  }

  const lastHeight = last(blocks || []).height;
  logger.info(`${ lastHeight } scan finished!`);
  return lastHeight + 1;
}

module.exports = {
  oneStepScan,
}
