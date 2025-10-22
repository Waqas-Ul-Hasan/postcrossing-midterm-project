// server.js

// 1. IMPORT REQUIRED PACKAGES
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); // We need ObjectId to search by user ID
const cors = require('cors');

// 2. SETUP THE APP
const app = express();
const port = 3000; // The port our server will run on
app.use(cors()); // Use CORS to allow our server to be contacted from other domains
app.use(express.json()); // Allow our server to understand JSON data from requests

// 3. DATABASE CONNECTION SETUP
const mongoUrl = 'mongodb://localhost:27017'; // Connection string for our local MongoDB
const dbName = 'postcrossing_db';
let db; // Variable to hold the database connection

// Function to connect to the database
async function connectToDb() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  console.log("Successfully connected to MongoDB!");
}

// 4. DEFINE API ROUTES (THE CORE OF OUR APP)

// --- USER ROUTES ---

// Route to register a new user
app.post('/api/users/register', async (req, res) => {
  try {
    const newUser = {
      username: req.body.username,
      email: req.body.email,
      country: req.body.country,
      date_joined: new Date(),
      sent_postcards: [],
      received_postcards: [],
    };
    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json({ message: "User registered!", userId: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
});

// Route to get a specific user's profile
app.get('/api/users/:userId', async (req, res) => {
  try {
    const userId = new ObjectId(req.params.userId); // Convert string ID to MongoDB ObjectId
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error });
  }
});


// --- POSTCARD ROUTES (THE COMPLEX PART) ---

// Route to request an address to send a postcard to
app.post('/api/postcards/request-address', async (req, res) => {
  try {
    const senderId = new ObjectId(req.body.senderId); // The ID of the user SENDING the card

    // This is the core of our new logic: A MongoDB Aggregation Pipeline
    // It processes data in stages to find the best recipient.
    const potentialRecipients = await db.collection('users').aggregate([
      // Stage 1: Find all users who are NOT the sender.
      {
        $match: { _id: { $ne: senderId } }
      },
      // Stage 2: Calculate the number of sent and received cards for each user.
      {
        $addFields: {
          sent_count: { $size: "$sent_postcards" },
          received_count: { $size: "$received_postcards" }
        }
      },
      // Stage 3: Calculate the "due_score" for each user.
      {
        $addFields: {
          due_score: { $subtract: ["$sent_count", "$received_count"] }
        }
      },
      // Stage 4: Sort the results to find the user with the HIGHEST due_score.
      {
        $sort: { due_score: -1 } // -1 means sort in descending order
      },
      // Stage 5: Limit the result to just the top user.
      {
        $limit: 1
      }
    ]).toArray();


    if (potentialRecipients.length === 0) {
      return res.status(404).json({ message: "No eligible users available to send a card to." });
    }

    const recipientUser = potentialRecipients[0];

    // The rest of the logic is the same as before
    const newPostcard = {
      postcard_id: `PC-${Date.now()}`,
      sender_id: senderId,
      receiver_id: recipientUser._id,
      status: 'traveling',
      sent_date: new Date(),
      received_date: null,
    };

    const postcardResult = await db.collection('postcards').insertOne(newPostcard);

    await db.collection('users').updateOne(
      { _id: senderId },
      { $push: { sent_postcards: postcardResult.insertedId } }
    );

    res.status(200).json({
      message: "Address assigned to the most 'due' user!",
      recipientInfo: {
        userId: recipientUser._id,
        username: recipientUser.username,
        country: recipientUser.country,
        address: "123 Fictional Street, Cityville, Country"
      },
      postcardId: postcardResult.insertedId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error requesting address", error });
  }
});

// Route to register that a postcard has been received
app.put('/api/postcards/:postcardId/received', async (req, res) => {
    try {
        const postcardId = new ObjectId(req.params.postcardId);

        // First, find the postcard to get the receiver's ID
        const postcard = await db.collection('postcards').findOne({ _id: postcardId });

        if (!postcard) {
            return res.status(404).json({ message: "Postcard not found." });
        }
        
        if (postcard.status === 'received') {
            return res.status(400).json({ message: "This postcard has already been registered." });
        }

        // 1. Update the postcard's status to 'received'
        await db.collection('postcards').updateOne(
            { _id: postcardId },
            { $set: { status: 'received', received_date: new Date() } }
        );

        // 2. Add the postcard's ID to the receiver's list of received cards
        await db.collection('users').updateOne(
            { _id: postcard.receiver_id },
            { $push: { received_postcards: postcardId } }
        );

        res.status(200).json({ message: "Postcard successfully registered as received!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error registering postcard", error });
    }
});


// 5. START THE SERVER
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  connectToDb(); // Connect to the database when the server starts
});

