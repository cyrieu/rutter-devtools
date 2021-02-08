import * as faker from "faker";
import { DateTime } from "luxon";
import { v4, v5 } from "uuid";

function getFakeProductsList() {
  const maxProducts = 10;
  let products = [];
  for (let counter = 0; counter < maxProducts; counter++) {
    let fakeProduct = {
      name: faker.commerce.product(),
      description: faker.commerce.productDescription(),
      images: [{ src: "https://via.placeholder.com/150" }],
      tags: ["rutterdevtools_generated"],
    };
    const numVariants = faker.random.number(2) + 1;
    const variants = [];

    const optionsMapping = {
      ["Color"]: ["blue", "black"],
      ["Size"]: ["sm", "md", "lg"],
    };

    if (Math.random() < 0.8) {
      // high chance of variants
      for (let counter2 = 0; counter2 < numVariants; counter2++) {
        let randomOptionsValues = undefined;
        randomOptionsValues = [];
        randomOptionsValues.push({
          name: "Color",
          value:
            optionsMapping["Color"][
              Math.floor(Math.random() * optionsMapping["Color"].length)
            ],
        });
        randomOptionsValues.push({
          name: "Size",
          value:
            optionsMapping["Size"][
              Math.floor(Math.random() * optionsMapping["Size"].length)
            ],
        });
        variants.push({
          option_values: randomOptionsValues,
          price: parseInt(faker.commerce.price()),
          sku: faker.random.hexaDecimal(),
        });
      }
      fakeProduct.variants = variants;
    }
    // generate tags
    products.push(fakeProduct);
  }
  return products;
}

// product & ordres dependency
function getFakeOrdersList() {
  let fakeOrders = [];
  let maxOrders = 10;

  for (let counter = 0; counter < maxOrders; counter++) {
    const randomFulfillmentStatus = ["fulfilled", "unfulfilled", "partial"];
    const fakeAddress1 = {
      address1: faker.address.streetAddress(),
      address2: faker.address.secondaryAddress(),
      city: faker.address.city(),
      postal_code: faker.address.zipCode(),
      region: faker.address.stateAbbr(),
      country_code: faker.address.countryCode(),
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      phone: Math.random() < 0.5 ? faker.phone.phoneNumber() : undefined,
    };
    const fakeAddress2 = {
      address1: faker.address.streetAddress(),
      address2: faker.address.secondaryAddress(),
      city: faker.address.city(),
      postal_code: faker.address.zipCode(),
      region: faker.address.stateAbbr(),
      country_code: faker.address.countryCode(),
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      phone: Math.random() < 0.5 ? faker.phone.phoneNumber() : undefined,
    };
    fakeOrders.push({
      fulfillment_status: randomFulfillmentStatus[faker.random.number(2)],
      line_items: [],
      shipping_address: fakeAddress1,
      billing_address: Math.random() < 0.3 ? fakeAddress2 : fakeAddress1,
    });
  }
  return fakeOrders;
}

// ordres dependency
function getFakeCustomersList() {
  const maxCustomers = 10;
  let customers = [];
  for (let counter = 0; counter < maxCustomers; counter++) {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    let fakeCustomer = {
      first_name: firstName,
      last_name: lastName,
      email: faker.internet.email(),
    };
    customers.push(fakeCustomer);
  }
  return customers;
}

export function generateFakeDataset() {
  let products = getFakeProductsList();
  let orders = getFakeOrdersList();
  let customers = getFakeCustomersList();
  return {
    products,
    orders,
    customers,
  };
}
