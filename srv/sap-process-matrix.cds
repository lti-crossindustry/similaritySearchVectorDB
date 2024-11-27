using { com.ltim.similaritysearch as db } from '../db/schema';


service ProcessMatrixSrv {
    // function mycdsfunction(msg : String) returns String;
    // entity ProcessMatrix as projection on db.SAPProcessMatrix;
    entity ProcessDocMedia as projection on db.ProcessDocMedia;
    entity ProcessTree as projection on db.SAPProcessTree;

    function ProcessMatrixTree() returns Map;
    function ProcessDocDel() returns Boolean;

}