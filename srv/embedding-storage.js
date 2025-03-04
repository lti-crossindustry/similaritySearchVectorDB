const cds = require('@sap/cds')
const { INSERT, DELETE, SELECT } = cds.ql
const { TextLoader } = require('langchain/document_loaders/fs/text')
const { CSVLoader  } = require('@langchain/community/document_loaders/fs/csv')
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter')
const path = require('path')
const fs = require('fs')
const { Document, Packer, Paragraph, TextRun } = require('docx');
const { uuid } = require('@sap/cds/lib/utils/cds-utils')
const { Readable, PassThrough } = require("stream");

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
  
  ProcessDocMedia = this.entities;
  const { DocumentChunk, DisplayDocument } = this.entities;
  this.on('FilterDocumentChunkToDisplay', async (req) => {
    try {
        console.log('Action FilterDocumentChunkToDisplay started.');

        const allEntries = await cds.run(SELECT.from(DocumentChunk));
        console.log('All entries in DocumentChunk:', allEntries);

       
        const distinctFiles = await cds.run(SELECT.distinct.from(DocumentChunk).columns('metadata_column'));
        console.log('Distinct files:', distinctFiles);

        for (const file of distinctFiles) {
            console.log('Processing file:', file.metadata_column);

           
            const entries = await cds.run(SELECT.from(DocumentChunk).where({ metadata_column: file.metadata_column }).limit(1));
            const entry = entries && entries.length > 0 ? entries[0] : null;
            console.log('Selected entry:', entry);

            if (entry) {
               
                const exists = await cds.run(SELECT.one.from(DisplayDocument).where({ metadata_column: entry.metadata_column }));
                console.log('Exists in DisplayDocument:', exists);

                if (!exists) {
                   
                    await cds.run(INSERT.into(DisplayDocument).entries(entry));
                    console.log('Inserted entry into DisplayDocument:', entry);
                } else {
                    console.log('Entry already exists in DisplayDocument:', entry.metadata_column);
                }
            } else {
                console.log('No entry found for file:', file.metadata_column);
            }
        }

        console.log('Action executed successfully.');
        return 'Action executed successfully';
    } catch (err) {
        console.error('Error executing action:', err);
        return err;
    }
});
 
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
          "embedding": array2VectorBuffer(embedding),
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

this.on('storeEmbeddingsApplication', async (req) => {
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
    const { DocumentChunkApplication } = this.entities

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
        "embedding": array2VectorBuffer(embedding),
             }
      
      textChunkEntries.push(entry)
      console.log(i);
    }

    console.log("Inserting text chunks with embeddings into db.")
    // Insert the text chunk with embeddings into db
    const insertStatus = await INSERT.into(DocumentChunkApplication).entries(textChunkEntries)
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
  });
  

  this.on('getTextChunks', async (req) => {   
      const { metadataValue } = req.data;
      try {
          const documentChunks = await SELECT.from(DocumentChunk).where({ metadata_column: metadataValue });
          return documentChunks.map(doc => doc.text_chunk);
      } catch (error) {
          console.error('Error fetching text chunks:', error);
          return [];
      }
  });

  this.on('uploadFileApplication', async (req) => {
    const {textFile} = req.data;
    const {parentId} = req.data;
    const {fileName} = req.data;
    const {Appname} = req.data;
    const {Version} = req.data;
    const {Country} = req.data;
    const {SapSystem} = req.data;
    const{Process} = req.data;
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
      const { DocumentChunkApplication } = this.entities
      
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
          "embedding": array2VectorBuffer(embedding),
          "Appname" : Appname,
          "Version" : Version,
          "Country" : Country,
          "SapSystem" : SapSystem,
          "Process" : Process
        }
        
        textChunkEntries.push(entry)
        console.log(i);
      }
  
      console.log("Inserting text chunks with embeddings into db.")
      // Insert the text chunk with embeddings into db
      const insertStatus = await INSERT.into(DocumentChunkApplication).entries(textChunkEntries)
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
  this.on('uploadFile', async (req) => {
    const {textFile} = req.data;
    const {parentId} = req.data;
    const {fileName} = req.data;
    const {Appname} = req.data;
    const {Version} = req.data;
    const {Country} = req.data;
    const {SapSystem} = req.data;
    const{Process} = req.data;
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
          "embedding": array2VectorBuffer(embedding),
          "Appname" : Appname,
          "Version" : Version,
          "Country" : Country,
          "SapSystem" : SapSystem,
          "Process" : Process
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
  this.on('storeFiles', async (req) => {
  const {base64content} = req.data;
  const {parentId} = req.data;
  const {fileName} = req.data;
  //sasas
  const {mediaType} = req.data;
  const { ProcessDumpDocMedia } = this.entities;
    await INSERT.into(ProcessDumpDocMedia).entries({
        ID: cds.utils.uuid(),
        base64content: base64content,
        parentId: parentId,
        fileName:fileName,
        mediaType:mediaType
    });

    return { message: 'File uploaded successfully' };

  });
  // Assign ProcessDumpDocMedia to this.entities
  const { ProcessDumpDocMedia } = this.entities;
  this.after("UPDATE",ProcessDumpDocMedia,async (req) => {

            if (!req) {
              console.error("Request object is undefined");
              return;
          }
            console.log("Request Data", req.mediaId);
            const iMediaId = req.mediaId;
            console.log("MediaID",iMediaId);
            if (!iMediaId || (iMediaId && iMediaId.length <= 0)) {
                req.reject(404, "Media ID Required");
                return;
            }
            await cds.tx (async ()=>{ 
            var mediaObj = await SELECT.one.from(ProcessDumpDocMedia).where({ mediaId: iMediaId }).columns('content');
        

        if (!mediaObj || (mediaObj && mediaObj.length <= 0)) {
            req.reject(404, "Media not found for the ID");
            return;
        }

        const stream = new PassThrough();
        const chunks = [];
        stream.on('data', (chunk) => { chunks.push(chunk) });
        stream.on('end', async () => {                   
            // mediaObj.base64content = Buffer.concat(chunks).toString('base64');   
            let base64content = Buffer.concat(chunks).toString('base64');   
            console.log("Base64 Data", base64content);
            await cds.tx (async ()=>{    
            await UPDATE(ProcessDumpDocMedia, iMediaId).with({ 'base64content': base64content}); // mediaObj
            // return true;
            }); 
            
        });
       
      //  mediaObj.content.pipe(stream); // writes data in stream object (writeable)
        

    });
        });
});
