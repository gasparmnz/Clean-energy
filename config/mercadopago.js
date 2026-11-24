require("dotenv").config();

const {
  MercadoPagoConfig,
  Preference,
  Payment,
  MerchantOrder
} = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preferenceClient = new Preference(client);
const paymentClient = new Payment(client);
const merchantOrderClient = new MerchantOrder(client);

module.exports = {
  preferenceClient,
  paymentClient,
  merchantOrderClient
};
