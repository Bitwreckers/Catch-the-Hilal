"""
Public endpoint for CTF start/end times (from admin config).
Used by the frontend countdown "Event ends in".
Reads directly from DB to always return the latest admin-configured values.
"""

from flask_restx import Namespace, Resource

from CTFd.models import Configs
from CTFd.utils.dates import isoformat, unix_time_to_utc

ctf_namespace = Namespace("ctf", description="Public CTF info (e.g. event times)")


def _get_config_value(key):
    """Read config from DB (no cache) so admin changes are visible immediately."""
    row = Configs.query.filter_by(key=key).first()
    if not row or row.value is None:
        return None
    val = row.value
    if val == "":
        return None
    try:
        return int(val)
    except (TypeError, ValueError):
        return None


@ctf_namespace.route("")
class CtfTime(Resource):
    """GET: Return CTF start and end times from admin config (public, no auth)."""

    @ctf_namespace.doc(
        description="Returns start and end times set by the admin for the event. Used for the countdown on the landing page.",
        responses={200: "Success"},
    )
    def get(self):
        start_ts = _get_config_value("start")
        end_ts = _get_config_value("end")

        start_iso = None
        if start_ts is not None and start_ts > 0:
            try:
                start_iso = isoformat(unix_time_to_utc(start_ts))
            except (TypeError, ValueError):
                pass

        end_iso = None
        if end_ts is not None and end_ts > 0:
            try:
                end_iso = isoformat(unix_time_to_utc(end_ts))
            except (TypeError, ValueError):
                pass

        return {
            "success": True,
            "data": {
                "start": start_iso,
                "end": end_iso,
            },
        }
