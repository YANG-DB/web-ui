/**
 * Mock graph data generators for Dragons and LinkedIn schemas
 * Generates realistic graph data structures for testing and demonstration
 */

// Helper to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Dragons schema mock data generator
export function generateDragonsMockGraph(templateIndex = 0, nodeCount = 10) {
  const dragonColors = ['red', 'blue', 'green', 'black', 'white', 'gold', 'silver', 'bronze'];
  const dragonNames = ['Smaug', 'Drogon', 'Viserion', 'Rhaegal', 'Balerion', 'Meraxes', 'Vhagar', 'Caraxes', 'Syrax', 'Meleys'];
  const personFirstNames = ['Brandon', 'Arya', 'Jon', 'Daenerys', 'Tyrion', 'Cersei', 'Jaime', 'Sansa', 'Theon', 'Robb', 'Catelyn', 'Eddard', 'Joffrey', 'Margaery', 'Petyr', 'Varys'];
  const personLastNames = ['Stark', 'Lannister', 'Targaryen', 'Baratheon', 'Greyjoy', 'Tully', 'Arryn', 'Tyrell', 'Martell', 'Bolton'];
  const genders = ['male', 'female', 'other'];
  const guildNames = ['Dragon Riders Guild', 'Knights of the Realm', 'Maesters Order', 'Faceless Men', 'Brotherhood Without Banners', 'Kingsguard'];
  const kingdomNames = ['Westeros', 'Essos', 'Sothoryos', 'Valyria', 'The North', 'The Vale', 'The Reach', 'Dorne'];

  const entities = [];
  const relationships = [];
  let entityIdCounter = 1;
  let relationshipIdCounter = 1;

  // Template-specific generation
  switch (templateIndex) {
    case 0: // Find all persons by first name
      for (let i = 0; i < nodeCount; i++) {
        entities.push({
          eID: `person_${entityIdCounter++}`,
          eType: 'Person',
          eTag: 'Person',
          firstName: personFirstNames[Math.floor(Math.random() * personFirstNames.length)],
          lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
          gender: genders[Math.floor(Math.random() * genders.length)],
          assignments: [0]
        });
      }
      break;

    case 1: // Find dragons with specific color
      for (let i = 0; i < nodeCount; i++) {
        const color = dragonColors[Math.floor(Math.random() * dragonColors.length)];
        entities.push({
          eID: `dragon_${entityIdCounter++}`,
          eType: 'Dragon',
          eTag: 'Dragon',
          name: dragonNames[Math.floor(Math.random() * dragonNames.length)],
          color: color,
          power: Math.floor(Math.random() * 1000) + 100,
          assignments: [0]
        });
      }
      break;

    case 2: // Find entities with multiple attributes
      for (let i = 0; i < nodeCount; i++) {
        entities.push({
          eID: `person_${entityIdCounter++}`,
          eType: 'Person',
          eTag: 'Person',
          firstName: personFirstNames[Math.floor(Math.random() * personFirstNames.length)],
          lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
          gender: genders[Math.floor(Math.random() * genders.length)],
          assignments: [0]
        });
      }
      break;

    case 3: // Find entities using OR condition (red or blue dragons)
      for (let i = 0; i < nodeCount; i++) {
        const color = Math.random() > 0.5 ? 'red' : 'blue';
        entities.push({
          eID: `dragon_${entityIdCounter++}`,
          eType: 'Dragon',
          eTag: 'Dragon',
          name: dragonNames[Math.floor(Math.random() * dragonNames.length)],
          color: color,
          power: Math.floor(Math.random() * 1000) + 100,
          assignments: [0]
        });
      }
      break;

    case 4: // Complex nested query
      for (let i = 0; i < Math.floor(nodeCount / 2); i++) {
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        entities.push({
          eID: `person_${entityIdCounter++}`,
          eType: 'Person',
          eTag: 'Person',
          firstName: personFirstNames[Math.floor(Math.random() * personFirstNames.length)],
          lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
          gender: gender,
          assignments: [0]
        });
      }
      break;

    case 5: // Person Own Dragon relationship
      const halfCount = Math.floor(nodeCount / 2);
      for (let i = 0; i < halfCount; i++) {
        const personId = `person_${entityIdCounter++}`;
        entities.push({
          eID: personId,
          eType: 'Person',
          eTag: 'Person',
          firstName: personFirstNames[Math.floor(Math.random() * personFirstNames.length)],
          lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
          assignments: [0]
        });

        const dragonId = `dragon_${entityIdCounter++}`;
        entities.push({
          eID: dragonId,
          eType: 'Dragon',
          eTag: 'Dragon',
          name: dragonNames[Math.floor(Math.random() * dragonNames.length)],
          color: dragonColors[Math.floor(Math.random() * dragonColors.length)],
          assignments: [0]
        });

        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: personId,
          eID2: dragonId,
          rType: 'Own',
          directional: true,
          assignments: [0]
        });
      }
      break;

    case 6: // Person MemberOf Guild relationship
      const memberCount = Math.floor(nodeCount * 0.6);
      const guildCount = Math.floor(nodeCount * 0.4);

      const guildIds = [];
      for (let i = 0; i < guildCount; i++) {
        const guildId = `guild_${entityIdCounter++}`;
        guildIds.push(guildId);
        entities.push({
          eID: guildId,
          eType: 'Guild',
          eTag: 'Guild',
          name: guildNames[Math.floor(Math.random() * guildNames.length)],
          assignments: [0]
        });
      }

      for (let i = 0; i < memberCount; i++) {
        const personId = `person_${entityIdCounter++}`;
        entities.push({
          eID: personId,
          eType: 'Person',
          eTag: 'Person',
          firstName: personFirstNames[Math.floor(Math.random() * personFirstNames.length)],
          lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
          assignments: [0]
        });

        const randomGuild = guildIds[Math.floor(Math.random() * guildIds.length)];
        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: personId,
          eID2: randomGuild,
          rType: 'MemberOf',
          directional: true,
          assignments: [0]
        });
      }
      break;

    case 7: // Person Know Person with firstName = George
      const georgeId = `person_${entityIdCounter++}`;
      entities.push({
        eID: georgeId,
        eType: 'Person',
        eTag: 'Person',
        firstName: 'George',
        lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
        assignments: [0]
      });

      for (let i = 0; i < nodeCount - 1; i++) {
        const personId = `person_${entityIdCounter++}`;
        entities.push({
          eID: personId,
          eType: 'Person',
          eTag: 'Person',
          firstName: personFirstNames[Math.floor(Math.random() * personFirstNames.length)],
          lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
          assignments: [0]
        });

        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: personId,
          eID2: georgeId,
          rType: 'Know',
          directional: false,
          assignments: [0]
        });
      }
      break;

    case 8: // Multi-relationship complex query
      // Create kingdoms
      const kingdomId = `kingdom_${entityIdCounter++}`;
      entities.push({
        eID: kingdomId,
        eType: 'Kingdom',
        eTag: 'Kingdom',
        name: kingdomNames[Math.floor(Math.random() * kingdomNames.length)],
        funds: Math.floor(Math.random() * 5000) + 1500,
        assignments: [0]
      });

      // Create persons originated in kingdom
      const personId = `person_${entityIdCounter++}`;
      entities.push({
        eID: personId,
        eType: 'Person',
        eTag: 'Person',
        firstName: personFirstNames[Math.floor(Math.random() * personFirstNames.length)],
        lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
        assignments: [0]
      });

      relationships.push({
        rID: `rel_${relationshipIdCounter++}`,
        eID1: personId,
        eID2: kingdomId,
        rType: 'OriginatedIn',
        directional: true,
        assignments: [0]
      });

      // Create dragons with Fire and Freeze relationships
      for (let i = 0; i < 4; i++) {
        const dragonId1 = `dragon_${entityIdCounter++}`;
        const dragonId2 = `dragon_${entityIdCounter++}`;

        entities.push({
          eID: dragonId1,
          eType: 'Dragon',
          eTag: 'Dragon',
          name: dragonNames[Math.floor(Math.random() * dragonNames.length)],
          color: dragonColors[Math.floor(Math.random() * dragonColors.length)],
          assignments: [0]
        });

        entities.push({
          eID: dragonId2,
          eType: 'Dragon',
          eTag: 'Dragon',
          name: i === 0 ? 'morgan' : dragonNames[Math.floor(Math.random() * dragonNames.length)],
          color: dragonColors[Math.floor(Math.random() * dragonColors.length)],
          assignments: [0]
        });

        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: dragonId1,
          eID2: dragonId2,
          rType: 'Fire',
          directional: true,
          assignments: [0]
        });

        if (i < 2) {
          relationships.push({
            rID: `rel_${relationshipIdCounter++}`,
            eID1: dragonId1,
            eID2: dragonId2,
            rType: 'Freeze',
            directional: true,
            assignments: [0]
          });
        }
      }
      break;

    default:
      // Default: mixed entities and relationships
      for (let i = 0; i < nodeCount; i++) {
        const entityType = ['Person', 'Dragon', 'Guild'][Math.floor(Math.random() * 3)];
        if (entityType === 'Person') {
          entities.push({
            eID: `person_${entityIdCounter++}`,
            eType: 'Person',
            eTag: 'Person',
            firstName: personFirstNames[Math.floor(Math.random() * personFirstNames.length)],
            lastName: personLastNames[Math.floor(Math.random() * personLastNames.length)],
            assignments: [0]
          });
        } else if (entityType === 'Dragon') {
          entities.push({
            eID: `dragon_${entityIdCounter++}`,
            eType: 'Dragon',
            eTag: 'Dragon',
            name: dragonNames[Math.floor(Math.random() * dragonNames.length)],
            color: dragonColors[Math.floor(Math.random() * dragonColors.length)],
            assignments: [0]
          });
        } else {
          entities.push({
            eID: `guild_${entityIdCounter++}`,
            eType: 'Guild',
            eTag: 'Guild',
            name: guildNames[Math.floor(Math.random() * guildNames.length)],
            assignments: [0]
          });
        }
      }
  }

  return {
    entities,
    relationships
  };
}

