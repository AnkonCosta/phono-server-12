const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_KEY}@cluster0.r8fzb08.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
console.log(uri);

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
async function run() {
  try {
    const phoneCollection = client
      .db("PhonoRetail")
      .collection("PhonesCollection");
    const brandCollection = client
      .db("PhonoRetail")
      .collection("BrandCollection");
    const bookingCollection = client.db("PhonoRetail").collection("bookings");
    const userColletcion = client.db("PhonoRetail").collection("users");

    //   get brand names

    app.get("/brands", async (req, res) => {
      const query = {};
      const result = await brandCollection.find(query).toArray();
      res.send(result);
    });

    //   get all phones
    app.get("/phones", async (req, res) => {
      const query = {};
      const result = await phoneCollection.find(query).toArray();
      res.send(result);
    });

    // // get all phones by brrandname
    app.get("/phones/:brand", async (req, res) => {
      const brand = req.params.brand;
      const query = { brand: brand };
      const result = await phoneCollection.find(query).toArray();
      res.send(result);
    });

    // post booking
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      booking.time = Date();
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }

      const query = { email: email };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings);
    });
    // jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userColletcion.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });

    app.post("/users", async (req, res) => {
      const users = req.body;
      users.time = Date();
      const result = await userColletcion.insertOne(users);
      res.send(result);
    });

    // get all users
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await userColletcion.find(query).toArray();
      res.send(users);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", (req, res) => {
  res.send("Phono resale market API Running");
});

app.listen(port, () => {
  console.log("Phono resale market Server running on port", port);
});
