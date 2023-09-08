const express = require("express");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;
const { ObjectId } = require("mongodb");
const cors = require("cors")

const url = process.env.MONGO_DB_URL;

const mongoClient = new MongoClient(url);

// Create a storage object with a given configuration
const storage = new GridFsStorage({
  url,
  file: (req, file) => {
    if (file.mimetype ) {
      return {
        bucketName: "photos",
        filename: `${Date.now()}_${file.originalname}`,
      };
    } else {
    
      return `${Date.now()}_${file.originalname}`;
    }
  },
});

// Set multer storage engine to the newly created object
const upload = multer({ storage });

const app = express();
app.use(cors());
app.post("/upload/image", upload.single("avatar"), (req, res) => {
  const file = req.file;
  // Respond with the file details
  res.send({
    message: "Uploaded",
    id: file.id,
    name: file.filename,
    contentType: "image/jpg"
  });
});
app.get("/images", async (req, res) => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db("test");
    const images = database.collection("photos.files");
    
    const allImages = await images.find({}).toArray();
    
    // if (allImages.length === 0) {
    //   return res.status(404).send({
    //     message: "Error: No Images found",
    //   });
    // }

    res.send({ files: allImages });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: error,
      error,
    });
  }
});

app.get("/images/:files_id", async (req, res) => {
  try {
    await mongoClient.connect();
    const database = mongoClient.db("test");
    const chunks = database.collection("photos.chunks"); // Use the correct collection

    const cursor = chunks.find({ files_id: ObjectId(req.params.files_id) });
    const buffers = [];
    
    await cursor.forEach((chunk) => {
      if (chunk) {
        buffers.push(chunk.data.buffer);
      }
    });
    
    if (buffers.length === 0) {
      return res.status(404).send({ error: "Chunk not found" });
    }
    
    
    const binaryData = Buffer.concat(buffers);
    
    res.status(200).send(binaryData); 
    console.log("buffers",buffers)
    console.log("binaryData",binaryData)
  } catch (error) {
    console.error(error);
    res.status(500).send({
      message: "Error: Something went wrong",
      error: error.message,
    });
  }
});

// app.get("/images/:files_id", async (req, res) => {
//   try {
//     await mongoClient.connect();
//     const database = mongoClient.db("test");
//     const chunks = database.collection("photos.chunks"); // Use the correct collection

//     const cursor = chunks.find({ files_id: ObjectId(req.params.files_id) });
//     const buffers = [];

//     await cursor.forEach((chunk) => {
//       if (chunk) {
//         buffers.push(chunk.data.buffer);
//       }
//     });

//     if (buffers.length === 0) {
//       return res.status(404).send({ error: "Chunk not found" });
//     }

//     const binaryData = Buffer.concat(buffers);
//     const arrayBuffer = binaryData.buffer;

//     const blob = new Blob([arrayBuffer]);
//     const imageUrl = URL.createObjectURL(blob);
//     console.log("image Url",imageUrl)
//     res.status(200).json( imageUrl );

//   } catch (error) {
//     console.error(error);
//     res.status(500).send({
//       message: "Error: Something went wrong",
//       error: error.message,
//     });
//   }
// });

app.get("/download/:filename", async (req, res) => {
  try {
    await mongoClient.connect();

    const database = mongoClient.db("test");

    const imageBucket = new GridFSBucket(database, {
      bucketName: "photos",
    });

    let downloadStream = imageBucket.openDownloadStreamByName(
      req.params.filename
    );

    downloadStream.on("data", function (data) {
      return res.status(200).write(data);
    });

    downloadStream.on("error", function (data) {
      return res.status(404).send({ error: "Image not found" });
    });

    downloadStream.on("end", () => {
      return res.end();
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error Something went wrong",
      error,
    });
  }
});

const server = app.listen(process.env.PORT || 8080, function () {
  const port = server.address().port;
  console.log("App started at port:", port);
});
