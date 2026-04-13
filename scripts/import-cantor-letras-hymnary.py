#!/usr/bin/env python3
"""
Preenche `letra` nos JSON do Cantor Cristão:
1) Texto em português no Hymnary.org (CC1971 → /text/… → «Representative Text»).
2) Se não houver texto, tentativa no Letras.com.br (slug derivado do título).
"""
from __future__ import annotations

import html
import json
import re
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HYMN_DIR = ROOT / "db/cantorcristao"
EXTRA_LETRAS_PATH = ROOT / "scripts" / "cantor-letras-extra.json"

UA = "Mozilla/5.0 (compatible; OnBibleBot/1.0; +https://onbible.github.io)"
HYMNARY_HYMN = "https://hymnary.org/hymn/CC1971/{n}"
HYMNARY_TEXT = "https://hymnary.org/text/{slug}"
LETRAS = "https://www.letras.com.br/cantor-cristao/{slug}"


def slugify_title(title: str) -> str:
    t = unicodedata.normalize("NFD", title)
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = t.lower()
    t = re.sub(r"[^a-z0-9]+", "-", t)
    return t.strip("-")


def hymnary_hymn_display_title(hymn_html: str) -> str | None:
    m = re.search(r"<h2 class='hymntitle'>\s*\d+\.\s*([^<]+)</h2>", hymn_html)
    return m.group(1).strip() if m else None


def hymnary_first_line(hymn_html: str) -> str | None:
    m = re.search(
        r'First Line:</span></td>\s*<td><span class="hy_infoItem"><a href="/text/[^"]+">([^<]+)</a>',
        hymn_html,
    )
    return m.group(1).strip() if m else None


def letras_slug_candidates(
    num: str,
    titulo: str,
    alt_titulo: str | None = None,
    first_line: str | None = None,
) -> list[str]:
    n = int(num)
    out: list[str] = []
    seen: set[str] = set()

    def add(s: str) -> None:
        if s and s not in seen:
            seen.add(s)
            out.append(s)

    titles = [titulo]
    if alt_titulo and alt_titulo.strip() and alt_titulo.strip().upper() != titulo.strip().upper():
        titles.append(alt_titulo.strip())

    for t in titles:
        base = slugify_title(t)
        add(base)
        add(f"{base}-{n}-do-cc")
        add(f"{base}-hino-{n}-do-cc")
        add(f"hino-{n}-do-cc")
        if base.startswith("a-"):
            add(base[2:])
        if base.startswith("ao-"):
            add(base[3:])
        if base.startswith("o-"):
            add(base[2:])

    if first_line and first_line.strip():
        fl = slugify_title(first_line)
        add(fl)
        add(f"{fl}-{n}-do-cc")
        add(f"{fl}-hino-{n}-do-cc")
    return out


def normalize_letra(s: str) -> str:
    t = s.replace("\r\n", "\n").replace("\r", "\n")
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()


def fetch_letras_letra(
    num: str,
    titulo: str,
    alt_titulo: str | None = None,
    first_line: str | None = None,
) -> str | None:
    for slug in letras_slug_candidates(num, titulo, alt_titulo, first_line):
        url = LETRAS.format(slug=slug)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=28) as r:
                final = r.geturl().rstrip("/")
                body = r.read().decode("utf-8", errors="replace")
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError):
            time.sleep(0.15)
            continue
        if not final.endswith(f"/{slug}"):
            time.sleep(0.1)
            continue
        m = re.search(r'print-component\s+:lyrics="`([^`]+)`"', body, re.DOTALL)
        if not m or len(m.group(1).strip()) < 8:
            time.sleep(0.1)
            continue
        return normalize_letra(m.group(1))
    return None


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", errors="replace")


def extract_text_slug(hymn_html: str) -> str | None:
    for m in re.finditer(r'href="/text/([a-zA-Z0-9_]+)"', hymn_html):
        slug = m.group(1)
        if slug and slug not in ("", "products"):
            return slug
    return None


