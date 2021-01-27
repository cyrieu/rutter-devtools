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

async function createFakeOrder(accessToken, generatedProducts) {
  // to generate fake line items, pick some random product varaints andd them
  const shuffled = generatedProducts
    .slice()
    .sort(() => 0.5 - faker.random.number());
  // Get sub-array of first n elements after shuffled
  let selectedProducts = shuffled.slice(0, faker.random.number(3) + 1);
  const selectedVariants = selectedProducts.map((product) => {
    const variant = product.variants[0];
    return {
      variant_id: variant.variant_id,
    };
  });
  const fakeOrder = {
    email: faker.internet.email(),
    line_items: selectedVariants,
  };
  const result = await axios.post(
    `https://${ENV_URL}/orders`,
    {
      order: fakeOrder,
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
    data: { order },
  } = result;
  return order;
}

// handles exchanging the token and calling a sample API route
export default async (req, res) => {
  if (req.method === "POST") {
    // Process a POST request
    const { accessToken } = req.body;
    try {
      // make sure we dont' go over the rate limit
      const productBatchSize = 1;
      const productBatches = 3;

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
        await sleep(3000);
      }
      // generate orders

      const orderBatchSize = 1;
      const orderBatches = 1;

      // do products first
      const generatedOrders = [];
      for (let i = 0; i < orderBatches; i++) {
        await Promise.all(
          [...Array(orderBatchSize).keys()].map(async (key) => {
            try {
              const newProd = await createFakeOrder(
                accessToken,
                generatedProducts
              );
              generatedOrders.push(newProd);
            } catch (e) {
              console.error(e);
            }
          })
        );
        await sleep(3000);
      }

      res.statusCode = 200;
      res.json({
        products: generatedProducts,
        orders: generatedOrders,
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