// LinkedIn schema mock data generator
export function generateLinkedInMockGraph(templateIndex = 0, nodeCount = 10) {
  const personNames = ['John Smith', 'Jane Doe', 'Michael Johnson', 'Emily Davis', 'David Wilson', 'Sarah Brown', 'James Martinez', 'Lisa Anderson', 'Robert Taylor', 'Jennifer Thomas', 'William Moore', 'Patricia Jackson'];
  const companyNames = ['TechCorp', 'DataSystems Inc', 'CloudSolutions', 'AI Innovations', 'CyberSecurity Pro', 'FinTech Global', 'HealthTech Solutions', 'EduTech Platform', 'RetailNext', 'LogisticsHub'];
  const industries = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Consulting'];
  const titles = ['Software Engineer', 'Senior Developer', 'Data Scientist', 'Product Manager', 'CEO', 'CTO', 'Engineering Manager', 'DevOps Engineer', 'UX Designer', 'Marketing Director'];
  const emails = ['@gmail.com', '@yahoo.com', '@outlook.com', '@company.com'];

  const entities = [];
  const relationships = [];
  let entityIdCounter = 1;
  let relationshipIdCounter = 1;

  switch (templateIndex) {
    case 0: // Find all persons by name
      for (let i = 0; i < nodeCount; i++) {
        entities.push({
          eID: `person_${entityIdCounter++}`,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          email: personNames[i % personNames.length].replace(' ', '.').toLowerCase() + emails[Math.floor(Math.random() * emails.length)],
          title: titles[Math.floor(Math.random() * titles.length)],
          assignments: [0]
        });
      }
      break;

    case 1: // Find companies with specific attributes
      for (let i = 0; i < nodeCount; i++) {
        entities.push({
          eID: `company_${entityIdCounter++}`,
          eType: 'Company',
          eTag: 'Company',
          name: companyNames[Math.floor(Math.random() * companyNames.length)],
          industry: industries[Math.floor(Math.random() * industries.length)],
          size: Math.floor(Math.random() * 10000) + 10,
          assignments: [0]
        });
      }
      break;

    case 2: // Find entities with multiple attributes
      for (let i = 0; i < nodeCount; i++) {
        entities.push({
          eID: `person_${entityIdCounter++}`,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          email: personNames[i % personNames.length].replace(' ', '.').toLowerCase() + '@company.com',
          title: titles[Math.floor(Math.random() * titles.length)],
          assignments: [0]
        });
      }
      break;

    case 3: // Find entities using OR condition (Technology or Finance)
      for (let i = 0; i < nodeCount; i++) {
        const industry = Math.random() > 0.5 ? 'Technology' : 'Finance';
        entities.push({
          eID: `company_${entityIdCounter++}`,
          eType: 'Company',
          eTag: 'Company',
          name: companyNames[Math.floor(Math.random() * companyNames.length)],
          industry: industry,
          size: Math.floor(Math.random() * 10000) + 10,
          assignments: [0]
        });
      }
      break;

    case 4: // Complex nested query
      for (let i = 0; i < nodeCount; i++) {
        const title = Math.random() > 0.5 ? 'Software Engineer' : 'Senior Developer';
        entities.push({
          eID: `person_${entityIdCounter++}`,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          email: personNames[i % personNames.length].replace(' ', '.').toLowerCase() + emails[Math.floor(Math.random() * emails.length)],
          title: title,
          assignments: [0]
        });
      }
      break;

    case 5: // Person WorksAt Company relationship
      const workerCount = Math.floor(nodeCount * 0.6);
      const companyCount = Math.floor(nodeCount * 0.4);

      const companyIds = [];
      for (let i = 0; i < companyCount; i++) {
        const companyId = `company_${entityIdCounter++}`;
        companyIds.push(companyId);
        entities.push({
          eID: companyId,
          eType: 'Company',
          eTag: 'Company',
          name: companyNames[Math.floor(Math.random() * companyNames.length)],
          industry: industries[Math.floor(Math.random() * industries.length)],
          assignments: [0]
        });
      }

      for (let i = 0; i < workerCount; i++) {
        const personId = `person_${entityIdCounter++}`;
        entities.push({
          eID: personId,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          title: titles[Math.floor(Math.random() * titles.length)],
          assignments: [0]
        });

        const randomCompany = companyIds[Math.floor(Math.random() * companyIds.length)];
        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: personId,
          eID2: randomCompany,
          rType: 'WorksAt',
          directional: true,
          assignments: [0]
        });
      }
      break;

    case 6: // Person ConnectedTo Person relationship
      const personIds = [];
      for (let i = 0; i < nodeCount; i++) {
        const personId = `person_${entityIdCounter++}`;
        personIds.push(personId);
        entities.push({
          eID: personId,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          title: titles[Math.floor(Math.random() * titles.length)],
          assignments: [0]
        });
      }

      // Create random connections
      for (let i = 0; i < nodeCount; i++) {
        const person1 = personIds[i];
        const person2 = personIds[Math.floor(Math.random() * personIds.length)];
        if (person1 !== person2) {
          relationships.push({
            rID: `rel_${relationshipIdCounter++}`,
            eID1: person1,
            eID2: person2,
            rType: 'ConnectedTo',
            directional: false,
            assignments: [0]
          });
        }
      }
      break;

    case 7: // Person Founded Company relationship
      const founderCount = Math.floor(nodeCount / 2);
      for (let i = 0; i < founderCount; i++) {
        const personId = `person_${entityIdCounter++}`;
        entities.push({
          eID: personId,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          title: 'CEO',
          assignments: [0]
        });

        const companyId = `company_${entityIdCounter++}`;
        entities.push({
          eID: companyId,
          eType: 'Company',
          eTag: 'Company',
          name: companyNames[Math.floor(Math.random() * companyNames.length)],
          industry: industries[Math.floor(Math.random() * industries.length)],
          assignments: [0]
        });

        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: personId,
          eID2: companyId,
          rType: 'Founded',
          directional: true,
          assignments: [0]
        });
      }
      break;

    case 8: // Person ConnectedTo someone named John Smith
      const johnId = `person_${entityIdCounter++}`;
      entities.push({
        eID: johnId,
        eType: 'Person',
        eTag: 'Person',
        name: 'John Smith',
        email: 'john.smith@company.com',
        title: titles[Math.floor(Math.random() * titles.length)],
        assignments: [0]
      });

      for (let i = 0; i < nodeCount - 1; i++) {
        const personId = `person_${entityIdCounter++}`;
        entities.push({
          eID: personId,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          title: titles[Math.floor(Math.random() * titles.length)],
          assignments: [0]
        });

        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: personId,
          eID2: johnId,
          rType: 'ConnectedTo',
          directional: false,
          assignments: [0]
        });
      }
      break;

    case 9: // Multi-relationship LinkedIn query
      // Create Technology company
      const techCompanyId = `company_${entityIdCounter++}`;
      entities.push({
        eID: techCompanyId,
        eType: 'Company',
        eTag: 'Company',
        name: 'TechCorp',
        industry: 'Technology',
        size: 5000,
        assignments: [0]
      });

      // Create employees
      for (let i = 0; i < 3; i++) {
        const employeeId = `person_${entityIdCounter++}`;
        entities.push({
          eID: employeeId,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          title: titles[Math.floor(Math.random() * titles.length)],
          assignments: [0]
        });

        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: employeeId,
          eID2: techCompanyId,
          rType: 'WorksAt',
          directional: true,
          assignments: [0]
        });

        // Create CEO connections
        const ceoId = `person_${entityIdCounter++}`;
        entities.push({
          eID: ceoId,
          eType: 'Person',
          eTag: 'Person',
          name: personNames[Math.floor(Math.random() * personNames.length)],
          title: 'CEO',
          assignments: [0]
        });

        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: employeeId,
          eID2: ceoId,
          rType: 'ConnectedTo',
          directional: false,
          assignments: [0]
        });

        // CEO founded company
        const startupId = `company_${entityIdCounter++}`;
        entities.push({
          eID: startupId,
          eType: 'Company',
          eTag: 'Company',
          name: companyNames[Math.floor(Math.random() * companyNames.length)],
          industry: industries[Math.floor(Math.random() * industries.length)],
          assignments: [0]
        });

        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: ceoId,
          eID2: startupId,
          rType: 'Founded',
          directional: true,
          assignments: [0]
        });
      }
      break;

    default:
      // Default: mixed entities
      for (let i = 0; i < nodeCount; i++) {
        const entityType = Math.random() > 0.5 ? 'Person' : 'Company';
        if (entityType === 'Person') {
          entities.push({
            eID: `person_${entityIdCounter++}`,
            eType: 'Person',
            eTag: 'Person',
            name: personNames[Math.floor(Math.random() * personNames.length)],
            title: titles[Math.floor(Math.random() * titles.length)],
            assignments: [0]
          });
        } else {
          entities.push({
            eID: `company_${entityIdCounter++}`,
            eType: 'Company',
            eTag: 'Company',
            name: companyNames[Math.floor(Math.random() * companyNames.length)],
            industry: industries[Math.floor(Math.random() * industries.length)],
            assignments: [0]
          });
        }
      }
  }

  return {
    entities,
    relationships
  };
}

