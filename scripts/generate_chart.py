import argparse
import json
import os

import matplotlib
matplotlib.use("Agg")  # ★ EC2ヘッドレス必須

import matplotlib.pyplot as plt
from matplotlib import rcParams
import pandas as pd
from matplotlib import font_manager

def pick_japanese_font():
    candidates = [
        "Meiryo",
        "Noto Sans CJK JP",
        "Noto Sans JP",
        "IPAexGothic",
        "IPAGothic",
        "TakaoGothic",
    ]

    available = {f.name for f in font_manager.fontManager.ttflist}

    for c in candidates:
        if c in available:
            rcParams["font.family"] = c
            print(f"[chart] using font: {c}")
            return

    # fallback
    rcParams["font.family"] = "DejaVu Sans"
    print("[chart] using fallback font: DejaVu Sans")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", required=True)
    ap.add_argument("--out", dest="out", required=True)
    ap.add_argument("--top", dest="top", type=int, default=30)  # 表示数制限（多いと潰れる）
    ap.add_argument("--rotate", dest="rotate", type=int, default=0)
    args = ap.parse_args()

    pick_japanese_font()

    with open(args.inp, "r", encoding="utf-8") as f:
        data = json.load(f)

    title = data.get("title", "選挙結果")
    ballot_type = (data.get("ballotType") or "").upper()

    rows = data.get("rows") or []
    if not rows:
        raise SystemExit("rows is empty")

    # rows -> DataFrame（CANDIDATE/PARTY/NONE_SUPPORT なんでも来る前提）
    df = pd.DataFrame([{
        "targetType": r.get("targetType"),
        "label": r.get("label", ""),
        "value": int(r.get("value") or 0),
    } for r in rows])

    # value desc、top件に絞る
    df = df.sort_values("value", ascending=False).head(max(1, args.top))

    # 表示用ラベル（配分ならポイント、通常なら得票）
    y_label = "ポイント" if ballot_type == "ALLOCATION" else "得票数"

    # あなたの元コードに寄せた描画
    ax = df.plot(
        x="label",
        y="value",
        kind="bar",
        legend=False
    )
    ax.set_xlabel("候補者" if ballot_type != "ALLOCATION" else "対象")
    ax.set_ylabel(y_label)
    ax.set_title(f"{title}（{y_label}）")

    plt.xticks(rotation=args.rotate)
    plt.tight_layout()

    out_path = args.out
    out_dir = os.path.dirname(out_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    plt.savefig(out_path)
    # plt.show() はサーバでは不要（ヘッドレスで止まる原因になるので消す）


if __name__ == "__main__":
    main()
