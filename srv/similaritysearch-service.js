const cds = require('@sap/cds')
const tableName = 'COM_LTIM_SIMILARITYSEARCH_DOCUMENTCHUNK'
const tableName1 = 'COM_LTIM_SIMILARITYSEARCH_DOCUMENTCHUNKAPPLICATION'
const embeddingColumn = 'EMBEDDING'
const contentColumn = 'TEXT_CHUNK'
const getPersonalizedEmail = require('./ai-core-service')
//const userQuery = 'In which city are Thomas Jung and Rich Heilman on April, 19th 2024?'
const instructions = 'Return the result in json format. Display the keys, the topic and the city in a table form.'

const altUserQuery = 'Who is joining the event in Madrid Spain?'
const altInstructions = 'Return the result in json format. Display the name.'



module.exports = function () {

    const { NipunAI } = this.entities;
    this.on('getRagResponse', async (req) => {
        try {
            var userQuery = req.data.userQuery;
            const vectorplugin = await cds.connect.to('cap-llm-plugin')
            // const embeddings = await vectorplugin.getEmbedding(userQuery)
            const ragResponse = await vectorplugin.getRagResponse(
                userQuery,
                tableName1,
                embeddingColumn,
                contentColumn,
                // embeddings
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
            100
        )
        return similaritySearchResults
    })
    this.on('executeSimilaritySearchApplication', async (req) => {

        var userQuery = req.data.userQuery;
        const vectorplugin = await cds.connect.to('cap-llm-plugin')
        const embeddings = await vectorplugin.getEmbedding(userQuery)
        const similaritySearchResults = await vectorplugin.similaritySearch(
            tableName1,
            embeddingColumn,
            contentColumn,
            embeddings,
            'L2DISTANCE',
            100
        )
        return similaritySearchResults
    })
    this.on('getUserQueryResponse', async (req) => {

        try {
            var userQuery = req.data.userQuery;
            const vectorplugin = await cds.connect.to('cap-llm-plugin')
            //set the modeName you want
            const chatModelName = "gpt-4";
            const embeddingModelName = "text-embedding-ada-002";

             //Obtain the model configs configured in package.json
            const chatModelConfig = cds.env.requires["gen-ai-hub"][chatModelName];
            const embeddingModelConfig = cds.env.requires["gen-ai-hub"][embeddingModelName];
            const systemPrompt =
                ` You are an helpful assistant who answers user question based only on the following context enclosed in triple quotes.\n`;
              const chatRagResponse = await vectorplugin.getRagResponseWithConfig(
                userQuery,  //user query
                tableName1,   //table name containing the embeddings
                embeddingColumn, //column in the table containing the vector embeddings
                contentColumn, //  column in the table containing the actual content
                systemPrompt, // system prompt for the task
                embeddingModelConfig, //embedding model config
                chatModelConfig, //chat model config
                //Optional.conversation memory context to be used.
                5  //Optional. topK similarity search results to be fetched. Defaults to 5
            );

            let chatCompletionResponse = null;
            if (chatModelName === "gpt-4") {
                chatCompletionResponse =
                {
                      "content": chatRagResponse.completion.choices[0].message.content
                }                                                                                                                               
            }
            //Optional. parse other model outputs if you choose to use a different model.
            else {
                throw new Error("The model supported in this application is 'gpt-4'. Please customize this application to use any model supported by CAP LLM Plugin. Please make the customization by referring to the comments.")
            }
             console.log(" message " + chatRagResponse.completion.choices[0].message.content);
    
            //Optional. handle memory after the RAG LLM call
            const responseTimestamp = new Date().toISOString();
         
            //build the response payload for the frontend.
            const response = {
                 "content": chatCompletionResponse.content,
             };

            return response;
        }
        catch (error) {
            // Handle any errors that occur during the execution
            console.log('Error while generating response for user query:', error);
            throw error;
        }
    })
    
    this.on('getUserQueryResponse1', async (req) => {
        try {
            var userQuery = req.data.userQuery;
            const vectorplugin = await cds.connect.to('cap-llm-plugin')
            //set the modeName you want
            const chatModelName = "gpt-4";
            const embeddingModelName = "text-embedding-ada-002";

            // console.log(`Leveraing the following LLMs \n Chat Model:  gpt-4 \n Embedding Model: text-embedding-ada-002\n`);
            //Optional. handle memory before the RAG LLM call
            //  const memoryContext = await storeRetrieveMessages(conversationId, messageId, message_time, user_id, user_query, Conversation, Message, chatModelName);

            //Obtain the model configs configured in package.json
            const chatModelConfig = cds.env.requires["gen-ai-hub"][chatModelName];
            const embeddingModelConfig = cds.env.requires["gen-ai-hub"][embeddingModelName];
            const systemPrompt =
                ` You are an helpful assistant who answers user question based only on the following context enclosed in triple quotes.\n
`;
            //  console.log(userQuery);
            //  console.log(tableName1);
            //  console.log(embeddingColumn);
            //  console.log(contentColumn);
            //  console.log(systemPrompt);
            //  console.log(embeddingModelConfig);
            //  console.log( chatModelConfig);
            const chatRagResponse = await vectorplugin.getRagResponseWithConfig(
                userQuery,  //user query
                tableName1,   //table name containing the embeddings
                embeddingColumn, //column in the table containing the vector embeddings
                contentColumn, //  column in the table containing the actual content
                systemPrompt, // system prompt for the task
                embeddingModelConfig, //embedding model config
                chatModelConfig, //chat model config
                //Optional.conversation memory context to be used.
                5  //Optional. topK similarity search results to be fetched. Defaults to 5
            );

            let chatCompletionResponse = null;
            if (chatModelName === "gpt-4") {
                chatCompletionResponse =
                {
                      "content": chatRagResponse.completion.choices[0].message.content
                }                                                                                                                               
            }
            //Optional. parse other model outputs if you choose to use a different model.
            else {
                throw new Error("The model supported in this application is 'gpt-4'. Please customize this application to use any model supported by CAP LLM Plugin. Please make the customization by referring to the comments.")
            }
             console.log(" message " + chatRagResponse.completion.choices[0].message.content);
            // console.log(" messageValue " + chatRagResponse.value.completion.choices.message.content);
            // Example of accessing specific fields in the response
            // const { response, similarityResults } = chatRagResponse;

            // console.log("Generated Response:", response);
            // similarityResults.forEach((result, index) => {
            //     console.log(`Result ${index + 1}:`);
            //     console.log(`Content: ${result[contentColumn]}`);
            //  });
            // if (chatRagResponse) {
            //     chatCompletionResponse = JSON.parse(chatRagResponse.value.completion.choices[0].message);

            // }
            // //Optional. parse other model outputs if you choose to use a different model.
            // else {
            //     chatCompletionResponse = "The model supported in this application is 'gpt-4'. Please customize this application to use any model supported by CAP LLM Plugin. Please make the customization by referring to the comments."
            // }
            //Optional. handle memory after the RAG LLM call
            const responseTimestamp = new Date().toISOString();
         
            //build the response payload for the frontend.
            const response = {
                 "content": chatCompletionResponse.content,
             };

            return response;

            // return chatRagResponse;

        }
        catch (error) {
            // Handle any errors that occur during the execution
            console.log('Error while generating response for user query:', error);
            throw error;
        }


    })
    this.on('getUserQueryResponseadminapp', async (req) => {
    
        try {
            var userQuery = req.data.userQuery;
            const vectorplugin = await cds.connect.to('cap-llm-plugin')
            //set the modeName you want
            const chatModelName = "gpt-4";
            const embeddingModelName = "text-embedding-ada-002";
            console.log("this is the tablename" + tableName);
             //Obtain the model configs configured in package.json
            const chatModelConfig = cds.env.requires["gen-ai-hub"][chatModelName];
            const embeddingModelConfig = cds.env.requires["gen-ai-hub"][embeddingModelName];
            const systemPrompt =
                ` You are an helpful assistant who answers user question based only on the following context enclosed in triple quotes.\n`;
              const chatRagResponse = await vectorplugin.getRagResponseWithConfig(
                userQuery,  //user query
                tableName,   //table name containing the embeddings
                embeddingColumn, //column in the table containing the vector embeddings
                contentColumn, //  column in the table containing the actual content
                systemPrompt, // system prompt for the task
                embeddingModelConfig, //embedding model config
                chatModelConfig, //chat model config
                //Optional.conversation memory context to be used.
                5  //Optional. topK similarity search results to be fetched. Defaults to 5
            );
            console.log("this is the tablename 2" + tableName);
    
            let chatCompletionResponse = null;
            if (chatModelName === "gpt-4") {
                chatCompletionResponse =
                {
                      "content": chatRagResponse.completion.choices[0].message.content
                }                                                                                                                               
            }
            //Optional. parse other model outputs if you choose to use a different model.
            else {
                throw new Error("The model supported in this application is 'gpt-4'. Please customize this application to use any model supported by CAP LLM Plugin. Please make the customization by referring to the comments.")
            }
             console.log(" message " + chatRagResponse.completion.choices[0].message.content);
    
            //Optional. handle memory after the RAG LLM call
            const responseTimestamp = new Date().toISOString();
         
            //build the response payload for the frontend.
            const response = {
                 "content": chatCompletionResponse.content,
             };
             console.log("this is the tablename 3" + tableName);
    
            return response;
        }
        catch (error) {
            // Handle any errors that occur during the execution
            console.log('Error while generating response for user query:', error);
            throw error;
        }
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

    this.on("CREATE", NipunAI, async (req) => {

        // var sProcessName = req.data.sProcessName;
        // var sTestCaseId = req.data.sTestCaseId;
        var sPrompt = req.data.sPrompt;
        var oUrl = 'http://3.111.119.187:9000/v1/chat/completions';
        var myHeaders = new Headers();
        // myHeaders.append("Authorization", "Basic " + oToken);
        myHeaders.append("api-key", "budserve_JKLIN9kMb8jx5zBLS8G6MnJu5tAPWmiHlJSh5ccu");
        myHeaders.append('Content-Type', "application/json");

        let payload =
        {
            "model": "nipun-dpo",
            "temperature": 0.2,
            "messages": [{
                "role": "user",
                "content": sPrompt
            }]
        };

        const response = await fetch(oUrl, {
            method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(payload),
        })
        if (response.status != 200) {
            const oErrorResponse = await response.json()
            var record = {
                "ports": "failed: " + oErrorResponse.error.message.value
            }
            return record;
        } else {
            const data = await response.json();
            return Object.assign(data);
        }
    });
}