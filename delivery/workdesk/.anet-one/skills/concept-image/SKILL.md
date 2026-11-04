---
name: concept-image
description: 生成概念图、示意图、墙报配图、展厅效果图。用于"出一张图"、"画个示意图"、"墙报配图"、"展厅概念图"这类请求。经 Agent Network 的 token 网关调用,按张计费,生成后存成本地文件并在回复里给出路径。
---

# 概念图生成

网关提供三档出图模型,按张计费(单价见 `GET /v1/models` 的 `tb_retail_per_unit`):

| 模型             | 用途                           |
| ---------------- | ------------------------------ |
| `image-fast`     | 草图、快速试几个方向           |
| `image-standard` | 一般配图                       |
| `image-max`      | 墙报、展厅这类要印出来或投屏的 |

默认用 `image-fast` 先出草图让使用者挑方向,定了方向再用 `image-max` 出终稿。
直接用 `image-max` 试方向会把钱花在会被丢掉的图上 —— 它比 `image-fast` 贵约
7.7 倍。

## 调用

token 从环境变量 `ANET_TOKEN` 取(与登录时填的是同一个)。没有设置就问使用者,
不要把 token 写进脚本或留在命令行参数里 —— 命令行参数在 `ps` 里对同机其他用户
可见。

```bash
# 提示词和参数写进文件,token 走 header
cat > /tmp/img.json <<'JSON'
{"model":"image-fast","prompt":"<英文提示词>","n":1,"size":"1024x1024"}
JSON
curl -sS -m 300 -X POST https://token.anet.chat/v1/images/generations \
  -H "Authorization: Bearer $ANET_TOKEN" \
  -H 'Content-Type: application/json' -d @/tmp/img.json -o /tmp/img.resp.json
```

响应的 `data[]` 里每项是 `b64_json` 或 `url` 之一,取决于模型。两种都要处理:

```bash
python3 - <<'PY'
import base64, json, pathlib, urllib.request
d = json.load(open("/tmp/img.resp.json"))
if "error" in d or "detail" in d:
    raise SystemExit(f"出图失败: {d}")
for i, item in enumerate(d.get("data") or [], 1):
    out = pathlib.Path(f"concept-{i}.png")
    if item.get("b64_json"):
        out.write_bytes(base64.b64decode(item["b64_json"]))
    elif item.get("url"):
        out.write_bytes(urllib.request.urlopen(item["url"], timeout=120).read())
    else:
        print(f"第 {i} 项没有图片内容,跳过")
        continue
    print("已保存", out, out.stat().st_size, "字节")
PY
```

## 提示词

用英文写提示词。中文提示词这几个模型也接受,但出图质量明显不稳定。
先写中文想法,再翻成英文提示词,两者都在回复里给出,方便使用者改。

一次只出一张(`n=1`)。多张是乘上去的钱,而方向不对时多出的几张一样要丢。

## 墙报与印刷

`size` 给的是像素,不是物理尺寸。墙报按 A0/A1 印刷需要在 300dpi 下有足够像素
(A1 约 7016×9933),这超出模型的输出上限。做法:用 `image-max` 出概念图用于
定方向和排版占位,最终印刷稿交给设计人员按概念图重做矢量版本。**不要**把生成图
放大后直接送印 —— 放大的位图在 A0 尺寸上会明显模糊。

把这一点讲清楚,不要让使用者以为生成的图可以直接印。

## 不要做的事

- 不要把生成的图当作真实照片或实景使用
- 不要在图里放公司名、产品型号、数据标注 —— 模型会把文字画错,而看图的人会
  当成真的。文字和数据另外用排版工具加上
- 不要为一个还没定方向的需求连出多张高价图
