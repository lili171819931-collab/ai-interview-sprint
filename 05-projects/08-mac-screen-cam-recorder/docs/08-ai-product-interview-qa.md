# 面试高频问答（录屏项目）

## Q1：为什么不做 Windows？

先验证 Mac 教学场景与权限模型；一人项目跨端会稀释「成片质量」主目标。文档与架构不排除未来，但当前成功标准按 macOS 定义。

## Q2：为什么不用 OBS 插件思路？

OBS 强但心智重。本产品卖的是 **3 步出片 + 圆窗构图**，不是无限场景图。

## Q3：MediaRecorder 明明能录，为什么还搞 ffmpeg？

Chromium 路径常出 WebM，系统双击易进浏览器，被感知为「网页版」。产品承诺是 QuickTime 友好的 MP4，必须转码并校验。

## Q4：如何保证预览和成片一致？

同一 compose canvas：`drawCompositeFrame` → `captureStream`；布局 state 唯一来源。

## Q5：录制中改形状会不会不同步？

形状/镜像写在同一 React state，合成循环每帧读取；PiP 只发 IPC 改 state，不维护第二套布局真相（位置通过 moved 事件写回 layout）。