def parse_representative_text(text_html: str) -> str | None:
    idx = text_html.find("<div property='text'>")
    if idx == -1:
        idx = text_html.find('<div property="text">')
    if idx == -1:
        return None
    chunk = text_html[idx : idx + 120000]
    bar = chunk.find("<div class='authority_bottom_bar'")
    if bar != -1:
        chunk = chunk[:bar]
    col = chunk.find('<div class="authority_columns">')
    if col == -1:
        col = chunk.find("<div class='authority_columns'>")
    if col == -1:
        inner = chunk
    else:
        inner = chunk[col:]

    # Alguns textos omitem </p> no último estrofe; extrair blocos <p>… manualmente.
    raw_paras: list[str] = []
    pos = 0
    while True:
        start = inner.find("<p>", pos)
        if start == -1:
            break
        body_start = start + 3
        end_p = inner.find("</p>", body_start)
        end_dd = inner.find("</div></div>", body_start)
        if end_p != -1 and (end_dd == -1 or end_p <= end_dd):
            raw_paras.append(inner[body_start:end_p])
            pos = end_p + len("</p>")
        elif end_dd != -1:
            raw_paras.append(inner[body_start:end_dd])
            break
        else:
            raw_paras.append(inner[body_start:])
            break

    if not raw_paras:
        return None

    parts: list[str] = []
    for raw in raw_paras:
        block = raw
        block = re.split(r"<br\s*/?>\s*Source\s*:", block, maxsplit=1, flags=re.I)[0]
        block = re.split(r"\bSource\s*:", block, maxsplit=1, flags=re.I)[0]
        block = re.sub(r"<br\s*/?>", "\n", block, flags=re.I)
        block = re.sub(r"<[^>]+>", "", block)
        block = html.unescape(block)
        lines = [ln.strip() for ln in block.split("\n")]
        lines = [ln for ln in lines if ln]
        text = "\n".join(lines)
        text = re.sub(r"^\[Estribilho:\s*\]", "Coro:", text, flags=re.I)
        text = re.sub(r"\[Estribilho\]\s*$", "", text, flags=re.I)
        text = text.strip()
        if text:
            parts.append(text)
    if not parts:
        return None
    return "\n\n".join(parts)


def load_extra_letras() -> dict[str, str]:
    if not EXTRA_LETRAS_PATH.is_file():
        return {}
    with open(EXTRA_LETRAS_PATH, encoding="utf-8") as f:
        raw = json.load(f)
    return {str(k): str(v).strip() for k, v in raw.items() if str(v).strip()}


def main() -> None:
    stats = {
        "ok_hymnary": 0,
        "ok_letras": 0,
        "ok_extra": 0,
        "fail": 0,
        "already": 0,
    }
    extra_letras = load_extra_letras()

    for n in range(1, 582):
        path = HYMN_DIR / f"{n}.json"
        with open(path, encoding="utf-8") as f:
            data = json.load(f)

        if (data.get("letra") or "").strip():
            stats["already"] += 1
            continue

        sn = str(n)
        if sn in extra_letras:
            data["letra"] = extra_letras[sn]
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=4)
                f.write("\n")
            stats["ok_extra"] += 1
            print(f"OK {n} extra (local)", flush=True)
            continue

        titulo = data.get("titulo") or ""
        letra: str | None = None
        source = ""
        hym_slug = ""
        h_html = ""
        alt_title: str | None = None
        first_line: str | None = None

        try:
            h_url = HYMNARY_HYMN.format(n=n)
            h_html = fetch(h_url)
            alt_title = hymnary_hymn_display_title(h_html)
            first_line = hymnary_first_line(h_html)
            hym_slug = extract_text_slug(h_html) or ""
            if hym_slug:
                t_html = fetch(HYMNARY_TEXT.format(slug=hym_slug))
                letra = parse_representative_text(t_html)
                if letra and len(letra.strip()) >= 8:
                    source = "hymnary"
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            print(f"WARN {n} hymnary: {e}", flush=True)

        if not letra or len(letra.strip()) < 8:
            letra = fetch_letras_letra(str(n), titulo, alt_title, first_line)
            if letra:
                source = "letras"

        if not letra or len(letra.strip()) < 8:
            stats["fail"] += 1
            print(f"FAIL {n} {titulo!r} (hymnary_slug={hym_slug!r})", flush=True)
            time.sleep(0.25)
            continue

        data["letra"] = letra
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
            f.write("\n")
        if source == "hymnary":
            stats["ok_hymnary"] += 1
            print(f"OK {n} hymnary ({hym_slug})", flush=True)
        else:
            stats["ok_letras"] += 1
            print(f"OK {n} letras", flush=True)
        time.sleep(0.3)

    print("STATS", stats, flush=True)


if __name__ == "__main__":
    main()
