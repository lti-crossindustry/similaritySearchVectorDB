const resourceGroupId = `<resourceGroupId>`;
const deploymentId = "<deploymentId>";
const AI_CORE_DESTINATION = "<AI_CORE_DESTINATION_NAME>";
const API_VERSION = "<API_VERSION>";

async function getPersonalizedEmail(data)
{
    const template = `
                    you are S/4 Hana Expert , this is a user query
                    You are an advanced language model. Your task is to generate a coherent and contextually appropriate response to a user’s query using the provided embeddings or context. Ensure the response is accurate, relevant, and engaging.
                    User Query: [Insert user query here]
                    Context/Embeddings: [Insert context or embeddings here]
                    Instructions:
                    1. Analyze the user query and the provided context or embeddings.
                    2. Generate a response that directly addresses the user’s query.
                    3. Ensure the response is clear, concise, and informative.
                    4. Maintain a friendly and approachable tone.
                    `
    if (deploymentId) {
    const aiCoreService = await cds.connect.to(AI_CORE_DESTINATION);
    const payload = {
        messages: [{ role: "user", content: template }],
        max_tokens: 16000,
        temperature: 0.0,
    };
    const headers = {
        "Content-Type": "application/json",
        "AI-Resource-Group": resourceGroupId,
    };
    const response = await aiCoreService.send({
        // @ts-ignore
        query: `POST /inference/deployments/${deploymentId}/chat/completions?api-version=${API_VERSION}`,
        data: payload,
        headers: headers,
    });
    console.log(JSON.stringify(response));
    return response["choices"][0]?.message?.content;
    } else {
    return `No deployment found for this tenant`;
    }
}

module.exports=getPersonalizedEmail;