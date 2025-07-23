"""
Caching utilities for the application.
"""

import time
from collections import OrderedDict
import asyncio
from functools import wraps
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class CacheEntry:
    def __init__(self, value, ttl):
        self.value = value
        self.expiry = time.time() + ttl

class MultiDomainCache:
    """
    A multi-domain cache with TTL support and max entry limits per domain.
    """
    def __init__(self, max_entries=128, ttl=300):
        self.max_entries = max_entries
        self.ttl = ttl
        self.cache = {}
        
    def _evict(self, domain):
        """Evict the oldest entries in the domain cache until max_entries is not exceeded."""
        domain_cache = self.cache[domain]
        while len(domain_cache) > self.max_entries:
            domain_cache.popitem(last=False)

    def _is_expired(self, entry):
        """Check if a cache entry is expired."""
        return entry.expiry < time.time()
    
    def add(self, domain, key, value, ttl=None):
        """Add an entry to the cache."""
        ttl = ttl if ttl is not None else self.ttl
        if domain not in self.cache:
            self.cache[domain] = OrderedDict()
        self.cache[domain][key] = CacheEntry(value, ttl)
        self._evict(domain)

    
    def get(self, domain, key):
        """Get an entry from the cache. Return (False, None) if not found or expired."""
        if domain in self.cache and key in self.cache[domain]:
            entry = self.cache[domain][key]
            if not self._is_expired(entry):
                return True, entry.value
            else:
                # Remove expired entry
                del self.cache[domain][key]
                # Remove domain cache if empty
                if not self.cache[domain]:
                    del self.cache[domain]
        return False, None

    def invalidate(self, domain, key_prefix):
        """Invalidate (remove) entries from the cache that match the key prefix."""
        string_prefix = str(key_prefix) if not isinstance(key_prefix, str) else key_prefix
        if domain in self.cache:
            domain_cache = self.cache[domain]
            # Collect keys to delete to avoid modifying dict during iteration
            keys_to_delete = [key for key in domain_cache if str(key).startswith(string_prefix)]
            for key in keys_to_delete:
                del domain_cache[key]
            # Remove domain cache if empty
            if not domain_cache:
                del self.cache[domain]

    def update_value(self, domain, key, new_value, ttl=None):
        """
        Update an entry in-place if it exists:
          - list:    append (or extend if new_value is a list)
          - dict:    merge .update()
          - other:   overwrite
        If the entry doesn't exist, create it.
        """
        ttl = ttl if ttl is not None else self.ttl
        now = time.time()

        # Ensure domain exists
        if domain not in self.cache:
            self.cache[domain] = OrderedDict()

        domain_cache = self.cache[domain]

        if key in domain_cache:
            entry = domain_cache[key]
            # If expired, just replace
            if self._is_expired(entry):
                entry = CacheEntry(new_value, ttl)
                domain_cache[key] = entry
            else:
                # Merge behavior based on type
                existing = entry.value
                if isinstance(existing, list):
                    if isinstance(new_value, list):
                        existing.extend(new_value)
                    else:
                        existing.append(new_value)
                elif isinstance(existing, dict) and isinstance(new_value, dict):
                    existing.update(new_value)
                else:
                    entry.value = new_value
                # refresh expiry
                entry.expiry = now + ttl
        else:
            # No such key, so just add
            domain_cache[key] = CacheEntry(new_value, ttl)

        self._evict(domain)


def time_execution(func):
    """
    A decorator to measure and log the execution time of a function (sync or async).
    """
    if asyncio.iscoroutinefunction(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            end_time = time.time()
            execution_time = end_time - start_time
            logger.info(f"Function '{func.__name__}' executed in {execution_time:.4f} seconds")
            return result
        return async_wrapper
    else:
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            execution_time = end_time - start_time
            logger.info(f"Function '{func.__name__}' executed in {execution_time:.4f} seconds")
            return result
        return sync_wrapper

# Example instantiation
multidomain_cache = MultiDomainCache(ttl=60*60*5) 