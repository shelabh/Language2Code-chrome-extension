

const getKey = () => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(['openai-key'], (result) => {
			if (result['openai-key']) {
				const decodedKey = atob(result['openai-key']);
				resolve(decodedKey);
			}
		});
	});
};

const sendMessage = (content) => {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const activeTab = tabs[0].id;
	
		chrome.tabs.sendMessage(
			activeTab,
			{ message: 'inject', content },
			(response) => {
				if (response.status === 'failed') {
					console.log('injection failed.');
				}
			}
		);
	});
};




const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.6,
    }),
  });
	
  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
	try {
		// Send mesage with generating text (this will be like a loading indicator)
		sendMessage('generating...');

		const { selectionText } = info;
		const basePromptPrefix = `
			Change my English statement into a code. Please make sure the code is the best solution to the statement. Do not write anything other than code. if the programming language is not specified change the statement into python code. 
			Statement:
		`;
		const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

		sendMessage(baseCompletion.text)	
	} catch (error) {
	  	console.log(error);
		sendMessage(error.toString());
	}
};



chrome.contextMenus.create({
	id: 'context-run',
	title: 'Language2Code',
	contexts: ['selection'],
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);