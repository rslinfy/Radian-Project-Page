#!/usr/bin/env python3
"""Threaded static server with byte-range support for the video gallery."""

from __future__ import annotations

import argparse
from http.server import ThreadingHTTPServer
from pathlib import Path

from RangeHTTPServer import RangeRequestHandler


class ProjectPageHandler(RangeRequestHandler):
    def end_headers(self) -> None:
        suffix = Path(self.path.split("?", 1)[0]).suffix.lower()
        if suffix in {".mp4", ".jpg", ".jpeg", ".png", ".pdf"}:
            self.send_header("Cache-Control", "public, max-age=3600")
        else:
            self.send_header("Cache-Control", "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=18765)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), ProjectPageHandler)
    print(f"Serving Radian project page on http://{args.host}:{args.port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
