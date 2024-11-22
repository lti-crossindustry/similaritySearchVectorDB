namespace com.ltim.similaritysearch;

using { managed } from '@sap/cds/common';

entity DocumentChunk {
  key id: String;
       text_chunk: LargeString;
    metadata_column: LargeString;
    embedding: Vector(1536);
}
entity SAPProcessMatrix : managed
{ 
   key id: String;
       level1: String;
       level2: String;
       level3: String;
       level4: String;
       testscripts: String;
       processflow: String;

       
}

