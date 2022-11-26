const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
      let query = {};
      // get via email
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const result = await phoneCollection.find(query).toArray();
      res.send(result);
    });



    // post to server 
    app.post('/phones',async (req,res)=>{
      const phone=req.body;
      const result=await phoneCollection.insertOne(phone)
      res.send(result)
    })

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

// delete bookings
app.delete('/bookings/:id',async(req,res)=>{
  const id = req.params.id;
  const filter = {_id :ObjectId(id)}
  const result = await bookingCollection.deleteOne(filter)
  res.send(result)
})

    // jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userColletcion.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1d",
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

    // get sellers
    app.get("/allsellers", async (req, res) => {
      const filter = { role: "seller" };
      const seller = await userColletcion.find(filter).toArray();
      res.send(seller);
    });

// delete seller 
app.delete('/allsellers/:id',async(req,res)=>{
  const id = req.params.id;
  const filter = {_id :ObjectId(id)}
  const result = await userColletcion.deleteOne(filter)
  res.send(result)
})

    app.get("/allbuyers", async (req, res) => {
      const filter = { role: "user" };
      const seller = await userColletcion.find(filter).toArray();
      res.send(seller);
    });
    // delete buyer 
app.delete('/allbuyers/:id',async(req,res)=>{
  const id = req.params.id;
  const filter = {_id :ObjectId(id)}
  const result = await userColletcion.deleteOne(filter)
  res.send(result)
})

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userColletcion.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await userColletcion.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });

    app.put("/users/admin/:id", verifyJWT, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await userColletcion.findOne(query);

      if (user?.role !== 'admin') {
        return res.status(403).send({ message: "Forbidded Access" });
      }

      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verified: true,
        },
      };
      const result = await userColletcion.updateOne(
        filter,
        updatedDoc,
        options
      );
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
