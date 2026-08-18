"""Serve the mockups locally with caching switched off.

`python -m http.server` sends no cache headers, which lets browsers hold on to
old copies of a screen — during review that shows up as a change that "did not
happen". This serves the same folder but tells the browser never to store a
copy, so a plain refresh always shows the current mockup.

    python serve.py            # http://localhost:8080
    python serve.py 9000       # another port
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    root = Path(__file__).resolve().parent
    handler = partial(NoCacheHandler, directory=str(root))
    server = ThreadingHTTPServer(("", port), handler)
    print("Serving %s at http://localhost:%d (caching off)" % (root, port))
    print("Gallery:     http://localhost:%d/index.html" % port)
    print("Walkthrough: http://localhost:%d/prototype.html" % port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()


if __name__ == "__main__":
    main()
