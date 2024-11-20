service SimilaritySearchService {

    function getRagResponse()                                 returns String;
    action executeSimilaritySearch(userQuery : String)      returns String;
    action   getCallChatGPT4o(contentAIData : iContentAIData) returns String;

    type iContentAIData {
        content           : LargeString;
        max_tokens        : Integer;
        temperature       : Integer;
        frequency_penalty : Integer;
        presence_penalty  : Integer;
        url               : LargeString;
    }


}
