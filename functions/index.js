/* Bibi step — webhook Stripe.
 *
 * Unique fonction serveur du projet (même principe que Bibi Love) : un paiement ne
 * peut pas être vérifié côté navigateur, et les règles Firestore interdisent
 * d'écrire `hosts/{uid}` depuis le client. L'Admin SDK utilisé ici les contourne.
 *
 * Déploiement :
 *   cd functions && npm install
 *   firebase functions:secrets:set STRIPE_SECRET_KEY
 *   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
 *   firebase deploy --only functions
 * Puis Stripe → Développeurs → Webhooks : URL de la fonction, événement
 * `checkout.session.completed`. Endpoints et secrets sont DISTINCTS en test et en live.
 */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');

const STRIPE_SECRET  = defineSecret('STRIPE_SECRET_KEY');
const WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

admin.initializeApp();

exports.stripeWebhook = onRequest(
  {
    region: 'europe-west1',
    secrets: [STRIPE_SECRET, WEBHOOK_SECRET],
    cors: false,
    invoker: 'public'
  },
  async (req, res) => {
    const stripe = require('stripe')(STRIPE_SECRET.value());

    let event;
    try {
      // `req.rawBody` obligatoire : la signature porte sur les octets bruts.
      event = stripe.webhooks.constructEvent(
        req.rawBody, req.headers['stripe-signature'], WEBHOOK_SECRET.value());
    } catch (err) {
      console.error('Signature Stripe invalide :', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type !== 'checkout.session.completed') {
      return res.status(200).send('ignoré');       // 200 : sinon Stripe réessaie en boucle
    }

    const session = event.data.object;
    const uid = session.client_reference_id;
    if (!uid) {
      console.error('Paiement sans client_reference_id, session', session.id);
      return res.status(200).send('sans identité');
    }
    if (session.payment_status !== 'paid') return res.status(200).send('non payé');

    try {
      await admin.firestore().doc(`hosts/${uid}`).set({
        premium: true,
        achatLe: admin.firestore.FieldValue.serverTimestamp(),
        stripeSessionId: session.id,
        email: session.customer_details ? session.customer_details.email : null,
        montant: session.amount_total,
        devise: session.currency
      }, { merge: true });
      console.log('Premium accordé à', uid);
      return res.status(200).send('ok');
    } catch (err) {
      // 500 pour que Stripe REJOUE : une panne Firestore passagère ne doit pas
      // faire perdre un achat déjà encaissé.
      console.error('Écriture Firestore impossible pour', uid, err);
      return res.status(500).send('retry');
    }
  }
);
