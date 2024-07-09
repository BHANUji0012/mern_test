const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

const url = 'mongodb://localhost:27017';
const dbName = 'yourDatabaseName';

app.use(express.json());

app.get('/products', async (req, res) => {
  const minPrice = parseFloat(req.query.minPrice);

  if (isNaN(minPrice)) {
    return res.status(400).send({ error: 'Invalid minPrice value' });
  }

  let client;
  try {
    client = new MongoClient(url, { useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to database');

    const db = client.db(dbName);
    const collection = db.collection('products');

    const products = await collection.find({ price: { $gt: minPrice } })
      .sort({ price: -1 })
      .toArray();

    res.status(200).json(products);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