// Generate mock graph data for Flights ontology
function generateFlightsMockGraph(templateIndex = 0, nodeCount = 10) {
  const entities = [];
  const relationships = [];
  let entityIdCounter = 1;
  let relationshipIdCounter = 1;

  const carriers = ['OpenSearch-Air', 'Logstash Airways', 'ES-Air', 'Kibana Airlines'];
  const airportCodes = ['JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'ATL', 'SFO', 'SEA', 'BOS', 'MIA'];
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Dallas', 'Denver', 'Atlanta', 'San Francisco', 'Seattle', 'Boston', 'Miami'];
  const countries = ['US', 'CA', 'MX'];
  const weatherTypes = ['Clear', 'Cloudy', 'Rain', 'Snow', 'Fog'];

  switch (templateIndex) {
    case 0: // Find all flights by flight number
      for (let i = 0; i < nodeCount; i++) {
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        entities.push({
          eID: `flight_${entityIdCounter++}`,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(150 + Math.random() * 500),
          flightDelay: Math.random() > 0.8,
          assignments: [0]
        });
      }
      break;

    case 1: // Find flights by carrier
      for (let i = 0; i < nodeCount; i++) {
        entities.push({
          eID: `flight_${entityIdCounter++}`,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `OS${1000 + i}`,
          carrier: 'OpenSearch-Air',
          avgTicketPrice: Math.floor(150 + Math.random() * 500),
          flightDelay: Math.random() > 0.8,
          assignments: [0]
        });
      }
      break;

    case 2: // Find delayed flights
      for (let i = 0; i < nodeCount; i++) {
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        entities.push({
          eID: `flight_${entityIdCounter++}`,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(150 + Math.random() * 500),
          flightDelay: true,
          flightDelayMin: Math.floor(30 + Math.random() * 120),
          assignments: [0]
        });
      }
      break;

    case 3: // Find flights with price range (500-1000)
      for (let i = 0; i < nodeCount; i++) {
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        entities.push({
          eID: `flight_${entityIdCounter++}`,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(500 + Math.random() * 500),
          flightDelay: Math.random() > 0.8,
          assignments: [0]
        });
      }
      break;

    case 4: // Find flights using OR condition (OpenSearch-Air or Logstash Airways)
      for (let i = 0; i < nodeCount; i++) {
        const carrier = Math.random() > 0.5 ? 'OpenSearch-Air' : 'Logstash Airways';
        entities.push({
          eID: `flight_${entityIdCounter++}`,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(150 + Math.random() * 500),
          flightDelay: Math.random() > 0.8,
          assignments: [0]
        });
      }
      break;

    case 5: // Flight OriginAirport Airport relationship
      const flightCount1 = Math.floor(nodeCount * 0.6);
      const airportCount1 = Math.floor(nodeCount * 0.4);

      const airportIds1 = [];
      for (let i = 0; i < airportCount1; i++) {
        const airportId = `airport_${entityIdCounter++}`;
        airportIds1.push(airportId);
        entities.push({
          eID: airportId,
          eType: 'Airport',
          eTag: ['Airport'],
          code: airportCodes[i % airportCodes.length],
          cityName: cities[i % cities.length],
          country: countries[Math.floor(Math.random() * countries.length)],
          assignments: [0]
        });
      }

      for (let i = 0; i < flightCount1; i++) {
        const flightId = `flight_${entityIdCounter++}`;
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        entities.push({
          eID: flightId,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(150 + Math.random() * 500),
          assignments: [0]
        });

        const randomAirport = airportIds1[Math.floor(Math.random() * airportIds1.length)];
        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: flightId,
          eID2: randomAirport,
          rType: 'OriginAirport',
          directional: true,
          assignments: [0]
        });
      }
      break;

    case 6: // Flight DestinationAirport Airport relationship
      const flightCount2 = Math.floor(nodeCount * 0.6);
      const airportCount2 = Math.floor(nodeCount * 0.4);

      const airportIds2 = [];
      for (let i = 0; i < airportCount2; i++) {
        const airportId = `airport_${entityIdCounter++}`;
        airportIds2.push(airportId);
        entities.push({
          eID: airportId,
          eType: 'Airport',
          eTag: ['Airport'],
          code: airportCodes[i % airportCodes.length],
          cityName: cities[i % cities.length],
          country: countries[Math.floor(Math.random() * countries.length)],
          assignments: [0]
        });
      }

      for (let i = 0; i < flightCount2; i++) {
        const flightId = `flight_${entityIdCounter++}`;
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        entities.push({
          eID: flightId,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(150 + Math.random() * 500),
          assignments: [0]
        });

        const randomAirport = airportIds2[Math.floor(Math.random() * airportIds2.length)];
        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: flightId,
          eID2: randomAirport,
          rType: 'DestinationAirport',
          directional: true,
          assignments: [0]
        });
      }
      break;

    case 7: // Flight OperatedBy Carrier relationship
      const flightCount3 = Math.floor(nodeCount * 0.7);
      const carrierCount = Math.floor(nodeCount * 0.3);

      const carrierIds = [];
      for (let i = 0; i < carrierCount; i++) {
        const carrierId = `carrier_${entityIdCounter++}`;
        carrierIds.push(carrierId);
        entities.push({
          eID: carrierId,
          eType: 'Carrier',
          eTag: ['Carrier'],
          code: carriers[i % carriers.length].substring(0, 2).toUpperCase(),
          name: carriers[i % carriers.length],
          assignments: [0]
        });
      }

      for (let i = 0; i < flightCount3; i++) {
        const flightId = `flight_${entityIdCounter++}`;
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        entities.push({
          eID: flightId,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(150 + Math.random() * 500),
          assignments: [0]
        });

        const randomCarrier = carrierIds[Math.floor(Math.random() * carrierIds.length)];
        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: flightId,
          eID2: randomCarrier,
          rType: 'OperatedBy',
          directional: true,
          assignments: [0]
        });
      }
      break;

    case 8: // Airport ConnectsTo Airport relationship
      const airportIds3 = [];
      for (let i = 0; i < nodeCount; i++) {
        const airportId = `airport_${entityIdCounter++}`;
        airportIds3.push(airportId);
        entities.push({
          eID: airportId,
          eType: 'Airport',
          eTag: ['Airport'],
          code: airportCodes[i % airportCodes.length],
          cityName: cities[i % cities.length],
          country: countries[Math.floor(Math.random() * countries.length)],
          assignments: [0]
        });
      }

      // Create connections between airports
      for (let i = 0; i < nodeCount - 1; i++) {
        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: airportIds3[i],
          eID2: airportIds3[i + 1],
          rType: 'ConnectsTo',
          directional: false,
          assignments: [0]
        });
      }
      break;

    case 9: // Complex flight query with relationships and conditions
      // Create US airports
      const usAirportIds = [];
      for (let i = 0; i < 3; i++) {
        const airportId = `airport_${entityIdCounter++}`;
        usAirportIds.push(airportId);
        entities.push({
          eID: airportId,
          eType: 'Airport',
          eTag: ['Airport'],
          code: airportCodes[i % airportCodes.length],
          cityName: cities[i % cities.length],
          country: 'US',
          assignments: [0]
        });
      }

      // Create carriers
      const carrierIds2 = [];
      for (let i = 0; i < 2; i++) {
        const carrierId = `carrier_${entityIdCounter++}`;
        carrierIds2.push(carrierId);
        entities.push({
          eID: carrierId,
          eType: 'Carrier',
          eTag: ['Carrier'],
          code: carriers[i % carriers.length].substring(0, 2).toUpperCase(),
          name: carriers[i % carriers.length],
          assignments: [0]
        });
      }

      // Create flights with relationships
      for (let i = 0; i < 5; i++) {
        const flightId = `flight_${entityIdCounter++}`;
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        entities.push({
          eID: flightId,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(300 + Math.random() * 400),
          flightDelay: Math.random() > 0.5,
          assignments: [0]
        });

        // Add OriginAirport relationship
        const randomOrigin = usAirportIds[Math.floor(Math.random() * usAirportIds.length)];
        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: flightId,
          eID2: randomOrigin,
          rType: 'OriginAirport',
          directional: true,
          assignments: [0]
        });

        // Add OperatedBy relationship
        const randomCarrier = carrierIds2[Math.floor(Math.random() * carrierIds2.length)];
        relationships.push({
          rID: `rel_${relationshipIdCounter++}`,
          eID1: flightId,
          eID2: randomCarrier,
          rType: 'OperatedBy',
          directional: true,
          assignments: [0]
        });
      }
      break;

    default:
      // Default: mixed entities
      for (let i = 0; i < nodeCount; i++) {
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        entities.push({
          eID: `flight_${entityIdCounter++}`,
          eType: 'Flight',
          eTag: ['Flight'],
          flightNum: `${carrier.substring(0, 2).toUpperCase()}${1000 + i}`,
          carrier: carrier,
          avgTicketPrice: Math.floor(150 + Math.random() * 500),
          flightDelay: Math.random() > 0.8,
          assignments: [0]
        });
      }
  }

  return {
    entities,
    relationships
  };
}

// Wrapper function to generate mock data based on ontology type
export function generateMockGraphData(ontologyType, templateIndex = 0, nodeCount = 10) {
  if (ontologyType === 'dragons') {
    return generateDragonsMockGraph(templateIndex, nodeCount);
  } else if (ontologyType === 'linkedin') {
    return generateLinkedInMockGraph(templateIndex, nodeCount);
  } else if (ontologyType === 'flights') {
    return generateFlightsMockGraph(templateIndex, nodeCount);
  }
  return { entities: [], relationships: [] };
}
