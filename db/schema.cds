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
       processflow: String; 
}

entity ProcessDocMedia
{
    key id        : Integer;
        @Core.MediaType   : mediaType
        content   : LargeBinary;
        @Core.IsMediaType : true
        mediaType : String;
        fileName  : String;
        url       : String;
        processId: String;
}

