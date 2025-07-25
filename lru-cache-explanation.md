# LRU Cache: How It Works and Implementation

## What LRU Cache Does

LRU (Least Recently Used) cache is a memory management strategy that:

1. **Stores key-value pairs in memory** for fast access
2. **Automatically evicts old data** when memory limit is reached
3. **Keeps frequently used data** in memory longer
4. **Provides O(1) operations** for get/set operations

## Core Algorithm

### Basic Principle
When cache is full and new data needs to be stored:
- Remove the **least recently used** item
- Add the new item
- Update access order for all operations

### Access Pattern
```
Cache Access Order (most → least recent):
[Item D] → [Item A] → [Item C] → [Item B]

When accessing Item C:
[Item C] → [Item D] → [Item A] → [Item B]

When cache is full and adding Item E:
[Item E] → [Item C] → [Item D] → [Item A]
(Item B is evicted)
```

## Implementation Details

### Data Structure
LRU cache typically uses:
1. **Hash Map** - O(1) key lookups
2. **Doubly Linked List** - O(1) insertion/deletion at any position

### Internal Structure
```
Hash Map: {
  "key1" → Node1,
  "key2" → Node2,
  "key3" → Node3
}

Doubly Linked List:
[HEAD] ↔ [Node1] ↔ [Node2] ↔ [Node3] ↔ [TAIL]
  ↑                                        ↑
Most Recent                          Least Recent
```

### Operations

#### GET Operation
1. Check if key exists in hash map
2. If found: Move node to head of list (mark as recently used)
3. Return value
4. Time complexity: **O(1)**

#### SET Operation
1. If key exists: Update value, move to head
2. If key doesn't exist:
   - Create new node at head
   - Add to hash map
   - If cache exceeds capacity: Remove tail node and its hash entry
3. Time complexity: **O(1)**

## Practical Implementation

### Simple LRU Cache Class
```javascript
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Maintains insertion order in modern JS
  }
  
  get(key) {
    if (this.cache.has(key)) {
      // Move to end (most recent)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recent (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
}
```

### Production LRU Cache (npm package)
```javascript
const LRU = require('lru-cache');

const cache = new LRU({
  max: 1000,           // Maximum items
  ttl: 1000 * 60 * 15, // 15 minutes TTL
  allowStale: false,   // Don't return expired items
  updateAgeOnGet: true // Reset TTL on access
});

// Usage
cache.set('key', 'value');
const value = cache.get('key'); // Returns 'value' or undefined
```

## Memory Management

### Eviction Strategy
1. **Size-based**: Remove items when max count reached
2. **TTL-based**: Remove items after time expiration  
3. **Memory-based**: Remove items when memory limit exceeded

### Access Tracking
- **Read access**: `get()` operations move item to "most recent"
- **Write access**: `set()` operations also update recency
- **No access**: Items gradually move toward "least recent" position

## Performance Characteristics

### Time Complexity
- **Get**: O(1)
- **Set**: O(1) 
- **Delete**: O(1)
- **Clear**: O(n)

### Space Complexity
- **Memory usage**: O(capacity)
- **Overhead**: Hash map pointers + linked list nodes

## Use Cases in Our System

### Dashboard Caching
```javascript
// Founder data cache
const founderCache = new LRU({
  max: 1000,        // 1000 founders
  ttl: 15 * 60000,  // 15 minutes
});

// Dashboard validation cache  
const dashboardCache = new LRU({
  max: 500,         // 500 dashboard states
  ttl: 5 * 60000,   // 5 minutes
});
```

### Cache Hit Scenarios
1. **Frequent users**: Dashboard data stays in memory
2. **Occasional users**: Data evicted, fetched from KV/DB
3. **Peak traffic**: Hot data served from memory, cold data from slower tiers

## Implementation Benefits

### Speed
- **Memory access**: ~0.1ms vs 2-5ms (KV) vs 100-300ms (DB)
- **No serialization**: Objects stored directly in memory
- **No network overhead**: Local memory access

### Efficiency  
- **Automatic cleanup**: No manual cache invalidation needed
- **Memory bounds**: Prevents unlimited memory growth
- **Smart eviction**: Keeps useful data, removes unused data

### Reliability
- **Predictable performance**: O(1) operations
- **Memory safety**: Built-in size limits
- **Graceful degradation**: Falls back to slower tiers when cache misses

The LRU cache acts as a high-speed memory buffer between your application and slower storage systems, dramatically improving response times for frequently accessed data while automatically managing memory usage.