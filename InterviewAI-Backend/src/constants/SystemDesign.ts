import { SystemDesignQuestion } from "../types/SystemDesign";

export const SYSTEM_DESIGN_QUESTIONS: SystemDesignQuestion[] = [
  {
    question: `Design a scalable URL shortening service like TinyURL or Bitly.
- Core requirements: generate/store short codes (7–10 chars), redirect → original URL, basic analytics (click counts, geolocation, referrers, timestamps).
- Non-functional: ≥100K writes/s, ≥1M reads/s, redirect latency <50 ms p95, 99.99% uptime, no lost mappings.
- Consider: key-generation (hash vs. counter vs. random), collision avoidance; storage (SQL vs. NoSQL, hot/cold tiers); caching/CDN; analytics pipeline (Kafka → stream processing → OLAP); sharding/consistent hashing; rate-limiting/abuse prevention; security (malicious-URL detection, HTTPS, key management).`,
    difficulty: "Medium"
  },
  {
    question: `Design a distributed file storage system like Google Drive or Dropbox.
- Core requirements: upload/download arbitrary‐size files, real-time sync, sharing permissions (ACLs, links), version history/revert.
- Non-functional: strong vs. eventual consistency, thousands of concurrent transfers, deduplication/compression, conflict resolution (OT/CRDTs vs. manual).
- Consider: metadata service (Raft for directory/permissions); chunking & content‐addressable storage; sync protocol (long-poll vs. push, OT/CRDT); auth (OAuth/OIDC); replication (erasure coding vs. 3×); versioning & GC; performance (local cache, delta transfers).`,
    difficulty: "Hard"
  },
  {
    question: `Design a notification service sending push (APNs/FCM), email (SMTP), SMS.
- Core requirements: template management, user subscriptions/preferences, retry/backoff, delivery guarantees.
- Non-functional: millions of notifications/s at peak, push end-to-end <200 ms, enqueue email/SMS <2 s, per-channel SLAs, cross-AZ HA.
- Consider: channel adapters abstraction; versioned templates; queueing & fan-out (topic per channel); rate-limiting (global vs. per-tenant); dead-letter queues; analytics (bounce, open/click, unsubscribes); monitoring & alerts.`,
    difficulty: "Medium"
  },
  {
    question: `Design a recommendation system for a video-streaming platform.
- Core requirements: personalized suggestions (watch history, likes), trending/new releases, category recommendations, cold-start handling.
- Non-functional: serve <100 ms, ≥10K queries/s, near-real-time trending updates.
- Consider: batch (Spark) vs. real-time (Flink) pipelines; model types (ALS, content-based, deep learning); feature store (embeddings, metadata); serving (ANN search with FAISS/Annoy); A/B testing & multi-armed bandits; cold-start (demographics, default trending); feedback loop & retraining.`,
    difficulty: "Hard"
  },
  {
    question: `Design a real-time chat application like Slack or Discord.
- Core requirements: one-to-one & group messaging (text/files/reactions), presence (online/typing), delivery status (sent/delivered/read), searchable history.
- Non-functional: millions of WebSocket connections, <200 ms latency end-to-end, fault tolerance.
- Consider: WebSockets vs. MQTT, connection proxies; message routing (pub/sub vs. actor model); storage (time-series DB or append-only logs); presence service (heartbeats, TTL); offline delivery & sync; scaling (partition by user/room); optional E2E encryption & ACLs.`,
    difficulty: "Medium"
  },
  {
    question: `Design a ride-sharing service like Uber or Lyft.
- Core requirements: real-time rider→driver matching, GPS tracking, ETA/fare calculation, in-app payments, trip history.
- Non-functional: match <1 s, map updates <500 ms, handle peak events, 99.9% uptime.
- Consider: location ingestion (gRPC/Kafka), geospatial index & tiered matching, surge pricing engine, routing/maps integration, PCI-compliant payments, real-time dashboards, multi-region failover.`,
    difficulty: "Hard"
  },
  {
    question: `Design a distributed rate limiter.
- Core requirements: enforce per-user, per-API, global limits; support token/leaky bucket, fixed/sliding window.
- Non-functional: <5 ms check/decrement, millions of ops/s, distributed across app servers.
- Consider: accuracy vs. memory (fixed vs. sliding logs), data store (Redis vs. local cache + sync), consistency (strong vs. eventual), burst handling, dynamic per-tenant policies, degraded fallback, monitoring breaches.`,
    difficulty: "Easy"
  },
  {
    question: `Design a distributed job scheduler.
- Core requirements: schedule one-time & recurring jobs, “exactly-once” execution, dependency DAGs.
- Non-functional: millions of jobs/day, high reliability with retries.
- Consider: master election (ZooKeeper/Raft), job persistence (Kafka vs. RDBMS), execution leases & heartbeats, idempotent tasks, DAG engine & topological sort, backfill after downtime, UI/monitoring, autoscaling workers.`,
    difficulty: "Medium"
  },
  {
    question: `Design an e-commerce system like Amazon or eBay.
- Core requirements: product catalog/search, shopping cart, checkout, payments, inventory & order fulfillment.
- Non-functional: accurate inventory under high concurrency, browsing availability during checkout outages, PCI & data security.
- Consider: microservices (catalog, cart, order, inventory, payment), data model (event sourcing vs. CRUD), inventory locking vs. compensating txns (Saga), Elasticsearch for search, CQRS/read replicas, fraud detection/monitoring.`,
    difficulty: "Hard"
  },
  {
    question: `Design a content delivery network (CDN).
- Core requirements: global caching of static assets, cache invalidation, optimal edge routing.
- Non-functional: ≤20 ms TTFB in key markets, TB/s throughput, configurable staleness vs. strong invalidation.
- Consider: PoP topology, anycast DNS vs. HTTP redirect, TTL vs. push vs. origin-pull, load balancing & failover, purge API & versioned URLs, metrics (hit/miss, latency heatmaps), DDoS mitigation, edge TLS termination, edge compute for dynamic content.`,
    difficulty: "Medium"
  }
];
