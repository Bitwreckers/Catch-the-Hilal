#!/usr/bin/env python3
"""
Create an admin user for CTFd.

Run from the backend directory with the same Python env as the server (e.g. activate
your venv first, or: pip install -r requirements.txt):

  python create_admin.py
  python create_admin.py --name admin --email admin@example.com --password admin123
  python create_admin.py --set-admin-ids 1,2   # treat these user ids as admin on the frontend
"""
import argparse
import sys


def main():
    parser = argparse.ArgumentParser(description="Create a CTFd admin user or reset password")
    parser.add_argument("--name", default="admin", help="Admin username")
    parser.add_argument("--email", default="admin@example.com", help="Admin email")
    parser.add_argument("--password", default="admin123", help="Admin password (plain text)")
    parser.add_argument("--reset-password", action="store_true", help="Reset password for existing user (by name or email)")
    parser.add_argument("--set-admin-ids", metavar="IDS", help="Set config admin_user_ids so these user ids are treated as admin (e.g. 1 or 1,2,3)")
    args = parser.parse_args()

    from CTFd import create_app
    from CTFd.models import Admins, Users, db
    from CTFd.utils import set_config

    app = create_app()
    with app.app_context():
        if args.set_admin_ids is not None:
            set_config("admin_user_ids", args.set_admin_ids.strip())
            print(f"Config admin_user_ids set to: {args.set_admin_ids!r}")
            print("Restart the backend; then these user ids will be treated as admin on the site.")
            return 0

        existing = Users.query.filter(
            (Users.name == args.name) | (Users.email == args.email)
        ).first()
        if existing and args.reset_password:
            existing.password = args.password  # model validator hashes it
            db.session.commit()
            print(f"Password reset for user: name={existing.name}, email={existing.email}, id={existing.id}")
        elif existing:
            # Promote existing user to admin and set password (model hashes it)
            existing.type = "admin"
            existing.password = args.password
            db.session.add(existing)
            if Admins.query.filter_by(id=existing.id).first() is None:
                try:
                    admin_row = Admins(id=existing.id)
                    db.session.add(admin_row)
                except Exception:
                    pass
            db.session.commit()
            print(f"User '{args.name}' (id={existing.id}) promoted to admin, password updated.")
        else:
            # Create new admin (password hashed by model validator)
            admin = Admins(
                name=args.name,
                email=args.email,
                password=args.password,
                verified=True,
            )
            db.session.add(admin)
            db.session.commit()
            print(f"Admin created: name={args.name}, email={args.email}, id={admin.id}")
        print("")
        print("Login with:")
        print(f"  Name:     {args.name}")
        print(f"  Email:    {args.email}")
        print(f"  Password: {args.password}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
