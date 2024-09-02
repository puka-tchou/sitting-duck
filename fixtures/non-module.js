const from = turf.point([-75.343, 39.984]);
const to = turf.point([-75.534, 39.123]);
const options = { units: "miles" };

const calcDistance = turf.distance(from, to, options);
console.log(calcDistance);
