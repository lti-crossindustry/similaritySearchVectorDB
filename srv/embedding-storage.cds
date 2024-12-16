using { com.ltim.similaritysearch as db } from '../db/schema';

service EmbeddingStorageService {
    entity DocumentChunk as projection on db.DocumentChunk excluding { embedding };
    function storeEmbeddings(textFile: LargeString, parentId:String, fileName:String) returns String;
    function deleteEmbeddings() returns String;
    action uploadFile(textFile: LargeString, parentId:String, fileName:String) returns String;
    entity ProcessDumpDocMedia as projection on db.ProcessDumpDocMedia;
}