# World Model Lab

世界模型的学习与测试记录。线索是 2026 年 10 月的论文 [Video Prediction Policy 2: Predict Better, Act Better](https://arxiv.org/abs/2610.10270)（VPP2），顺着它拆开视频基础模型的结构、MoT 架构、后训练流程和评测方法，每页配可交互的 3D 实验。

**站点：https://haoxiangntu.github.io/world-model-lab/**

| 页面 | 内容 | 3D / 交互实验 |
|---|---|---|
| [论文导读](https://haoxiangntu.github.io/world-model-lab/docs/vpp2.html) | VPP2 的问题、核心观察、数据流水线（22 个训练数据来源，附主页与论文链接）、三阶段训练、三组结果 | 同一起点的轨迹分布；两个数据集的坐标系对齐 |
| [Wan2.1 架构](https://haoxiangntu.github.io/world-model-lab/docs/wan.html) | Wan-VAE、40 层 DiT、umT5 与 CLIP 条件、流匹配、参数量对账（I2V 实际 16.4B） | 整张 I2V-14B 的一次前向；像素 → latent → token；一个 DiT block 的内部 |
| [MoT 原理](https://haoxiangntu.github.io/world-model-lab/docs/mot.html) | Mixture-of-Transformers 原始论文、与 MoE 的区别、π0 / Cosmos 3 / VPP2 的用法、单向掩码与 KV cache | 双塔共享注意力；注意力掩码 |
| [后训练过程](https://haoxiangntu.github.io/world-model-lab/docs/posttrain.html) | 事件级持续预训练、固定时长后训练、一致性蒸馏、动作专家预训练、评测专项后训练 | 采样时间线；流匹配与蒸馏的 3D 粒子；三阶段参数冻结图 |
| [评测数据集](https://haoxiangntu.github.io/world-model-lab/docs/benchmarks.html) | 视频预测指令跟随、ALOHA 零样本、LIBERO 的 ID / Pro / OOD、RoboDojo 五维度，附全部结果图 | 一张桌子六种考法；双臂桌面五个维度 |
| [原理问答](https://haoxiangntu.github.io/world-model-lab/docs/notes.html) | 14B 为什么赢 64B、token 数和延迟怎么算、一致性蒸馏、8 s 与 2 s、MoT 与 MoE、LoRA、LIBERO 98% 为什么不算泛化 | — |

## 目录

```
index.html       首页
docs/*.html      六个页面，静态 HTML
docs/lab3d.js    3D 实验公共部分：场景、轨道相机、标签、机械臂 IK（three.js r128）
docs/charts.js   结果图表：SVG 柱图 / 横向柱图 / 百分比堆叠图，带悬停与表格视图
docs/site.css    样式，与 llm-inference-lab 共用
```

本地打开 `index.html` 即可，不需要构建；three.js 从 cdnjs 加载。

## 关键结论

- VPP2-14B 在操作视频的指令跟随上超过 Cosmos3-64B（机器人 90% 对 78%）：对口的数据、详细描述和事件级预测比参数量更关键。
- 分布内成绩已经饱和（LIBERO-ID 所有近期模型 ≥ 94%），真正区分模型的是扰动和组合泛化：VPP2 在 LIBERO-Pro 任务扰动上 47.8%，最强 VLA 基线 6.8%。
- 单步 0.12 s 的视频预测来自两件事：token 从 32 760 压到 1 950，以及一致性蒸馏把 40 步压成 1 步。
- 动作专家通过 MoT 挂在视频 DiT 旁边，靠参数隔离、单向掩码和冻结 + LoRA 保住视频先验；视频塔算一次缓存 KV，动作塔 5 步去噪复用。
- Wan2.1-I2V-14B 的真实参数量约 16.4B（权重文件 65.58 GB fp32），比 T2V 多出每层一组图像 k、v。

数字来自论文正文、附录与公开模型仓库；3D 场景为示意，不是论文的真实数据或仿真环境。姊妹站：[LLM Inference Lab](https://haoxiangntu.github.io/llm-inference-lab/)。
