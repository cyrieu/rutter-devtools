import axios from "axios";
import faker from "faker";

const ENV_URL = process.env.RUTTER_URL || "sandbox.rutterapi.com";
const CLIENT_ID = process.env.RUTTER_CLIENT_ID || "RUTTER_CLIENT_ID";
const SECRET = process.env.RUTTER_SECRET || "RUTTER_SECRET";
async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createRandomProduct(accessToken) {
  const fakeProduct = {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
  };
  const result = await axios.post(
    `https://${ENV_URL}/products`,
    {
      product: fakeProduct,
    },
    {
      params: {
        access_token: accessToken,
      },
      auth: {
        username: CLIENT_ID,
        password: SECRET,
      },
    }
  );
  const {
    data: { product },
  } = result;
  return product;
}

// handles exchanging the token and calling a sample API route
export default async (req, res) => {
  if (req.method === "POST") {
    // Process a POST request
    const { accessToken } = req.body;
    try {
      // make sure we dont' go over the rate limit
      const productBatchSize = 10;
      const productBatches = 1;

      // do products first
      const generatedProducts = [];
      for (let i = 0; i < productBatches; i++) {
        await Promise.all(
          [...Array(productBatchSize).keys()].map(async (key) => {
            try {
              const newProd = await createRandomProduct(accessToken);
              generatedProducts.push(newProd);
            } catch (e) {
              console.error(e);
            }
          })
        );
        // await sleep(1000);
      }
      // generate orders

      res.statusCode = 200;
      res.json({
        products: generatedProducts,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({
        error: e.message,
      });
    }
  } else {
    // Handle any other HTTP method
    res.statusCode(401).json({
      error_message: "Unauthorized Method",
    });
  }
};
