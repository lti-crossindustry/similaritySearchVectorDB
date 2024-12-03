const cds = require('@sap/cds')
const { INSERT, DELETE, SELECT } = cds.ql
const { TextLoader } = require('langchain/document_loaders/fs/text')
const { CSVLoader  } = require('@langchain/community/document_loaders/fs/csv')
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')
const path = require('path')
const fs = require('fs')
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { uuid } = require('@sap/cds/lib/utils/cds-utils')
  
// Helper method to convert embeddings to buffer for insertion
let array2VectorBuffer = (data) => {
  const sizeFloat = 4
  const sizeDimensions = 4
  const bufferSize = data.length * sizeFloat + sizeDimensions

  const buffer = Buffer.allocUnsafe(bufferSize)
  // write size into buffer
  buffer.writeUInt32LE(data.length, 0)
  data.forEach((value, index) => {
    buffer.writeFloatLE(value, index * sizeFloat + sizeDimensions);
  })
  return buffer
}

// Helper method to delete file if it already exists
let deleteIfExists = (filePath) => {
    try {
        fs.unlink(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
            console.log('File does not exist')
            } else {
            console.error('Error deleting file:', err)
            }
        } else {
            console.log('File deleted successfully')
        }
        })
    } catch (unlinkErr) {
        console.error('Error occurred while attempting to delete file:', unlinkErr)
    }
}

module.exports = cds.service.impl(async function () {
  this.on('storeEmbeddings', async (req) => {
    const {textFile} = req.data;
    const {parentId} = req.data;
    const {fileName} = req.data;
    try{
      
      const chunkSize = 5000; // Define your chunk size
      const textChunks = [];
      console.log('parentId',parentId);
      for (let i = 0; i < textFile.length; i += chunkSize) {
          const chunk = textFile.slice(i, i + chunkSize);
          textChunks.push({ pageContent: chunk.toString('utf-8'), startIndex: i });
      }

      //const text = buffer.toString('utf-8');
      // Split the text into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 5000,
        chunkOverlap: 0,
        addStartIndex: true
      });
  
      const vectorPlugin = await cds.connect.to('cap-llm-plugin')
      const { DocumentChunk } = this.entities
  
      //const document = [{ text }]; // Assuming the splitter expects an object with a text property
      //const textChunks = await splitter.splitDocuments(document);
      console.log(`Documents split into ${textChunks.length} chunks.`)
      console.log("Generating the vector embeddings for the text chunks.")
      
      function generateRandomNumber() {
        // Generate a random number between 10000 and 999999
        const min = 10000;
        const max = 999999;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return randomNumber;
      }
    
    // Example usage
    const randomNumber = generateRandomNumber();

      // For each text chunk generate the embeddings
      let textChunkEntries = []
      var j = 47;
      var k = j ;
      for (var i=0; i<textChunks.length; i++) {
         
        const embedding = await vectorPlugin.getEmbedding(textChunks[i].pageContent)
        
         k = k + 1;
        console.log('UUID',randomNumber);
         const entry = {
          "id": randomNumber.toString(),
          "parentId":parentId,
          "text_chunk": textChunks[i].pageContent,
          //"metadata_column": path.resolve('db/data/Standard_Tcode_Library_for_S4_2023_02.csv'),
            "metadata_column":fileName,
          "embedding": array2VectorBuffer(embedding)
        }
        
        textChunkEntries.push(entry)
        console.log(i);
      }
  
      console.log("Inserting text chunks with embeddings into db.")
      // Insert the text chunk with embeddings into db
      const insertStatus = await INSERT.into(DocumentChunk).entries(textChunkEntries)
      if (!insertStatus) {
        throw new Error("Insertion of text chunks into db failed!")
      }
      return `Embeddings stored successfully to db.`
    }
   catch (error){
      // Handle any errors that occur during the execution
      console.log('Error while generating and storing vector embeddings:', error)
      return `Error while generating and storing vector embeddings`
      throw error
    }
})

  this.on ('deleteEmbeddings', async (req) => {
    try {
      // Delete any previous records in the table
      const { DocumentChunk } = this.entities
      await DELETE.from(DocumentChunk)
      return "Success!"
    }
    catch (error) {
      // Handle any errors that occur during the execution
      console.log('Error while deleting the embeddings content in db:', error)
      throw error
    }
  })

  this.on('uploadFile', async (req) => {
    const {textFile} = req.data;
    const {parentId} = req.data;
    const {fileName} = req.data;
    try{
      
      const sDecodeText=Buffer.from(textFile, 'base64').toString('utf-8')
      const chunkSize = 5000; // Define your chunk size
      const textChunks = [];
      console.log('parentId',parentId);
      for (let i = 0; i < sDecodeText.length; i += chunkSize) {
          const chunk = sDecodeText.slice(i, i + chunkSize);
          textChunks.push({ pageContent: chunk.toString('utf-8'), startIndex: i });
      }

      //const text = buffer.toString('utf-8');
      // Split the text into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 5000,
        chunkOverlap: 0,
        addStartIndex: true
      });
  
      const vectorPlugin = await cds.connect.to('cap-llm-plugin')
      const { DocumentChunk } = this.entities
  
      //const document = [{ text }]; // Assuming the splitter expects an object with a text property
      //const textChunks = await splitter.splitDocuments(document);
      console.log(`Documents split into ${textChunks.length} chunks.`)
      console.log("Generating the vector embeddings for the text chunks.")
      
      function generateRandomNumber() {
        // Generate a random number between 10000 and 999999
        const min = 1000;
        const max = 999999;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return randomNumber;
      }
    
    // Example usage
    const randomNumber = generateRandomNumber();

      // For each text chunk generate the embeddings
      let textChunkEntries = []
      var j = randomNumber;
      var k = j ;
      for (var i=0; i<textChunks.length; i++) {
        k =  k+ 1;
        console.log('UUID',randomNumber);
        const embedding = await vectorPlugin.getEmbedding(textChunks[i].pageContent)
        
         
         const entry = {
          "id": k.toString(),
          "parentId":parentId,
          "text_chunk": textChunks[i].pageContent,
          //"metadata_column": path.resolve('db/data/Standard_Tcode_Library_for_S4_2023_02.csv'),
            "metadata_column":fileName,
          "embedding": array2VectorBuffer(embedding)
        }
        
        textChunkEntries.push(entry)
        console.log(i);
      }
  
      console.log("Inserting text chunks with embeddings into db.")
      // Insert the text chunk with embeddings into db
      const insertStatus = await INSERT.into(DocumentChunk).entries(textChunkEntries)
      if (!insertStatus) {
        throw new Error("Insertion of text chunks into db failed!")
      }
      return `Embeddings stored successfully to db.`
    }
   catch (error){
      // Handle any errors that occur during the execution
      console.log('Error while generating and storing vector embeddings:', error)
      return `Error while generating and storing vector embeddings`
      throw error
    }
});
});