const cds = require('@sap/cds')
const tableName = 'COM_LTIM_SIMILARITYSEARCH_DOCUMENTCHUNK'
const embeddingColumn = 'EMBEDDING'
const contentColumn = 'TEXT_CHUNK'
//const userQuery = 'In which city are Thomas Jung and Rich Heilman on April, 19th 2024?'
const instructions = 'Return the result in json format. Display the keys, the topic and the city in a table form.'

const altUserQuery = 'Who is joining the event in Madrid Spain?'
const altInstructions = 'Return the result in json format. Display the name.'

module.exports = function() {
    this.on('getRagResponse', async () => {
        try {
            const vectorplugin = await cds.connect.to('cap-llm-plugin')
            const ragResponse = await vectorplugin.getRagResponse(
                altUserQuery,
                tableName,
                embeddingColumn,
                contentColumn
            )
            return ragResponse
        } catch (error) {
            console.log('Error while generating response for user query:', error)
            throw error;
        }
    })

    this.on('executeSimilaritySearch', async (req) => {
        
        var userQuery = req.data.userQuery;
        const vectorplugin = await cds.connect.to('cap-llm-plugin')
        const embeddings = await vectorplugin.getEmbedding(userQuery)
        const similaritySearchResults = await vectorplugin.similaritySearch(
            tableName,
            embeddingColumn,
            contentColumn,
            embeddings,
            'L2DISTANCE',
            10
        )
        return similaritySearchResults
    })

    async function onGetBearerToken(tx, req) {
        try {
          var tx = cds.transaction(req);
          var clientID = "sb-b66c3931-8480-4dfd-8108-0992e56cac64!b476474|aicore!b540" // app clientID
          var clientSecret = "edf7fec3-428d-4983-b574-536143d70001$I7GPwBkjWwNnKDZmo7PQ3MZ0w4sDNKtO3pOpYKReCZU="; // app clientSecret
          var srvTokenUrl = "https://genai-ltim.authentication.eu10.hana.ondemand.com/oauth/token?grant_type=client_credentials"; // Your application token endpoint  
          // var srvUrl = "https://openai-serv-app.cfapps.eu10-004.hana.ondemand.com/api/v1/completions";
          var token = clientID + ":" + clientSecret;
    
          let params = new Headers()
          params.append('Authorization', "Basic " + btoa(token))
          const response = await fetch(srvTokenUrl, {
              method: 'GET',
              headers: params,
          })
          if (response.status != 200) {
              const oErrorResponse = await response.json()
              return "failed: " + oErrorResponse.error.message.value;
          } else {
              const data = await response.json()
              var accToken = "Bearer " + data.access_token;
              return accToken;
              // var getGENAIData = await onGetGENAIHack(accToken, aResponse);
          }
        } catch (e) {
          return e;
        }
      }
    
    this.on('getCallChatGPT4o', async (req) => {
        try {
            var tx = cds.transaction(req);
            var uContent = req.data.contentAIData.content;
            var uMaxToken = req.data.contentAIData.max_tokens;
            var uTemperature = req.data.contentAIData.temperature;
            var uFreqPenalty = req.data.contentAIData.frequency_penalty;
            var uPresPenalty = req.data.contentAIData.presence_penalty;
            var imageBase64 = req.data.contentAIData.url;
            var accToken = await onGetBearerToken(tx, req);
            var oUrl = "https://api.ai.prod.eu-central-1.aws.ml.hana.ondemand.com/v2/inference/deployments/db95416e131fc5dc/chat/completions?api-version=2023-05-15"
            var myHeaders = new Headers();
            myHeaders.append('AI-Resource-Group', "default");
            myHeaders.append('Content-Type', "application/json");
            myHeaders.append('Authorization', accToken);
            var payload = JSON.stringify({
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": uContent
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": imageBase64
                                }
                            }
                        ]
                    }
                ],
                "max_tokens": uMaxToken,
                "temperature": uTemperature,
                "frequency_penalty": uFreqPenalty,
                "presence_penalty": uPresPenalty,
                "stop": "null"
            });
            
            const response = await fetch(oUrl, {
                method: 'POST',
                timeout: 0,
                headers: myHeaders,
                body: payload,
            })
            if (response.status != 200) {
                const oErrorResponse = await response.json()
                return "failed: " + oErrorResponse.error.message.value;
            } else {
                const data = await response.json();
                return data;
            }
        } catch (e) {
            return e;
        }
    })   
}