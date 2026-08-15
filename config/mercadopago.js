require("dotenv").config();

const {
  MercadoPagoConfig,
  Preference
} = require("mercadopago");

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const preferenceClient = new Preference(client);

module.exports = {
  preferenceClient
};