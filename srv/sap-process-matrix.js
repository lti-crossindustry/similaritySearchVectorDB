const cds = require('@sap/cds');
const { log } = require('console');
const LOG = cds.log('ProcessMatrixSrv');
// const log = require('cf-nodejs-logging-support')
// const SequenceHelper = require("./library/SequenceHelper");
const { Readable, PassThrough } = require("stream");
cds.env.features.fetch_csrf = true;
let sReqId;

class ProcessMatrixSrv extends cds.ApplicationService {
    async init() {
        const db = await cds.connect.to('db');
        const { ProcessMatrix, ProcessDocMedia, ProcessTree } = this.entities;
        // db.entities('com.ltim.similaritysearch');

        this.on('ProcessMatrixTree', async (oEvent) => {
            const { SAPProcessMatrix, SAPProcessTree } = db.entities('com.ltim.similaritysearch');
            return ProcessMatrixData(SAPProcessMatrix, SAPProcessTree);
        }
        );

        async function ProcessMatrixData(SAPProcessMatrix, SAPProcessTree) {

            let oPMesult = await SELECT.from(SAPProcessMatrix);
            let aLevel1Parents = [], aLevel2Parents = [], aLevel3Parents = [], aLevel4Parents = [];
            let aLevel1List = [], aLevel2List = [], aLevel3List = [], aLevel4List = [], aRepeatData = [];
            let oLevel1Value, oLevel2Value, oLevel3Value, oLevel4Value;
            let aComposeKeyList = [];
            let level1Count = 0, level2Count = 0, level3Count = 0, level4Count = 0;
            let aUpsertData = [];
            for (let each in oPMesult) {

                

                let oLevel1Value = oPMesult[each].level1;
                let oLevel2Value = oPMesult[each].level2;
                let oLevel3Value = oPMesult[each].level3;
                let oLevel4Value = oPMesult[each].level4;

                let sCurrCompositeKey = oLevel1Value + oLevel2Value + oLevel3Value + oLevel4Value;
                if(sCurrCompositeKey)
                sCurrCompositeKey = replaceChar(sCurrCompositeKey);

                aUpsertData.push({ id: oPMesult[each].id, composekey: String(sCurrCompositeKey)  });

                if(sCurrCompositeKey=== "enterprise_asset_managementshutdown_maintenance_processnotification_processcreate_a_shutdown_maintenance_notification_with_revision")
                {
                    console.log("Checking Entry");
                }

                if( !aComposeKeyList.includes(sCurrCompositeKey) )
                {          
                
                    // console.log(oLevel1Value);
                let sLevel1CompKey = replaceChar(oLevel1Value)
                if (oLevel1Value && !aLevel1List.includes(sLevel1CompKey)) {
                    aLevel1List.push(sLevel1CompKey);

                    aLevel1Parents.push({
                        id: "NA" + level1Count,
                        nodename: oLevel1Value,
                        nodelevel: 1,
                        parent: "",
                        composeKey: sLevel1CompKey

                    }
                    );

                    level1Count++;
                }

                let sLevel2CompKey = replaceChar(oLevel1Value + oLevel2Value)
                if (oLevel2Value && !aLevel2List.includes(sLevel2CompKey)) { 
                    aLevel2List.push(sLevel2CompKey);
                    
                    aLevel2Parents.push({
                        id: "NB" + level2Count,
                        nodename: oLevel2Value,
                        nodelevel: 2,
                        parent: oLevel1Value,
                        parentCompKey: sLevel1CompKey,
                        composeKey: sLevel2CompKey

                    });
                    level2Count++;
                }
                
                
                let sLevel3CompKey = replaceChar(oLevel1Value + oLevel2Value + oLevel3Value)
                if (oLevel3Value && !aLevel3List.includes(sLevel3CompKey)) {
                    aLevel3List.push(sLevel3CompKey);
                    aLevel3Parents.push({
                        id: "NC" + level3Count,
                        nodename: oLevel3Value,
                        nodelevel: 3,
                        parent: oLevel2Value,
                        parentCompKey:sLevel2CompKey,
                        composeKey: sLevel3CompKey

                    });
                    level3Count++;
                }
              

                if (oLevel4Value && !aLevel4List.includes(sCurrCompositeKey)) {
                    aLevel4List.push(sCurrCompositeKey);
                    aLevel4Parents.push({
                        id: "ND" + level4Count,
                        nodename: oLevel4Value,
                        nodelevel: 4,
                        parent: oLevel3Value,
                        parentCompKey:sLevel3CompKey,
                        testscripts: oPMesult[each].testscripts,
                        processflow: oPMesult[each].processflow,
                        composeKey: sCurrCompositeKey

                    }
                    );
                    level4Count++;
                }
              

                aComposeKeyList.push( sCurrCompositeKey );
            }
            }

            aLevel1Parents = aLevel1Parents.concat(aLevel2Parents, aLevel3Parents, aLevel4Parents);
            let aTblEnteries = []; //nodeId = 0
            let iParentNodeId ;
            aLevel1Parents.forEach(
                (node) => {
                    iParentNodeId = "";
                    aLevel1Parents.forEach(
                        (pnode) => {
                            if(pnode.composeKey === node.parentCompKey)
                            {
                                iParentNodeId = pnode.id;
                            }
                        });

                    aTblEnteries.push({
                        id: String("H" + node.id),
                        nodename: node.nodename,
                        nodelevel: String(node.nodelevel),
                        parent: node.parent,
                        parentid: (iParentNodeId.trim() !== "") ? String("H" + iParentNodeId) : "" ,
                        testscripts: node.testscripts ? node.testscripts : "",
                        processflow: node.processflow ? node.processflow : "",
                        drillState: node.nodelevel === "4" ? "leaf" : "expanded"
                    });
                    // nodeId++;
                }
            );

            // await UPSERT.into (SAPProcessMatrix).entries(aUpsertData);
            await UPSERT (aUpsertData).into(SAPProcessMatrix);
            await DELETE.from(SAPProcessTree);
            let oTblData = await SELECT.from(SAPProcessTree);
            console.log("After Delete Table enteries - " + oTblData);

            await INSERT.into(SAPProcessTree).entries(aTblEnteries);
            return "Master Data Table - SAPProcessTree updated";
        }

        function replaceChar(sChar)
        {
            if(sChar)
            return (sChar.replaceAll(" ","_").toLowerCase());
            else return sChar;
        }

        this.on("READ", ProcessDocMedia, async (req, next) => {
            console.log("in Media Read");
            if (!req.data.mediaId) {
                return next();
            }
            //Fetch the url from where the req is triggered
            const url = req._.req.path;
           
            if (url.includes("content")) {
                const iMediaId = req.data.mediaId;

                var mediaObj = await SELECT.one.from(ProcessDocMedia).where({ mediaId: iMediaId });

                if (!mediaObj || (mediaObj && mediaObj.length <= 0)) {
                    req.reject(404, "Media not found for the ID");
                    return;
                }
                var decodedMedia = "";
                let mediaStr = mediaObj.base64content.toString();
                // mediaStr = mediaStr.toString();
                decodedMedia = new Buffer.from(
                    mediaStr.split(";base64,").pop(),
                    "base64"
                );
                return _formatResult(decodedMedia, mediaObj.mediaType, mediaObj.filename);

            } else return next();

        });

        function _formatResult(decodedMedia, mediaType, filename) {
            const readable = new Readable();
            readable.push(decodedMedia);
            readable.push(null);

            return {
                value: readable,                
                $mediaContentType: mediaType                
            }


        }   

        this.on("ProcessDocDel", async (oEvent) => {
            console.log("In Attachments Delete");
            await DELETE.from(ProcessDocMedia);
            return true;
        }
        );

        this.after("UPDATE", ProcessDocMedia, async (req, next) => {
        let sMediaId = req.mediaId;
        let sMediaType = req.mediaType;
        
        if(sMediaType !== "application/pdf")
        {
            return;
        }

        
        let sImgBase64 = await convertToImgBase64(sMediaId);

        cds.tx (async ()=>{ 
            await UPDATE (ProcessDocMedia, sMediaId).with({ base64ImgContent: sImgBase64 });
        });
        
        });
        
        
        async function convertToImgBase64 (sMediaId){
        
        var mediaObj;
        await cds.tx (async ()=>{ 
        mediaObj = await SELECT.one.from(ProcessDocMedia).where({ mediaId: sMediaId }).columns('base64content');
        });
        
        if (!mediaObj || (mediaObj && mediaObj.length <= 0)) {
            return;
        }
        const { PdfToImg } = require("pdftoimg-js");

        const pdfBase64 = mediaObj.base64content;
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');
        
        let sImage;        
        sImage = await PdfToImg(pdfBuffer);
        sImage = sImage[0];
        return Promise.resolve(sImage);
        }


        


        return super.init();
    }
}

