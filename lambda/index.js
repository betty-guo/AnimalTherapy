// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
// sets up dependencies
const Alexa = require('ask-sdk-core');
const i18n = require('i18next');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const querystring = require('querystring');
const r2 = require('r2');

const CAT_API_URL   = "https://api.thecatapi.com/";
const CAT_API_KEY   = "778e2d98-b860-44b5-9b5b-a973c5b9ff0a"; 
const DOG_API_URL   = "https://api.thedogapi.com/";
const DOG_API_KEY   = "320dc485-77dc-4fb4-818c-b4911f06ad0b"; 

// function for http calls
async function loadImage(animal, breed_id)
{
  // you need an API key to get access to all the iamges, or see the requests you've made in the stats for your account
  // fix this and take if out
  let _api_key = "";
  if (animal === "CAT") {
        _api_key = CAT_API_KEY;
  } else {
        _api_key = DOG_API_KEY;
  }
  var headers = {
    'X-API-KEY': _api_key,
  }
  var query_params = {
    'has_breeds': true, // we only want images with at least one breed data object - name, temperament etc
    'mime_types':'jpg,png', // we only want static image
    'size':'small',   // get the small images
    'breed_id': breed_id, // pass the breed if needed to find breed
    'limit' : 1       // only need one
  }
  // convert this obejc to query string 
  let queryString = querystring.stringify(query_params);

  try {
    // construct the API Get request url
    let _url = "";
    if (animal === "CAT") {
        _url = CAT_API_URL + `v1/images/search?${queryString}`;
    } else {
        _url = DOG_API_URL + `v1/images/search?${queryString}`;
    }
    
    console.log(_url);
    // make the request passing the url, and headers object which contains the API_KEY
    var response = await r2.get(_url , {headers} ).json
  } catch (e) {
      console.log(e)
  }
  return response;

}

// function for http calls
async function loadID(animal, breed_name)
{
  // you need an API key to get access to all the iamges, or see the requests you've made in the stats for your account
  // fix this and take if out
  let _api_key = "";
  if (animal === "CAT") {
        _api_key = CAT_API_KEY;
  } else {
        _api_key = DOG_API_KEY;
  }
  var headers = {
    'X-API-KEY': _api_key,
  }

  try {
    // construct the API Get request url
    let _url = "";
    if (animal === "CAT") {
        _url = CAT_API_URL + `v1/breeds/search?q=${breed_name}`;
    } else {
        _url = DOG_API_URL + `v1/breeds/search?q=${breed_name}`;
    }
    
    console.log(_url);
    // make the request passing the url, and headers object which contains the API_KEY
    var response = await r2.get(_url , {headers} ).json
  } catch (e) {
      console.log(e)
  }
  return response;

}

// has a favourite animal
const HasFavouriteAnimalLaunchRequestHandler = {
    canHandle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};

        const favanimal = sessionAttributes.hasOwnProperty('favanimal') ? sessionAttributes.favanimal : 0;
        
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest' // has a favourite animal
            && favanimal;
    },
    handle(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        const favanimal = sessionAttributes.hasOwnProperty('favanimal') ? sessionAttributes.favanimal : 0;
        
        const speakOutput = 'Welcome back to Animal Therapy. Your favourite animal is a ' + favanimal + '...To continue with this animal say continue, to change it say change.';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

// starting point
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to Animal Therapy! To begin, are you a cat person or a dog person?';
        const repromptText = 'To get started, please tell me if your favourite animal is a cat or a dog';
         
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptText)
            //.withSimpleCard(requestAttributes.t('SKILL_NAME'))
            .getResponse();
    }
};

