import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--port", help="Port for debug server to listen on", default=4000)
parser.add_argument(
    "--profile", help="Enable flask_profiler profiling", action="store_true"
)
parser.add_argument(
    "--disable-gevent",
    help="Disable importing gevent and monkey patching",
    action="store_false",
)
parser.add_argument(
    "--reload",
    help="Enable reloader on file changes (use with --disable-gevent on Windows to avoid socket errors)",
    action="store_true",
)
args = parser.parse_args()
if args.disable_gevent:
    print(" * Importing gevent and monkey patching. Use --disable-gevent to disable.")
    from gevent import monkey

    monkey.patch_all()

# Import not at top of file to allow gevent to monkey patch uninterrupted
from CTFd import create_app

app = create_app()

if args.profile:
    from flask_debugtoolbar import DebugToolbarExtension
    import flask_profiler

    app.config["flask_profiler"] = {
        "enabled": app.config["DEBUG"],
        "storage": {"engine": "sqlite"},
        "basicAuth": {"enabled": False},
        "ignore": ["^/themes/.*", "^/events"],
    }
    flask_profiler.init_app(app)
    app.config["DEBUG_TB_PROFILER_ENABLED"] = True
    app.config["DEBUG_TB_INTERCEPT_REDIRECTS"] = False

    toolbar = DebugToolbarExtension()
    toolbar.init_app(app)
    print(" * Flask profiling running at http://127.0.0.1:4000/flask-profiler/")

# With gevent, the reloader can cause "WinError 10038" on Windows when files change.
# Keep reloader off when gevent is enabled; use --reload with --disable-gevent for reload.
use_reloader = (not args.disable_gevent) and args.reload
app.run(
    debug=True,
    threaded=True,
    host="127.0.0.1",
    port=args.port,
    use_reloader=use_reloader,
)
