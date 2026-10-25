import sys
import unittest
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import report


class DailyReportTests(unittest.TestCase):
    def test_report_day_defaults_to_previous_day(self):
        self.assertEqual(report.report_day(today=date(2026, 10, 24)), date(2026, 10, 23))

    def test_invalid_report_date_has_safe_error(self):
        with self.assertRaisesRegex(report.ReportError, "YYYY-MM-DD"):
            report.report_day("not-a-date")

    def test_firestore_orders_are_filtered_by_pakistan_day(self):
        day = date(2026, 10, 24)
        orders = [
            # Pakistan day starts at 19:00 UTC on the previous date.
            {"createdAt": datetime(2026, 10, 23, 20, 0, tzinfo=timezone.utc), "total": 100, "status": "New"},
            # 18:00 UTC is 23:00 PKT, still inside Oct 24.
            {"createdAt": datetime(2026, 10, 24, 18, 0, tzinfo=timezone.utc), "total": 50, "status": "Delivered"},
            # Before the 19:00 UTC start; this declined order belongs to Oct 23 PKT.
            {"createdAt": datetime(2026, 10, 23, 18, 59, tzinfo=timezone.utc), "total": 90, "status": "Declined"},
            # Exactly at the next Pakistan day's start; the end is exclusive.
            {"createdAt": datetime(2026, 10, 24, 19, 0, tzinfo=timezone.utc), "total": 70, "status": "Ready"},
        ]
        result = report.summarize_orders(orders, day)
        self.assertEqual(result["count"], 2)
        self.assertEqual(result["gross_sales"], 150)
        self.assertEqual(result["active_sales"], 150)
        self.assertEqual(result["statuses"], {"Delivered": 1, "New": 1})

    def test_cancelled_orders_are_excluded_from_active_sales(self):
        result = report.summarize_orders(
            [{"createdAt": datetime(2026, 10, 23, 20, 0, tzinfo=timezone.utc), "total": 125, "status": "Cancelled"}],
            date(2026, 10, 24),
        )
        self.assertEqual(result["gross_sales"], 125)
        self.assertEqual(result["active_sales"], 0)

    def test_report_has_english_and_roman_urdu(self):
        plain, body = report.render_report(
            date(2026, 10, 24),
            {"page_views": 10, "users": 6, "sessions": 8, "add_to_cart": 2, "purchases": 1, "purchase_revenue": 200},
            {"count": 1, "gross_sales": 200, "active_sales": 200, "statuses": {"New": 1}},
        )
        self.assertIn("WEBSITE ANALYTICS", plain)
        self.assertIn("MASHWARAY", plain)
        self.assertIn("Roman Urdu", body)
        self.assertIn("Page views: 10", body)

    def test_ga_failure_still_generates_partial_report(self):
        plain, body = report.render_report(
            date(2026, 10, 24), None,
            {"count": 0, "gross_sales": 0, "active_sales": 0, "statuses": {}},
            "GA4 report request failed (PermissionDenied).",
        )
        self.assertIn("GA4 report unavailable", plain)
        self.assertIn("PermissionDenied", body)
        self.assertIn("Viewer permission", plain)


if __name__ == "__main__":
    unittest.main()