// generates random photo
const RandomPhotoHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const requestEnvelope = handlerInput.requestEnvelope;
        
        //console.log("random photo handler ", request.intent.slots.catbreed.value);
        console.log("random photo handler");
        
        return (request.type === 'IntentRequest'
        && request.intent.name === 'CatIntent'
        && request.intent.slots
        && request.intent.slots.catbreed.value === "random") ||
        (request.type === 'IntentRequest'
        && request.intent.name === 'DogIntent'
        && request.intent.slots
        && request.intent.slots.dogbreed.value === "random"); 
    },
    async handle(handlerInput) {
        
        const request = handlerInput.requestEnvelope.request;
          
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        //const speakOutput = requestAttributes.t('WELCOME_MESSAGE', { skillName: requestAttributes.t('SKILL_NAME') }); // change this
        const speakOutput = "Here's your random photo. You can tell me to show you another specific breed's photo, tell me to show you a random photo or even change the type of animal by saying change. Or you can say exit.";
      // const repromptText = requestAttributes.t('REPROMPT_MESSAGE');
         
        try{
            // pass the empty breed
            let images = "";
            let breed_type = "";
            if (request.intent.name === 'CatIntent') {
                images = await loadImage("CAT", "");
                breed_type = 'catbreed';
            } else {
                images = await loadImage("DOG", "");
                breed_type = 'dogbreed';
            }
        
            // get the Image, and first Breed from the returned object.
            let image = images[0];
            let breed = image.breeds[0];
        
            console.log('message processed','showing',breed)
             return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt(repromptText)
            .withStandardCard("Animal Therapy", breed.name, image.url)
            .getResponse();
        
        }catch(error)
        {
            console.log(error)
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .addElicitSlotDirective(breed_type)
            .withSimpleCard("Animal Therapy", "There was an error fetching the image")
            .getResponse();
        }
    }
};

// generates photo based on breed
const PhotoHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request; // fix this to reflect slot isn't empty
        const requestEnvelope = handlerInput.requestEnvelope;
         const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};

        const favanimal = sessionAttributes.hasOwnProperty('favanimal') ? sessionAttributes.favanimal : 0;
        console.log("favanimal ", favanimal);
        
        console.log("photo handler");
        
        
        return ((request.type === 'IntentRequest'
        && request.intent.name === 'CatIntent')
        && request.intent.slots
        && request.intent.slots.catbreed.value) ||
        ((request.type === 'IntentRequest'
        && request.intent.name === 'DogIntent')
        && request.intent.slots
        && request.intent.slots.dogbreed.value); 
    },
    async handle(handlerInput) {
        const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
        const request = handlerInput.requestEnvelope.request;
        const requestEnvelope = handlerInput.requestEnvelope;
        console.log("I'm here");
        // this.event.request.intent.slots.RecipeName.resolutions.resolutionsPerAuthority[0].values[0].value.id;
        
        let temp = "";
        let id = "";
        try{
            // get the breed id
            if (request.intent.name === 'CatIntent') {
                temp = await loadID("CAT", request.intent.slots.catbreed.value);
            } else {
                temp = await loadID("DOG", request.intent.slots.dogbreed.value);
            }
        
            // get the Image, and first Breed from the returned object.
            id = temp[0].id;
            
            console.log('temp', temp);
            console.log('id','showing',id)
        
        }catch(error)
        {
            console.log(error)
        }
        
        //const speakOutput = requestAttributes.t('WELCOME_MESSAGE', { skillName: requestAttributes.t('SKILL_NAME') }); // change this
        const speakOutput = "Here's your photo. You can tell me to show you another specific breed's photo, tell me to show you a random photo or even change the type of animal by saying change. Or you can say exit.";
      // const repromptText = requestAttributes.t('REPROMPT_MESSAGE');
         
        try{
            // pass the breed id
            let images = "";
            let breed_type = "";
            if (request.intent.name === 'CatIntent') {
                images = await loadImage("CAT", id);
                breed_type = 'catbreed';
            } else {
                images = await loadImage("DOG", id);
                breed_type = 'dogbreed';
            }
        
            // get the Image, and first Breed from the returned object.
            let image = images[0];
            let breed = image.breeds[0];
            
            console.log("breed.name ", breed.name);
            console.log("image.url", image.url);
        
            console.log('message processed','showing',breed);
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .withStandardCard("Animal Therapy", breed.name, image.url, image.url)
            .addElicitSlotDirective(breed_type)
            .getResponse();
        
        }catch(error)
        {
            console.log(error)
            return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt(repromptText)
            .withSimpleCard("Animal Therapy", "There was an error fetching the image")
            .getResponse();
        }
    }
};

