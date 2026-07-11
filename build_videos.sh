#!/usr/bin/env bash
# Build self-contained demo videos from generated imagery (Ken Burns + crossfade).
set -euo pipefail

cd "$(dirname "$0")/assets"
IMG=img
VID=video
FPS=30

mkdir -p "$VID" work

# Build one Ken Burns clip from an image: scale+crop to 1920x1080, gentle zoom, pan centered.
make_clip () {
  local in="$1" out="$2" dur="$3"
  local frames=$((dur*FPS))
  ffmpeg -y -loop 1 -i "$in" -framerate "$FPS" -t "$dur" \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,\
zoompan=z='1.08+0.0009*on':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${FPS},\
fade=t=in:st=0:d=0.6,\
format=yuv420p" \
    -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -movflags +faststart "$out" \
    -loglevel error
}

# Concatenate N clips with crossfades into one video.
# usage: build_video OUT DUR PERCLIP IMG1 IMG2 [...]   (DUR per clip, TRANS=1s crossfade)
build_video () {
  local out="$1"; shift
  local dur="$1"; shift
  local imgs=("$@")
  local n=${#imgs[@]}
  # make temp clips
  local clips=()
  for i in "${!imgs[@]}"; do
    local c="work/c$((i)).mp4"
    make_clip "$IMG/${imgs[$i]}" "$c" "$dur"
    clips+=("$c")
  done
  if [ "$n" -eq 1 ]; then
    cp "${clips[0]}" "$out"
    return
  fi
  # build filter_complex chain of xfades
  local fc=""
  local prev="0:v"
  local off=0
  local TRANS=1
  for ((i=1;i<n;i++)); do
    local next="${imgs[$i]}"
    local this_out="v$i"
    if [ "$i" -eq $((n-1)) ]; then this_out="vout"; fi
    fc+="[${prev}][${i}:v]xfade=transition=fade:duration=${TRANS}:offset=${off}[${this_out}];"
    prev="${this_out}"
    off=$((off + dur - TRANS))
  done
  # inputs list
  local inputs=""
  for c in "${clips[@]}"; do inputs+=" -i $c"; done
  ffmpeg -y $inputs -filter_complex "${fc%?}" -map "[vout]" \
    -c:v libx264 -preset veryfast -crf 23 -pix_fmt yuv420p -movflags +faststart "$out" \
    -loglevel error
}

# 1) Hero reel: lifestyle landscape shots
build_video "$VID/hero.mp4" 5 model-tortoise.png optician.png boutique.png

# 2) Collection reel: product studio shots
build_video "$VID/collection.mp4" 4 aviator.png cat-eye.png crystal.png blue-light.png rimless.png

# 3) About reel: boutique + optician + model
build_video "$VID/about.mp4" 4 boutique.png optician.png model-tortoise.png

echo "=== Built videos ==="
ls -la "$VID"/*.mp4
for f in "$VID"/*.mp4; do
  echo "-- $f --"
  ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$f"
done

rm -rf work
echo "DONE"
