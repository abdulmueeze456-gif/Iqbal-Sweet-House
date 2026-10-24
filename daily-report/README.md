# Iqbal Sweet House Daily Report

This reporting utility is isolated from the storefront. It reads the Firestore `orders` collection and GA4 Data API, creates an English and Roman Urdu report, and emails it through SMTP. It does not change or deploy the website.

## What is reported

- GA4 page views, total users, sessions, `add_to_cart` events, `purchase` events, and purchase revenue for the selected date.
- Firestore order count, gross order total, active sales (excluding cancelled/declined orders), and counts by status.
- Rule-based recommendations from those measured values.
- Firestore dates are grouped by Asia/Karachi. GA4 date grouping follows the property's configured timezone.

## GitHub Actions secrets

In the repository, open **Settings → Secrets and variables → Actions → New repository secret**. Add the exact names:

- `GA4_PROPERTY_ID` (property ID, expected to be `4909600135`)
- `GA4_SERVICE_ACCOUNT_JSON` (complete service-account JSON; keep it in the secret)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (Firebase service-account JSON with Firestore read access)
- `SMTP_HOST` (for Gmail, commonly `smtp.gmail.com`)
- `SMTP_PORT` (587 for STARTTLS, or 465 for SSL)
- `SMTP_USERNAME` (Gmail account used to send)
- `SMTP_PASSWORD` (Gmail App Password, not the normal account password)
- `REPORT_TO_EMAIL` (must be `iqbalsweethouse1@gmail.com`; the code rejects a different recipient)
- `REPORT_FROM_EMAIL` (email address matching the SMTP sender)

Grant the GA4 service-account email **Viewer** access to property `4909600135`, and enable the Google Analytics Data API in the service account's Google Cloud project. The Firebase service account needs read access to the `orders` collection. Never put either service-account JSON in the repository or workflow logs.

## Run and launch

1. Add the secrets above under the repository's Actions secrets.
2. Open **Actions → Iqbal Sweet House Daily Report → Run workflow**.
3. Leave the report date blank to send yesterday's Pakistan-time report, or enter a date as `YYYY-MM-DD`.
4. Open that run and inspect the **Run unit checks** and **Generate and email report** steps. The script never prints secret values.
5. A fully successful run ends with “Firestore and GA4 report generation completed.” A partial report may still be emailed if GA4 is unavailable; that workflow run exits with an error so the access/API problem is visible.

The scheduled run is at 08:30 Pakistan Standard Time and reports the previous Pakistan calendar day. GitHub may delay scheduled starts. Manual workflow dispatch is available at any time.

## Local run

Use Python 3.12+, install `daily-report/requirements.txt`, set the same environment variables in your local shell or a private environment manager, then run:

```powershell
python -m pip install -r daily-report/requirements.txt
python -m unittest discover -s daily-report/tests -v
$env:GA4_PROPERTY_ID = "4909600135"
# Set the remaining secrets securely in your shell/session:
python daily-report/report.py
```

Do not paste service-account JSON or SMTP passwords into chat or commit them. For an explicit date, set `REPORT_DATE=YYYY-MM-DD`.

