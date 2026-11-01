import type { CapabilityId } from '@/lib/schemas/manifest'

export type CapabilityDefinition = {
  id: CapabilityId
  name: string
  shortName: string
  summary: string
  description: string
  typicalUses: string[]
  docsUrl: string
  verificationStatus: 'verified' | 'unverified'
}

/**
 * Reference descriptions for capability pages. Links point to official MongoDB
 * documentation entry points. Items marked "unverified" must be reviewed by an
 * admin before being presented as product fact.
 */
export const seedCapabilities: CapabilityDefinition[] = [
  {
    id: 'atlas',
    name: 'MongoDB Atlas',
    shortName: 'Atlas',
    summary: 'Fully managed, multi-cloud developer data platform.',
    description:
      'Atlas runs and operates MongoDB clusters on AWS, Google Cloud and Azure, with integrated security, backup, monitoring and data services. Demos in this catalog can run against a user-provisioned Atlas project in Atlas Connected Mode.',
    typicalUses: ['Managed operational database', 'Multi-region deployments', 'Integrated search and stream processing'],
    docsUrl: 'https://www.mongodb.com/docs/atlas/',
    verificationStatus: 'verified',
  },
  {
    id: 'crud',
    name: 'CRUD & Document Model',
    shortName: 'CRUD',
    summary: 'Flexible JSON-like documents with rich query and update operators.',
    description:
      'The document model maps naturally to application objects. CRUD operations, indexes and schema validation let demos model entities such as tickets, documents and events without rigid joins.',
    typicalUses: ['Entity storage', 'Metadata catalogs', 'Single view of customer or event'],
    docsUrl: 'https://www.mongodb.com/docs/manual/crud/',
    verificationStatus: 'verified',
  },
  {
    id: 'aggregation',
    name: 'Aggregation Framework',
    shortName: 'Aggregation',
    summary: 'Multi-stage pipelines for analytics, correlation and transformation.',
    description:
      'Aggregation pipelines filter, group, join ($lookup) and reshape data on the server. Demos use them for operational dashboards, event correlation and journey reconstruction.',
    typicalUses: ['Operational analytics', 'Event correlation', 'Reporting'],
    docsUrl: 'https://www.mongodb.com/docs/manual/aggregation/',
    verificationStatus: 'verified',
  },
  {
    id: 'atlas-search',
    name: 'Atlas Search',
    shortName: 'Atlas Search',
    summary: 'Lucene-based full-text search integrated with your Atlas data.',
    description:
      'Atlas Search provides relevance-ranked full-text search, facets, autocomplete and fuzzy matching via the $search aggregation stage, without a separate search system to synchronize.',
    typicalUses: ['Document search', 'Faceted navigation', 'Autocomplete'],
    docsUrl: 'https://www.mongodb.com/docs/atlas/atlas-search/',
    verificationStatus: 'verified',
  },
  {
    id: 'vector-search',
    name: 'Atlas Vector Search',
    shortName: 'Vector Search',
    summary: 'Semantic similarity search over vector embeddings stored alongside data.',
    description:
      'Vector Search indexes embeddings and retrieves nearest neighbours with $vectorSearch, optionally combined with metadata pre-filters. Used for semantic retrieval, classification and RAG.',
    typicalUses: ['Semantic search', 'Classification by similarity', 'Retrieval-augmented generation'],
    docsUrl: 'https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-overview/',
    verificationStatus: 'verified',
  },
  {
    id: 'voyage-ai',
    name: 'Voyage AI Embeddings',
    shortName: 'Voyage AI',
    summary: 'Embedding and reranking models for high-quality retrieval.',
    description:
      'Voyage AI models generate embeddings used with Atlas Vector Search. How embeddings are produced (application-side calls or automated embedding features) depends on each demo and must be confirmed in its repository.',
    typicalUses: ['Document embeddings', 'Ticket classification', 'Reranking'],
    docsUrl: 'https://docs.voyageai.com/',
    verificationStatus: 'verified',
  },
  {
    id: 'change-streams',
    name: 'Change Streams',
    shortName: 'Change Streams',
    summary: 'Subscribe to real-time data changes in collections, databases or clusters.',
    description:
      'Change streams let applications react to inserts, updates and deletes in near real time — for notifications, downstream propagation or live UIs — without polling.',
    typicalUses: ['Live dashboards', 'Event-driven notifications', 'Downstream sync'],
    docsUrl: 'https://www.mongodb.com/docs/manual/changeStreams/',
    verificationStatus: 'verified',
  },
  {
    id: 'stream-processing',
    name: 'Atlas Stream Processing',
    shortName: 'Stream Processing',
    summary: 'Process streams of complex data using the aggregation API.',
    description:
      'Atlas Stream Processing connects to sources such as Apache Kafka and continuously processes, validates and merges events into Atlas using familiar aggregation syntax.',
    typicalUses: ['Kafka ingestion', 'Windowed aggregation', 'Stream validation and DLQ'],
    docsUrl: 'https://www.mongodb.com/docs/atlas/atlas-stream-processing/overview/',
    verificationStatus: 'verified',
  },
  {
    id: 'kafka',
    name: 'Apache Kafka Integration',
    shortName: 'Kafka',
    summary: 'Integrate MongoDB with Kafka via the Kafka Connector or Stream Processing.',
    description:
      'The MongoDB Kafka Connector and Atlas Stream Processing move events between Kafka topics and MongoDB. Several demos in this catalog simulate Kafka topics locally; simulation is not the same as a live Kafka integration.',
    typicalUses: ['Event ingestion', 'CDC pipelines', 'Event-driven microservices'],
    docsUrl: 'https://www.mongodb.com/docs/kafka-connector/current/',
    verificationStatus: 'verified',
  },
  {
    id: 'online-archive',
    name: 'Atlas Online Archive',
    shortName: 'Online Archive',
    summary: 'Tier aged data to lower-cost storage while keeping it queryable.',
    description:
      'Online Archive moves infrequently accessed data from an Atlas cluster to managed cloud object storage based on rules, and exposes a federated endpoint to query live and archived data together.',
    typicalUses: ['Audit retention', 'Cost optimisation', 'Historical queries'],
    docsUrl: 'https://www.mongodb.com/docs/atlas/online-archive/manage-online-archive/',
    verificationStatus: 'verified',
  },
  {
    id: 'sharding',
    name: 'Sharding',
    shortName: 'Sharding',
    summary: 'Horizontal scale-out by distributing data across shards.',
    description:
      'Sharding partitions collections across multiple replica sets using a shard key. Shard key design, balancing and query routing are central architectural considerations.',
    typicalUses: ['Large datasets', 'High write throughput', 'Data locality'],
    docsUrl: 'https://www.mongodb.com/docs/manual/sharding/',
    verificationStatus: 'verified',
  },
  {
    id: 'atlas-infinite',
    name: 'Atlas Infinite',
    shortName: 'Atlas Infinite',
    summary: 'Educational topic: architectures that separate compute from storage.',
    description:
      'This catalog presents Atlas Infinite as an educational topic. Specific limits, scaling characteristics, availability stages and migration guarantees are tracked as versioned, admin-editable facts with verification status and are not asserted here as product facts.',
    typicalUses: ['Architecture education', 'Modernisation planning', 'Webinar presentations'],
    docsUrl: 'https://www.mongodb.com/docs/atlas/',
    verificationStatus: 'unverified',
  },
]

export const capabilityById = new Map(seedCapabilities.map((c) => [c.id, c]))
