import axios from 'axios';

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const DEAL_THRESHOLD = parseInt(process.env.DEAL_THRESHOLD) || 1500;
const ACTOR_ID = 'parseforge~carmax-scraper';

const OHIO_ZIP_CODES = [
  '45419', // Montgomery (Dayton)
  '45011', // Butler (Hamilton)
  '45202', // Hamilton (Cincinnati)
  '45005', // Warren (Franklin)
  '45150', // Clermont (Milford)
  '45320', // Preble (Eaton)
  '45373', // Miami (Troy)
  '45331', // Darke (Greenville)
  '45365', // Shelby (Sidney)
  '45177', // Clinton (Wilmington)
  '45503', // Clark (Springfield)
  '43078', // Champaign (Urbana)
];

export async function GET(request) {
  try {
    const allResults = await Promise.all(
      OHIO_ZIP_CODES.map(async (zip) => {
        try {
          const res = await axios.post(
            `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`,
            { zip, maxItems: 100 },
            {
              headers: {
                Authorization: `Bearer ${APIFY_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              timeout: 120000,
            }
          );
          console.log(`ZIP ${zip}: ${res.data.length} listings`);
          return res.data;
        } catch (err) {
          console.warn(`ZIP ${zip} failed:`, err.message);
          return [];
        }
      })
    );

    // Deduplicate by VIN
    const seen = new Set();
    const uniqueListings = allResults
      .flat()
      .filter(car => car.vin && !seen.has(car.vin) && seen.add(car.vin));

    console.log(`Total unique listings: ${uniqueListings.length}`);

    // Score and flag deals
    const deals = uniqueListings
      .filter(car => car.basePrice)
      .map(car => {
        const carmaxPrice = car.basePrice;
        const estimatedCarvanaOffer = Math.round(carmaxPrice * 1.08);
        const projectedSpread = estimatedCarvanaOffer - carmaxPrice;
        return {
          vin: car.vin,
          year: car.year,
          make: car.make,
          model: car.model,
          trim: car.trim,
          miles: car.mileage,
          carmaxPrice,
          estimatedCarvanaOffer,
          projectedSpread,
          listingUrl: car.listingUrl,
          isFlagged: projectedSpread >= DEAL_THRESHOLD,
        };
      })
      .filter(car => car.isFlagged)
      .sort((a, b) => b.projectedSpread - a.projectedSpread);

    if (deals.length > 0) {
      try {
        await sendAlerts(deals);
      } catch (alertErr) {
        console.warn('Alert failed:', alertErr.message);
      }
    }

    return Response.json({
      success: true,
      total: deals.length,
      deals,
    });

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error.response?.data);
    return Response.json(
      { success: false, error: error.message, details: error.response?.data },
      { status: 500 }
    );
  }
}

async function sendAlerts(deals) {
  const top = deals[0];
  const message = `
CarFlip Alert! ${deals.length} deals found.
Top deal: ${top.year} ${top.make} ${top.model} ${top.trim || ''}
Miles: ${top.miles?.toLocaleString()}
CarMax Price: $${top.carmaxPrice?.toLocaleString()}
Est. Carvana Offer: $${top.estimatedCarvanaOffer?.toLocaleString()}
Projected Spread: $${top.projectedSpread?.toLocaleString()}
VIN: ${top.vin}
CarMax: ${top.listingUrl}
Carvana: https://www.carvana.com/sell-my-car/${top.vin}
  `.trim();

  await sendSMS(message);
  await sendEmail(message, deals);
}

async function sendSMS(message) {
  const twilio = (await import('twilio')).default;
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: process.env.ALERT_PHONE_NUMBER,
  });
}

async function sendEmail(message, deals) {
  const nodemailer = (await import('nodemailer')).default;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const dealRows = deals.map(d =>
    `${d.year} ${d.make} ${d.model} ${d.trim || ''} | $${d.carmaxPrice?.toLocaleString()} | Est. Carvana: $${d.estimatedCarvanaOffer?.toLocaleString()} | Spread: $${d.projectedSpread?.toLocaleString()} | ${d.listingUrl}`
  ).join('\n');

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: process.env.ALERT_EMAIL,
    subject: `CarFlip - ${deals.length} Deals Found!`,
    text: `${message}\n\nAll Deals:\n${dealRows}`,
  });
}