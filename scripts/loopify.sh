#!/usr/bin/env bash
# Turn a raw generated clip into an optimised, seamlessly-looping web asset.
#   usage: loopify.sh INPUT OUTPUT_MP4 WIDTH POSTER_JPG
# Seamless loop = crossfade the clip's tail into its head.
set -euo pipefail

IN="$1"; OUT="$2"; W="$3"; POSTER="$4"
C=0.7   # crossfade seconds

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
OFFSET=$(awk "BEGIN{printf \"%.3f\", $DUR-$C}")

ffmpeg -y -loglevel error -i "$IN" -filter_complex \
"[0:v]scale=${W}:-2:flags=lanczos,setsar=1,fps=30,format=yuv420p[s];\
 [s]split=3[s1][s2][s3];\
 [s1]trim=0:${OFFSET},setpts=PTS-STARTPTS[a];\
 [s2]trim=${OFFSET}:${DUR},setpts=PTS-STARTPTS[b];\
 [s3]trim=0:${C},setpts=PTS-STARTPTS[c];\
 [b][c]xfade=transition=fade:duration=${C}:offset=0[bc];\
 [a][bc]concat=n=2:v=1[v]" \
 -map "[v]" -an \
 -c:v libx264 -profile:v high -crf 23 -preset slow -pix_fmt yuv420p \
 -movflags +faststart "$OUT"

# WebM (VP9) sibling for browsers that prefer it
WEBM="${OUT%.mp4}.webm"
ffmpeg -y -loglevel error -i "$OUT" -an \
 -c:v libvpx-vp9 -b:v 0 -crf 34 -row-mt 1 -deadline good -cpu-used 3 \
 "$WEBM"

# Poster frame (~1.2s in — representative, dark)
ffmpeg -y -loglevel error -ss 1.2 -i "$OUT" -frames:v 1 -q:v 4 "$POSTER"

echo "  -> $(basename "$OUT") ($(du -h "$OUT" | cut -f1)) | $(basename "$WEBM") ($(du -h "$WEBM" | cut -f1)) | poster ok"
