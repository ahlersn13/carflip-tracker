import axios from 'axios';

const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
const DEAL_THRESHOLD = parseInt(process.env.DEAL_THRESHOLD) || 1500;

export async function GET(request) {
  try {
    // Pull CarMax listings from Marketcheck
    const listingsResponse = await axios.get(
      'https://api.marketcheck.com/v2/search/car/active',
      {
        params: {
          api_key: MARKETCHECK_API_KEY,
          source: 'carmax',          // CarMax listings only
          car_type: 'used',
          rows: 50,                  // pull 50 listings per call
          fields: 'id,vin,year,make,model,trim,miles,price,seller_name',
        }
      }
    );

    const listings = listingsResponse.data.listings;

    // Run each listing through the spread calculation
    const deals = listings
      .map(car => {
        const carmaxPrice = car.price;
        const estimatedCarvanaOffer = Math.round(carmaxPrice * 1.08);
        const projectedSpread = estimatedCarvanaOffer - carmaxPrice;

        return {
          vin: car.vin,
          year: car.year,
          make: car.make,
          model: car.model,
          trim: car.trim,
          miles: car.miles,
          carmaxPrice,
          estimatedCarvanaOffer,
          projectedSpread,
          isFlagged: projectedSpread >= DEAL_THRESHOLD,
        };
      })
      .filter(car => car.isFlagged) // only return flagged deals
      .sort((a, b) => b.projectedSpread - a.projectedSpread); // best deals first

    return Response.json({
      success: true,
      total: deals.length,
      deals,
    });

  } catch (error) {
    console.error('Marketcheck API error:', error.message);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}