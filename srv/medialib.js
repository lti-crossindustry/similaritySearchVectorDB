const SequenceHelper = require("./library/SequenceHelper");
const { Readable, PassThrough } = require("stream");
const cds = require('@sap/cds');
cds.env.features.fetch_csrf = true;
let sReqId;

module.exports = async function () {

    // const {
    //     ProcessDocMedia
    // } = this.entities;
    const db = await cds.connect.to('db');

    // reflect entity definitions used below...
    const { ProcessDocMedia, SAPProcessTree } = db.entities('com.ltim.similaritysearch');

    /**
     * Handler method called before creating data entry
     * for entity ProcessDocMedia.
     */
    this.before('CREATE', ProcessDocMedia, async (req) => {
        const db = await cds.connect.to("db");
        // Create Constructor for SequenceHelper 
        // Pass the sequence name and db
        const SeqReq = new SequenceHelper({
            sequence: "MEDIA_ID",
            db: db,
        });
        //Call method getNextNumber() to fetch the next sequence number 
        let seq_no = await SeqReq.getNextNumber();
        // Assign the sequence number to id element
        sReqId = req.data.id = seq_no;
        //Assign the url by appending the id
        req.data.url = `/MediaLibSrv/ProcessDocMedia(${req.data.id})/content`;
    });

    this.after('CREATE', ProcessDocMedia, async (req) => {
        // const db = await cds.connect.to("db");
        // Create Constructor for SequenceHelper 
        // Pass the sequence name and db
        UPDATE (SAPProcessTree, req.data.processId) .with ({
            processflow: sReqId     
          });
    });

    /**
     * Handler method called on reading data entry
     * for entity ProcessDocMedia.
     **/
    this.on("READ", ProcessDocMedia, async (req, next) => {
        if (!req.data.id) {
            return next();
        }
        //Fetch the url from where the req is triggered
        const url = req._.req.path;
        //If the request url contains keyword "content"
        // then read the media content
        if (url.includes("content")) {
            const iMediaId = req.data.id;
            // var tx = cds.transaction(req);
            // // Fetch the media obj from database
            // var mediaObj = await tx.run(
            //     SELECT.one.from("Media.db.ProcessDocMedia", ["content", "mediaType"]).where(
            //         "id =",
            //         id
            //     )
            // );

            var mediaObj = await SELECT.one.from (ProcessDocMedia) .where ({ id: iMediaId })
            .columns ( oProcessDocMediaRow => { oProcessDocMediaRow.content, oProcessDocMediaRow.mediaType })       


            if (mediaObj.length <= 0) {
                req.reject(404, "Media not found for the ID");
                return;
            }
            var decodedMedia = "";
            decodedMedia = new Buffer.from(
                mediaObj.content.toString().split(";base64,").pop(),
                "base64"
            );
            return _formatResult(decodedMedia, mediaObj.mediaType);
        } else return next();
    });

    function _formatResult(decodedMedia, mediaType) {
        const readable = new Readable();
        const result = new Array();
        readable.push(decodedMedia);
        readable.push(null);
        return {
            value: readable,
            '*@odata.mediaContentType': mediaType
        }

    
    }

}

