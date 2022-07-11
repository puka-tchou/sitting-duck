// @MODULE
import { distance, point } from "@turf/turf";

const from = point([-75.343, 39.984]);
const to = point([-75.534, 39.123]);
const options = { units: "miles" };

const calcDistance = distance(from, to, options);
console.log(calcDistance);
