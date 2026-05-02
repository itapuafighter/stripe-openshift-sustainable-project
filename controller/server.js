require('dotenv').config();
const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const alimentosModel = require('../model/alimentosModel');
const shopModel = require('../model/shopModel');

const app = express();
const port = process.env.PORT || 3000;

app.use('/fotos', express.static(path.join(__dirname, '..', 'fotos')));
app.use('/iconos', express.static(path.join(__dirname, '..', 'iconos')));
app.use(express.static(path.join(__dirname, '..', 'view')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'view', 'index.html'));
});

app.get('/alimentos', (req, res) => {
  alimentosModel.obtenerDatosTabla('Alimentos_Calorias', (err, results) => {
    if (err) { res.status(500).send('Error al obtener datos de alimentos'); return; }
    res.json(results);
  });
});

app.get('/macronutrientes', (req, res) => {
  alimentosModel.obtenerDatosTabla('Alimentos_Macronutrientes', (err, results) => {
    if (err) { res.status(500).send('Error al obtener datos de macronutrientes'); return; }
    res.json(results);
  });
});

app.get('/nutricion', (req, res) => {
  alimentosModel.obtenerDatosTabla('Alimentos_Nutricion', (err, results) => {
    if (err) { res.status(500).send('Error al obtener datos de nutrición'); return; }
    res.json(results);
  });
});

app.get('/sostenibilidad', (req, res) => {
  alimentosModel.obtenerDatosTabla('Alimentos_Sostenibilidad', (err, results) => {
    if (err) { res.status(500).send('Error al obtener datos de sostenibilidad'); return; }
    res.json(results);
  });
});

app.get('/lugar', (req, res) => {
  alimentosModel.obtenerDatosTabla('Alimentos_Lugar', (err, results) => {
    if (err) { res.status(500).send('Error al obtener datos de lugar'); return; }
    res.json(results);
  });
});

app.get('/mes', (req, res) => {
  alimentosModel.obtenerDatosTabla('Alimentos_Mes', (err, results) => {
    if (err) { res.status(500).send('Error al obtener datos de mes'); return; }
    res.json(results);
  });
});

app.get('/info', (req, res) => {
  alimentosModel.obtenerDatosTabla('Alimentos_Info', (err, results) => {
    if (err) { res.status(500).send('Error al obtener datos de información'); return; }
    res.json(results);
  });
});

app.get('/foto/:alimento', (req, res) => {
  const { alimento } = req.params;
  res.sendFile(path.join(__dirname, '..', 'fotos', `${alimento}.jpeg`));
});

app.get('/productos', (req, res) => {
  shopModel.obtenerProductos((err, results) => {
    if (err) { res.status(500).send('Error al obtener productos'); return; }
    res.json(results);
  });
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'view', 'shop.html'));
});

app.get('/checkout', (req, res) => {
  const html = require('fs').readFileSync(
    require('path').join(__dirname, '..', 'view', 'checkout.html'), 'utf8'
  );
  const injected = html.replace('STRIPE_PUBLISHABLE_KEY_PLACEHOLDER', process.env.STRIPE_PUBLISHABLE_KEY);
  res.send(injected);
});

app.get('/confirmacion', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'view', 'confirmacion.html'));
});

app.use((req, res, next) => {
  if (req.path === '/api/webhooks') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.post('/api/payment-session', async (req, res) => {
  const { productoId, cantidad } = req.body;

  shopModel.obtenerProductos(async (err, productos) => {
    if (err) { res.status(500).send('Error al obtener producto'); return; }

    const producto = productos.find(p => p.id === productoId);
    if (!producto) { res.status(404).send('Producto no encontrado'); return; }

    const total = producto.precio * cantidad;

    shopModel.crearOrden(productoId, cantidad, total, async (err, ordenId) => {
      if (err) { res.status(500).send('Error al crear orden'); return; }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(total * 100),
          currency: 'eur',
          metadata: {
            ordenId: ordenId.toString(),
            producto: producto.nombre,
            cantidad: cantidad.toString()
          }
        });

        res.json({
          clientSecret: paymentIntent.client_secret,
          ordenId
        });

      } catch (err) {
        console.error('Error al crear PaymentIntent:', err);
        res.status(500).send('Error al conectar con Stripe');
      }
    });
  });
});

app.post('/api/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const ordenId = paymentIntent.metadata.ordenId;
    const pspReference = paymentIntent.id;

    shopModel.actualizarOrden(pspReference, 'pagado', ordenId, (err) => {
      if (err) console.error('Error al actualizar orden:', err);
    });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    const ordenId = paymentIntent.metadata.ordenId;
    const pspReference = paymentIntent.id;

    shopModel.actualizarOrden(pspReference, 'fallido', ordenId, (err) => {
      if (err) console.error('Error al actualizar orden:', err);
    });
  }

  res.status(200).json({ received: true });
});

app.listen(port, () => {
  console.log(`Servidor Express iniciado en el puerto ${port}`);
});