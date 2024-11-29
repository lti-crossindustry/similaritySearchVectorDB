using { com.ltim.similaritysearch as db } from '../db/schema';

service EmbeddingStorageService {
    entity DocumentChunk as projection on db.DocumentChunk excluding { embedding };
    function storeEmbeddings(textFile: LargeString) returns String;
    function deleteEmbeddings() returns String;
    action uploadFile(fileContent: LargeString) returns String;
}

