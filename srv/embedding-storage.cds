using { com.ltim.similaritysearch as db } from '../db/schema';

service EmbeddingStorageService {
    entity DocumentChunk as projection on db.DocumentChunk excluding { embedding };
    entity DisplayDocument as projection on db.DisplayDocument;
    entity DocumentChunkApplication as projection on db.DocumentChunkApplication excluding { embedding };
    function storeEmbeddings(textFile: LargeString, parentId:String, fileName:String) returns String;
    function storeEmbeddingsApplication(textFile: LargeString, parentId:String, fileName:String) returns String;
    function deleteEmbeddings() returns String;
    action getTextChunks(metadataValue: String) returns array of String;
    action uploadFile(textFile: LargeString, parentId:String, fileName:String, Appname:String, Version:String, Country:String, SapSystem:String, Process:String) returns String;
    action FilterDocumentChunkToDisplay() returns String;
    action uploadFileApplication(textFile: LargeString, parentId:String, fileName:String, Appname:String, Version:String, Country:String, SapSystem:String, Process:String) returns String;
    entity ProcessDumpDocMedia as projection on db.ProcessDumpDocMedia;
}