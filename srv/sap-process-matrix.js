const cds = require('@sap/cds');

const SequenceHelper = require("./library/SequenceHelper");
const { Readable, PassThrough } = require("stream");
cds.env.features.fetch_csrf = true;
let sReqId;

class ProcessMatrixSrv extends cds.ApplicationService { async init() 
    {
        

    const db = await cds.connect.to('db');
    const { SAPProcessMatrix, ProcessDocMedia, SAPProcessTree } = db.entities('com.ltim.similaritysearch');

    this.on('ProcessMatrixTree', async (oEvent) => {
        return ProcessMatrixData( SAPProcessMatrix, SAPProcessTree );    
    }
    );

    async function ProcessMatrixData( SAPProcessMatrix, SAPProcessTree )
    {
       
         let oPMesult = await SELECT.from(SAPProcessMatrix);
         let aLevel1Parents = [], aLevel2Parents = [], aLevel3Parents = [], aLevel4Parents = []; 
         let aLevel1ParentsList = [], aLevel2ParentsList = [], aLevel3ParentsList = [], aLevel4ParentsList = []; 
         let oLevel1ParentValue, oLevel2ParentValue, oLevel3ParentValue, oLevel4ParentValue;
         for(let each in oPMesult)
         {
 
             let oLevel1ParentValue = oPMesult[each].level1;
             let oLevel2ParentValue = oPMesult[each].level2;
             let oLevel3ParentValue = oPMesult[each].level3;
             let oLevel4ParentValue = oPMesult[each].level4;
             
             if( !aLevel1ParentsList.includes(oLevel1ParentValue) )
             {
                 aLevel1ParentsList.push( oLevel1ParentValue );
                 aLevel1Parents.push( {
                     nodename: oLevel1ParentValue,
                     nodelevel:1,
                     parent: ""
                     
                 }
                     );
             }
 
             if( !aLevel2ParentsList.includes(oLevel2ParentValue) )
                 {
                     aLevel2ParentsList.push( oLevel2ParentValue );
                     aLevel2Parents.push( {
                         nodename: oLevel2ParentValue,
                         nodelevel:2,
                         parent: oLevel1ParentValue
                         
                     }
                         );
                 }
 
                 if( !aLevel3ParentsList.includes(oLevel3ParentValue) )
                     {
                         aLevel3ParentsList.push( oLevel3ParentValue );
                         aLevel3Parents.push( {
                             nodename: oLevel3ParentValue,
                             nodelevel:3,
                             parent: oLevel2ParentValue
                             
                         }
                             );
                     }
 
                     if( !aLevel4ParentsList.includes(oLevel4ParentValue) )
                         {
                             aLevel4ParentsList.push( oLevel4ParentValue );
                             aLevel4Parents.push( {
                                 nodename: oLevel4ParentValue,
                                 nodelevel:4,
                                 parent: oLevel3ParentValue,
                                 testscripts:oPMesult[each].testscripts,
                                 processflow: oPMesult[each].processflow
                                 
                             }
                                 );
                         }
         }
 
         aLevel1Parents = aLevel1Parents.concat(aLevel2Parents, aLevel3Parents, aLevel4Parents);
         let nodeId = 0, aTblEnteries = [];
         aLevel1Parents.forEach(
             (node) =>{
                 aTblEnteries.push( { id: String("N" + nodeId), 
                                         nodename: node.nodename, 
                                         nodelevel: String(node.nodelevel), 
                                         parent: node.parent,
                                         testscripts: node.testscripts ? node.testscripts : "",
                                         processflow: node.processflow ? node.processflow : ""
                                    } );
                 nodeId++;
             }
         );
         await DELETE.from(SAPProcessTree);
         let oTblData = await SELECT.from(SAPProcessTree);
         console.log( "After Delete Table enteries - " +  oTblData  );
         
         await INSERT.into(SAPProcessTree).entries(aTblEnteries);
         return "Master Data Table - SAPProcessTree updated";
    }

    this.before("READ", SAPProcessTree, async (req) => {
        cds.log("before Media Read");
    });

    this.before("READ", ProcessDocMedia, async (req) => {
        console.log("before Media Read");
    });
    /**
     * Handler method called on reading data entry
     * for entity ProcessDocMedia.
     **/
    this.on("READ", ProcessDocMedia, async (req, next) => {
        console.log("in Media Read");
        if (!req.data.mediaId) {
            return next();
        }
        //Fetch the url from where the req is triggered
        const url = req._.req.path;
        //If the request url contains keyword "content"
        // then read the media content
        if (url.includes("content")) {
            const iMediaId = req.data.mediaId;
            
            var mediaObj = await SELECT.one.from (ProcessDocMedia) .where ({ id: iMediaId });    

            if (mediaObj.length <= 0) {
                req.reject(404, "Media not found for the ID");
                return;
            }
            var decodedMedia = "";
            decodedMedia = new Buffer.from(
                mediaObj.content.toString().split(";base64,").pop(),
                "base64"
            );
            return _formatResult(decodedMedia, mediaObj.mediaType,  mediaObj.filename, mediaObj.processId);
        } else return next();
    });

    function _formatResult(decodedMedia, mediaType, filename, processId) {
        const readable = new Readable();
        // const result = new Array();
        readable.push(decodedMedia);
        readable.push(null);
        return {
            value: readable,
            '*@odata.mediaContentType': mediaType,
            filename: filename,            
            processId: processId
        }

    
    }

    this.on("ProcessDocDel", async (oEvent) => {
        console.log("In Attachments Delete");
        await DELETE.from(ProcessDocMedia);
        return true;
    }
    );

    //     /**
//      * Handler method called before creating data entry
//      * for entity ProcessDocMedia.
//      */
//     // this.before('CREATE', ProcessDocMedia, async (req) => {
//     //     // console.log(req);
//     //     console.log("In before CREATE");
//     //     // Create Constructor for SequenceHelper 
//     //     // Pass the sequence name and db
//     //     const SeqReq = new SequenceHelper({
//     //         sequence: "MEDIA_ID",
//     //         db: db,
//     //     });
//     //     //Call method getNextNumber() to fetch the next sequence number 
//     //     let seq_no = await SeqReq.getNextNumber();
//     //     // Assign the sequence number to id element
//     //     sReqId = req.data.mediaId = seq_no;
//     //     //Assign the url by appending the id
//     //     // req.data.url = `/MediaLibSrv/ProcessDocMedia(${req.data.mediaId})/content`;
//     // });

//     // this.after('CREATE', ProcessDocMedia, async (req) => {
//     //     // console.log(req);
//     //     console.log("In After CREATE");
//     //     // Create Constructor for SequenceHelper 
//     //     // Pass the sequence name and db
//     //     UPDATE (SAPProcessTree, req.data.processId) .with ({
//     //         processflow: sReqId     
//     //       });
//     // });

    return super.init()
    }
}

module.exports = ProcessMatrixSrv;
