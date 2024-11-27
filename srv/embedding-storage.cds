using { com.ltim.similaritysearch as db } from '../db/schema';

service EmbeddingStorageService {
    entity DocumentChunk as projection on db.DocumentChunk excluding { embedding };
    function storeEmbeddings() returns String;
    function deleteEmbeddings() returns String;
}

service MyService {
    function uploadFile(fileContent: LargeBinary) returns String;
}