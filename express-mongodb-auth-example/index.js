const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

const url = 'mongodb://localhost:27017';
const dbName = 'yourDatabaseName';

const jwtSecret = 'secret';

app.use(express.json());

const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (token) {
    jwt.verify(token, jwtSecret, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.put('/update-password', authenticateJWT, async (req, res) => {
  const { userId } = req.user;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).send({ error: 'New password is required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const client = new MongoClient(url, { useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to database');

    const db = client.db(dbName);
    const collection = db.collection('users');

    const result = await collection.updateOne(
      { _id: userId },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).send({ message: 'Password updated successfully' });
    } else {
      res.status(404).send({ error: 'User not found' });
    }

    await client.close();
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
