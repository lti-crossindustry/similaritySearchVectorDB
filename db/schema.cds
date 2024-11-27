namespace com.ltim.similaritysearch;

using { managed } from '@sap/cds/common';

entity DocumentChunk {
  key id: String;
       text_chunk: LargeString;
    metadata_column: LargeString;
    embedding: Vector(1536);
}
entity SAPProcessMatrix
{ 
   key id: String;
       level1: String;
       level2: String;
       level3: String;
       level4: String;
       testscripts: String;
       processflow: String;       
}

entity SAPProcessTree
{
   key id: String;
       nodename: String;
       nodelevel: String;
       parent: String;
       testscripts: String;
       processflow: Association to many ProcessDocMedia on processflow.processId = $self; 
       NavTo_TestScripts   : Composition of many SAPBusinessProcess_TestScripts
                                             on NavTo_TestScripts.ParentID = id;
}

entity ProcessDocMedia
{
        key mediaId : String;
        processId:  Association to SAPProcessTree;
        @Core.MediaType: mediaType
        content: LargeBinary;
        @Core.IsMediaType: true
        mediaType : String;
        fileName  : String;
}

entity SAPBusinessProcess_TestScripts: managed{
        key sNo            : UUID;
        ParentID           : String(36); 
        testCaseID         : String;
        objective          : String; 
        NavTo_Preconditions: Composition of many SAPTestScripts_Preconditions
                                             on NavTo_Preconditions.ParentID = sNo;
        NavTo_TestSteps: Composition of many SAPTestScripts_TestSteps
                                             on NavTo_TestSteps.ParentID = sNo;
        NavTo_ExpResults: Composition of many SAPTestScripts_ExpResults
                                             on NavTo_ExpResults.ParentID = sNo;
        transactionCode    : String; 
        
}

entity SAPTestScripts_Preconditions: managed{
        key sNo            : UUID;
        preconditions      : String; 
        ParentID           : String(36); 
}

entity SAPTestScripts_TestSteps: managed{
        key sNo            : UUID;
        testSteps      : String; 
        ParentID           : String(36); 
}

entity SAPTestScripts_ExpResults: managed{
        key sNo            : UUID;
        expectedResults      : String; 
        ParentID           : String(36); 
}