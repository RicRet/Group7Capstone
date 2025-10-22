#Script to insert some dummy data into redis db
# Usage: ./redis-seed.sh [HOST] [PORT]
# Defaults: HOST=127.0.0.1 PORT=6379
set -euo pipefail
HOST="${1:-127.0.0.1}"
PORT="${2:-6379}"

if ! command -v redis-cli >/dev/null 2>&1; then
  echo "redis-cli not found. Please install Redis CLI first." >&2
  exit 1
fi

echo "Seeding Redis at ${HOST}:${PORT} ..."

# Feed commands to redis-cli
redis-cli -h "$HOST" -p "$PORT" <<'EOF'
HSET building:1 name "Union Building" description "Main student center" type "academic"
GEOADD buildings_geo -97.1483 33.2104 building:1
HSET building:2 name "Willis Library" description "Main campus library" type "academic"
GEOADD buildings_geo -97.1530 33.2109 building:2
HSET building:3 name "Discovery Park" description "Engineering campus" type "academic"
GEOADD buildings_geo -97.1579 33.2702 building:3

HSET bus_stop:1 name "Union Stop" description "Northbound stop near Union"
GEOADD bus_stops_geo -97.1468 33.2110 bus_stop:1
HSET bus_stop:2 name "Library Mall Stop" description "Stop by Willis Library"
GEOADD bus_stops_geo -97.1515 33.2108 bus_stop:2
HSET bus_stop:3 name "Fouts Field Stop" description "Stadium stop"
GEOADD bus_stops_geo -97.1505 33.2142 bus_stop:3

HSET parking_lot:20 name "Lot 20" type "visitor" spots_total 200 spots_available 45
GEOADD parking_lots_geo -97.1491 33.2120 parking_lot:20
HSET parking_lot:7 name "Lot 7" type "student" spots_total 500 spots_available 120
GEOADD parking_lots_geo -97.1545 33.2089 parking_lot:7

ZINCRBY feature_usage 5 buildings
ZINCRBY feature_usage 2 bus_stops
ZINCRBY feature_usage 1 parking_lots

SET user_session:demo "user_id:12345,token:abc123" EX 3600
EOF

echo "Done. Try a quick check:"
echo "  redis-cli -h $HOST -p $PORT HGETALL building:1"
echo "  redis-cli -h $HOST -p $PORT GEOPOS buildings_geo building:1"
