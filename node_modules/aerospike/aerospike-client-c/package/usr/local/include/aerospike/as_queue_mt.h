/*
 * Copyright 2008-2018 Aerospike, Inc.
 *
 * Portions may be licensed to Aerospike, Inc. under one or more contributor
 * license agreements.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
#pragma once

#include <aerospike/as_queue.h>
#include <aerospike/as_std.h>
#include <pthread.h>

#ifdef __cplusplus
extern "C" {
#endif

/******************************************************************************
 * TYPES
 ******************************************************************************/

/**
 * A thread-safe multi-threaded dynamic queue implementation.
 * as_queue_mt is not part of the generic as_val family.
 */
typedef struct as_queue_mt_s {
	/**
	 * The queue.
	 */
	as_queue queue;

	/**
	 * The lock.
	 */
	pthread_mutex_t lock;

	/**
	 * The notify/wait condition variable.
	 */
	pthread_cond_t cond;
} as_queue_mt;

/******************************************************************************
 * MACROS
 ******************************************************************************/

#define AS_QUEUE_FOREVER -1
#define AS_QUEUE_NOWAIT 0

/**
 * Initialize a stack allocated as_queue_mt, with item storage on the stack.
 * as_queue_mt_inita() will transfer stack memory to the heap if a resize is
 * required.
 */
#define as_queue_mt_inita(__q, __item_size, __capacity)\
as_queue_inita(&(__q)->queue, __item_size, __capacity);\
pthread_mutex_init(&(__q)->lock, NULL);\
pthread_cond_init(&(__q)->cond, NULL);

/******************************************************************************
 * FUNCTIONS
 ******************************************************************************/

/**
 * Initialize a stack allocated as_queue, with item storage on the heap.
 */
AS_EXTERN bool
as_queue_mt_init(as_queue_mt* queue, uint32_t item_size, uint32_t capacity);

/**
 * Create a heap allocated as_queue, with item storage on the heap.
 */
AS_EXTERN as_queue_mt*
as_queue_mt_create(uint32_t item_size, uint32_t capacity);

/**
 * Release queue memory.
 */
static inline void
as_queue_mt_destroy(as_queue_mt* queue)
{
	pthread_cond_destroy(&queue->cond);
	pthread_mutex_destroy(&queue->lock);
	as_queue_destroy(&queue->queue);
}

/**
 * Get the number of elements currently in the queue.
 */
static inline uint32_t
as_queue_mt_size(as_queue_mt* queue)
{
	pthread_mutex_lock(&queue->lock);
	uint32_t size = as_queue_size(&queue->queue);
	pthread_mutex_unlock(&queue->lock);
	return size;
}
	
/**
 * Is queue empty?
 */
static inline bool
as_queue_mt_empty(as_queue_mt* queue)
{
	pthread_mutex_lock(&queue->lock);
	bool empty = as_queue_empty(&queue->queue);
	pthread_mutex_unlock(&queue->lock);
	return empty;
}

/**
 * Push to the tail of the queue.
 */
static inline bool
as_queue_mt_push(as_queue_mt* queue, const void* ptr)
{
	pthread_mutex_lock(&queue->lock);
	bool status = as_queue_push(&queue->queue, ptr);

	if (status) {
		pthread_cond_signal(&queue->cond);
	}
	pthread_mutex_unlock(&queue->lock);
	return status;
}

/**
 * Push element on the queue only if size < capacity.
 */
static inline bool
as_queue_mt_push_limit(as_queue_mt* queue, const void* ptr)
{
	pthread_mutex_lock(&queue->lock);
	bool status = as_queue_push_limit(&queue->queue, ptr);

	if (status) {
		pthread_cond_signal(&queue->cond);
	}
	pthread_mutex_unlock(&queue->lock);
	return status;
}

/**
 * Push to the front of the queue.
 */
static inline bool
as_queue_mt_push_head(as_queue_mt* queue, const void* ptr)
{
	pthread_mutex_lock(&queue->lock);
	bool status = as_queue_push_head(&queue->queue, ptr);

	if (status) {
		pthread_cond_signal(&queue->cond);
	}
	pthread_mutex_unlock(&queue->lock);
	return status;
}

/**
 * Pop from the head of the queue.
 *
 * If the queue is empty, wait_ms is the maximum time in milliseconds to wait 
 * for an available entry.  If wait_ms is AS_QUEUE_FOREVER (-1), the wait time will be forever.
 * If wait_ms is AS_QUEUE_NOWAIT (0), the function will not wait.
 *
 * The return value is true if an entry was successfully retrieved.
 */
AS_EXTERN bool
as_queue_mt_pop(as_queue_mt* queue, void* ptr, int wait_ms);

#ifdef __cplusplus
} // end extern "C"
#endif
