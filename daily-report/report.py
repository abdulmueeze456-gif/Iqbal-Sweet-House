#!/usr/bin/env python3
"""Generate and email a bilingual daily report from Firestore and GA4."""
from __future__ import annotations

import html
import json
import os
import smtplib
import ssl
import sys
from collections import Counter
from datetime import date, datetime, time, timedelta, timezone
from email.message import EmailMessage
from typing import Any, Iterable
from zoneinfo import ZoneInfo

BUSINESS_TZ = ZoneInfo("Asia/Karachi")
DEFAULT_PROPERTY_ID = "4909600135"
RECIPIENT_DEFAULT = "iqbalsweethouse1@gmail.com"
CANCELLED_STATUSES = {"cancelled", "canceled", "declined", "rejected", "failed"}


class ReportError(RuntimeError):
    """Configuration or source-data error safe to show in CI logs."""


def report_day(value: str | None = None, *, today: date | None = None) -> date:
    """Use an explicit YYYY-MM-DD date or the previous Pakistan calendar day."""
    if value:
        try:
            return date.fromisoformat(value)
        except ValueError as exc:
            raise ReportError("REPORT_DATE must use YYYY-MM-DD.") from exc
    now_day = today or datetime.now(BUSINESS_TZ).date()
    return now_day - timedelta(days=1)


def day_bounds_utc(day: date) -> tuple[datetime, datetime]:
    start_local = datetime.combine(day, time.min, tzinfo=BUSINESS_TZ)
    end_local = start_local + timedelta(days=1)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def _as_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.replace(tzinfo=timezone.utc) if value.tzinfo is None else value
    if hasattr(value, "to_datetime"):
        try:
            converted = value.to_datetime()
            return converted.replace(tzinfo=timezone.utc) if converted.tzinfo is None else converted
        except (TypeError, ValueError):
            return None
    if isinstance(value, str):
        candidate = value.strip()
        try:
            parsed = datetime.fromisoformat(candidate.replace("Z", "+00:00"))
            return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed
        except ValueError:
            pass
        for fmt in (
            "%m/%d/%Y, %I:%M:%S %p", "%d/%m/%Y, %I:%M:%S %p",
            "%m/%d/%Y, %I:%M %p", "%d/%m/%Y, %I:%M %p",
            "%m/%d/%Y %H:%M:%S", "%d/%m/%Y %H:%M:%S",
        ):
            try:
                return datetime.strptime(candidate, fmt).replace(tzinfo=BUSINESS_TZ)
            except ValueError:
                continue
    return None


def _order_datetime(order: dict[str, Any]) -> datetime | None:
    return _as_datetime(order.get("createdAt")) or _as_datetime(order.get("date"))


def summarize_orders(orders: Iterable[dict[str, Any]], day: date) -> dict[str, Any]:
    start, end = day_bounds_utc(day)
    matches: list[dict[str, Any]] = []
    for order in orders:
        created = _order_datetime(order)
        if created is None:
            continue
        created_utc = created.astimezone(timezone.utc)
        if start <= created_utc < end:
            matches.append(order)

    statuses = Counter(str(order.get("status") or "Unknown").strip().title() for order in matches)
    gross = sum(float(order.get("total") or 0) for order in matches)
    active_sales = sum(
        float(order.get("total") or 0)
        for order in matches
        if str(order.get("status") or "").strip().lower() not in CANCELLED_STATUSES
    )
    return {
        "count": len(matches),
        "gross_sales": gross,
        "active_sales": active_sales,
        "statuses": dict(sorted(statuses.items(), key=lambda item: item[0].lower())),
    }


def get_firestore_orders(day: date) -> list[dict[str, Any]]:
    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise ReportError("Missing FIREBASE_SERVICE_ACCOUNT_JSON secret.")
    try:
        service_info = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ReportError("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.") from exc

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        try:
            app = firebase_admin.get_app("daily-report")
        except ValueError:
            app = firebase_admin.initialize_app(
                credentials.Certificate(service_info), name="daily-report"
            )
        start, end = day_bounds_utc(day)
        orders_query = (
            firestore.client(app).collection("orders")
            .where("createdAt", ">=", start)
            .where("createdAt", "<", end)
        )
        return [snapshot.to_dict() or {} for snapshot in orders_query.stream()]
    except Exception as exc:
        raise ReportError(f"Firestore read failed ({type(exc).__name__}).") from exc


