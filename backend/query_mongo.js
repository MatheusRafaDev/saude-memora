const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const uri = "mongodb+srv://saudememora:12345@saudememora.mrscett.mongodb.net/";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('SaudeMemora');
    const docs = db.collection('Documentos');
    
    console.log("All docs count:", await docs.countDocuments());
    const doc = await docs.findOne({ _id: new ObjectId("6ac00ce8d262d3924d67914b") });
    console.log("Doc 6ac00ce8d262d3924d67914b:", doc);
    
    // show 3 recent docs
    const recent = await docs.find({}).sort({_id: -1}).limit(3).toArray();
    console.log("Recent docs:");
    for (const d of recent) console.log(d._id, d.titulo, d.pacienteId);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
