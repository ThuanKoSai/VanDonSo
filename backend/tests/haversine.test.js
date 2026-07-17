/**
 * Test độc lập cho lib/haversine.js — không cần DB/RPC.
 * Chạy: node tests/haversine.test.js
 */
const { haversineDistanceMeters, isDistanceFlagged, DISTANCE_THRESHOLD_METERS } = require("../lib/haversine");

let passed = 0;
let failed = 0;
function assert(cond, label) {
  if (cond) { passed++; console.log("✅", label); }
  else { failed++; console.error("❌", label); }
}

// Cái Bè, Tiền Giang -> trung tâm TP.HCM: khoảng cách thực tế ~83-90km
const d1 = haversineDistanceMeters(10.3969, 106.0483, 10.7769, 106.7009);
assert(d1 > 70000 && d1 < 100000, `Khoảng cách Cái Bè -> TP.HCM hợp lý (${Math.round(d1 / 1000)}km)`);

// 2 điểm trùng nhau -> khoảng cách = 0
const d2 = haversineDistanceMeters(10.3969, 106.0483, 10.3969, 106.0483);
assert(d2 === 0, "Khoảng cách = 0 khi 2 điểm trùng nhau");

// Lệch đúng ngưỡng cảnh báo
const d3 = haversineDistanceMeters(10.3969, 106.0483, 10.3996, 106.0483);
assert(d3 > DISTANCE_THRESHOLD_METERS, `Lệch ~${Math.round(d3)}m vượt ngưỡng ${DISTANCE_THRESHOLD_METERS}m`);
assert(isDistanceFlagged(10.3969, 106.0483, 10.3996, 106.0483) === true, "isDistanceFlagged() trả về true khi vượt ngưỡng");
assert(isDistanceFlagged(10.3969, 106.0483, 10.3969, 106.0483) === false, "isDistanceFlagged() trả về false khi trùng điểm");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
