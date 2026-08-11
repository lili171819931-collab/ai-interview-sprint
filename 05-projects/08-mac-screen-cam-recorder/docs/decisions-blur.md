# Decision: circular camera blur

## 选型
- **MediaPipe ImageSegmenter (`selfie_segmenter`)** via `@mediapipe/tasks-vision`
- 人像 mask 保留清晰前景，背景单独高斯模糊后合成
- 禁止整圆 CSS blur（会糊脸）

## 降级
- 模型 / WASM 加载失败 → `blurStatus=failed`，自动用清晰摄像头帧继续录制并提示
- 分割暂无 mask 时当帧不启用虚化输出，避免错误糊脸

## 性能
- 分割隔帧；处理边长上限 ~320px
- 虚化强度 0–100 映射 blur px
