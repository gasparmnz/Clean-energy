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
// Usado para descobrir a qual preferência (preference_id) um pagamento
// pertence: no Checkout Pro o pagamento aponta para uma merchant_order
// (payment.order.id), e é a merchant_order que guarda o preference_id.
const merchantOrderClient = new MerchantOrder(client);

module.exports = {
  preferenceClient,
  paymentClient,
  merchantOrderClient
};
