#!/usr/bin/env bash
# Renames the boilerplate for a new project: package scope, root package name and database names.
# Usage: scripts/rename.sh <name>   (lowercase letters, digits and hyphens; e.g. "acme")
set -euo pipefail

name="${1:-}"
if [[ ! "$name" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "usage: $0 <name>   (lowercase letters, digits and hyphens, starting with a letter)" >&2
  exit 1
fi

cd "$(dirname "$0")/.."

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this inside a git checkout (it renames tracked and untracked, non-ignored files)." >&2
  exit 1
fi

if ! grep -q '"@app/' package.json apps/web/package.json 2>/dev/null; then
  echo "Nothing to rename: this repo no longer uses the @app scope." >&2
  exit 1
fi

# Postgres identifiers can't contain hyphens.
db="${name//-/_}"

files=$(git ls-files --cached --others --exclude-standard | grep -vE '(^|/)pnpm-lock\.yaml$|^scripts/rename\.sh$')
files+=$'\n'$(ls apps/*/.env packages/*/.env 2>/dev/null || true)

while IFS= read -r file; do
  [[ -f "$file" ]] || continue
  sed -i.bak \
    -e "s#@app/#@${name}/#g" \
    -e "s#\"name\": \"ts-nextjs-monorepo\"#\"name\": \"${name}\"#" \
    -e "s#app:app@localhost:\([0-9]*\)/app_db#${db}:${db}@localhost:\1/${db}_db#g" \
    -e "s#POSTGRES_USER: app\$#POSTGRES_USER: ${db}#" \
    -e "s#POSTGRES_PASSWORD: app\$#POSTGRES_PASSWORD: ${db}#" \
    -e "s#POSTGRES_DB: app_db\$#POSTGRES_DB: ${db}_db#" \
    -e "s#-U app -d app_db#-U ${db} -d ${db}_db#" \
    -e "s#user/password: app, db: app_db#user/password: ${db}, db: ${db}_db#g" \
    "$file"
  rm "$file.bak"
done <<< "$files"

pnpm install

cat <<MSG

Renamed to @${name}/* with database ${db}_db (user/password: ${db}).
Next steps:
  1. Replace the notes example (see "Starting a new project" in README.md).
  2. Reset git history if this is a fresh copy: rm -rf .git && git init -b main
  3. docker compose up -d && pnpm db:migrate && pnpm dev
MSG
