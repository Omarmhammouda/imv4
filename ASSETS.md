# Generated asset jobs (Higgsfield)

Poll with `job_display` / `show_generations`, then download into /public.

## Spray-can product image (seed for 3D)
- `9e47938b-e9f7-4691-9854-0eea78f4d154` (candidate A)
- `0552c3a5-0d25-42ad-b496-2860e9f40bec` (candidate B)
- model: nano_banana_pro, 3:4, 2k

## Chapter background videos (seedance_2_0, 16:9, 5s)
| Chapter | Label | Job ID | Res | File target |
|---|---|---|---|---|
| 1 | VISION (hero) | `11fffc3c-6532-4228-8d06-1eb9b01ed804` | 1080p | public/videos/vision.mp4 |
| 2 | CRAFT | `e055ae67-5d3b-40b7-85c8-f880add7f3f3` | 720p | public/videos/craft.mp4 |
| 3 | SCALE | `d98725f6-adcd-44fe-88bc-cce3e67dd906` (re-gen; a336e744 NSFW-flagged) | 720p | public/videos/scale.mp4 |
| 4 | COLLABORATION | `c6ca34d8-f313-44eb-a56c-25e16a677550` | 720p | public/videos/collaboration.mp4 |
| 5 | IMPACT | `c34758d5-f45a-499d-8cda-00e659ff756e` | 720p | public/videos/impact.mp4 |
| 6 | LEGACY | `51c49e7d-388a-4962-883c-67dc2044ea49` | 720p | public/videos/legacy.mp4 |

## 3D spray can GLB (from image candidate B)
- model: image_to_3d (Meshy), should_texture+enable_pbr, symmetry on, 45k tris
- job id: `64dd12d9-289b-4101-b64f-ab89300c1441`
- file target: public/models/spray-can.glb  (11.8MB → 501KB via gltf-transform meshopt+webp)
- transparent cutout: remove_background job `7659a195-bbb3-498d-aff1-88d9b5b84c7b` → public/textures/can-cutout.png

## Status: DONE — all assets downloaded, optimized, and wired in.

## Pipeline
1. download mp4 -> ffmpeg optimize (loop-friendly, h264 + webm) -> public/videos
2. extract poster frame (first/representative frame) -> public/posters/*.jpg
3. download GLB -> public/models/spray-can.glb
