// @ts-check
const fs = require("fs"),
	http = require("http"),
	https = require("https"),
	express = require("express"),
	bodyParser = require("body-parser"),
	request= require("request"),
	util = require('util');
const { exec } = require("child_process");

//settings to connect to Siren port 
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9220/siren/'}); 

//creating the connector
const app = express();
const port = process.env.PORT || 3700;

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
		
function getDashboard(){
  request.get('http://127.0.0.1:5606/api/generate-query/dashboard').auth('sirenadmin', 'password').on('response', function(response){
		let data="";
		
		response.on('data', (chunk) =>{
			data += chunk;
		});		
		
		response.on('end', () => {	
		const dashboardJSON= JSON.parse(data);
		//création du dictionnaire
		var i= 0;
		var len= dashboardJSON.length;
		while(i<len){
			let index= dashboardJSON[i].index;
			if(index != undefined){
				let query= dashboardJSON[i].query;
				Dashboards[index[0]]= query;
			}
			i++;
		}
		});
	});  
}

var Dashboards= new Object(); //definition of the dictionnary

setInterval(getDashboard, 5000);
/**
 * Extracts the search text from the supplied condition
 * @param {Object[]} conditions - The conditions provided in the search form
 * @param {string} conditionId - The identifier of the condition whose value is the search text
 * @returns {Object} - The search text, or Undefined
 */
function valueFromCondition(conditions, conditionId) {
	const condition = conditions && conditions.find(x => x.id === conditionId);
	return condition && condition.value;
}

/**
 * Determines whether a substring occurs within a supplied string, using a case-insensitive comparison
 * @param {string} source - The string to search for a substring within
 * @param {string} searchValue - The substring to search for within the source string
 */
function caseInsensitiveContains(source, searchValue) {
	return source.toLowerCase().includes(searchValue.toLowerCase());
}

/**
 * Determines whether a source identifier is from the i2 Connect gateway
 * @param {SourceId} sourceId - The source identifier
 */
function isI2ConnectSeed(sourceId) {
	return sourceId.type === "OI.DAOD";
}

/**
 * Extracts external identifiers from the keys of i2 Connect source identifiers
 * @param {SourceId[]=} sourceIds - The source identifiers to query
 * @returns {Set<string>} - The set of external identifiers from i2 Connect sources
 */
function extractExternalIdsFromI2ConnectSources(sourceIds) {
	// i2 Connect keys have the format [connectorId, itemTypeId, externalId]
	// 
	//
	const externalIds = sourceIds ? sourceIds.filter(isI2ConnectSeed).map(s => s.key[2]) : [];

	return new Set(externalIds);
}

/**
 * The security configuration file that sets up HTTP or HTTPS
 */
const securityConfig = JSON.parse(fs.readFileSync("security-config.json", "utf8"));

/**
 * Make the server use HTTPS if the configuration file demands it
 */
let server;
if (securityConfig.https) {
	// Secure connection
	const options = {
		key: fs.readFileSync(securityConfig.keyFileName),
		cert: fs.readFileSync(securityConfig.certificateFileName),
		ca: fs.readFileSync(securityConfig.certificateAuthorityFileName),
		passphrase: securityConfig.keyPassphrase,
		requestCert: true,
		rejectUnauthorized: false
	};

	app.use((req, res, next) => {
		const clientUnauthorized = () => res.status(401).send("Client is not authorized");
		if (!req.client.authorized) {
			return clientUnauthorized();
		}

		const cert = req.socket.getPeerCertificate();

		if (!cert.subject || cert.subject.CN !== securityConfig.gatewayCN) {
			return clientUnauthorized();
		}

		next();
	});

	server = https.createServer(options, app);
} else {
	// Insecure connection
	server = http.createServer(app);
}



/*------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------*/


/*CUSTOM CODE SEGMENT*/

/*
 * convert Siren Dashboard to the native Entity of I2
 */
function marshalDashboard(dashboard) {
	return {
		id: dashboard.id,
		typeId: "ET6",
		properties: {
			INT15: dashboard.title,
			INT14: dashboard.type,
			INT16: JSON.stringify(dashboard.index),
			INT4:	 JSON.stringify(dashboard.query)
		}
	};
}

