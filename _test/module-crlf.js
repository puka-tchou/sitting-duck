// @MODULE
import distance from "@turf/distance";
import { point } from "@turf/helpers";

const testModule = () => {
  const from = point([-75.343, 39.984]);
  const to = point([-75.534, 39.123]);
  const options = { units: "miles" };

  return distance(from, to, options);
};

export { testModule };
