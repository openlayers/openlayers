#!/bin/bash

#
# Run this script to build the website.
#
set -o errexit

#
# Destination directory for the website.
#
build=build/site

usage() {
  cat <<-EOF

  Usage: ${1} [options]

  Options:
    -v <version>
      Version identifier.  If omitted, the current branch name will be used.
    
    -l <version>
      The latest release version.  If provided, the root of the website will be
      rebuilt using this version identifier.  If the -l value matches the -v value,
      the examples and API docs will be copied to en/latest.  If the -l option
      is omitted, only the examples and API docs will be rebuilt (not the root of the site).
EOF
  exit 1;
}

root=false

while getopts ":v:l:" o; do
  case "${o}" in
    v)
      version=${OPTARG}
      ;;
    l)
      latest=${OPTARG}
      ;;
    *)
      usage
      ;;
  esac
done
shift $((OPTIND-1))

if [ -z "${version}" ]; then
  version=$(git branch --show-current)
fi

root=$(cd -P -- "$(dirname -- "${0}")" && pwd -P)/..
cd ${root}

rm -rf ${build}

if [ -n "${latest}" ] ; then
  echo "Building the website root with ${latest}"
  mkdir -p ${build}
  OL_VERSION=${latest} node site/build.js
  cp -r site/build/* ${build}/
fi

mkdir -p ${build}/en/${version}/

echo "Building examples for ${version}"
npm run build-examples
mv build/examples ${build}/en/${version}/

echo "Building API docs for ${version}"
npm run apidoc
mv build/apidoc ${build}/en/${version}/

echo "Building the package ${version}"
npm run build-package
mv build/ol ${build}/en/${version}/

if [[ "${latest}" == "${version}" ]] ; then
  echo "Copying to en/latest"
  cp -r ${build}/en/${version} ${build}/en/latest

  echo "Building release artifacts"
  pushd ${build}
  zip -r ${OLDPWD}/build/${version}-site.zip . -x "en/${version}/*"
  popd

  pushd ${build}/en/${version}/ol
  zip -r ${OLDPWD}/build/${version}-package.zip .
  popd
fi
