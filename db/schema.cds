namespace com.ltim.similaritysearch;

using { managed } from '@sap/cds/common';

entity DocumentChunk {
  key id: String;
       text_chunk: LargeString;
    metadata_column: LargeString;
    embedding: Vector(1536);
}
