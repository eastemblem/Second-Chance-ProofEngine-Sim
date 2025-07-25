// Simple LRU Cache Implementation Example

class Node {
  constructor(key, value) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Hash map for O(1) lookup
    
    // Create dummy head and tail nodes
    this.head = new Node(0, 0);
    this.tail = new Node(0, 0);
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  
  // Add node right after head
  addNode(node) {
    node.prev = this.head;
    node.next = this.head.next;
    
    this.head.next.prev = node;
    this.head.next = node;
  }
  
  // Remove an existing node
  removeNode(node) {
    const prevNode = node.prev;
    const nextNode = node.next;
    
    prevNode.next = nextNode;
    nextNode.prev = prevNode;
  }
  
  // Move node to head (mark as recently used)
  moveToHead(node) {
    this.removeNode(node);
    this.addNode(node);
  }
  
  // Remove last node (least recently used)
  popTail() {
    const lastNode = this.tail.prev;
    this.removeNode(lastNode);
    return lastNode;
  }
  
  get(key) {
    const node = this.cache.get(key);
    
    if (node) {
      // Move accessed node to head
      this.moveToHead(node);
      return node.value;
    }
    
    return -1; // Not found
  }
  
  set(key, value) {
    const node = this.cache.get(key);
    
    if (node) {
      // Update existing node
      node.value = value;
      this.moveToHead(node);
    } else {
      const newNode = new Node(key, value);
      
      if (this.cache.size >= this.capacity) {
        // Remove least recently used node
        const tail = this.popTail();
        this.cache.delete(tail.key);
      }
      
      // Add new node
      this.cache.set(key, newNode);
      this.addNode(newNode);
    }
  }
  
  // Display current cache state
  display() {
    const items = [];
    let current = this.head.next;
    
    while (current !== this.tail) {
      items.push(`${current.key}:${current.value}`);
      current = current.next;
    }
    
    console.log('Cache (most → least recent):', items.join(' → '));
  }
}

// Demonstration
console.log('=== LRU Cache Demonstration ===\n');

const cache = new LRUCache(3); // Capacity of 3

console.log('1. Adding items:');
cache.set('A', 'Apple');
cache.display(); // A:Apple

cache.set('B', 'Banana'); 
cache.display(); // B:Banana → A:Apple

cache.set('C', 'Cherry');
cache.display(); // C:Cherry → B:Banana → A:Apple

console.log('\n2. Accessing item A (moves to front):');
console.log('get(A):', cache.get('A')); // Returns 'Apple'
cache.display(); // A:Apple → C:Cherry → B:Banana

console.log('\n3. Adding item D (evicts least recent B):');
cache.set('D', 'Date');
cache.display(); // D:Date → A:Apple → C:Cherry

console.log('\n4. Trying to access evicted item B:');
console.log('get(B):', cache.get('B')); // Returns -1 (not found)

console.log('\n5. Updating existing item C:');
cache.set('C', 'Coconut');
cache.display(); // C:Coconut → D:Date → A:Apple

// Performance timing example
console.log('\n=== Performance Test ===');

const largeCache = new LRUCache(10000);
const iterations = 100000;

console.time('LRU Cache Operations');
for (let i = 0; i < iterations; i++) {
  largeCache.set(`key${i}`, `value${i}`);
  if (i % 1000 === 0) {
    largeCache.get(`key${Math.floor(i/2)}`); // Access some items
  }
}
console.timeEnd('LRU Cache Operations');

// Real-world usage example for dashboard caching
console.log('\n=== Dashboard Cache Example ===');

class DashboardCache {
  constructor() {
    this.cache = new LRUCache(100); // 100 dashboard states
    this.hits = 0;
    this.misses = 0;
  }
  
  getDashboardData(userId) {
    const cached = this.cache.get(userId);
    
    if (cached !== -1) {
      this.hits++;
      console.log(`✅ Cache HIT for user ${userId}`);
      return cached;
    }
    
    this.misses++;
    console.log(`❌ Cache MISS for user ${userId} - fetching from database`);
    
    // Simulate database fetch
    const dashboardData = {
      proofScore: Math.floor(Math.random() * 100),
      filesUploaded: Math.floor(Math.random() * 20),
      timestamp: new Date().toISOString()
    };
    
    this.cache.set(userId, dashboardData);
    return dashboardData;
  }
  
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total * 100).toFixed(1) : 0;
    console.log(`\nCache Stats: ${this.hits} hits, ${this.misses} misses (${hitRate}% hit rate)`);
  }
}

const dashCache = new DashboardCache();

// Simulate user requests
const users = ['user1', 'user2', 'user3', 'user1', 'user2', 'user1', 'user4'];
users.forEach(userId => {
  dashCache.getDashboardData(userId);
});

dashCache.getStats();