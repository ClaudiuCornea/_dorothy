'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Text} = require('dialogflow-fulfillment');
const fetch = require('node-fetch'); 

exports.dorothyCares = functions.https.onRequest( (request, response) => {
  
  const agent = new WebhookClient ({ request, response });
  
  function extractTags ( contextParameter ) {
    let paramsArray = [];
    if ( typeof contextParameter === 'object' ) {
      paramsArray = contextParameter.map( (param) => {
        return param
      })
    }
    else if ( typeof contextParameter === 'string' ) {
      paramsArray.push(contextParameter)
    };
    return paramsArray;
  }

  function createTagsArray ( context ) {
    let tagsArray = [];
    if ( context.Technologies ) {
      tagsArray.push(extractTags(context.Technologies))
      };
    if ( context.CodeTopic ) {
      tagsArray.push(extractTags(context.CodeTopic));
    };
    if ( context.OS ) {
    tagsArray.push(extractTags(context.OS))
    };
    return tagsArray;
  }

  function generateGetRequest ( tagsArray ) {
    let stringRequest = "/tech-answers?";
    stringRequest=stringRequest.concat( "0=" + tagsArray[0] );
    for (let i = 1 ; i < tagsArray.length; i++ ) {
      stringRequest = stringRequest.concat( "&" + i + "=" + tagsArray[i] );
    };
    return stringRequest;
  }

  function generateFullGetRequestUrl ( url,string ) {
    let getReq = url.concat(string);
    return getReq;
  }

  async function UserAsksTech ( agent ) {
    let currentContext = (agent.context.get('useraskedtech'));
    let queryTagsArray = createTagsArray(currentContext.parameters);
    let getRequest = generateGetRequest(queryTagsArray);
    let requestFullUrl = generateFullGetRequestUrl('https://dorothycares.ovh/resources', getRequest);
    const response = await fetch( requestFullUrl, {
      method : 'get',
      headers : { 'Content-Type' : 'application/json' },
    });
    const body = await response.json();  //.json() needed to have usable info
    const answer = JSON.stringify(body);  // re-stringify so DialogFlow can read it
    agent.add(answer);
  }

  async function Legacy ( agent ) {
    const response = await fetch( 'https://dorothycares.ovh/node-api/ressources/php', {
      method : 'get',
      headers : { 'Content-Type' : 'application/json' },
    });
    let body = await response.json();
    body.modal = true;
    body.api = 'no-rel';
    body.type = 'ressources';
    const answer = JSON.stringify(body);
    agent.add(answer);
  }
    
  // Run the proper function handler based on the matched Dialogflow intent name
  
  let intentMap = new Map();
  intentMap.set( 'UserAsksTech', UserAsksTech );
  intentMap.set( 'Legacy', Legacy );
  agent.handleRequest(intentMap);
});