const CatIntentHandler = {
    canHandle(handlerInput) {
        const request = handlerInput.requestEnvelope.request;
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};

        const favanimal = sessionAttributes.hasOwnProperty('favanimal') ? sessionAttributes.favanimal : 0;
        
        console.log("cat intent handler");
        
        return ((request.type === 'IntentRequest'
        && request.intent.name === 'CatIntent'
        && request.intent.slots
        && !request.intent.slots.catbreed.value) ||
         (request.type === 'IntentRequest'
        && request.intent.name === 'ContinueIntent'
        && favanimal === "cat") ||
         (request.type === 'IntentRequest'
        && request.intent.name === 'ChangeIntent'
        && favanimal === "dog")); // don't have a breed yet
    },
    async handle(handlerInput) {
        const { attributesManager, requestEnvelope } = handlerInput;
        
        const speakOutput = '<audio src="soundbank://soundlibrary/animals/amzn_sfx_cat_meow_1x_01"/> I can show you a random cat photo or show you a photo of a specific breed...What would you like to start with?';
        const repromptText = 'I can show you a random cat photo or show you a specific cat photo...Which one would you like?';
        
        const favanimal = {
            "favanimal": "cat",
        };
        
        attributesManager.setPersistentAttributes(favanimal);
        await attributesManager.savePersistentAttributes();
         
         console.log("I'm in the cat intent handler");
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptText)
            .addElicitSlotDirective('catbreed', {
                name: "CatIntent",
                confirmationStatus: "NONE",
                slots: {}
            })
            //.withSimpleCard(requestAttributes.t('SKILL_NAME'))
            .getResponse();
    }
};

const DogIntentHandler = {
    canHandle(handlerInput) {
      const request = handlerInput.requestEnvelope.request;
        const { attributesManager } = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};

        const favanimal = sessionAttributes.hasOwnProperty('favanimal') ? sessionAttributes.favanimal : 0;
        console.log("favanimal ", favanimal);
        
        console.log("dog intent handler");
        
        return ((request.type === 'IntentRequest'
        && request.intent.name === 'DogIntent'
        && request.intent.slots
        && !request.intent.slots.dogbreed.value) ||
         (request.type === 'IntentRequest'
        && request.intent.name === 'ContinueIntent'
        && favanimal === "dog") ||
         (request.type === 'IntentRequest'
        && request.intent.name === 'ChangeIntent'
        && favanimal === "cat")); // don't have a breed yet
    },
    async handle(handlerInput) {
        const { attributesManager, requestEnvelope } = handlerInput;
        
        const speakOutput = '<audio src="soundbank://soundlibrary/animals/amzn_sfx_dog_med_bark_1x_02"/> I can show you a random dog photo or show you a photo of a specific breed ...What would you like to start with?';
        const repromptText = 'I can show you a random dog photo or show you a specific dog photo...Which one would you like?';
        
        const favanimal = {
            "favanimal": "dog",
        };
        
        attributesManager.setPersistentAttributes(favanimal);
        await attributesManager.savePersistentAttributes();
        
        console.log("I'm in the dog intent handler");
         
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(repromptText)
            .addElicitSlotDirective('dogbreed', {
                name: "DogIntent",
                confirmationStatus: "NONE",
                slots: {}
            })
            //.withSimpleCard(requestAttributes.t('SKILL_NAME'))
            .getResponse();
    }
};


const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak('You can ask me to give you a random photo or a photo of your favourite breed. Or you can say exit... What can I help you with?')
      .getResponse();
  },
};

const FallbackHandler = {
  // The FallbackIntent can only be sent in those locales which support it,
  // so this handler will always be skipped in locales where it is not supported.
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak('Animal Therapy can\'t help you with that.')
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak('Goodbye!')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder
    .speak('Goodbye!')
    .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(`Error stack: ${error.stack}`);
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    return handlerInput.responseBuilder
      .speak('Sorry, an error occurred.')
      .reprompt('Sorry, an error occurred.')
      .getResponse();
  },
};

const LoadAnimalInterceptor = {
    async process(handlerInput) {
        const { attributesManager } = handlerInput;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {};

        const favanimal = sessionAttributes.hasOwnProperty('favanimal') ? sessionAttributes.favanimal : 0;
      
        if (favanimal) {
            attributesManager.setSessionAttributes(sessionAttributes);
        }
    }
}

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
        )
    .addRequestHandlers(
        HasFavouriteAnimalLaunchRequestHandler,
        LaunchRequestHandler,
        RandomPhotoHandler,
        PhotoHandler,
        CatIntentHandler,
        DogIntentHandler,
        HelpHandler,
        ExitHandler,
        FallbackHandler,
        SessionEndedRequestHandler
    )
    .addRequestInterceptors(
        LoadAnimalInterceptor
    )
    .addErrorHandlers(
        ErrorHandler
    )
    .lambda();