/**
 * The "acquire" endpoint for the 'siren dashboard' service
 */
app.post("/sirenDashboards/acquire", (req, res) => {
	// Pull out the option using the identifier defined in the client configuration
	//const useOrganizationsMembers = valueFromCondition(req.body.payload.conditions, "organizationsMembers");

	request.get('http://127.0.0.1:5606/api/generate-query/dashboard').auth('sirenadmin', 'password').on('response', function(response){
		let data="";

		response.on('data', (chunk) =>{
			data += chunk;
		});		

		response.on('end', () => {	
			const dashboardJSON= JSON.parse(data);
			const dashboard= dashboardJSON.map(marshalDashboard);
			console.log(dashboard);
			res.send({
				entities: dashboard,
				links: []
			});
		});
	});  
});

/*
 * convert Siren Dashbord link to the native Link of I2
 */
function marshalDashboardLink(id1, id2){
	var Ident= Math.random();
	return {
		// Construct a unique identifier for the link, given the two end identifiers in the data set
		id: Ident,

		typeId: "LT2",

		fromEndId: id1,
		toEndId: id2,	

		linkDirection: "NONE",
	};  
}


//---------------------------------COMPANIES---------------------------------------

/*
 * convert Siren Companies to the native entitie of I2
 */
function marshalCompanies(companie) {
	if(typeof(companie._source.label) == "number"){
		companie._source.label= companie._source.label.toString();
	}
	const formatedCompanie= {
		id: companie._id,
		typeId: "ET4",
		properties: {
			ORG1: companie._source.id,
			ORG2: companie._source.label,
			ORG4: companie._source.url,
			PT16: companie._source.city,
			PT17: companie._source.countrycode
		}
	};
	const geopoints= (companie._source.Geopoint);
	if( geopoints != null){
		//formatedCompanie.properties.PT13= companie._source.Geopoint;
		const geopoint= geopoints.split(",");
		formatedCompanie.properties.PT14= geopoint[1]; //latitude
		formatedCompanie.properties.PT15= geopoint[0]; //longitude
		//or the Geopoint
		const coords= { type: "Point", coordinates: [parseFloat(geopoint[1]), parseFloat(geopoint[0])]}
		//const coords= { type: "Point", coordinates: [0.0, 0.0]};
		formatedCompanie.properties.PT13= coords;
	}
	return formatedCompanie;
}

/**
 * The "acquire" endpoint for the 'find like this' service (Example Seeded Search 1)
 */
app.post("/sirenCompanies/acquire", (req, res) => {
	const term = valueFromCondition(req.body.payload.conditions, "term");
	const nb = valueFromCondition(req.body.payload.conditions, "nb");	
	//we get the object {entity, link, truc}
	const seeds = req.body.payload.seeds;
	//we get the list entitie
	const seed = seeds.entities[0];

	//{ query: JSON.parse(seed.properties.INT4) }, //get the query
	//sending search and writting result
	const myQuery= JSON.parse(seed.properties.INT4);
	myQuery.bool.must.push({"wildcard": {"label": {"value": "*"+term+"*"}}});

	client.search({ 
		index: JSON.parse(seed.properties.INT16),
		size: nb,
		body: { 
			query: myQuery
		}
	}, 
		(err, result) => {
			if (err) console.error(err)
			const companiesJSON= result.body.hits.hits;
			//const companies= companiesJSON.map(marshalCompanies);
			//console.log(companiesJSON);
			companies= [];
			companiesLinks= [];
			var count= 0;
			for(const comp of companiesJSON){
				count = count+1;
				if(comp._index == "companies"){ 
					const newComp= marshalCompanies(comp);
					companies.push(newComp);
					companiesLinks.push(marshalDashboardLink(newComp.id, seed.seedId));
					if(count == 23){
						console.log(comp);
						console.log(newComp);
					}	
				}
			}
			res.send({
				entities: companies,
				links: companiesLinks
			});
		}
	);
});


//---------------------------------INVESTOR---------------------------------------

/*
 * convert Siren Investors to the native entitie of I2
 */
