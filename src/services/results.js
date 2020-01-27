import result from "../mocks/queries/Result"
import update from "../mocks/queries/Update";

export default {
  get: function (query) {
    return Promise.resolve(result);
  },
  update: function (nodeId) {
    if (nodeId === "P02_Mlle.Baptistine") {
      return Promise.resolve(update);
    }
    return Promise.reject();
  }
}