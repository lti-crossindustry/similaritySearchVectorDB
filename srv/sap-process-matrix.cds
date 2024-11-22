using { com.ltim.similaritysearch as db } from '../db/schema';


service ProcessMatrixSrv {
    // function mycdsfunction(msg : String) returns String;
    entity ProcessMatrix as projection on db.SAPProcessMatrix;

    // function ProcessMatrixTree() returns Map;

}