async function marshalInvestors(investor) {
	const myQuery= {"wildcard": {"id": {"value": investor._source.investors}}}; 
	const result= await client.search({ 
		index: ["investors"],
		size: 1,
		body: { 
			query: myQuery
		}
	}
	)
	const myInvestor= result.body.hits.hits[0];
	if(myInvestor._source.investortype == "person"){ 
		return {
			id: myInvestor._id,
			typeId: "ET5",
			properties: {
				PER1: myInvestor._source.affiliation_name,
				PER4: myInvestor._source.first_name,
				PER6: myInvestor._source.last_name,
				PER50: myInvestor._source.overview
			}
		};
	}
	else if(myInvestor._source.investortype == "company"){ 
		return {
			id: myInvestor._id,
			typeId: "ET4",
			properties: {
				PT3: false,
				ORG1: myInvestor._source.affiliation_name,
				ORG2: myInvestor._source.label,
				ORG4: myInvestor._source.homepage_url,
				ORG7: myInvestor._source.description
			}
		};
	}
	else if(myInvestor._source.investortype == "fin-org"){ 
		return {
			id: myInvestor._id,
			typeId: "ET4",
			properties: {
				PT3: true,
				ORG1: myInvestor._source.affiliation_name,
				ORG2: myInvestor._source.label,
				ORG4: myInvestor._source.homepage_url,
				ORG7: myInvestor._source.description
			}
		};
	}
	else{ 
		return "rien";
	}
}

function marshalInvestmentLink(inv, id1, id2){
	var Ident= Math.random();
	return {
		// Construct a unique identifier for the link, given the two end identifiers in the data set
		id: Ident,

		typeId: "LT1",

		fromEndId: id1,
		toEndId: id2,	

		linkDirection: "AGAINST",
		properties: {
			PT4: inv._source.raised_amount,
			PT5: inv._source.funded_date,
			PT6: inv._source.raised_currency_code
		}
	};  
}

async function sirenInvestors(seed){ 
	const myIndex= ["investments"];
	const myQuery= {"bool": {"must":[{"wildcard": {"companies": {"value": "*"+seed.properties["ORG1"]+"*"}}}],"must not":[]}};

	//sending search and writting result
	const result= await client.search(
		{ 
			index: myIndex,
			body: {
				query: myQuery
			}
		}
	);
	//definition of entity table and link table
	var investors= [];
	var investorsLinks= [];

	//parsing data
	const investorsJSON= result.body.hits.hits;
	for(var inv of investorsJSON){
		var newInv= await marshalInvestors(inv);
		if(newInv != "rien"){
			investors.push(newInv);
			investorsLinks.push(marshalInvestmentLink(inv, seed.seedId, newInv.id));
		}
	}
	return { 
		entities: investors,
		links: investorsLinks
	};
}

//remove ducplicate entities gathered by the multiple request
function removeDups(names) {
	let unique = {};
	names.forEach(function(i) {
		if(!unique[i]) {
			unique[i] = true;
		}
	});
	return Object.keys(unique);
}

//the specific filter to distinguish organizations, financial organizations, and people
function typeFilter(Ent, per, org, fin_org){ 
	var tab= [];
	var finale= [];
	if (per){
		tab.push("ET5");
	}
	if (org){ 
		tab.push("ET4false");
	}
	if (fin_org){ 
		tab.push("ET4true");
	}
	finale= Ent.map(function(i){
		var ID= "";
		var ret= null;
		if (i.typeId == "ET4"){
			if (i.PT3 == true){ 
				ID= "ET4true";
			}
			else{ 
				ID= "ET4false";
			}
		}
		else{ 
			ID="ET5";
		}

		if(tab.indexOf(ID) != -1){ 
			var ret= i;
		}
		return ret;
	}
	);	
	finale = finale.filter(function (el) {
		return el != null;
	});
	return finale;	
}

