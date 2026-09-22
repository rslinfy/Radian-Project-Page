#!/usr/bin/env bash
set -euo pipefail

ROOT="/mnt/data/linfangyu/Playground"
PROJECT="$ROOT/DINO-GAN"
SITE="$ROOT/radian_project_page"
ASSETS="$SITE/assets"

mkdir -p "$ASSETS/images" "$ASSETS/videos/chunk" "$ASSETS/videos/frame" \
  "$ASSETS/videos/long" "$ASSETS/videos/more" "$ASSETS/posters"

cp "$ROOT/paper_images/pipeline.png" "$ASSETS/images/pipeline.png"
cp "$ROOT/paper_images/D.png" "$ASSETS/images/discriminator.png"
cp "$PROJECT/scripts/heterogeneous_training_asymmetric_combined.png" \
  "$ASSETS/images/complementary_supervision.png"
cp "$ROOT/Radian_ICLR27 (6).pdf" "$ASSETS/radian_paper.pdf"

encode_crop() {
  local src="$1"
  local out="$2"
  local crop="$3"
  ffmpeg -hide_banner -loglevel error -nostdin -y -i "$src" \
    -vf "$crop,scale=832:480:flags=lanczos,format=yuv420p" \
    -an -c:v libx264 -preset fast -crf 23 -r 16 -movflags +faststart "$out"
}

encode_single() {
  local src="$1"
  local out="$2"
  ffmpeg -hide_banner -loglevel error -nostdin -y -i "$src" \
    -vf "scale=832:480:flags=lanczos,format=yuv420p" \
    -an -c:v libx264 -preset fast -crf 23 -r 16 -movflags +faststart "$out"
}

encode_long_crop() {
  local src="$1"
  local out="$2"
  local crop="$3"
  ffmpeg -hide_banner -loglevel error -nostdin -y -i "$src" \
    -vf "$crop,scale=640:360:flags=lanczos,format=yuv420p" \
    -an -c:v libx264 -preset fast -crf 25 -r 16 -movflags +faststart "$out"
}

make_poster() {
  local src="$1"
  local rel="${src#"$ASSETS/videos/"}"
  local stem="${rel%.mp4}"
  local out="$ASSETS/posters/${stem//\//__}.jpg"
  ffmpeg -hide_banner -loglevel error -nostdin -y -ss 0.35 -i "$src" \
    -frames:v 1 -vf "scale=640:-2:flags=lanczos" -q:v 3 "$out"
}

# Paper cases: SF / CF / Salt / DiT-GAN / Radian.
declare -A CHUNK_SEEDS=( [618]=2 [740]=2 [646]=3718700 [267]=3894121 )
for prompt in 618 740 646 267; do
  seed="${CHUNK_SEEDS[$prompt]}"
  src="$PROJECT/qualitative_results/5s/prompt${prompt}_seed${seed}_SF_CF_Salt_Radian_SaltRadianS100EMA.mp4"
  out_dir="$ASSETS/videos/chunk/p${prompt}"
  mkdir -p "$out_dir"
  encode_crop "$src" "$out_dir/sf.mp4" "crop=832:480:0:0"
  encode_crop "$src" "$out_dir/cf.mp4" "crop=832:480:832:0"
  encode_crop "$src" "$out_dir/salt.mp4" "crop=832:480:1664:0"
  encode_crop "$src" "$out_dir/radian.mp4" "crop=832:480:2496:0"

  dit="$PROJECT/logs/goal_20260813_ditgan_d_steps400_600_30seed_full944_vb16_va/ditgan_d_step000500_raw_seed${seed}_full944_vb16_va/videos/${prompt}-0_ema.mp4"
  encode_single "$dit" "$out_dir/ditgan.mp4"
done

# One-step paper cases: CF++ / One Forcing / Radian.
while read -r prompt seed; do
  out_dir="$ASSETS/videos/frame/p${prompt}"
  mkdir -p "$out_dir"
  cfpp="$PROJECT/logs/goal_20260801_23ckpt_30seed_full_bench/cfpp_framewise1_official/groups/case8_seed${seed}/cfpp_framewise1_official_seed${seed}_oldstyle/videos/${prompt}-0_ema.mp4"
  one="$PROJECT/logs/goal_20260813_oneforcing_30seed_full944_vb16_va/oneforcing_fw1_seed${seed}_full944_vb16_va/videos/${prompt}-0_ema.mp4"
  radian="$PROJECT/logs/goal_20260805_radian10ckpt_top5_2node/dlcve3uyb9qwqfjv/fw1case8_step000700_ema/groups/case8_seed${seed}/fw1case8_step000700_ema_seed${seed}_oldstyle/videos/${prompt}-0_ema.mp4"
  encode_single "$cfpp" "$out_dir/cfpp.mp4"
  encode_single "$one" "$out_dir/oneforcing.mp4"
  encode_single "$radian" "$out_dir/radian.mp4"
done <<'EOF'
547 9130059
753 9130059
304 9591495
691 9539461
EOF

# One-minute paper cases: Rolling Forcing / Radian.
for prompt in 512 556 188; do
  src="$PROJECT/qualitative_results/1min/all_prompts_RF_Radian_seed9591495/prompt${prompt}_seed9591495_1min_RF_Radian.mp4"
  out_dir="$ASSETS/videos/long/p${prompt}"
  mkdir -p "$out_dir"
  encode_long_crop "$src" "$out_dir/rf.mp4" "crop=832:480:0:0"
  encode_long_crop "$src" "$out_dir/radian.mp4" "crop=832:480:832:0"
done
src="$PROJECT/qualitative_results/1min/style_action_304_RF_Radian/prompt182_medieval_castle_stir_frying_1min_RF_Radian.mp4"
mkdir -p "$ASSETS/videos/long/p182"
encode_long_crop "$src" "$ASSETS/videos/long/p182/rf.mp4" "crop=832:480:0:0"
encode_long_crop "$src" "$ASSETS/videos/long/p182/radian.mp4" "crop=832:480:832:0"

# VBench cases not used in the paper: export only Radian.
declare -A MORE_SEEDS=( [813]=2 [301]=3894121 [421]=3894121 [642]=3894121 [732]=3894121 [753]=3894121 )
for prompt in 813 301 421 642 732 753; do
  seed="${MORE_SEEDS[$prompt]}"
  src="$PROJECT/qualitative_results/5s_4way/prompt${prompt}_seed${seed}_4way_SF_CF_Salt_Radian.mp4"
  encode_crop "$src" "$ASSETS/videos/more/vbench_p${prompt}.mp4" "crop=832:480:2496:0"
done

# Curated style/action results not used in the paper: export only Radian.
for key in \
  020_4 021_2360032 024_6918661 025_2379747 042_9274039 \
  049_4 050_2 058_5 062_4656530 066_4656530 075_4232825 \
  076_4232825 078_1542573 078_4232825 100_5279402; do
  prompt="${key%%_*}"
  seed="${key#*_}"
  src="$PROJECT/qualitative_results/5s_4way_selected_style_action/prompt${prompt}_seed${seed}_4way_SF_CF_Salt_Radian.mp4"
  encode_crop "$src" "$ASSETS/videos/more/style_p${prompt}_s${seed}.mp4" "crop=832:480:2496:0"
done

while IFS= read -r video; do
  make_poster "$video"
done < <(find "$ASSETS/videos" -type f -name '*.mp4' | sort)

echo "Prepared assets in $ASSETS"
