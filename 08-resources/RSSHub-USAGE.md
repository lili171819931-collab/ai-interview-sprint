# RSSHub 本地使用速查
# 安装目录：08-resources/RSSHub
# 官方：https://github.com/DIYgod/RSSHub
# 文档：https://docs.rsshub.app/deploy/

## 已完成
- 克隆仓库并 `pnpm i` + `pnpm build`
- 本地启动默认端口：http://127.0.0.1:1200/

## 常用命令

```bash
export PATH="/opt/homebrew/bin:$HOME/.local/bin:$PATH"
cd 08-resources/RSSHub

# 启动
pnpm start

# 浏览器打开
open http://127.0.0.1:1200/
```

## 说明

- 本机未安装 Docker，采用官方 Manual Deployment（pnpm）
- Node 官方要求 `^22 || ^24`；当前环境若为更高版本，一般仍可运行，遇兼容问题可切回 Node 22 LTS
- 更多路由见：https://docs.rsshub.app/
