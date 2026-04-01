# CarFlip Tracker

A Next.js web app that scans CarMax listings across 12 Ohio counties and identifies potential arbitrage opportunities between CarMax and Carvana.

## How It Works

1. Pulls live CarMax inventory via the Apify CarMax Scraper API
2. Calculates an estimated Carvana offer at 8% above the CarMax listing price
3. Flags deals where the projected spread exceeds the configured threshold
4. Sends SMS and email alerts when deals are found
5. Dashboard auto-scans every 4 hours and displays flagged deals sorted by spread

## The Strategy

CarMax and Carvana use different pricing algorithms. CarMax prices cars to move volume quickly, while Carvana's algorithm often values the same vehicle higher. By buying a car from CarMax and selling it to Carvana, you can capture the spread — typically $1,500–$4,000+ on the right vehicle.

**Always verify the Carvana offer manually before purchasing.** The estimated offer is a projection based on historical spread data, not a guaranteed price.

## Ohio Counties Covered

Montgomery, Butler, Hamilton, Warren, Clermont, Preble, Miami, Darke, Shelby, Clinton, Clark, Champaign

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Data Source:** Apify CarMax Scraper API
- **Alerts:** Twilio (SMS) + Nodemailer (Gmail)
- **Styling:** Tailwind CSS
- **Deployment:** AWS Amplify

## Environment Variables

Create a `.env.local` file in the root of the project:
```
APIFY_API_TOKEN=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
ALERT_PHONE_NUMBER=
EMAIL_USER=
EMAIL_PASS=
ALERT_EMAIL=
DEAL_THRESHOLD=1500
```

## Getting Started
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Legal

This tool is for personal use only. Ohio law permits up to 5 casual vehicle sales per year without a dealer license. Always consult local regulations before engaging in vehicle arbitrage.