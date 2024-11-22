

module.exports = async function () {

    const cds = require('@sap/cds');
    const db = await cds.connect.to('db');

    // reflect entity definitions used below...
    const { SAPProcessMatrix } = db.entities('com.ltim.similaritysearch');

    this.on('READ', async () => {
        // let SAPProcessMatrix = SAPProcessMatrix;
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
                    parent: "",
                    children: []
                }
                    );
            }

            if( !aLevel2ParentsList.includes(oLevel2ParentValue) )
                {
                    aLevel2ParentsList.push( oLevel2ParentValue );
                    aLevel2Parents.push( {
                        nodename: oLevel2ParentValue,
                        nodelevel:2,
                        parent: oLevel1ParentValue,
                        children: []
                    }
                        );
                }

                if( !aLevel3ParentsList.includes(oLevel3ParentValue) )
                    {
                        aLevel3ParentsList.push( oLevel3ParentValue );
                        aLevel3Parents.push( {
                            nodename: oLevel3ParentValue,
                            nodelevel:3,
                            parent: oLevel2ParentValue,
                            children: []
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
                                children: []
                            }
                                );
                        }
        }

        // for(let level1 in aLevel1Parents)
        //     {
        //          for(let level2 in aLevel2Parents)
        //             {
        //                 if( aLevel2Parents[level2].parent === aLevel1Parents[level1].nodename )
        //                 {
        //                     aLevel1Parents[level1].children.push(aLevel2Parents[level2]);
        //                 }

        //                 for(let level3 in aLevel3Parents)
        //                     {
        //                         if( aLevel3Parents[level3].parent ===  aLevel2Parents[level2].nodename )
        //                             {
        //                                 aLevel2Parents[level2].children.push(aLevel3Parents[level3]);
        //                             }

        //                             for(let level4 in aLevel4Parents)
        //                                 {
        //                                     if( aLevel4Parents[level4].parent ===  aLevel3Parents[level3].nodename )
        //                                         {
        //                                             aLevel3Parents[level3].children.push(aLevel4Parents[level4]);
        //                                         }
        //                                 }
        //                     }
        //             }
                   
                       
        //     }

        aLevel1Parents = aLevel1Parents.concat(aLevel2Parents, aLevel3Parents, aLevel4Parents)
        // console.log( aLevel1Parents[0].children[0].nodename ); 
        return aLevel1Parents;
        



    }
    );

}