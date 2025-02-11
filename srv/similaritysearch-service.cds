using { com.ltim.similaritysearch as db } from '../db/schema';
service SimilaritySearchService {

     entity ProcessTree as projection on db.SAPProcessTree;
     entity ProcessDocMedia as projection on db.ProcessDocMedia;
     entity SAPProcessFlowMassUpload as projection on db.SAPProcessFlowMassUpload;
     entity SAPBusinessProcess_TestScripts as projection on db.SAPBusinessProcess_TestScripts;
     entity SAPTestScripts_Preconditions as projection on db.SAPTestScripts_Preconditions;
     entity SAPTestScripts_TestSteps as projection on db.SAPTestScripts_TestSteps;
     entity SAPTestScripts_ExpResults as projection on db.SAPTestScripts_ExpResults;
     entity systemCollection as projection on db.systemCollection;
     entity systemVersion as projection on db.systemVersion;
     entity NipunAI as projection on db.NipunAI;
    //  entity DocumentChunkApplication as projection on db.DocumentChunkApplication;

    action getRagResponse(userQuery : String)              returns String;
    action executeSimilaritySearch(userQuery : String)      returns String;
    action executeSimilaritySearchApplication(userQuery : String)      returns String;
    action   getCallChatGPT4o(contentAIData : iContentAIData) returns String;
    action getUserQueryResponse(userQuery : String ) returns String;
    action getUserQueryResponse1(userQuery : String ) returns String;
    action getUserQueryResponseadminapp(userQuery : String ) returns String;
    // function callNipunGenAI( sPrompt: String ) returns String;

    type iContentAIData {
        content           : LargeString;
        max_tokens        : Integer;
        temperature       : Integer;
        frequency_penalty : Integer;
        presence_penalty  : Integer;
        url               : LargeString;
    }

    


}
