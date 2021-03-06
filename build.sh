#!/usr/bin/env bash
set -e

get_script_dir() {
  SOURCE="${BASH_SOURCE[0]}"

  while [ -h "$SOURCE" ]; do
    DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
    SOURCE="$(readlink "$SOURCE")"
    [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
  done
  cd -P "$(dirname "$SOURCE")"
  pwd
}

BUILD_DATE=$(date --iso-8601=seconds) \
VCS_REF=$(git describe --tags) \
VERSION=$(git describe --tags) \
WORKSPACE=$(get_script_dir) \
  docker build -t hbpmip/portal-frontend:$(git describe --tags) .

docker tag hbpmip/portal-frontend:$(git describe --tags) hbpmip/portal-frontend:latest