app.post("/sirenInvestors/acquire", async (req, res) => {
	const person = valueFromCondition(req.body.payload.conditions, "person");
	const org = valueFromCondition(req.body.payload.conditions, "org");	
	const fin_org = valueFromCondition(req.body.payload.conditions, "fin_org");	
	const amount = valueFromCondition(req.body.payload.conditions, "amount");	

	const seeds = req.body.payload.seeds.entities;

	//define void tables Entities and Links
	var Entities= [];
	var Links= [];
	for(const seed of seeds){
		const investors= await sirenInvestors(seed).catch((error) => {
			return {
				entities: [],
				links: []
			}
		});
		//console.log(investors.entities);
		Entities= [...Entities, ...investors.entities];
		Links= [...Links, ...investors.links];
	}
	//remove redundancy
	var tab= Entities.map(JSON.stringify);
	tab= removeDups(tab);
	Entities= tab.map(JSON.parse);

	//filter org, fin-org, person
	Entities= typeFilter(Entities, person, org, fin_org);

	//see if Entities is void
	if(Entities.length == 0){ 
		Links= [];
	}
	console.log(Entities);
	//console.log(Links);
	res.send({
		entities: Entities,
		links: Links
	});
});

//---------------------------------INVESTEMENT---------------------------------------


function marshalInvestement(investment) {
	return {
		id: investment._id,
		typeId: "ET11",
		properties: {
			PT8: investment._source.raised_amount,
			PT9: investment._source.raised_currency_code,
			PT10: investment._source.funded_date
		}
	};
}

app.post("/sirenInvestements/acquire", (req, res) => {
	//getting settings set in the form currency_code
	const raised_amount = valueFromCondition(req.body.payload.conditions, "raise_amount");
	const currency_code = valueFromCondition(req.body.payload.conditions, "currency_code");

	//we get the object {entity, link, truc}
	const seeds = req.body.payload.seeds;
	//we get the list entitie
	const seed = seeds.entities[0];
	const myIndex = JSON.parse(seed.properties["INT16"]);
	const myQuery = JSON.parse(seed.properties["INT4"]);
	const myFilter= JSON.parse('{"term" : { "raised_currency_code" : "USD" }}');
	console.log(myQuery);

	myQuery.bool.must.push(myFilter)
	//sending search and writting result
	client.search(
		{ 
			index: myIndex,
			size: 100,
			body: { 
				query: myQuery
			}
		}, 
		(err, result) => {
			if (err) console.error(err)
			const investmentsJSON= result.body.hits.hits;
			investments= [];
			investmentsLinks= [];
			//console.log(investmentsJSON);
			for(const inv of investmentsJSON){
				const newInv= marshalInvestement(inv);
				investments.push(newInv);
				//investmentsLinks.push(marshalDashboardLink(newInv.id, seed.seedId));
			}
			console.log(investments);
			res.send({
				entities: investments,
				links: investmentsLinks
			});
		}
	)

});

//---------------------------------ARTICLES---------------------------------------

function marshalArticles(article) {
	return {
		id: article._id,
		typeId: "ET12",
		properties: {
			PT18: article._source.title,
			PT19: article._source.author,
			PT20: article._source.id,
			PT21: article._source.companies,
			PT22: article._source.date,
			PT23: article._source.source,
			PT24: article._source.url,
		}
	};
}

app.post("/sirenArticles/acquire", (req, res) => {
	const term = "*";
	const nb = 10;

	const myQuery= {"bool": {"must": [], "must not": []}};

	client.search({ 
		index: ["articles"],
		size: nb,
		body: { 
			query: myQuery
		}
	}, 
		(err, result) => {
			if (err) console.error(err)
			const articles= result.body.hits.hits;
			const anbArticles= articles.map(marshalArticles)
			res.send({
				entities: anbArticles,
				links: []
			});
		}
	);
});


/**
 * The "config" endpoint for the example connector
 */
app.get("/config", (req, res) => {
	console.log("Reload config .... this file is being used");
	res.download("config.json");
});

/**
 * The "schema" endpoint for the example connector
 */
app.get("/schema", (req, res) => {
	console.log("Reload schema ....");
	res.download("schema.xml");
});

/**
 * The "chartingSchemes" endpoint for the example connector
 */
app.get("/chartingSchemes", (req, res) => {
	console.log("Reload chartingScheme ....");
	res.download("chartingSchemes.xml");
});

/**
 * Start the server and the example connector
 */
server.listen(port, () => {
	console.log("Satom connector is actualy listening on port " + port);
});
