export default function extract(results) {
  return results.data.cursorResourceInfos[0].pageResourceInfos[0].data
    .assignments[0];
}
