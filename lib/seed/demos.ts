import type { DemoRecord } from '@/lib/schemas/manifest'

/**
 * Initial catalog. Every entry is DRAFT with repository = null until a real
 * GitHub URL is supplied by an admin. No repository URLs, screenshots,
 * benchmark results or product limits are invented here. Setup steps are left
 * empty so the UI shows "Awaiting verified repository instructions".
 */
const SEED_TIMESTAMP = '2026-01-01T00:00:00.000Z'

const neverSynced = {
  status: 'never' as const,
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastError: null,
  commitSha: null,
  ref: null,
}

const solutionsArchitecture = { name: 'Solutions Architecture Team', team: 'MongoDB Solutions Architecture' }

const pendingRepoNote =
  'Repository not yet registered. Commands, configuration variables and file links will be populated from the repository README after the first successful GitHub synchronization.'

export const ATLAS_INFINITE_COMPUTE_NODES = 2
export const ATLAS_CORE_ILLUSTRATIVE_SHARDS = 3
export const ATLAS_CORE_ILLUSTRATIVE_NODES_PER_SHARD = 3

export const seedDemos: DemoRecord[] = [
  {
    id: 'atlas-document-hub',
    slug: 'atlas-document-hub',
    title: 'Atlas Document Hub',
    tagline: 'Document management with metadata filtering, full-text and semantic search on MongoDB Atlas.',
    summary:
      'A document management solution that stores document metadata in MongoDB, offers structured filtering, Atlas Search full-text search and Atlas Vector Search semantic retrieval, with Voyage AI embeddings and configurable external object storage for binary content.',
    businessProblem:
      'Enterprises keep contracts, policies and operational documents across disconnected file shares and content systems. Finding the right document requires knowing where it lives and what it is called; metadata is inconsistent and semantic questions ("documents about supplier liability caps") cannot be answered with keyword search alone.',
    solution:
      'MongoDB becomes the metadata and search layer: each document is represented by a rich metadata document with its embedding, while the binary file remains in a configurable object store. Users combine structured filters, relevance-ranked full-text search and vector similarity in a single query surface.',
    industry: 'Cross-industry',
    category: 'Document Management',
    useCases: ['Document management', 'Enterprise search', 'Semantic retrieval'],
    tags: ['documents', 'search', 'embeddings', 'object-storage', 'kafka-simulator'],
    capabilities: [
      { capability: 'atlas', whyUsed: 'Managed cluster hosting metadata, search and vector indexes in Atlas Connected Mode.', businessValue: 'No separate search infrastructure to operate.', verified: false },
      { capability: 'crud', whyUsed: 'Document metadata records with flexible, per-type attributes.', businessValue: 'New document types without schema migrations.', verified: false },
      { capability: 'atlas-search', whyUsed: 'Full-text search over titles, extracted text and metadata.', businessValue: 'Relevance-ranked results with facets.', verified: false },
      { capability: 'vector-search', whyUsed: 'Semantic retrieval of documents by meaning.', businessValue: 'Answers natural-language questions keyword search misses.', verified: false },
      { capability: 'voyage-ai', whyUsed: 'Automated embeddings for document content.', businessValue: 'High-quality retrieval without hand-tuned features.', verified: false },
      { capability: 'kafka', whyUsed: 'A Kafka event simulator emits document lifecycle events.', businessValue: 'Shows event-driven ingestion patterns. Simulated only.', verified: false },
    ],
    architecture: {
      overview:
        'Binary content lives in a configurable external object store; MongoDB Atlas stores document metadata, extracted text and embeddings. A document generator and initial-load process seed realistic data. A Kafka event simulator produces lifecycle events (created, updated, archived). A configuration wizard captures Atlas and object storage settings.',
      dataFlow: [
        'Document generator / initial load creates sample documents and uploads binaries to object storage.',
        'Metadata, extracted text and storage references are written to MongoDB.',
        'Embeddings are generated with Voyage AI and stored alongside metadata.',
        'Kafka simulator emits lifecycle events that update document state.',
        'Users query with structured filters, Atlas Search and Vector Search.',
      ],
      diagrams: [
        {
          id: 'adh-overview',
          title: 'Atlas Document Hub — logical architecture',
          description: 'Illustrative logical architecture. Confirm component names against the repository once connected.',
          illustrative: true,
          provenance: 'catalog',
          mermaid: `flowchart LR
  U[User / Browser] --> APP[Document Hub App]
  WIZ[Configuration Wizard] --> APP
  GEN[Document Generator\\nInitial Load] --> OS[(External Object Storage)]
  GEN --> APP
  K[Kafka Event Simulator] -- lifecycle events --> APP
  APP -- metadata & text --> DB[(MongoDB Atlas\\nmetadata collection)]
  APP -- embed --> V[Voyage AI]
  V -- vectors --> DB
  DB --- S[Atlas Search index]
  DB --- VS[Vector Search index]
  APP -- signed references --> OS`,
        },
      ],
    },
    screenshots: [],
    repository: null,
    defaultBranch: 'main',
    readmePath: 'README.md',
    prerequisites: [
      { name: 'Git' },
      { name: 'Node.js', check: 'Version to be confirmed from repository' },
      { name: 'Docker', check: 'Required only if the repository provides containers' },
      { name: 'MongoDB Atlas project', check: 'Atlas Connected Mode only' },
      { name: 'Object storage bucket', check: 'Atlas Connected Mode only' },
    ],
    localSetup: [],
    atlasSetup: [],
    configuration: [],
    demoModes: ['local-demo', 'atlas-connected'],
    themeMode: 'mongodb',
    maintainer: solutionsArchitecture,
    maturity: 'prototype',
    difficulty: 'intermediate',
    documentationStatus: 'missing',
    verificationTimestamp: null,
    releaseVersion: null,
    status: 'draft',
    walkthrough: [
      'Run the configuration wizard to choose Demo Mode or connect Atlas and object storage.',
      'Generate a sample document corpus and perform the initial load.',
      'Browse documents with structured filters (type, owner, date, status).',
      'Run a full-text query and compare with a semantic query on the same topic.',
      'Start the Kafka simulator and observe lifecycle updates.',
    ],
    userJourney:
      'A compliance analyst needs every supplier contract with liability clauses above a threshold. She filters by document type and region, then asks semantically for "liability caps for logistics vendors", receiving relevant contracts even when the exact wording differs.',
    troubleshooting: [],
    faq: [
      { question: 'What is the difference between Demo Mode and Atlas-connected mode?', answer: 'Demo Mode is intended to run locally with generated data. Atlas-connected mode uses your own Atlas project and object storage. Exact behaviour will be documented from the repository README.' },
    ],
    limitations: [pendingRepoNote],
    securityNotes: ['Never commit Atlas connection strings or object-storage keys. Use environment variables or the configuration wizard as documented by the repository.'],
    contributionGuide: 'Propose documentation changes through the Hub (contributor role) or open a pull request in the demo repository.',
    setupWizard: 'The demo provides a configuration wizard for Atlas and object storage. Details will be sourced from the repository README.',
    repositoryFiles: [],
    facts: [],
    featured: true,
    interactiveExperience: null,
    sync: neverSynced,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'intelligent-workflow-automation',
    slug: 'intelligent-workflow-automation',
    title: 'Intelligent Workflow Automation',
    tagline: 'Classify, route and audit enterprise workflows from simulated Remedy tickets.',
    summary:
      'Monitor and manage enterprise workflows originating from simulated Remedy tickets. Tickets are classified using Voyage AI embeddings and MongoDB Vector Search, routed automatically or via human-in-the-loop review, processed, notified and closed with a full audit trail.',
    businessProblem:
      'Insurance operations receive high volumes of tickets from many agencies. Manual triage is slow and inconsistent, routing errors cause rework, and auditors need a reliable record of every decision and state change.',
    solution:
      'Each ticket becomes a MongoDB document enriched with an embedding. Vector Search finds similar historical tickets to classify and suggest a route; confident results are routed automatically, uncertain ones go to a human reviewer. Every transition is appended to an audit trail.',
    industry: 'Insurance',
    category: 'Workflow Orchestration',
    useCases: ['Ticket triage', 'Workflow orchestration', 'Human-in-the-loop AI', 'Audit trail'],
    tags: ['remedy', 'classification', 'routing', 'audit', 'kafka-simulator', 'customer-branding'],
    capabilities: [
      { capability: 'crud', whyUsed: 'Ticket and workflow state documents with agency metadata.', businessValue: 'Single operational record per ticket.', verified: false },
      { capability: 'vector-search', whyUsed: 'Similarity-based ticket classification.', businessValue: 'Consistent, explainable routing suggestions.', verified: false },
      { capability: 'voyage-ai', whyUsed: 'Embeddings for ticket descriptions.', businessValue: 'Captures meaning beyond keywords.', verified: false },
      { capability: 'aggregation', whyUsed: 'Operational monitoring dashboards.', businessValue: 'Real-time visibility into backlog and SLAs.', verified: false },
      { capability: 'kafka', whyUsed: 'Simulated Kafka inputs representing ticket feeds.', businessValue: 'Shows event-driven ingestion. Simulated only.', verified: false },
    ],
    architecture: {
      overview:
        'A simulator publishes Remedy-style tickets to simulated Kafka inputs. The workflow service stores tickets in MongoDB, generates embeddings with Voyage AI and queries Vector Search for nearest historical tickets. A routing policy decides between automatic routing and human review. Processing, notification and closure events are appended to an audit trail.',
      dataFlow: [
        'Ticket simulator emits tickets with agency origin and metadata.',
        'Tickets are persisted and embedded.',
        'Vector Search returns similar classified tickets; a confidence threshold selects auto-route or human-in-the-loop.',
        'Processing, notifications and closure update ticket state.',
        'Every transition is recorded in the audit trail.',
      ],
      diagrams: [
        {
          id: 'iwa-flow',
          title: 'Ticket lifecycle and routing',
          description: 'Illustrative lifecycle. Thresholds and states to be confirmed from the repository.',
          illustrative: true,
          provenance: 'catalog',
          mermaid: `flowchart TD
  R[Simulated Remedy tickets] --> K[(Simulated Kafka input)]
  K --> W[Workflow Service]
  W --> DB[(MongoDB Atlas\\ntickets)]
  W --> E[Voyage AI embeddings]
  E --> VS[Vector Search\\nsimilar tickets]
  VS --> D{Confidence\\nthreshold}
  D -- high --> AR[Automatic routing]
  D -- low --> H[Human-in-the-loop review]
  AR --> P[Processing]
  H --> P
  P --> N[Notifications]
  N --> C[Closure]
  W -. every transition .-> A[(Audit trail)]`,
        },
      ],
    },
    screenshots: [],
    repository: null,
    defaultBranch: 'main',
    readmePath: 'README.md',
    prerequisites: [{ name: 'Git' }, { name: 'Node.js', check: 'Version to be confirmed from repository' }, { name: 'MongoDB Atlas project', check: 'Atlas Connected Mode only' }],
    localSetup: [],
    atlasSetup: [],
    configuration: [],
    demoModes: ['local-demo', 'atlas-connected'],
    themeMode: 'customer',
    customerTheme: {
      name: 'Example Insurance Co. (fictional)',
      primaryColor: '#1A3D7C',
      accentColor: '#F2A900',
      notes: 'Customer-branded demo metadata. Affects demo previews and documentation metadata only; the Hub shell remains LeafyGreen.',
    },
    maintainer: solutionsArchitecture,
    maturity: 'prototype',
    difficulty: 'intermediate',
    documentationStatus: 'missing',
    verificationTimestamp: null,
    releaseVersion: null,
    status: 'draft',
    walkthrough: [
      'Start the ticket simulator and watch tickets arrive by agency.',
      'Open a ticket to see metadata, embedding-based similar tickets and suggested classification.',
      'Observe automatic routing for confident cases and the review queue for uncertain ones.',
      'Approve a routing decision as a human reviewer.',
      'Follow processing, notification and closure, then inspect the audit trail.',
    ],
    userJourney:
      'An operations lead sees a spike of tickets from one agency. The monitor shows most were auto-routed to claims; three low-confidence tickets wait for review. She approves two, re-routes one, and the audit trail records each decision with reviewer identity.',
    troubleshooting: [],
    faq: [{ question: 'Does this connect to a real Remedy system?', answer: 'No. Tickets are simulated. Any real integration would need a separately validated implementation.' }],
    limitations: [pendingRepoNote, 'Remedy tickets and Kafka inputs are simulated.'],
    securityNotes: ['Simulated data only. Do not load real customer tickets into a demo environment.'],
    contributionGuide: 'Propose documentation changes through the Hub or open a pull request in the demo repository.',
    setupWizard: null,
    repositoryFiles: [],
    facts: [],
    featured: true,
    interactiveExperience: null,
    sync: neverSynced,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'digital-euro-single-view-audit',
    slug: 'digital-euro-single-view-audit',
    title: 'Digital Euro Single View Audit',
    tagline: 'Operational single view and audit layer for digital euro events.',
    summary:
      'MongoDB as an operational single view and audit layer for digital euro events. A simulator publishes to five Kafka topics; events land in five MongoDB collections and are correlated in near real time into customer journeys, state transitions, notifications, failures and reconciliation views.',
    businessProblem:
      'Digital currency onboarding involves many systems emitting events about the same customer. Without a correlated view, operations cannot answer "where is this customer in their journey?" or explain failures, and reconciliation across systems is slow.',
    solution:
      'Events from each topic are stored in dedicated MongoDB collections and correlated by customer and journey identifiers to reconstruct state transitions, detect failures and support reconciliation and audit queries.',
    industry: 'Financial Services',
    category: 'Event-Driven Architecture',
    useCases: ['Single view', 'Audit', 'Event correlation', 'Reconciliation'],
    tags: ['digital-euro', 'events', 'audit', 'kafka-simulator', 'single-view'],
    capabilities: [
      { capability: 'crud', whyUsed: 'Five collections for operational event categories.', businessValue: 'Clear separation of event types with flexible payloads.', verified: false },
      { capability: 'aggregation', whyUsed: 'Near-real-time correlation of events into journeys and reconciliation views.', businessValue: 'Explains customer state across systems.', verified: false },
      { capability: 'kafka', whyUsed: 'Simulated Kafka topics feed the event store.', businessValue: 'Demonstrates event-driven ingestion. Simulated only.', verified: false },
      { capability: 'atlas-search', whyUsed: 'Full-text search over events — only where implemented in the repository.', businessValue: 'Investigators find events quickly.', verified: false },
      { capability: 'vector-search', whyUsed: 'Semantic search — only where implemented in the repository.', businessValue: 'To be confirmed.', verified: false },
    ],
    architecture: {
      overview:
        'The simulator publishes events to five topics: onboarding-events, offboarding-events, dean-assignment, notification-outbound and error-dead-letter. Each topic maps to a MongoDB collection for its operational event category. A correlation layer joins events by customer and journey identifiers to produce journeys, state transitions and reconciliation views.',
      dataFlow: [
        'Simulator generates customer journeys and publishes events to the five topics.',
        'Consumers persist each topic into its own collection.',
        'Correlation pipelines reconstruct journeys and state transitions.',
        'Failures from error-dead-letter are linked to the originating journey.',
        'Reconciliation views compare expected versus observed transitions.',
      ],
      diagrams: [
        {
          id: 'de-topics',
          title: 'Topics to collections',
          description: 'Topic names as specified. Collection names to be confirmed from the repository.',
          illustrative: true,
          provenance: 'catalog',
          mermaid: `flowchart LR
  SIM[Event Simulator] --> T1[[onboarding-events]]
  SIM --> T2[[offboarding-events]]
  SIM --> T3[[dean-assignment]]
  SIM --> T4[[notification-outbound]]
  SIM --> T5[[error-dead-letter]]
  T1 --> C1[(onboarding collection)]
  T2 --> C2[(offboarding collection)]
  T3 --> C3[(dean assignment collection)]
  T4 --> C4[(notification collection)]
  T5 --> C5[(error collection)]
  C1 & C2 & C3 & C4 & C5 --> COR[Correlation pipelines]
  COR --> SV[Single view: journeys, states, reconciliation]`,
        },
      ],
    },
    screenshots: [],
    repository: null,
    defaultBranch: 'main',
    readmePath: 'README.md',
    prerequisites: [{ name: 'Git' }, { name: 'Node.js or runtime', check: 'To be confirmed from repository' }, { name: 'MongoDB Atlas project', check: 'Atlas Connected Mode only' }],
    localSetup: [],
    atlasSetup: [],
    configuration: [],
    demoModes: ['local-demo', 'atlas-connected'],
    themeMode: 'mongodb',
    maintainer: solutionsArchitecture,
    maturity: 'prototype',
    difficulty: 'advanced',
    documentationStatus: 'missing',
    verificationTimestamp: null,
    releaseVersion: null,
    status: 'draft',
    walkthrough: [
      'Start the simulator to generate onboarding and offboarding journeys.',
      'Search for a customer and open the single view.',
      'Inspect state transitions and the notifications sent.',
      'Open a failed journey and trace it to the dead-letter event.',
      'Review the reconciliation view.',
    ],
    userJourney:
      'An auditor investigates why a customer did not receive a wallet. The single view shows onboarding completed but the dean assignment failed; the linked dead-letter event explains the error and the reconciliation view flags the gap.',
    troubleshooting: [],
    faq: [{ question: 'Are these real digital euro interfaces?', answer: 'No. Topics and events are simulated for education and do not represent any official specification.' }],
    limitations: [pendingRepoNote, 'All events are simulated. Full-text and vector search are only shown where the repository implements them.'],
    securityNotes: ['Use synthetic data only.'],
    contributionGuide: 'Propose documentation changes through the Hub or open a pull request in the demo repository.',
    setupWizard: null,
    repositoryFiles: [],
    facts: [],
    featured: true,
    interactiveExperience: null,
    sync: neverSynced,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: 'atlas-infinite-scale-without-limits',
    slug: 'atlas-infinite-scale-without-limits',
    title: 'Atlas Infinite: Scale Without Limits',
    tagline: 'Educational comparison of a sharded Atlas Core architecture and Atlas Infinite.',
    summary:
      'An interactive educational experience comparing a conventional sharded Atlas Core architecture with Atlas Infinite: architecture evolution, data-growth and application-load sliders, compute/storage separation, operational implications, a guided migration simulation and a webinar presentation mode.',
    businessProblem:
      'As data and load grow, teams must plan shard topology, capacity and operations in advance. Architects need a clear, honest way to explain alternative approaches to customers without overstating product capabilities.',
    solution:
      'An educational explorer that visualises both architectures side by side, clearly separates illustrative assumptions from measured results, and keeps product facts in versioned, admin-editable metadata with verification status.',
    industry: 'Cross-industry',
    category: 'Scalability / Modernization',
    useCases: ['Architecture education', 'Modernisation', 'Webinars'],
    tags: ['scalability', 'sharding', 'compute-storage-separation', 'education', 'webinar'],
    capabilities: [
      { capability: 'sharding', whyUsed: 'Illustrates a conventional sharded Atlas Core topology.', businessValue: 'Explains shard planning trade-offs.', verified: true, implementationLocation: 'Hub interactive explorer (educational)' },
      { capability: 'atlas-infinite', whyUsed: 'Illustrates a compute/storage separated architecture.', businessValue: 'Frames modernisation conversations.', verified: true, implementationLocation: 'Hub interactive explorer (educational)' },
      { capability: 'atlas', whyUsed: 'Context for both architectures.', businessValue: 'Managed operations.', verified: true, implementationLocation: 'Hub interactive explorer (educational)' },
    ],
    architecture: {
      overview:
        'Atlas Core (illustrative): three shards with three nodes each — nine nodes — where each node couples compute and storage. Atlas Infinite (educational scenario): exactly two compute nodes over a separated, shared storage layer. Both are illustrative configurations, not universal requirements.',
      dataFlow: [
        'Application traffic is routed through query routers to shards (Atlas Core).',
        'In the separated model, compute nodes serve queries against a shared storage layer.',
        'Scaling compute and storage independently changes operational planning.',
      ],
      diagrams: [
        {
          id: 'ai-core',
          title: 'Atlas Core — illustrative sharded configuration (3 shards × 3 nodes = 9 nodes)',
          description: 'Illustrative configuration only; real topologies vary by workload.',
          illustrative: true,
          provenance: 'catalog',
          mermaid: `flowchart TB
  APP[Application] --> R[Query routers]
  subgraph S1[Shard 1]
    A1[Node 1]:::n
    A2[Node 2]:::n
    A3[Node 3]:::n
  end
  subgraph S2[Shard 2]
    B1[Node 1]:::n
    B2[Node 2]:::n
    B3[Node 3]:::n
  end
  subgraph S3[Shard 3]
    C1[Node 1]:::n
    C2[Node 2]:::n
    C3[Node 3]:::n
  end
  R --> S1
  R --> S2
  R --> S3
  classDef n fill:#E3FCF7,stroke:#00684A`,
        },
        {
          id: 'ai-infinite',
          title: 'Atlas Infinite — educational scenario (2 compute nodes)',
          description: 'Educational scenario with exactly two compute nodes over a separated storage layer.',
          illustrative: true,
          provenance: 'catalog',
          mermaid: `flowchart TB
  APP[Application] --> CMP
  subgraph CMP[Compute layer]
    X1[Compute node 1]:::c
    X2[Compute node 2]:::c
  end
  CMP --> ST[(Separated shared storage layer)]
  classDef c fill:#E3FCF7,stroke:#00684A`,
        },
      ],
    },
    screenshots: [],
    repository: null,
    defaultBranch: 'main',
    readmePath: 'README.md',
    prerequisites: [{ name: 'Modern web browser' }],
    localSetup: [],
    atlasSetup: [],
    configuration: [],
    demoModes: ['interactive-educational'],
    themeMode: 'mongodb',
    maintainer: solutionsArchitecture,
    maturity: 'beta',
    difficulty: 'beginner',
    documentationStatus: 'partial',
    verificationTimestamp: null,
    releaseVersion: null,
    status: 'draft',
    walkthrough: [
      'Compare the illustrative Atlas Core topology with the Atlas Infinite scenario.',
      'Move the data-growth and application-load sliders to see illustrative operational implications.',
      'Review the verification status of each fact before presenting it.',
      'Run the migration SIMULATION — no infrastructure is touched.',
      'Switch to webinar mode for large diagrams and speaker notes.',
    ],
    userJourney:
      'A Solutions Architect presents to a customer whose data is growing quickly. She walks through both architectures in webinar mode, uses sliders to discuss planning implications, and runs the migration simulation to explain the phases — making clear that a real migration follows official, separately validated procedures.',
    troubleshooting: [],
    faq: [
      { question: 'Can I start a real migration from the Hub?', answer: 'No. The Hub never initiates real migrations. Use official, supported procedures with the required permissions and a separately validated implementation.' },
      { question: 'Are the slider numbers benchmarks?', answer: 'No. They are illustrative assumptions, labelled as such, not measured results.' },
    ],
    limitations: ['All figures in the explorer are illustrative assumptions unless a fact is marked verified with a source.'],
    securityNotes: ['The explorer runs entirely in the browser and makes no infrastructure calls.'],
    contributionGuide: 'Admins update facts in the admin editor; each change increments the fact version and records an audit entry.',
    setupWizard: null,
    repositoryFiles: [],
    facts: [
      { key: 'storage-limit', label: 'Maximum storage', value: 'Not specified — consult official documentation.', kind: 'product-fact', verificationStatus: 'unverified', version: 1 },
      { key: 'scaling-time', label: 'Compute scaling time', value: 'Not specified — consult official documentation.', kind: 'product-fact', verificationStatus: 'unverified', version: 1 },
      { key: 'availability-stage', label: 'Availability stage', value: 'Not specified — consult official announcements.', kind: 'product-fact', verificationStatus: 'unverified', version: 1 },
      { key: 'migration-guarantees', label: 'Migration guarantees', value: 'None asserted by the Hub. Follow official supported procedures.', kind: 'product-fact', verificationStatus: 'unverified', version: 1 },
      { key: 'core-topology', label: 'Atlas Core example topology', value: '3 shards × 3 nodes = 9 nodes (illustrative, not a requirement).', kind: 'assumption', verificationStatus: 'verified', version: 1 },
      { key: 'infinite-compute-nodes', label: 'Atlas Infinite scenario compute nodes', value: '2 compute nodes (educational scenario).', kind: 'assumption', verificationStatus: 'verified', version: 1 },
    ],
    featured: true,
    interactiveExperience: 'atlas-infinite',
    sync: neverSynced,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
]