module.exports = ProcessMatrixSrv;


//     this.on('ProcessDocMediaBase64',async (req) => {
    //         let iMediaId = req.data.mediaId;
    //         if (!iMediaId || (iMediaId && iMediaId.length <= 0)) {
    //             req.reject(404, "Media ID Required");
    //             return;
    //         }
    //         await cds.tx (async ()=>{ 
    //         var mediaObj = await SELECT.one.from(ProcessDocMedia).where({ mediaId: iMediaId }).columns('content');
        

    //     if (!mediaObj || (mediaObj && mediaObj.length <= 0)) {
    //         req.reject(404, "Media not found for the ID");
    //         return;
    //     }

    //     const stream = new PassThrough();
    //     const chunks = [];
    //     stream.on('data', (chunk) => { chunks.push(chunk) });
    //     stream.on('end', async () => {                   
    //         // mediaObj.base64content = Buffer.concat(chunks).toString('base64');   
    //         let base64content = Buffer.concat(chunks).toString('base64');   
    //         await cds.tx (async ()=>{    
    //         await UPDATE(ProcessDocMedia, iMediaId).with({ 'base64content': base64content}); // mediaObj
    //         // return true;
    //         }); 
            
    //     });
       
    //     mediaObj.content.pipe(stream); // writes data in stream object (writeable)
        

    // });
    //     });


        // this.after("UPDATE", ProcessDocMedia, async (req, next) => {
        //     let sMediaId = req.mediaId;  
        //     cds.tx (async ()=>{ 
        //         this.send('ProcessDocMediaBase64', { mediaId: sMediaId });
        //     });
            
        //     });

        // Method to use V4 version for content upload, it changes readable stream to base64
            // this.on("UPDATE", ProcessDocMedia, async (req, next) => {
            //     console.log("in After Media Update");
            //     if (!req.data.mediaId) {
            //         return next();
            //     }
            //     const url = req._.req.path;
            //     //If the request url contains keyword "content" // then read the media content
                
            //     if (url.includes("content")) {
            //         const iMediaId = req.data.mediaId;
            //         // const iMediaId = req.mediaId;

            //         var mediaObj = await SELECT.one.from(ProcessDocMedia).where({ mediaId: iMediaId });
                    

            //         if (!mediaObj || (mediaObj && mediaObj.length <= 0)) {
            //             req.reject(404, "Media not found for the ID");
            //             return;
            //         }

            //         const stream = new PassThrough();
            //         const chunks = [];
            //         stream.on('data', (chunk) => { chunks.push(chunk) });
            //         stream.on('end', async () => {                   
            //             mediaObj.base64content = Buffer.concat(chunks).toString('base64'); 
            //             cds.tx (async ()=>{ 
                            
            //             });      
            //             await UPDATE(ProcessDocMedia, iMediaId).with(mediaObj);
            //         });
                
            //         req.data.content.pipe(stream); // writes data in stream object (writeable)
            //         // req.content.pipe(stream); // writes data in stream object (writeable)
                    


            //     } 
            //     else return next();

            // });