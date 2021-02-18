import axios from "axios";
import faker from "faker";
import * as _ from "lodash";
import { generateFakeDataset } from "../../backend/utils";

const ENV_URL = process.env.RUTTER_URL || "sandbox.rutterapi.com";
const CLIENT_ID = process.env.RUTTER_CLIENT_ID || "RUTTER_CLIENT_ID";
const SECRET = process.env.RUTTER_SECRET || "RUTTER_SECRET";

async function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function createProduct(accessToken, fakeProduct) {
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

async function createOrder(accessToken, fakeOrder) {
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
      const fakeDataset = generateFakeDataset();
      const { products, orders, customers } = fakeDataset;
      // make sure we dont' go over the rate limit
      const productBatchSize = 10;
      const productBatches = 1;

      const productsToGenerate = _.take(products, productBatchSize);
      const generatedProducts = await Promise.all(
        productsToGenerate.map(async (product) => {
          try {
            return await createProduct(accessToken, product);
          } catch (e) {
            console.error(e?.response?.data);
          }
        })
      );

      console.log("GENERATED");
      console.log(generatedProducts);

      const orderBatchSize = 10;
      const orderBatches = 1;
      let ordersToUse = _.take(orders, orderBatchSize);
      // we need to load these orders with variants
      ordersToUse = ordersToUse.map((order) => {
        const productsToUse = _.take(generatedProducts, 2);
        let fakeLineItems = [];
        productsToUse.forEach((prod) => {
          if (prod) {
            const { variants } = prod;
            const randVariant =
              variants[Math.floor(Math.random() * variants.length)];
            fakeLineItems.push({
              variant_id: randVariant.id,
              quantity: faker.random.number(10),
            });
          }
        });

        const randCustomer =
          customers[Math.floor(Math.random() * customers.length)];
        const state = faker.address.state(true);
        const zipcode = faker.address.zipCodeByState(state);
        return {
          billing_address: {
            address1: faker.address.streetAddress(),
            city: faker.address.city(),
            postal_code: zipcode,
            region: state,
            country_code: "US",
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            phone: faker.phone.phoneNumber(),
            email: faker.internet.email(),
          },
          currency_code: "USD",
          line_items: fakeLineItems,
          customer: randCustomer,
        };
      });

      const generatedOrders = await Promise.all(
        ordersToUse.map(async (order) => {
          try {
            return await createOrder(accessToken, order);
          } catch (e) {
            console.error(e?.response?.data);
          }
        })
      );

      res.statusCode = 200;
      return res.json({
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
