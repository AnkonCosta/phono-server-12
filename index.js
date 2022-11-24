const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

async function run() {
  try {
    const phoneCollection = client
      .db("PhonoRetail")
      .collection("PhonesCollection");
    const brandCollection = client
      .db("PhonoRetail")
      .collection("BrandCollection");
    const bookingCollection = client.db("PhonoRetail").collection("bookings");

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
      booking.time=Date()
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
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
