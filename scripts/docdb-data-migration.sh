#!/usr/bin/env bash
#
# DocumentDB data migration pipeline:
#   Atlas (source Mongo)  ->  local Mongo  ->  clean (prune companies)  ->  dump  ->  AWS DocDB
#
# Run ONE STAGE at a time so you can verify between steps:
#   ./scripts/docdb-data-migration.sh dump-atlas
#   ./scripts/docdb-data-migration.sh restore-local
#   ./scripts/docdb-data-migration.sh clean
#   ./scripts/docdb-data-migration.sh dump-local
#   ./scripts/docdb-data-migration.sh restore-docdb
#
# Config via env (defaults shown):
#   ATLAS_URI   (REQUIRED for dump-atlas) e.g. "mongodb+srv://user:pass@cluster.mongodb.net/osaAndes"
#   SRC_DB=osaAndes         # db name inside the Atlas dump
#   LOCAL_URI="mongodb://osacontrol:osacontrol@localhost:27017/?authSource=admin"
#   LOCAL_DB=osaAndes
#   DOCDB_HOSTPORT=localhost:27018   # the bastion SSM tunnel
#   DOCDB_DB=osaAndes
#   CA=./global-bundle.pem
#   WORKDIR=./dump/docdb-migration   # dumps live here (under the already-gitignored dump/)
#   FORCE=1                          # skip the "type yes" confirmations (careful)
#   DROP=1                           # restore-* : drop target collections first (clean replace)
#
set -euo pipefail
export PATH="/opt/homebrew/bin:$PATH"

SRC_URI="${ATLAS_URI:-}"
SRC_DB="${SRC_DB:-osaAndes}"
LOCAL_URI="${LOCAL_URI:-mongodb://osacontrol:osacontrol@localhost:27017/?authSource=admin}"
LOCAL_DB="${LOCAL_DB:-osaAndes}"
DOCDB_HOSTPORT="${DOCDB_HOSTPORT:-localhost:27018}"
DOCDB_DB="${DOCDB_DB:-osaAndes}"
CA="${CA:-./global-bundle.pem}"
WORKDIR="${WORKDIR:-./dump/docdb-migration}"
DUMP_ATLAS="$WORKDIR/dump-atlas"
DUMP_CLEAN="$WORKDIR/dump-clean"
REGION="${AWS_REGION:-sa-east-1}"
DOCDB_SECRET="${DOCDB_SECRET:-andes-dev/docdb/master_password}"

confirm() { [ "${FORCE:-}" = "1" ] && return 0; read -r -p "⚠️  $1  Type 'yes' to continue: " a; [ "$a" = "yes" ]; }
have()    { command -v "$1" >/dev/null 2>&1 || { echo "❌ missing tool: $1"; exit 1; }; }

case "${1:-}" in

  dump-atlas)
    have mongodump; [ -n "$SRC_URI" ] || { echo "❌ set ATLAS_URI"; exit 1; }
    echo "→ mongodump from Atlas ($SRC_DB) into $DUMP_ATLAS"
    mkdir -p "$DUMP_ATLAS"
    mongodump --uri="$SRC_URI" --db="$SRC_DB" --out="$DUMP_ATLAS"
    echo "✅ dumped: $(du -sh "$DUMP_ATLAS/$SRC_DB" 2>/dev/null | cut -f1)"
    ;;

  restore-local)
    have mongorestore; [ -d "$DUMP_ATLAS/$SRC_DB" ] || { echo "❌ no dump at $DUMP_ATLAS/$SRC_DB (run dump-atlas)"; exit 1; }
    confirm "Restore Atlas dump into LOCAL mongo db '$LOCAL_DB'${DROP:+ (DROPPING existing collections)}."
    mongorestore --uri="$LOCAL_URI" ${DROP:+--drop} \
      --nsFrom="$SRC_DB.*" --nsTo="$LOCAL_DB.*" "$DUMP_ATLAS"
    echo "✅ restored into local '$LOCAL_DB'"
    ;;

  clean)
    # Prunes to COMPANY_FILTER in src/dbCleaner/standalone-cleanup-script.js (DRY_RUN is false there).
    echo "→ running cleanup against LOCAL db '$LOCAL_DB' (keeps only COMPANY_FILTER companies)"
    echo "   TIP: preview first by setting DRY_RUN:true in the script; AUTO_CONFIRM=true runs unattended."
    confirm "This DELETES all non-kept companies + related data in local '$LOCAL_DB'."
    MONGODB_URI="mongodb://osacontrol:osacontrol@localhost:27017/$LOCAL_DB?authSource=admin" \
      node src/dbCleaner/standalone-cleanup-script.js
    ;;

  dump-local)
    have mongodump
    echo "→ mongodump cleaned LOCAL db '$LOCAL_DB' into $DUMP_CLEAN"
    rm -rf "$DUMP_CLEAN"; mkdir -p "$DUMP_CLEAN"
    mongodump --uri="$LOCAL_URI" --db="$LOCAL_DB" --out="$DUMP_CLEAN"
    echo "✅ dumped: $(du -sh "$DUMP_CLEAN/$LOCAL_DB" 2>/dev/null | cut -f1)"
    ;;

  restore-docdb)
    have mongorestore; have aws
    [ -d "$DUMP_CLEAN/$LOCAL_DB" ] || { echo "❌ no cleaned dump at $DUMP_CLEAN/$LOCAL_DB (run dump-local)"; exit 1; }
    [ -f "$CA" ] || { echo "❌ CA bundle not found at $CA"; exit 1; }
    nc -z "${DOCDB_HOSTPORT%%:*}" "${DOCDB_HOSTPORT##*:}" 2>/dev/null || { echo "❌ tunnel not reachable at $DOCDB_HOSTPORT — start the bastion port-forward"; exit 1; }
    echo "→ fetching DocDB password from Secrets Manager ($DOCDB_SECRET)"
    PWD_DB=$(aws secretsmanager get-secret-value --secret-id "$DOCDB_SECRET" --region "$REGION" --query SecretString --output text)
    [ -n "$PWD_DB" ] || { echo "❌ could not read DocDB password"; exit 1; }
    # --noIndexRestore: DO NOT restore dump indexes. The app builds them (ensureIndexes at boot,
    #   or scripts/docdb-build-indexes.ts). This avoids restore failures on incompatible/unique
    #   indexes (e.g. codes.correlative on duplicate data) and matches how prod builds indexes.
    # retryWrites=false is required by DocDB; TLS via the AWS RDS CA bundle.
    URI="mongodb://osacontrol:${PWD_DB}@${DOCDB_HOSTPORT}/?tls=true&tlsCAFile=${CA}&tlsAllowInvalidHostnames=true&directConnection=true&retryWrites=false&authSource=admin"
    confirm "Restore cleaned dump into DocDB db '$DOCDB_DB' via tunnel${DROP:+ (DROPPING existing collections)}. This writes to the live cluster."
    mongorestore --uri="$URI" --noIndexRestore ${DROP:+--drop} \
      --numInsertionWorkersPerCollection=4 \
      --nsFrom="$LOCAL_DB.*" --nsTo="$DOCDB_DB.*" "$DUMP_CLEAN"
    echo "✅ data restored to DocDB '$DOCDB_DB' (NO indexes)."
    echo "   Build indexes next: deploy so ensureIndexes() runs, OR run scripts/docdb-build-indexes.ts."
    ;;

  *)
    echo "Usage: $0 {dump-atlas|restore-local|clean|dump-local|restore-docdb}"
    echo "Run stages in that order. See the header of this file for env config."
    exit 1
    ;;
esac