def _ga_credentials():
    raw = os.environ.get("GA4_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise ReportError("Missing GA4_SERVICE_ACCOUNT_JSON secret.")
    try:
        service_info = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ReportError("GA4_SERVICE_ACCOUNT_JSON is not valid JSON.") from exc
    try:
        from google.oauth2 import service_account

        return service_account.Credentials.from_service_account_info(
            service_info,
            scopes=["https://www.googleapis.com/auth/analytics.readonly"],
        )
    except Exception as exc:
        raise ReportError(f"GA4 credentials could not be loaded ({type(exc).__name__}).") from exc


def get_ga4_report(day: date) -> dict[str, Any]:
    property_id = (os.environ.get("GA4_PROPERTY_ID") or DEFAULT_PROPERTY_ID).strip()
    if not property_id.isdigit():
        raise ReportError("GA4_PROPERTY_ID must be a numeric GA4 property ID.")
    try:
        from google.analytics.data_v1beta import BetaAnalyticsDataClient, DateRange, Dimension, Metric

        client = BetaAnalyticsDataClient(credentials=_ga_credentials())
        date_range = DateRange(start_date=day.isoformat(), end_date=day.isoformat())
        overview = client.run_report(
            request={
                "property": f"properties/{property_id}",
                "date_ranges": [date_range],
                "metrics": [
                    Metric(name="screenPageViews"),
                    Metric(name="totalUsers"),
                    Metric(name="sessions"),
                    Metric(name="purchaseRevenue"),
                ],
            }
        )
        values = overview.rows[0].metric_values if overview.rows else []
        result = {
            "page_views": int(float(values[0].value)) if len(values) > 0 else 0,
            "users": int(float(values[1].value)) if len(values) > 1 else 0,
            "sessions": int(float(values[2].value)) if len(values) > 2 else 0,
            "purchase_revenue": float(values[3].value) if len(values) > 3 else 0.0,
            "add_to_cart": 0,
            "checkouts": 0,
            "purchases": 0,
        }
        events = client.run_report(
            request={
                "property": f"properties/{property_id}",
                "date_ranges": [date_range],
                "dimensions": [Dimension(name="eventName")],
                "metrics": [Metric(name="eventCount")],
                "limit": "10000",
            }
        )
        for row in events.rows:
            event_name = row.dimension_values[0].value
            count = int(float(row.metric_values[0].value))
            if event_name == "add_to_cart":
                result["add_to_cart"] = count
            elif event_name == "begin_checkout":
                result["checkouts"] = count
            elif event_name == "purchase":
                result["purchases"] = count
        return result
    except ReportError:
        raise
    except Exception as exc:
        # Keep credentials, request payloads and customer data out of Actions logs.
        raise ReportError(f"GA4 report request failed ({type(exc).__name__}).") from exc


def make_recommendations(ga: dict[str, Any] | None, orders: dict[str, Any]) -> list[tuple[str, str]]:
    tips: list[tuple[str, str]] = []
    if ga is None:
        return [(
            "Roman Urdu: GA4 data nahin mil saka. Property access, GA4 service-account email ki Viewer permission, aur API setup check karein.",
            "English: GA4 data was unavailable. Check property access, the service account's Viewer permission, and API setup.",
        )]
    visits = int(ga.get("sessions", 0))
    carts = int(ga.get("add_to_cart", 0))
    checkouts = int(ga.get("checkouts", 0))
    purchases = int(ga.get("purchases", 0))
    if visits == 0:
        tips.append((
            "Roman Urdu: Aaj sessions record nahin huay. GA4 Realtime mein tag aur traffic sources check karein.",
            "English: No sessions were recorded today. Check the tag and traffic sources in GA4 Realtime.",
        ))
    elif carts == 0:
        tips.append((
            "Roman Urdu: Sessions aaye lekin cart additions nahin huay. Product photos, prices aur Add to Cart button review karein.",
            "English: Sessions arrived but no cart additions were recorded. Review product photos, prices, and the Add to Cart button.",
        ))
    if carts and checkouts == 0:
        tips.append((
            "Roman Urdu: Cart additions huay magar checkout start nahin hua. Cart se checkout ka flow aur delivery charges check karein.",
            "English: Carts were started but checkout was not. Review the cart-to-checkout flow and delivery charges.",
        ))
    if checkouts > purchases:
        tips.append((
            "Roman Urdu: Checkout starts purchases se zyada hain. Checkout steps, payment/order confirmation aur mobile experience test karein.",
            "English: Checkout starts exceed purchases. Test checkout steps, order confirmation, and the mobile experience.",
        ))
    if orders.get("count", 0) and orders.get("active_sales", 0) == 0:
        tips.append((
            "Roman Urdu: Aaj ke tamam orders cancelled ya declined status mein hain. Customers se wajah confirm karein.",
            "English: All of today's orders are cancelled or declined. Follow up with customers to learn why.",
        ))
    pending = sum(
        count for status, count in orders.get("statuses", {}).items()
        if status.lower() in {"new", "confirmed", "preparing", "ready"}
    )
    if pending:
        tips.append((
            f"Roman Urdu: {pending} order(s) abhi delivery ke liye pending hain; unki preparation aur customer update follow up karein.",
            f"English: {pending} order(s) are still in progress; follow up on preparation and customer updates.",
        ))
    if not tips:
        tips.append((
            "Roman Urdu: Aaj ke funnel aur order numbers mein koi wazeh rukawat nahin. Rozana trend compare karte rahein.",
            "English: No clear funnel or order bottleneck stands out today. Continue comparing daily trends.",
        ))
    return tips


def _money(amount: float) -> str:
    return f"PKR {amount:,.2f}"


def render_report(day: date, ga: dict[str, Any] | None, orders: dict[str, Any], ga_error: str | None = None) -> tuple[str, str]:
    recs = make_recommendations(ga, orders)
    if ga is None:
        ga_en = "GA4 report unavailable"
        ga_ur = "GA4 data dastiyab nahin"
        ga_html = f"<p><strong>GA4:</strong> {html.escape(ga_error or ga_en)}</p>"
    else:
        ga_en = (
            f"Page views: {ga['page_views']:,}; users: {ga['users']:,}; sessions: {ga['sessions']:,}; "
            f"add-to-cart events: {ga['add_to_cart']:,}; checkout starts: {ga.get('checkouts', 0):,}; purchase events: {ga['purchases']:,}; "
            f"GA4 purchase revenue: {_money(ga['purchase_revenue'])}."
        )
        ga_ur = (
            f"Page views: {ga['page_views']:,}; users: {ga['users']:,}; sessions: {ga['sessions']:,}; "
            f"cart mein add: {ga['add_to_cart']:,}; checkout starts: {ga.get('checkouts', 0):,}; purchase events: {ga['purchases']:,}; "
            f"GA4 purchase revenue: {_money(ga['purchase_revenue'])}."
        )
        ga_html = f"<p><strong>GA4:</strong> {html.escape(ga_en)}</p>"

    statuses = orders.get("statuses", {})
    status_en = ", ".join(f"{name}: {count}" for name, count in statuses.items()) or "No orders"
    status_ur = ", ".join(f"{name}: {count}" for name, count in statuses.items()) or "Koi order nahin"
    en = (
        f"IQBAL SWEET HOUSE — DAILY REPORT — {day.isoformat()}\n\n"
        f"WEBSITE ANALYTICS\n{ga_en}\n\n"
        f"FIRESTORE ORDERS\nOrders: {orders['count']}; gross order total: {_money(orders['gross_sales'])}; "
        f"active sales (excluding cancelled/declined): {_money(orders['active_sales'])}.\n"
        f"Order statuses: {status_en}.\n\n"
        f"RECOMMENDATIONS\n" + "\n".join(f"- {english}" for _, english in recs)
    )
    ur = (
        f"IQBAL SWEET HOUSE — ROZANA REPORT — {day.isoformat()}\n\n"
        f"WEBSITE ANALYTICS\n{ga_ur}\n\n"
        f"FIRESTORE ORDERS\nOrders: {orders['count']}; kul order total: {_money(orders['gross_sales'])}; "
        f"cancelled/declined ke baghair sales: {_money(orders['active_sales'])}.\n"
        f"Order statuses: {status_ur}.\n\n"
        f"MASHWARAY\n" + "\n".join(f"- {roman_urdu}" for roman_urdu, _ in recs)
    )
    plain = en + "\n\n" + ur
    status_items = "".join(f"<li>{html.escape(name)}: {count}</li>" for name, count in statuses.items()) or "<li>No orders</li>"
    en_recs = "".join(f"<li>{html.escape(english)}</li>" for _, english in recs)
    ur_recs = "".join(f"<li>{html.escape(roman_urdu)}</li>" for roman_urdu, _ in recs)
    html_body = f"""<!doctype html><html><body style="font-family:Arial,sans-serif;color:#292929">
<h1>Iqbal Sweet House — Daily Report</h1><p><strong>Date:</strong> {day.isoformat()}</p>
<h2>English</h2><h3>Website analytics</h3>{ga_html}
<h3>Firestore orders</h3><p>Orders: {orders['count']}<br>Gross order total: {_money(orders['gross_sales'])}<br>
Active sales (excluding cancelled/declined): {_money(orders['active_sales'])}</p><ul>{status_items}</ul>
<h3>Recommendations</h3><ul>{en_recs}</ul>
<hr><h2>Roman Urdu</h2><h3>Website analytics</h3><p>{html.escape(ga_ur)}</p>
<h3>Firestore orders</h3><p>Orders: {orders['count']}<br>Kul order total: {_money(orders['gross_sales'])}<br>
Cancelled/declined ke baghair sales: {_money(orders['active_sales'])}</p>
<p>Order statuses: {html.escape(status_ur)}</p><h3>Mashwaray</h3><ul>{ur_recs}</ul>
<p style="color:#777;font-size:12px">Daily automated report. GA4 dates follow the GA4 property's timezone; Firestore order dates use Asia/Karachi.</p>
</body></html>"""
    return plain, html_body


def send_email(subject: str, plain: str, html_body: str) -> None:
    required = ("SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "REPORT_FROM_EMAIL")
    missing = [key for key in required if not os.environ.get(key)]
    if missing:
        raise ReportError("Missing required email configuration: " + ", ".join(missing))
    recipient = (os.environ.get("REPORT_TO_EMAIL") or RECIPIENT_DEFAULT).strip()
    if not recipient:
        recipient = RECIPIENT_DEFAULT
    if recipient.lower() != RECIPIENT_DEFAULT:
        raise ReportError("REPORT_TO_EMAIL must be iqbalsweethouse1@gmail.com.")
    sender = os.environ["REPORT_FROM_EMAIL"].strip()
    try:
        port = int(os.environ["SMTP_PORT"])
    except ValueError as exc:
        raise ReportError("SMTP_PORT must be a number.") from exc

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = sender
    message["To"] = recipient
    message.set_content(plain)
    message.add_alternative(html_body, subtype="html")
    if port not in {465, 587}:
        raise ReportError("SMTP_PORT must be 465 (implicit TLS) or 587 (STARTTLS).")

    host = os.environ["SMTP_HOST"].strip()
    username = os.environ["SMTP_USERNAME"].strip()
    password = os.environ["SMTP_PASSWORD"].strip()
    if host.lower() == "smtp.gmail.com":
        # Google displays App Passwords in groups; tolerate pasted spaces/newlines.
        password = "".join(password.split())
    stage = "SMTP connection"
    try:
        if port == 465:
            # Gmail port 465 uses implicit TLS during the connection handshake.
            stage = "SMTP connection / implicit TLS negotiation"
            with smtplib.SMTP_SSL(
                host, port, context=ssl.create_default_context(), timeout=30
            ) as server:
                stage = "SMTP authentication"
                server.login(username, password)
                stage = "SMTP message sending"
                server.send_message(message)
        else:
            # Gmail port 587 connects in cleartext, then upgrades with STARTTLS.
            with smtplib.SMTP(host, port, timeout=30) as server:
                stage = "SMTP TLS negotiation"
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
                stage = "SMTP authentication"
                server.login(username, password)
                stage = "SMTP message sending"
                server.send_message(message)
    except Exception as exc:
        # Report only the phase and exception class. Never log server text,
        # addresses, credentials, or message contents from the exception.
        hint = ""
        if stage == "SMTP authentication" and isinstance(exc, smtplib.SMTPServerDisconnected):
            hint = (
                " Gmail closed the connection during authentication; verify that SMTP_USERNAME "
                "is the full Gmail address and SMTP_PASSWORD is that account's current App Password."
            )
        raise ReportError(
            f"Email delivery failed during {stage} ({type(exc).__name__}).{hint}"
        ) from exc


def main() -> int:
    try:
        day = report_day(os.environ.get("REPORT_DATE"))
        orders = summarize_orders(get_firestore_orders(day), day)
        ga: dict[str, Any] | None
        ga_error = None
        try:
            ga = get_ga4_report(day)
        except ReportError as exc:
            ga = None
            ga_error = str(exc)
        plain, html_body = render_report(day, ga, orders, ga_error)
        subject = f"Iqbal Sweet House Daily Report — {day.isoformat()}"
        send_email(subject, plain, html_body)
        print(f"Daily report email sent for {day.isoformat()} to configured recipient.")
        if ga is None:
            print("Report was sent with GA4 unavailable; check GA4 API/service-account access.")
            return 2
        print("Firestore and GA4 report generation completed.")
        return 0
    except ReportError as exc:
        print(f"Daily report failed: {exc}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"Daily report failed ({type(exc).__name__}).", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
