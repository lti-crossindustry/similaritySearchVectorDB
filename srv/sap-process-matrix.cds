using { com.ltim.similaritysearch as db } from '../db/schema';


service ProcessMatrixSrv {
    // function mycdsfunction(msg : String) returns String;
    // entity ProcessMatrix as projection on db.SAPProcessMatrix;
    entity ProcessDocMedia as projection on db.ProcessDocMedia;
    entity ProcessTree as projection on db.SAPProcessTree;
     entity SAPBusinessProcess_TestScripts as projection on db.SAPBusinessProcess_TestScripts;
     entity SAPTestScripts_Preconditions as projection on db.SAPTestScripts_Preconditions;
     entity SAPTestScripts_TestSteps as projection on db.SAPTestScripts_TestSteps;
     entity SAPTestScripts_ExpResults as projection on db.SAPTestScripts_ExpResults;


    function ProcessMatrixTree() returns String;
    function ProcessDocDel() returns Boolean;
    function ProcessDocMediaBase64() returns String;

}